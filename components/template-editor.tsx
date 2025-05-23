"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function TemplateEditor() {
  const [templateName, setTemplateName] = useState("")
  const [htmlContent, setHtmlContent] = useState("")
  const [textContent, setTextContent] = useState("")
  const [preview, setPreview] = useState<string | null>(null)

  const handleSave = () => {
    // Save template logic would go here
    console.log("Saving template:", { templateName, htmlContent, textContent })
  }

  const handlePreview = () => {
    setPreview(htmlContent)
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Email Template Editor</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Input
              placeholder="Template Name"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              className="mb-4"
            />
          </div>

          <Tabs defaultValue="html">
            <TabsList>
              <TabsTrigger value="html">HTML</TabsTrigger>
              <TabsTrigger value="text">Plain Text</TabsTrigger>
              {preview && <TabsTrigger value="preview">Preview</TabsTrigger>}
            </TabsList>

            <TabsContent value="html">
              <Textarea
                placeholder="Enter HTML content here..."
                value={htmlContent}
                onChange={(e) => setHtmlContent(e.target.value)}
                className="min-h-[400px] font-mono"
              />
            </TabsContent>

            <TabsContent value="text">
              <Textarea
                placeholder="Enter plain text content here..."
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                className="min-h-[400px] font-mono"
              />
            </TabsContent>

            {preview && (
              <TabsContent value="preview">
                <div className="border rounded-md p-4 min-h-[400px] bg-white">
                  <div dangerouslySetInnerHTML={{ __html: preview }} />
                </div>
              </TabsContent>
            )}
          </Tabs>

          <div className="flex justify-between">
            <Button variant="outline" onClick={handlePreview}>
              Preview
            </Button>
            <div className="space-x-2">
              <Button variant="outline">Cancel</Button>
              <Button onClick={handleSave}>Save Template</Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
