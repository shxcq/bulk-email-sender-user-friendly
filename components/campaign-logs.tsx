"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, Download, RefreshCw, ChevronDown, Eye } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

// Mock log data
const mockLogs = [
  {
    id: "1",
    timestamp: "2023-05-23 10:15:32",
    campaign: "Newsletter May 2023",
    subject: "May Newsletter: Latest Updates",
    sender: "newsletter@ascent-institute.com",
    environment: "it",
    recipients: 120,
    successful: 118,
    failed: 2,
    status: "completed",
  },
  {
    id: "2",
    timestamp: "2023-05-20 14:22:45",
    campaign: "Product Announcement",
    subject: "Introducing Our New Training Program",
    sender: "pensionstrainings@ascent-institute.com",
    environment: "pension",
    recipients: 85,
    successful: 85,
    failed: 0,
    status: "completed",
  },
  {
    id: "3",
    timestamp: "2023-05-18 09:30:12",
    campaign: "Weekly Update",
    subject: "This Week at Ascent Institute",
    sender: "newsletter@ascent-institute.com",
    environment: "it",
    recipients: 150,
    successful: 145,
    failed: 5,
    status: "completed",
  },
  {
    id: "4",
    timestamp: "2023-05-15 16:45:30",
    campaign: "Special Offer",
    subject: "Limited Time Offer: 20% Off All Courses",
    sender: "governance@ascent-institute.com",
    environment: "governance",
    recipients: 200,
    successful: 0,
    failed: 0,
    status: "interrupted",
  },
  {
    id: "5",
    timestamp: "2023-05-10 11:20:15",
    campaign: "Governance Training",
    subject: "New Governance Training Sessions Available",
    sender: "governance@ascent-institute.com",
    environment: "governance",
    recipients: 75,
    successful: 72,
    failed: 3,
    status: "completed",
  },
]

// Mock recipient data for a specific campaign
const mockRecipients = [
  { email: "john.doe@example.com", status: "delivered", openedAt: "2023-05-23 10:30:45" },
  { email: "jane.smith@example.com", status: "delivered", openedAt: "2023-05-23 11:15:22" },
  { email: "robert.johnson@example.com", status: "delivered", openedAt: null },
  { email: "sarah.williams@example.com", status: "bounced", openedAt: null },
  { email: "michael.brown@example.com", status: "delivered", openedAt: "2023-05-23 12:45:10" },
]

export function CampaignLogs() {
  const [searchTerm, setSearchTerm] = useState("")
  const [logs, setLogs] = useState(mockLogs)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null)
  const [showRecipients, setShowRecipients] = useState(false)
  const [filterEnvironment, setFilterEnvironment] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<string | null>(null)

  useEffect(() => {
    filterLogs()
  }, [searchTerm, filterEnvironment, filterStatus])

  const filterLogs = () => {
    let filtered = [...mockLogs]

    if (searchTerm) {
      filtered = filtered.filter(
        (log) =>
          log.campaign.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.sender.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.timestamp.includes(searchTerm),
      )
    }

    if (filterEnvironment) {
      filtered = filtered.filter((log) => log.environment === filterEnvironment)
    }

    if (filterStatus) {
      filtered = filtered.filter((log) => log.status === filterStatus)
    }

    setLogs(filtered)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    filterLogs()
  }

  const handleRefresh = () => {
    setIsLoading(true)
    // Simulate API call
    setTimeout(() => {
      setLogs(mockLogs)
      setIsLoading(false)
      setFilterEnvironment(null)
      setFilterStatus(null)
      setSearchTerm("")
    }, 1000)
  }

  const handleDownload = (id: string) => {
    // In a real app, this would download the log file
    console.log(`Downloading log ${id}`)
  }

  const handleViewRecipients = (id: string) => {
    setSelectedCampaign(id)
    setShowRecipients(true)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500">Completed</Badge>
      case "interrupted":
        return <Badge className="bg-yellow-500">Interrupted</Badge>
      case "failed":
        return <Badge className="bg-red-500">Failed</Badge>
      case "in_progress":
        return <Badge className="bg-blue-500">In Progress</Badge>
      default:
        return <Badge>Unknown</Badge>
    }
  }

  const getRecipientStatusBadge = (status: string) => {
    switch (status) {
      case "delivered":
        return <Badge className="bg-green-500">Delivered</Badge>
      case "bounced":
        return <Badge className="bg-red-500">Bounced</Badge>
      case "pending":
        return <Badge className="bg-yellow-500">Pending</Badge>
      default:
        return <Badge>Unknown</Badge>
    }
  }

  return (
    <>
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Email Campaign Logs</CardTitle>
            <CardDescription>View history of all email campaigns</CardDescription>
          </div>
          <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row items-start md:items-center space-y-2 md:space-y-0 md:space-x-2 mb-4">
            <form onSubmit={handleSearch} className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Search campaigns..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </form>

            <div className="flex items-center space-x-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    Environment <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setFilterEnvironment(null)}>All</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterEnvironment("it")}>IT</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterEnvironment("pension")}>Pension</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterEnvironment("governance")}>Governance</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    Status <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setFilterStatus(null)}>All</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterStatus("completed")}>Completed</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterStatus("interrupted")}>Interrupted</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterStatus("failed")}>Failed</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterStatus("in_progress")}>In Progress</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Sender</TableHead>
                  <TableHead>Environment</TableHead>
                  <TableHead className="text-right">Recipients</TableHead>
                  <TableHead className="text-right">Success</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.length > 0 ? (
                  logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium whitespace-nowrap">{log.timestamp}</TableCell>
                      <TableCell>{log.campaign}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{log.subject}</TableCell>
                      <TableCell className="max-w-[150px] truncate">{log.sender}</TableCell>
                      <TableCell className="capitalize">{log.environment}</TableCell>
                      <TableCell className="text-right">{log.recipients}</TableCell>
                      <TableCell className="text-right">
                        {log.successful}/{log.recipients}
                      </TableCell>
                      <TableCell>{getStatusBadge(log.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewRecipients(log.id)}
                            title="View Recipients"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDownload(log.id)}
                            title="Download Report"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-4">
                      No logs found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showRecipients} onOpenChange={setShowRecipients}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Campaign Recipients</DialogTitle>
            <DialogDescription>
              {logs.find((log) => log.id === selectedCampaign)?.campaign} -{" "}
              {logs.find((log) => log.id === selectedCampaign)?.timestamp}
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-md border mt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Opened</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Device</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockRecipients.map((recipient, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{recipient.email}</TableCell>
                    <TableCell>{getRecipientStatusBadge(recipient.status)}</TableCell>
                    <TableCell>{recipient.openedAt || "Not opened"}</TableCell>
                    <TableCell>{recipient.status === "delivered" ? "192.168.1." + (index + 100) : "-"}</TableCell>
                    <TableCell>
                      {recipient.status === "delivered"
                        ? ["Chrome/Windows", "Safari/macOS", "Firefox/Linux", "Edge/Windows", "Mobile/iOS"][index % 5]
                        : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
