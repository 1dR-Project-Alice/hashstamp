"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Copy, Check, Trash2, ExternalLink } from "lucide-react"
import { getHistory, deleteFromHistory, type TimestampRecord } from "@/lib/storage"
import { Empty } from "@/components/ui/empty"

export function TimestampHistory() {
  const [history, setHistory] = useState<TimestampRecord[]>([])
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    loadHistory()
  }, [])

  const loadHistory = async () => {
    const records = await getHistory()
    setHistory(records)
  }

  const copyHash = async (hash: string, id: string) => {
    await navigator.clipboard.writeText(hash)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const deleteRecord = async (id: string) => {
    await deleteFromHistory(id)
    setHistory(prev => prev.filter(record => record.id !== id))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (history.length === 0) {
    return (
      <Card>
        <CardContent className="p-8">
          <Empty
            title="No timestamps yet"
            description="Files you timestamp will appear here. Your history is stored locally on your device."
          />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {history.length} timestamp{history.length !== 1 ? "s" : ""} stored locally
        </p>
      </div>

      <div className="space-y-3">
        {history.map(record => (
          <Card key={record.id} className="overflow-hidden">
            <CardContent className="p-0">
              {/* Header */}
              <div className="flex items-start gap-3 border-b border-border bg-secondary/30 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-foreground">{record.fileName}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{formatFileSize(record.fileSize)}</span>
                    <span>•</span>
                    <span>{formatDate(record.timestamp)}</span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteRecord(record.id)}
                  className="shrink-0 text-muted-foreground hover:text-destructive min-h-[44px] min-w-[44px]"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              {/* Hash */}
              <div className="p-4">
                <div className="flex items-center gap-2">
                  <code className="flex-1 overflow-hidden rounded-lg bg-secondary p-2 font-mono text-xs text-foreground truncate">
                    {record.hash}
                  </code>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyHash(record.hash, record.id)}
                    className="shrink-0 min-h-[44px] min-w-[44px]"
                  >
                    {copiedId === record.id ? (
                      <Check className="h-4 w-4 text-primary" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                {record.otsUrl && (
                  <Button
                    variant="link"
                    size="sm"
                    className="mt-2 h-auto p-0 text-xs"
                    asChild
                  >
                    <a href={record.otsUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-1 h-3 w-3" />
                      View on calendar server
                    </a>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-4">
          <p className="text-center text-xs text-muted-foreground">
            History is stored locally using IndexedDB. 
            Clear your browser data to remove all records.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
