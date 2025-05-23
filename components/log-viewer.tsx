"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, Download, RefreshCw } from "lucide-react"

// Mock log data
const mockLogs = [
  {
    id: "1",
    timestamp: "2023-05-23 10:15:32",
    campaign: "Newsletter May 2023",
    recipients: 120,
    successful: 118,
    failed: 2,
    status: "completed",
  },
  {
    id: "2",
    timestamp: "2023-05-20 14:22:45",
    campaign: "Product Announcement",
    recipients: 85,
    successful: 85,
    failed: 0,
    status: "completed",
  },
  {
    id: "3",
    timestamp: "2023-05-18 09:30:12",
    campaign: "Weekly Update",
    recipients: 150,
    successful: 145,
    failed: 5,
    status: "completed",
  },
  {
    id: "4",
    timestamp: "2023-05-15 16:45:30",
    campaign: "Special Offer",
    recipients: 200,
    successful: 0,
    failed: 0,
    status: "interrupted",
  },
]

export function LogViewer() {
  const [searchTerm, setSearchTerm] = useState("")
  const [logs, setLogs] = useState(mockLogs)
  const [isLoading, setIsLoading] = useState(false)

  const handleSearch = () => {
    if (!searchTerm) {
      setLogs(mockLogs)
      return
    }

    const filtered = mockLogs.filter(
      (log) => log.campaign.toLowerCase().includes(searchTerm.toLowerCase()) || log.timestamp.includes(searchTerm),
    )

    setLogs(filtered)
  }

  const handleRefresh = () => {
    setIsLoading(true)
    // Simulate API call
    setTimeout(() => {
      setLogs(mockLogs)
      setIsLoading(false)
    }, 1000)
  }

  const handleDownload = (id: string) => {
    // In a real app, this would download the log file
    console.log(`Downloading log ${id}`)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500">Completed</Badge>
      case "interrupted":
        return <Badge className="bg-yellow-500">Interrupted</Badge>
      case "failed":
        return <Badge className="bg-red-500">Failed</Badge>
      default:
        return <Badge>Unknown</Badge>
    }
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Email Campaign Logs</CardTitle>
        <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="search"
              placeholder="Search campaigns..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>
          <Button onClick={handleSearch}>Search</Button>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date & Time</TableHead>
                <TableHead>Campaign</TableHead>
                <TableHead className="text-right">Recipients</TableHead>
                <TableHead className="text-right">Successful</TableHead>
                <TableHead className="text-right">Failed</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length > 0 ? (
                logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium">{log.timestamp}</TableCell>
                    <TableCell>{log.campaign}</TableCell>
                    <TableCell className="text-right">{log.recipients}</TableCell>
                    <TableCell className="text-right">{log.successful}</TableCell>
                    <TableCell className="text-right">{log.failed}</TableCell>
                    <TableCell>{getStatusBadge(log.status)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleDownload(log.id)}>
                        <Download className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-4">
                    No logs found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
