import { type NextRequest, NextResponse } from "next/server"
import nodemailer from "nodemailer"
import Papa from "papaparse"

// Similar to the BulkEmailSender class in the Python code
class EmailSender {
  private smtp_server: string
  private smtp_port: number
  private username: string
  private password: string
  private sender_email: string
  private sender_name: string
  private session: nodemailer.Transporter | null = null
  private connection_attempts = 0
  private max_connection_attempts = 3

  constructor(
    smtp_server: string,
    smtp_port: number,
    username: string,
    password: string,
    sender_email: string,
    sender_name: string,
  ) {
    this.smtp_server = smtp_server
    this.smtp_port = smtp_port
    this.username = username
    this.password = password
    this.sender_email = sender_email
    this.sender_name = sender_name
  }

  async connect(): Promise<boolean> {
    try {
      this.connection_attempts += 1
      this.session = nodemailer.createTransport({
        host: this.smtp_server,
        port: this.smtp_port,
        secure: false, // true for 465, false for other ports
        auth: {
          user: this.username,
          pass: this.password,
        },
      })

      // Verify connection
      await this.session.verify()
      this.connection_attempts = 0 // Reset counter on successful connection
      console.log("Successfully connected to SMTP server")
      return true
    } catch (error) {
      console.error(`Failed to connect to SMTP server: ${error}`)
      return false
    }
  }

  disconnect() {
    if (this.session) {
      this.session.close()
      this.session = null
      console.log("Disconnected from SMTP server")
    }
  }

  async createMessage(
    recipient_email: string,
    subject: string,
    html_content: string,
    text_content?: string,
    attachment_files?: File[],
    cc?: string,
    bcc?: string,
  ) {
    const message: nodemailer.SendMailOptions = {
      from: `"${this.sender_name}" <${this.sender_email}>`,
      to: recipient_email,
      subject: subject,
      html: html_content,
    }

    if (text_content) {
      message.text = text_content
    }

    if (cc) {
      message.cc = cc
    }

    if (bcc) {
      message.bcc = bcc
    }

    if (attachment_files && attachment_files.length > 0) {
      message.attachments = await Promise.all(
        attachment_files.map(async (file) => {
          const buffer = Buffer.from(await file.arrayBuffer())
          return {
            filename: file.name,
            content: buffer,
          }
        }),
      )
    }

    return message
  }

  checkGmailBlock(error_message: string): boolean {
    const block_indicators = [
      "temporary disable",
      "unusual activity",
      "unusual sign",
      "unusual attempt",
      "temporarily locked",
      "temporary lock",
      "account has been disabled",
      "account was disabled",
      "try again later",
    ]

    const error_str = error_message.toLowerCase()
    for (const indicator of block_indicators) {
      if (error_str.includes(indicator)) {
        return true
      }
    }
    return false
  }

  async sendEmail(
    message: nodemailer.SendMailOptions,
    recipient_email: string,
    cc?: string,
    bcc?: string,
  ): Promise<boolean | "BLOCKED"> {
    if (!this.session) {
      const connected = await this.connect()
      if (!connected) {
        return false
      }
    }

    try {
      await this.session!.sendMail(message)
      console.log(`Email sent to ${recipient_email}`)
      return true
    } catch (error) {
      const errorMessage = (error as Error).message || String(error)
      if (this.checkGmailBlock(errorMessage)) {
        console.error(`Gmail block detected: ${error}`)
        console.error("Pausing for 1 hour to avoid account suspension")
        return "BLOCKED"
      }
      console.error(`Failed to send email to ${recipient_email}: ${error}`)
      return false
    }
  }

  async sendBulkEmails(
    recipients: any[],
    subject: string,
    html_template: string,
    text_template?: string,
    attachment_files?: File[],
    personalize = true,
    delay_base = 1,
    max_emails_per_day = 450,
    batch_size = 20,
    resume_from = 0,
    onProgress?: (progress: number, status: string, recipient?: string) => void,
  ): Promise<{ success: number; failed: number; skipped: number }> {
    if (!this.session) {
      const connected = await this.connect()
      if (!connected) {
        return { success: 0, failed: 0, skipped: 0 }
      }
    }

    const results = { success: 0, failed: 0, skipped: resume_from }

    try {
      // If resuming, skip already processed records
      if (resume_from > 0) {
        if (resume_from >= recipients.length) {
          console.error(`Resume index ${resume_from} is greater than the number of records ${recipients.length}`)
          return { success: 0, failed: 0, skipped: 0 }
        }
        console.log(`Resuming campaign from record ${resume_from}`)
        recipients = recipients.slice(resume_from)
      }

      if (recipients.length > max_emails_per_day) {
        console.warn(`Limiting to ${max_emails_per_day} emails per day, due to Gmail's daily sending limit`)
        recipients = recipients.slice(0, max_emails_per_day)
      }

      const total_recipients = recipients.length
      const start_time = new Date()
      console.log(`Starting bulk email campaign to ${total_recipients} recipients`)

      for (let index = 0; index < recipients.length; index++) {
        const real_index = index + resume_from
        const recipient = recipients[index]
        const recipient_email = recipient["Emails"] || recipient["Email"] || ""

        if (!recipient_email) {
          console.warn(`Skipping recipient at index ${real_index}: No email address found`)
          continue
        }

        // Personalize content if needed
        let personalized_html = html_template
        let personalized_text = text_template

        if (personalize) {
          // Replace placeholders with recipient data
          for (const [key, value] of Object.entries(recipient)) {
            const placeholder = `{{${key}}}`
            const str_value = value ? String(value) : ""
            personalized_html = personalized_html.replace(new RegExp(placeholder, "g"), str_value)
            if (personalized_text) {
              personalized_text = personalized_text.replace(new RegExp(placeholder, "g"), str_value)
            }
          }
        }

        // Process CC and BCC if they exist in the recipient data
        const cc = recipient["cc"] || undefined
        const bcc = recipient["bcc"] || undefined

        // Create and send the email
        const msg = await this.createMessage(
          recipient_email,
          subject,
          personalized_html,
          personalized_text,
          attachment_files,
          cc,
          bcc,
        )

        // Show progress
        const progress = Math.round(((index + 1) / total_recipients) * 100)
        onProgress?.(progress, "sending", recipient_email)

        const result = await this.sendEmail(msg, recipient_email, cc, bcc)
        if (result === "BLOCKED") {
          // Gmail block detected - save state and exit
          console.warn(`Campaign paused due to Gmail restrictions. Resume later with --resume ${real_index + 1}`)
          return results
        }

        if (result === true) {
          results.success += 1
          onProgress?.(progress, "sent", recipient_email)
          console.log(`✓ Sent to ${recipient_email}`)
        } else {
          results.failed += 1
          onProgress?.(progress, "failed", recipient_email)
          console.error(`✗ Failed to send to ${recipient_email}`)
        }

        // Add randomized delay to mimic human behavior
        if (index < total_recipients - 1) {
          const current_delay = delay_base * 1000 + Math.random() * 5000
          await new Promise((resolve) => setTimeout(resolve, current_delay))
        }

        // Take a longer break after each batch
        if ((index + 1) % batch_size === 0 && index < total_recipients - 1) {
          console.log(`Taking a longer break after ${batch_size} emails`)
          this.disconnect() // Disconnect before the break
          await new Promise((resolve) => setTimeout(resolve, 5000 + Math.random() * 5000)) // 5-10 seconds break
          const reconnected = await this.connect() // Reconnect after the break
          if (!reconnected) {
            console.error("Failed to reconnect to SMTP server after break")
            return results
          }
        }
      }

      const end_time = new Date()
      const duration = (end_time.getTime() - start_time.getTime()) / 1000
      console.log(`Bulk email campaign completed in ${duration.toFixed(2)} seconds`)
      console.log(`Results: ${results.success} successful, ${results.failed} failed, ${results.skipped} skipped`)

      return results
    } catch (error) {
      console.error(`Error in bulk email process: ${error}`)
      return results
    } finally {
      this.disconnect()
    }
  }
}

// Store active campaigns
const activeCampaigns = new Map<
  string,
  {
    sender: EmailSender
    progress: number
    status: "running" | "paused" | "completed" | "failed"
    results: { success: number; failed: number; skipped: number }
    logs: Array<{
      timestamp: string
      recipient: string
      status: string
      message?: string
      details?: string
    }>
  }
>()

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()

    // Extract form data
    const campaignId = formData.get("campaignId") as string
    const environment = formData.get("environment") as string
    const subject = formData.get("subject") as string
    const senderName = formData.get("senderName") as string
    const senderEmail = formData.get("senderEmail") as string
    const username = formData.get("username") as string
    const password = formData.get("password") as string
    const delayBase = Number.parseInt(formData.get("delayBase") as string)
    const maxEmailsPerDay = Number.parseInt(formData.get("maxEmailsPerDay") as string)
    const batchSize = Number.parseInt(formData.get("batchSize") as string)
    const resumeFrom = Number.parseInt(formData.get("resumeFrom") as string)
    const personalize = formData.get("personalize") === "true"

    // Get files
    const csvFile = formData.get("csvFile") as File
    const htmlTemplate = formData.get("htmlTemplate") as File
    const textTemplate = formData.get("textTemplate") as File | null
    const attachments = formData.getAll("attachments") as File[]

    // Read CSV file
    const csvText = await csvFile.text()
    const { data } = Papa.parse(csvText, { header: true })

    // Read templates
    const htmlContent = await htmlTemplate.text()
    const textContent = textTemplate ? await textTemplate.text() : undefined

    // Create email sender
    const sender = new EmailSender(
      "smtp.gmail.com", // SMTP server
      587, // SMTP port
      username,
      password,
      senderEmail,
      senderName,
    )

    // Create campaign entry
    activeCampaigns.set(campaignId, {
      sender,
      progress: 0,
      status: "running",
      results: { success: 0, failed: 0, skipped: resumeFrom },
      logs: [],
    })

    // Start sending emails in the background
    const campaign = activeCampaigns.get(campaignId)!

    // Function to add log entry
    const addLogEntry = (recipient: string, status: string, message?: string, details?: string) => {
      campaign.logs.push({
        timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
        recipient,
        status,
        message,
        details,
      })
    }

    // Start the email sending process in the background
    sender
      .sendBulkEmails(
        data as any[],
        subject,
        htmlContent,
        textContent,
        attachments,
        personalize,
        delayBase,
        maxEmailsPerDay,
        batchSize,
        resumeFrom,
        (progress, status, recipient) => {
          campaign.progress = progress
          if (recipient) {
            let message
            let details

            switch (status) {
              case "sending":
                message = "Preparing to send email"
                addLogEntry(recipient, "pending", message)
                break
              case "sent":
                message = "Email sent successfully"
                addLogEntry(recipient, "sent", message)
                break
              case "failed":
                message = "Failed to send email"
                details = "SMTP error or connection issue"
                addLogEntry(recipient, "failed", message, details)
                break
            }
          }
        },
      )
      .then((results) => {
        campaign.results = results
        campaign.status = "completed"
        campaign.progress = 100
      })
      .catch((error) => {
        console.error("Campaign failed:", error)
        campaign.status = "failed"
        addLogEntry("system", "error", "Campaign failed", error.message)
      })

    return NextResponse.json({
      success: true,
      message: "Email campaign started successfully",
      campaignId,
    })
  } catch (error) {
    console.error("Error starting email campaign:", error)
    return NextResponse.json({ success: false, message: "Failed to start email campaign" }, { status: 500 })
  }
}

// Endpoint to get campaign status
export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const campaignId = url.searchParams.get("campaignId")

  if (!campaignId) {
    return NextResponse.json({ success: false, message: "Campaign ID is required" }, { status: 400 })
  }

  const campaign = activeCampaigns.get(campaignId)
  if (!campaign) {
    return NextResponse.json({ success: false, message: "Campaign not found" }, { status: 404 })
  }

  return NextResponse.json({
    success: true,
    campaign: {
      progress: campaign.progress,
      status: campaign.status,
      results: campaign.results,
      logs: campaign.logs.slice(-50), // Return the last 50 logs
    },
  })
}
