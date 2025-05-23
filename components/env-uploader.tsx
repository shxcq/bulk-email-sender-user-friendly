"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, X, Check } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export interface EnvConfig {
  EMAIL_USERNAME: string
  EMAIL_PASSWORD: string
  SENDER_EMAIL: string
  SENDER_NAME: string
}

interface EnvUploaderProps {
  onEnvConfigsChange: (envConfigs: Record<string, EnvConfig>) => void
}

export function EnvUploader({ onEnvConfigsChange }: EnvUploaderProps) {
  const { toast } = useToast()
  const [envFiles, setEnvFiles] = useState<Record<string, File>>({})
  const [parsedConfigs, setParsedConfigs] = useState<Record<string, EnvConfig>>({})

  const handleEnvFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, envType: string) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setEnvFiles((prev) => ({ ...prev, [envType]: file }))

      try {
        const content = await file.text()
        const config = parseEnvFile(content)

        setParsedConfigs((prev) => {
          const newConfigs = { ...prev, [envType]: config }
          onEnvConfigsChange(newConfigs)
          return newConfigs
        })

        toast({
          title: "Environment file loaded",
          description: `Successfully loaded ${envType} environment configuration`,
        })
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to parse environment file. Please check the format.",
          variant: "destructive",
        })
      }
    }
  }

  const removeEnvFile = (envType: string) => {
    setEnvFiles((prev) => {
      const newFiles = { ...prev }
      delete newFiles[envType]
      return newFiles
    })

    setParsedConfigs((prev) => {
      const newConfigs = { ...prev }
      delete newConfigs[envType]
      onEnvConfigsChange(newConfigs)
      return newConfigs
    })
  }

  const parseEnvFile = (content: string): EnvConfig => {
    const config: Partial<EnvConfig> = {}
    const lines = content.split("\n")

    for (const line of lines) {
      if (line.trim() === "" || line.startsWith("#")) continue

      const [key, ...valueParts] = line.split("=")
      const value = valueParts.join("=").trim()

      if (key === "EMAIL_USERNAME") config.EMAIL_USERNAME = value
      if (key === "EMAIL_PASSWORD") config.EMAIL_PASSWORD = value
      if (key === "SENDER_EMAIL") config.SENDER_EMAIL = value
      if (key === "SENDER_NAME") config.SENDER_NAME = value
    }

    // Validate that we have all required fields
    if (!config.EMAIL_USERNAME || !config.SENDER_EMAIL || !config.SENDER_NAME) {
      throw new Error("Missing required environment variables")
    }

    return config as EnvConfig
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Environment Configuration</CardTitle>
        <CardDescription>Upload environment files for different email configurations</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {["it", "pension", "governance"].map((envType) => (
            <div key={envType} className="space-y-2">
              <Label htmlFor={`${envType}EnvFile`} className="capitalize">
                {envType} Environment
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id={`${envType}EnvFile`}
                  type="file"
                  accept=".env"
                  onChange={(e) => handleEnvFileUpload(e, envType)}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant={envFiles[envType] ? "outline" : "secondary"}
                  onClick={() => document.getElementById(`${envType}EnvFile`)?.click()}
                  className="w-full"
                >
                  {envFiles[envType] ? (
                    <>
                      <Check className="mr-2 h-4 w-4 text-green-500" />
                      Uploaded
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload .env.{envType}
                    </>
                  )}
                </Button>
                {envFiles[envType] && (
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeEnvFile(envType)}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {parsedConfigs[envType] && (
                <div className="text-xs text-gray-500 mt-1">
                  <p>Username: {parsedConfigs[envType].EMAIL_USERNAME}</p>
                  <p>Sender: {parsedConfigs[envType].SENDER_NAME}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
