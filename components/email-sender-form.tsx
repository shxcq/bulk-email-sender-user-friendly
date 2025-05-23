"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Progress } from "@/components/ui/progress"
import { AlertCircle, FileText, Upload, X, Eye } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { EnvUploader, type EnvConfig } from "@/components/env-uploader"
import { CsvPreview } from "@/components/csv-preview"
import { HtmlPreview } from "@/components/html-preview"
import { TestEmail } from "@/components/test-email"
import { RealTimeLogs } from "@/components/real-time-logs"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Papa from "papaparse"

export function EmailSenderForm() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [attachments, setAttachments] = useState<File[]>([])
  const [htmlTemplate, setHtmlTemplate] = useState<File | null>(null)
  const [textTemplate, setTextTemplate] = useState<File | null>(null)
  const [envConfigs, setEnvConfigs] = useState<Record<string, EnvConfig>>({})
  const [csvData, setCsvData] = useState<any[] | null>(null)
  const [activeTab, setActiveTab] = useState<string>("config")
  const [campaignActive, setCampaignActive] = useState(false)
  const [campaignPaused, setCampaignPaused] = useState(false)
  const [campaignId, setCampaignId] = useState<string | undefined>(undefined)
  const [logs, setLogs] = useState<any[]>([])
  const statusCheckInterval = useRef<NodeJS.Timeout | null>(null)
  const [formData, setFormData] = useState({
    environment: "it",
    subject: "",
    senderName: "",
    senderEmail: "",
    username: "",
    password: "",
    delayBase: 6,
    maxEmailsPerDay: 450,
    batchSize: 20,
    resumeFrom: 0,
    personalize: true,
  })

  // Update form data when environment changes
  useEffect(() => {
    const selectedEnv = formData.environment
    const config = envConfigs[selectedEnv]

    if (config) {
      setFormData((prev) => ({
        ...prev,
        senderName: config.SENDER_NAME,
        senderEmail: config.SENDER_EMAIL,
        username: config.EMAIL_USERNAME,
        password: config.EMAIL_PASSWORD || prev.password,
      }))
    }
  }, [formData.environment, envConfigs])

  // Parse CSV data when file changes
  useEffect(() => {
    if (!csvFile) {
      setCsvData(null)
      return
    }

    Papa.parse(csvFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setCsvData(results.data)
      },
      error: (error) => {
        console.error("Error parsing CSV:", error)
        setCsvData(null)
      },
    })
  }, [csvFile])

  // Auto-switch to logs tab when campaign starts
  useEffect(() => {
    if (campaignActive) {
      setActiveTab("live-logs")
    }
  }, [campaignActive])

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (statusCheckInterval.current) {
        clearInterval(statusCheckInterval.current)
      }
    }
  }, [])

  // Poll for campaign status updates
  useEffect(() => {
    if (campaignActive && campaignId && !campaignPaused) {
      // Start polling for status updates
      statusCheckInterval.current = setInterval(async () => {
        try {
          const response = await fetch(`/api/send-emails?campaignId=${campaignId}`)
          const data = await response.json()

          if (data.success) {
            setProgress(data.campaign.progress)
            setLogs(data.campaign.logs)

            // Check if campaign is complete
            if (data.campaign.status === "completed" || data.campaign.status === "failed") {
              setCampaignActive(false)
              setIsLoading(false)
              clearInterval(statusCheckInterval.current!)
              statusCheckInterval.current = null

              if (data.campaign.status === "completed") {
                toast({
                  title: "Success",
                  description: `Email campaign completed: ${data.campaign.results.success} sent, ${data.campaign.results.failed} failed`,
                })
              } else {
                toast({
                  title: "Error",
                  description: "Campaign failed. Check logs for details.",
                  variant: "destructive",
                })
              }
            }
          }
        } catch (error) {
          console.error("Error checking campaign status:", error)
        }
      }, 2000) // Check every 2 seconds
    } else if (statusCheckInterval.current) {
      clearInterval(statusCheckInterval.current)
      statusCheckInterval.current = null
    }

    return () => {
      if (statusCheckInterval.current) {
        clearInterval(statusCheckInterval.current)
      }
    }
  }, [campaignActive, campaignId, campaignPaused, toast])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: checked }))
  }

  const handleSliderChange = (name: string, value: number[]) => {
    setFormData((prev) => ({ ...prev, [name]: value[0] }))
  }

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCsvFile(e.target.files[0])
    }
  }

  const handleAttachmentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments((prev) => [...prev, ...Array.from(e.target.files || [])])
    }
  }

  const handleTemplateUpload = (e: React.ChangeEvent<HTMLInputElement>, type: "html" | "text") => {
    if (e.target.files && e.target.files[0]) {
      if (type === "html") {
        setHtmlTemplate(e.target.files[0])
      } else {
        setTextTemplate(e.target.files[0])
      }
    }
  }

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
  }

  const handleEnvConfigsChange = (configs: Record<string, EnvConfig>) => {
    setEnvConfigs(configs)
  }

  const handlePauseCampaign = () => {
    setCampaignPaused(true)
    toast({
      title: "Campaign Paused",
      description: "Email campaign has been paused. You can resume it at any time.",
    })
  }

  const handleResumeCampaign = () => {
    setCampaignPaused(false)
    toast({
      title: "Campaign Resumed",
      description: "Email campaign has been resumed.",
    })
  }

  const handleStopCampaign = () => {
    setCampaignActive(false)
    setCampaignPaused(false)
    setCampaignId(undefined)
    setIsLoading(false)
    setProgress(0)
    if (statusCheckInterval.current) {
      clearInterval(statusCheckInterval.current)
      statusCheckInterval.current = null
    }
    toast({
      title: "Campaign Stopped",
      description: "Email campaign has been stopped.",
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!csvFile) {
      toast({
        title: "Error",
        description: "Please upload a CSV file with recipient data",
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

    setIsLoading(true)
    setProgress(0)
    setCampaignActive(true)
    setCampaignPaused(false)
    const newCampaignId = `campaign-${Date.now()}`
    setCampaignId(newCampaignId)
    setLogs([])

    try {
      // Create form data for the API request
      const formData = new FormData()
      formData.append("campaignId", newCampaignId)
      formData.append("environment", formData.environment)
      formData.append("subject", formData.subject)
      formData.append("senderName", formData.senderName)
      formData.append("senderEmail", formData.senderEmail)
      formData.append("username", formData.username)
      formData.append("password", formData.password)
      formData.append("delayBase", formData.delayBase.toString())
      formData.append("maxEmailsPerDay", formData.maxEmailsPerDay.toString())
      formData.append("batchSize", formData.batchSize.toString())
      formData.append("resumeFrom", formData.resumeFrom.toString())
      formData.append("personalize", formData.personalize.toString())
      formData.append("csvFile", csvFile)
      formData.append("htmlTemplate", htmlTemplate)

      if (textTemplate) {
        formData.append("textTemplate", textTemplate)
      }

      attachments.forEach((file) => {
        formData.append("attachments", file)
      })

      // Start the email campaign
      const response = await fetch("/api/send-emails", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.message || "Failed to start email campaign")
      }

      toast({
        title: "Campaign Started",
        description: "Email campaign has been started successfully.",
      })
    } catch (error) {
      setCampaignActive(false)
      setIsLoading(false)
      setCampaignId(undefined)

      toast({
        title: "Error",
        description: `Failed to start email campaign: ${(error as Error).message}`,
        variant: "destructive",
      })
    }
  }

  // Check if the selected environment has a configuration
  const hasSelectedEnvConfig = !!envConfigs[formData.environment]

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-8">
            <TabsTrigger value="config">Configuration</TabsTrigger>
            <TabsTrigger value="preview-recipients" disabled={!csvFile}>
              Preview Recipients
            </TabsTrigger>
            <TabsTrigger value="preview-template" disabled={!htmlTemplate}>
              Preview Template
            </TabsTrigger>
            <TabsTrigger value="test-email">Test Email</TabsTrigger>
            <TabsTrigger value="live-logs" disabled={!campaignActive}>
              Live Logs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="config">
            <EnvUploader onEnvConfigsChange={handleEnvConfigsChange} />

            <div className="grid gap-6 md:grid-cols-2 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Email Configuration</CardTitle>
                  <CardDescription>Configure your email sender settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="environment">Environment</Label>
                    <Select
                      value={formData.environment}
                      onValueChange={(value) => handleSelectChange("environment", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select environment" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="it" disabled={!envConfigs.it}>
                          IT {!envConfigs.it && "(No config)"}
                        </SelectItem>
                        <SelectItem value="pension" disabled={!envConfigs.pension}>
                          Pension {!envConfigs.pension && "(No config)"}
                        </SelectItem>
                        <SelectItem value="governance" disabled={!envConfigs.governance}>
                          Governance {!envConfigs.governance && "(No config)"}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    {!hasSelectedEnvConfig && (
                      <p className="text-xs text-amber-600">Please upload an environment file for this environment.</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject">Email Subject</Label>
                    <Input
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      placeholder="Enter email subject"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="senderName">Sender Name</Label>
                    <Input
                      id="senderName"
                      name="senderName"
                      value={formData.senderName}
                      onChange={handleInputChange}
                      placeholder="Enter sender name"
                      required
                      readOnly={hasSelectedEnvConfig}
                      className={hasSelectedEnvConfig ? "bg-gray-50" : ""}
                    />
                    {hasSelectedEnvConfig && (
                      <p className="text-xs text-gray-500">Auto-filled from environment configuration</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="senderEmail">Sender Email</Label>
                    <Input
                      id="senderEmail"
                      name="senderEmail"
                      type="email"
                      value={formData.senderEmail}
                      onChange={handleInputChange}
                      placeholder="Enter sender email"
                      required
                      readOnly={hasSelectedEnvConfig}
                      className={hasSelectedEnvConfig ? "bg-gray-50" : ""}
                    />
                    {hasSelectedEnvConfig && (
                      <p className="text-xs text-gray-500">Auto-filled from environment configuration</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="username">SMTP Username</Label>
                    <Input
                      id="username"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      placeholder="Enter SMTP username"
                      required
                      readOnly={hasSelectedEnvConfig}
                      className={hasSelectedEnvConfig ? "bg-gray-50" : ""}
                    />
                    {hasSelectedEnvConfig && (
                      <p className="text-xs text-gray-500">Auto-filled from environment configuration</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">SMTP Password</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Enter SMTP password"
                      required
                    />
                    {hasSelectedEnvConfig && formData.password === "" && (
                      <p className="text-xs text-amber-600">
                        Password is required even when using environment configuration
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Campaign Settings</CardTitle>
                  <CardDescription>Configure your email campaign settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="csvFile">Recipient List (CSV)</Label>
                    <div className="flex items-center gap-2">
                      <Input id="csvFile" type="file" accept=".csv" onChange={handleCsvUpload} className="hidden" />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById("csvFile")?.click()}
                        className="w-full"
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        {csvFile ? csvFile.name : "Upload CSV File"}
                      </Button>
                      {csvFile && (
                        <Button type="button" variant="ghost" size="icon" onClick={() => setCsvFile(null)}>
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                      {csvFile && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => setActiveTab("preview-recipients")}
                          title="Preview Recipients"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="htmlTemplate">HTML Template</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="htmlTemplate"
                        type="file"
                        accept=".html"
                        onChange={(e) => handleTemplateUpload(e, "html")}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById("htmlTemplate")?.click()}
                        className="w-full"
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        {htmlTemplate ? htmlTemplate.name : "Upload HTML Template"}
                      </Button>
                      {htmlTemplate && (
                        <Button type="button" variant="ghost" size="icon" onClick={() => setHtmlTemplate(null)}>
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                      {htmlTemplate && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => setActiveTab("preview-template")}
                          title="Preview Template"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="textTemplate">Text Template (Optional)</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="textTemplate"
                        type="file"
                        accept=".txt"
                        onChange={(e) => handleTemplateUpload(e, "text")}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById("textTemplate")?.click()}
                        className="w-full"
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        {textTemplate ? textTemplate.name : "Upload Text Template"}
                      </Button>
                      {textTemplate && (
                        <Button type="button" variant="ghost" size="icon" onClick={() => setTextTemplate(null)}>
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="attachments">Attachments</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="attachments"
                        type="file"
                        multiple
                        onChange={handleAttachmentUpload}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById("attachments")?.click()}
                        className="w-full"
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Attachments
                      </Button>
                    </div>
                    {attachments.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {attachments.map((file, index) => (
                          <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                            <span className="text-sm truncate max-w-[200px]">{file.name}</span>
                            <Button type="button" variant="ghost" size="icon" onClick={() => removeAttachment(index)}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Advanced Settings</CardTitle>
                  <CardDescription>Configure advanced email sending settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="personalize">Personalize Emails</Label>
                      <Switch
                        id="personalize"
                        checked={formData.personalize}
                        onCheckedChange={(checked) => handleSwitchChange("personalize", checked)}
                      />
                    </div>
                    <p className="text-sm text-gray-500">
                      Replace placeholders like &#123;&#123;Name&#125;&#125; with recipient data from CSV
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="delayBase">Delay Between Emails (seconds)</Label>
                    <div className="pt-2">
                      <Slider
                        id="delayBase"
                        min={1}
                        max={30}
                        step={1}
                        value={[formData.delayBase]}
                        onValueChange={(value) => handleSliderChange("delayBase", value)}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>1s</span>
                      <span>{formData.delayBase}s</span>
                      <span>30s</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxEmailsPerDay">Max Emails Per Day</Label>
                    <Input
                      id="maxEmailsPerDay"
                      name="maxEmailsPerDay"
                      type="number"
                      min={1}
                      max={500}
                      value={formData.maxEmailsPerDay}
                      onChange={handleInputChange}
                    />
                    <p className="text-xs text-gray-500">Gmail limits: 500 per day for regular accounts</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="batchSize">Batch Size</Label>
                    <Input
                      id="batchSize"
                      name="batchSize"
                      type="number"
                      min={1}
                      max={100}
                      value={formData.batchSize}
                      onChange={handleInputChange}
                    />
                    <p className="text-xs text-gray-500">Number of emails to send before taking a longer break</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="resumeFrom">Resume From Index</Label>
                    <Input
                      id="resumeFrom"
                      name="resumeFrom"
                      type="number"
                      min={0}
                      value={formData.resumeFrom}
                      onChange={handleInputChange}
                    />
                    <p className="text-xs text-gray-500">
                      Start from a specific index (for resuming interrupted campaigns)
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Campaign Status</CardTitle>
                  <CardDescription>Monitor your email campaign progress</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isLoading ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span>{progress}%</span>
                        </div>
                        <Progress value={progress} />
                      </div>
                      <p className="text-sm text-gray-500">
                        {campaignPaused ? "Campaign paused..." : "Sending emails..."}
                      </p>
                      <div className="flex space-x-2">
                        {campaignPaused ? (
                          <Button type="button" variant="outline" onClick={handleResumeCampaign} className="flex-1">
                            Resume Campaign
                          </Button>
                        ) : (
                          <Button type="button" variant="outline" onClick={handlePauseCampaign} className="flex-1">
                            Pause Campaign
                          </Button>
                        )}
                        <Button type="button" variant="destructive" onClick={handleStopCampaign} className="flex-1">
                          Stop Campaign
                        </Button>
                      </div>
                      <Button type="button" variant="link" onClick={() => setActiveTab("live-logs")} className="w-full">
                        View Live Logs
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-40">
                      <p className="text-gray-500">Campaign status will appear here when you start sending emails.</p>
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Alert className="w-full">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Important</AlertTitle>
                    <AlertDescription>
                      Make sure your SMTP settings are correct and your account allows sending emails through SMTP.
                    </AlertDescription>
                  </Alert>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="preview-recipients">
            <CsvPreview file={csvFile} />
          </TabsContent>

          <TabsContent value="preview-template">
            <HtmlPreview htmlFile={htmlTemplate} textFile={textTemplate} csvData={csvData} />
          </TabsContent>

          <TabsContent value="test-email">
            <TestEmail
              htmlTemplate={htmlTemplate}
              textTemplate={textTemplate}
              senderName={formData.senderName}
              senderEmail={formData.senderEmail}
              subject={formData.subject}
              attachments={attachments}
              environment={formData.environment}
              username={formData.username}
              password={formData.password}
            />
          </TabsContent>

          <TabsContent value="live-logs">
            <RealTimeLogs
              isActive={campaignActive}
              campaignId={campaignId}
              campaignName={formData.subject || "Current Campaign"}
              sender={formData.senderEmail}
              onPause={handlePauseCampaign}
              onResume={handleResumeCampaign}
              logs={logs}
            />
          </TabsContent>
        </Tabs>

        <div className="mt-6">
          <Button type="submit" className="w-full" disabled={isLoading || !hasSelectedEnvConfig || campaignActive}>
            {isLoading ? "Sending Emails..." : "Start Email Campaign"}
          </Button>
          {!hasSelectedEnvConfig && !isLoading && !campaignActive && (
            <p className="text-center text-sm text-amber-600 mt-2">
              Please upload and select an environment configuration before starting the campaign.
            </p>
          )}
          {campaignActive && (
            <p className="text-center text-sm text-blue-600 mt-2">
              Campaign is currently active. You can view live logs in the "Live Logs" tab.
            </p>
          )}
        </div>
      </div>
    </form>
  )
}
