import { type NextRequest, NextResponse } from "next/server"
import nodemailer from "nodemailer"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()

    // Extract form data
    const testEmail = formData.get("testEmail") as string
    const senderName = formData.get("senderName") as string
    const senderEmail = formData.get("senderEmail") as string
    const subject = formData.get("subject") as string
    const username = formData.get("username") as string
    const password = formData.get("password") as string

    // Get files
    const htmlTemplate = formData.get("htmlTemplate") as File
    const textTemplate = formData.get("textTemplate") as File | null
    const attachments = formData.getAll("attachments") as File[]

    // Read templates
    const htmlContent = await htmlTemplate.text()
    const textContent = textTemplate ? await textTemplate.text() : undefined

    // Configure email transporter
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: username,
        pass: password,
      },
    })

    // Prepare email message
    const message: nodemailer.SendMailOptions = {
      from: `"${senderName}" <${senderEmail}>`,
      to: testEmail,
      subject: subject || "Test Email",
      html: htmlContent,
    }

    if (textContent) {
      message.text = textContent
    }

    // Add attachments if any
    if (attachments.length > 0) {
      message.attachments = await Promise.all(
        attachments.map(async (file) => {
          const buffer = Buffer.from(await file.arrayBuffer())
          return {
            filename: file.name,
            content: buffer,
          }
        }),
      )
    }

    // Send the test email
    await transporter.sendMail(message)

    return NextResponse.json({
      success: true,
      message: `Test email sent to ${testEmail}`,
    })
  } catch (error) {
    console.error("Error sending test email:", error)
    return NextResponse.json(
      { success: false, message: `Failed to send test email: ${(error as Error).message}` },
      { status: 500 },
    )
  }
}
