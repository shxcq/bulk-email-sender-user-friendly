"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { RefreshCw } from "lucide-react"

interface HtmlPreviewProps {
  htmlFile: File | null
  textFile: File | null
  csvData?: any[] | null
}

export function HtmlPreview({ htmlFile, textFile, csvData }: HtmlPreviewProps) {
  const [htmlContent, setHtmlContent] = useState<string>("")
  const [textContent, setTextContent] = useState<string>("")
  const [personalizedHtml, setPersonalizedHtml] = useState<string>("")
  const [personalizedText, setPersonalizedText] = useState<string>("")
  const [selectedRecipient, setSelectedRecipient] = useState<string>("none")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (htmlFile) {
      setIsLoading(true)
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result as string
        setHtmlContent(content)
        setPersonalizedHtml(content)
        setIsLoading(false)
      }
      reader.readAsText(htmlFile)
    } else {
      setHtmlContent("")
      setPersonalizedHtml("")
    }
  }, [htmlFile])

  useEffect(() => {
    if (textFile) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result as string
        setTextContent(content)
        setPersonalizedText(content)
      }
      reader.readAsText(textFile)
    } else {
      setTextContent("")
      setPersonalizedText("")
    }
  }, [textFile])

  const handleRecipientChange = (value: string) => {
    setSelectedRecipient(value)

    if (value === "none" || !csvData || csvData.length === 0) {
      setPersonalizedHtml(htmlContent)
      setPersonalizedText(textContent)
      return
    }

    const recipientIndex = Number.parseInt(value, 10)
    const recipient = csvData[recipientIndex]

    if (!recipient) return

    let newHtml = htmlContent
    let newText = textContent

    // Replace placeholders with recipient data
    Object.entries(recipient).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`
      const strValue = (value as string) || ""

      newHtml = newHtml.replace(new RegExp(placeholder, "g"), strValue)
      if (newText) {
        newText = newText.replace(new RegExp(placeholder, "g"), strValue)
      }
    })

    setPersonalizedHtml(newHtml)
    setPersonalizedText(newText)
  }

  const resetPreview = () => {
    setPersonalizedHtml(htmlContent)
    setPersonalizedText(textContent)
    setSelectedRecipient("none")
  }

  if (!htmlFile) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Email Preview</CardTitle>
          <CardDescription>Upload an HTML template to preview</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-40">
          <p className="text-gray-500">No HTML template uploaded</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Email Preview</CardTitle>
          <CardDescription>Preview how your email will look to recipients</CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={resetPreview}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Reset Preview
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <p className="text-gray-500">Loading template...</p>
          </div>
        ) : (
          <>
            {csvData && csvData.length > 0 && (
              <div className="mb-4">
                <Label htmlFor="recipient-select">Preview with recipient data</Label>
                <Select value={selectedRecipient} onValueChange={handleRecipientChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a recipient to preview personalization" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No personalization</SelectItem>
                    {csvData.slice(0, 10).map((_, index) => {
                      const emailField = csvData[index]["Emails"] || csvData[index]["Email"] || `Recipient ${index + 1}`
                      return (
                        <SelectItem key={index} value={index.toString()}>
                          {emailField}
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
            )}

            <Tabs defaultValue="html" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="html">HTML Preview</TabsTrigger>
                {textContent && <TabsTrigger value="text">Text Preview</TabsTrigger>}
              </TabsList>

              <TabsContent value="html">
                <div className="border rounded-md p-4 min-h-[400px] bg-white overflow-auto">
                  <iframe
                    srcDoc={personalizedHtml}
                    title="Email HTML Preview"
                    className="w-full h-[400px] border-0"
                    sandbox="allow-same-origin"
                  />
                </div>
              </TabsContent>

              {textContent && (
                <TabsContent value="text">
                  <div className="border rounded-md p-4 min-h-[400px] bg-white overflow-auto whitespace-pre-wrap font-mono text-sm">
                    {personalizedText}
                  </div>
                </TabsContent>
              )}
            </Tabs>
          </>
        )}
      </CardContent>
    </Card>
  )
}
