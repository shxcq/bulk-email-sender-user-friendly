"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Pause, Play, Download } from "lucide-react"

interface LogEntry {
  timestamp: string
  recipient: string
  status: "pending" | "sent" | "failed" | "delivered" | "opened" | "bounced" | "error"
  message?: string
  details?: string
}

interface RealTimeLogsProps {
  isActive: boolean
  campaignId?: string
  campaignName?: string
  sender?: string
  onPause?: () => void
  onResume?: () => void
  logs?: LogEntry[]
}

export function RealTimeLogs({
  isActive,
  campaignId,
  campaignName = "Current Campaign",
  sender = "Not specified",
  onPause,
  onResume,
  logs = [],
}: RealTimeLogsProps) {
  const [isPaused, setIsPaused] = useState(false)
  const [autoScroll, setAutoScroll] = useState(true)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (autoScroll && scrollAreaRef.current && logs.length > 0) {
      const scrollArea = scrollAreaRef.current
      scrollArea.scrollTop = scrollArea.scrollHeight
    }
  }, [logs, autoScroll])

  const getStatusBadge = (status: LogEntry["status"]) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-yellow-500">Pending</Badge>
      case "sent":
        return <Badge className="bg-blue-500">Sent</Badge>
      case "delivered":
        return <Badge className="bg-green-500">Delivered</Badge>
      case "opened":
        return <Badge className="bg-purple-500">Opened</Badge>
      case "failed":
        return <Badge className="bg-red-500">Failed</Badge>
      case "bounced":
        return <Badge className="bg-orange-500">Bounced</Badge>
      case "error":
        return <Badge className="bg-red-500">Error</Badge>
      default:
        return <Badge>Unknown</Badge>
    }
  }

  const handlePauseResume = () => {
    setIsPaused(!isPaused)
    if (isPaused) {
      onResume?.()
    } else {
      onPause?.()
    }
  }

  const handleExportLogs = () => {
    // Create a CSV of the logs
    const headers = ["Timestamp", "Recipient", "Status", "Message", "Details"]
    const csvContent = [
      headers.join(","),
      ...logs.map((log) =>
        [log.timestamp, log.recipient, log.status, log.message || "", log.details || ""]
          .map((value) => `"${value}"`)
          .join(","),
      ),
    ].join("\n")

    // Create a download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `campaign-logs-${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Real-Time Email Logs</CardTitle>
          <CardDescription>
            Campaign: {campaignName} | Sender: {sender}
          </CardDescription>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={handlePauseResume} disabled={!isActive}>
            {isPaused ? <Play className="h-4 w-4 mr-1" /> : <Pause className="h-4 w-4 mr-1" />}
            {isPaused ? "Resume" : "Pause"}
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportLogs} disabled={logs.length === 0}>
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <ScrollArea className="h-[400px] rounded-md" ref={scrollAreaRef}>
            <div className="p-4 space-y-4">
              {logs.length > 0 ? (
                logs.map((log, index) => (
                  <div key={index} className="border-b pb-3 last:border-0 last:pb-0">
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{log.recipient}</span>
                          {getStatusBadge(log.status)}
                        </div>
                        <span className="text-sm text-gray-500">{log.message}</span>
                        {log.details && <span className="text-xs text-red-500 mt-1">{log.details}</span>}
                      </div>
                      <span className="text-xs text-gray-500">{log.timestamp}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex items-center justify-center h-[350px] text-gray-500">
                  {isActive ? "Waiting for email activity..." : "No active campaign"}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
        <div className="flex justify-between items-center mt-2">
          <div className="text-sm text-gray-500">{logs.length} log entries</div>
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-500 flex items-center">
              <input
                type="checkbox"
                checked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
                className="mr-2"
              />
              Auto-scroll
            </label>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
