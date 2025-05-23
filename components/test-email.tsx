"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, CheckCircle, Send } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"

interface TestEmailProps {
  htmlTemplate: File | null
  textTemplate: File | null
  senderName: string
  senderEmail: string
  subject: string
  attachments: File[]
  environment: string
  username: string
  password: string
}

export function TestEmail({
  htmlTemplate,
  textTemplate,
  senderName,
  senderEmail,
  subject,
  attachments,
  environment,
  username,
  password,
}: TestEmailProps) {
  const { toast } = useToast()
  const [testEmail, setTestEmail] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [testResult, setTestResult] = useState<"success" | "error" | null>(null)
  const [testMessage, setTestMessage] = useState("")

  const handleSendTest = async () => {
    if (!testEmail) {
      toast({
        title: "Error",
        description: "Please enter a test email address",
        variant: "destructive",
      })
      return
    }

    if (!htmlTemplate) {
      toast({
        title: "Error",
        description: "Please upload an HTML template",
        variant: "destructive",
      })
      return
    }

    if (!username || !password) {
      toast({
        title: "Error",
        description: "SMTP username and password are required",
        variant: "destructive",
      })
      return
    }

    setIsSending(true)
    setTestResult(null)
    setTestMessage("")

    try {
      // Create form data for the API request
      const formData = new FormData()
      formData.append("testEmail", testEmail)
      formData.append("senderName", senderName)
      formData.append("senderEmail", senderEmail)
      formData.append("subject", subject)
      formData.append("username", username)
      formData.append("password", password)
      formData.append("htmlTemplate", htmlTemplate)

      if (textTemplate) {
        formData.append("textTemplate", textTemplate)
      }

      attachments.forEach((file) => {
        formData.append("attachments", file)
      })

      // Send the test email
      const response = await fetch("/api/send-test-email", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (result.success) {
        setTestResult("success")
        setTestMessage(`Test email successfully sent to ${testEmail}`)

        toast({
          title: "Success",
          description: `Test email sent to ${testEmail}`,
        })
      } else {
        throw new Error(result.message || "Failed to send test email")
      }
    } catch (error) {
      setTestResult("error")
      setTestMessage(`Failed to send test email: ${(error as Error).message}`)

      toast({
        title: "Error",
        description: `Failed to send test email: ${(error as Error).message}`,
        variant: "destructive",
      })
    } finally {
      setIsSending(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Send Test Email</CardTitle>
        <CardDescription>Send a test email to verify your configuration</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="testEmail">Test Email Address</Label>
          <div className="flex space-x-2">
            <Input
              id="testEmail"
              type="email"
              placeholder="Enter email address for testing"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
            />
            <Button onClick={handleSendTest} disabled={isSending || !htmlTemplate}>
              {isSending ? "Sending..." : "Send Test"}
              <Send className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Test Configuration</Label>
          <div className="rounded-md border p-3 text-sm space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div className="font-medium">Environment:</div>
              <div className="capitalize">{environment}</div>

              <div className="font-medium">From:</div>
              <div>
                {senderName} &lt;{senderEmail}&gt;
              </div>

              <div className="font-medium">Subject:</div>
              <div>{subject || "(No subject)"}</div>

              <div className="font-medium">HTML Template:</div>
              <div>{htmlTemplate?.name || "Not uploaded"}</div>

              <div className="font-medium">Text Template:</div>
              <div>{textTemplate?.name || "Not uploaded"}</div>

              <div className="font-medium">Attachments:</div>
              <div>{attachments.length > 0 ? `${attachments.length} file(s)` : "None"}</div>
            </div>
          </div>
        </div>

        {testResult && (
          <Alert variant={testResult === "success" ? "default" : "destructive"}>
            {testResult === "success" ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            <AlertTitle>{testResult === "success" ? "Success" : "Error"}</AlertTitle>
            <AlertDescription>{testMessage}</AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter className="text-xs text-gray-500">
        Test emails use the same configuration as your campaign but are sent immediately to the specified address.
      </CardFooter>
    </Card>
  )
}
