"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChevronLeft, ChevronRight, Search } from "lucide-react"
import Papa from "papaparse"

interface CsvPreviewProps {
  file: File | null
}

export function CsvPreview({ file }: CsvPreviewProps) {
  const [data, setData] = useState<any[]>([])
  const [headers, setHeaders] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredData, setFilteredData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const rowsPerPage = 10

  useEffect(() => {
    if (!file) {
      setData([])
      setHeaders([])
      setFilteredData([])
      return
    }

    setIsLoading(true)

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setData(results.data)
        setFilteredData(results.data)

        // Extract headers from the first row
        if (results.data.length > 0) {
          setHeaders(Object.keys(results.data[0]))
        }

        setIsLoading(false)
      },
      error: (error) => {
        console.error("Error parsing CSV:", error)
        setIsLoading(false)
      },
    })
  }, [file])

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredData(data)
      setCurrentPage(1)
      return
    }

    const filtered = data.filter((row) =>
      Object.values(row).some((value) => String(value).toLowerCase().includes(searchTerm.toLowerCase())),
    )

    setFilteredData(filtered)
    setCurrentPage(1)
  }, [searchTerm, data])

  const totalPages = Math.ceil(filteredData.length / rowsPerPage)
  const startIndex = (currentPage - 1) * rowsPerPage
  const currentData = filteredData.slice(startIndex, startIndex + rowsPerPage)

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  if (!file) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recipient Preview</CardTitle>
          <CardDescription>Upload a CSV file to preview recipient data</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-40">
          <p className="text-gray-500">No CSV file uploaded</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recipient Preview</CardTitle>
        <CardDescription>
          Showing data from {file.name} ({filteredData.length} recipients)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <p className="text-gray-500">Loading CSV data...</p>
          </div>
        ) : (
          <>
            <div className="flex items-center space-x-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="search"
                  placeholder="Search recipients..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {filteredData.length > 0 ? (
              <>
                <div className="rounded-md border overflow-hidden">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {headers.map((header) => (
                            <TableHead key={header}>{header}</TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {currentData.map((row, rowIndex) => (
                          <TableRow key={rowIndex}>
                            {headers.map((header) => (
                              <TableCell key={`${rowIndex}-${header}`}>{row[header] || ""}</TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-gray-500">
                      Showing {startIndex + 1}-{Math.min(startIndex + rowsPerPage, filteredData.length)} of{" "}
                      {filteredData.length} recipients
                    </p>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="icon" onClick={handlePrevPage} disabled={currentPage === 1}>
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-sm">
                        Page {currentPage} of {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={handleNextPage}
                        disabled={currentPage === totalPages}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center h-40">
                <p className="text-gray-500">No matching recipients found</p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
