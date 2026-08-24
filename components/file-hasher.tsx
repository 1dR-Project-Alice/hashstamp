"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Upload, FileText, Copy, Check, Download, ExternalLink, AlertCircle, Lock, Zap } from "lucide-react"
import { hashFile } from "@/lib/hash"
import { submitToOpenTimestamps, downloadOtsFile } from "@/lib/opentimestamps"
import { saveToHistory } from "@/lib/storage"
import { cn } from "@/lib/utils"

interface HashResult {
  fileName: string
  fileSize: number
  hash: string
  timestamp: Date
  otsData?: Uint8Array
  otsUrl?: string
  status: "hashing" | "hashed" | "submitting" | "stamped" | "error"
  error?: string
}

export function FileHasher() {
  const [result, setResult] = useState<HashResult | null>(null)
  const [copied, setCopied] = useState(false)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    // Reset state
    setResult({
      fileName: file.name,
      fileSize: file.size,
      hash: "",
      timestamp: new Date(),
      status: "hashing",
    })

    try {
      // Step 1: Hash the file locally
      const hash = await hashFile(file)
      
      setResult(prev => prev ? { ...prev, hash, status: "hashed" } : null)
    } catch (error) {
      setResult(prev => prev ? { 
        ...prev, 
        status: "error", 
        error: error instanceof Error ? error.message : "Failed to hash file" 
      } : null)
    }
  }, [])

  const submitTimestamp = async () => {
    if (!result?.hash) return

    setResult(prev => prev ? { ...prev, status: "submitting" } : null)

    try {
      const { otsData, calendarUrl } = await submitToOpenTimestamps(result.hash)
      
      const stampedResult: HashResult = {
        ...result,
        otsData,
        otsUrl: calendarUrl,
        status: "stamped",
        timestamp: new Date(),
      }
      
      setResult(stampedResult)

      // Save to local history
      await saveToHistory({
        fileName: result.fileName,
        fileSize: result.fileSize,
        hash: result.hash,
        timestamp: stampedResult.timestamp.toISOString(),
        otsUrl: calendarUrl,
      })
    } catch (error) {
      setResult(prev => prev ? { 
        ...prev, 
        status: "error", 
        error: error instanceof Error ? error.message : "Failed to submit timestamp" 
      } : null)
    }
  }

  const copyHash = async () => {
    if (!result?.hash) return
    await navigator.clipboard.writeText(result.hash)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const downloadProof = () => {
    if (!result?.otsData || !result?.fileName) return
    downloadOtsFile(result.otsData, result.fileName)
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
  })

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="space-y-6">
      {/* Drop Zone */}
      <div
        {...getRootProps()}
        className={cn(
          "group relative cursor-pointer overflow-hidden rounded-xl border-2 border-dashed transition-all duration-300",
          isDragActive 
            ? "border-primary bg-primary/5 shadow-[0_0_30px_rgba(99,102,241,0.15)]" 
            : "border-border/50 bg-card/30 hover:border-primary/50 hover:bg-card/50"
        )}
      >
        <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
          <input {...getInputProps()} />
          <div className={cn(
            "relative mb-5 flex h-20 w-20 items-center justify-center rounded-2xl transition-all duration-300",
            isDragActive ? "bg-primary/20" : "bg-secondary/50 group-hover:bg-secondary"
          )}>
            <div className={cn(
              "absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/10 opacity-0 transition-opacity",
              isDragActive && "opacity-100"
            )} />
            <Upload className={cn(
              "h-9 w-9 transition-colors duration-300",
              isDragActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
            )} />
          </div>
          <p className="text-lg font-semibold tracking-tight text-foreground">
            {isDragActive ? "Drop file here" : "Drop a file to hash"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            or tap to browse files
          </p>
          <div className="mt-5 flex items-center gap-2 rounded-full bg-secondary/50 px-3 py-1.5 text-xs text-muted-foreground">
            <Lock className="h-3 w-3" />
            <span>Hashed locally - never uploaded</span>
          </div>
        </div>
      </div>

      {/* Result */}
      {result && (
        <Card>
          <CardContent className="overflow-hidden rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm">
            {/* File Info Header */}
            <div className="border-b border-border/50 bg-secondary/20 p-4">
              <div className="flex items-start gap-3">
                <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary/50">
                  <FileText className="h-5 w-5 text-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold tracking-tight text-foreground">{result.fileName}</p>
                  <p className="text-sm text-muted-foreground">{formatFileSize(result.fileSize)}</p>
                </div>
              </div>
            </div>

            {/* Hash Result */}
            <div className="p-4">
              {result.status === "hashing" ? (
                <div className="flex items-center justify-center gap-3 py-4">
                  <Spinner className="h-5 w-5" />
                  <span className="text-muted-foreground">Computing SHA256 hash...</span>
                </div>
              ) : result.status === "error" ? (
                <div className="flex items-center gap-3 rounded-lg bg-destructive/10 p-4 text-destructive">
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  <p className="text-sm">{result.error}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Hash Display */}
                  <div>
                    <label className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      <Zap className="h-3 w-3 text-primary" />
                      SHA256 Hash
                    </label>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 overflow-hidden rounded-lg border border-border/50 bg-secondary/30 p-3 font-mono text-xs text-foreground break-all">
                        {result.hash}
                      </code>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={copyHash}
                        className="shrink-0 min-h-[44px] min-w-[44px] border-border/50 bg-secondary/30 hover:bg-secondary"
                      >
                        {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {result.status === "hashed" && (
                    <Button
                      onClick={submitTimestamp}
                      className="w-full min-h-[48px] bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-primary/30"
                      size="lg"
                    >
                      <Zap className="mr-2 h-4 w-4" />
                      Timestamp with OpenTimestamps
                    </Button>
                  )}

                  {result.status === "submitting" && (
                    <Button disabled className="w-full min-h-[48px]" size="lg">
                      <Spinner className="mr-2 h-4 w-4" />
                      Submitting to calendar servers...
                    </Button>
                  )}

                  {result.status === "stamped" && (
                    <div className="space-y-4">
                      <div className="rounded-xl border border-success/20 bg-success/5 p-4">
                        <div className="flex items-center gap-2 mb-1">
                          <Check className="h-4 w-4 text-success" />
                          <p className="text-sm font-semibold text-success">Timestamp Submitted</p>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Your hash has been submitted to OpenTimestamps calendar servers. 
                          The proof will be anchored to Bitcoin within ~24 hours.
                        </p>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <Button
                          onClick={downloadProof}
                          variant="default"
                          className="min-h-[48px] bg-gradient-to-r from-primary to-accent shadow-lg shadow-primary/20"
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Download .ots Proof
                        </Button>

                        {result.otsUrl && (
                          <Button
                            variant="outline"
                            className="min-h-[48px] border-border/50 bg-secondary/30 hover:bg-secondary"
                            asChild
                          >
                            <a href={result.otsUrl} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="mr-2 h-4 w-4" />
                              View on Calendar
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* How it works */}
      <div className="rounded-xl border border-border/50 bg-card/30 p-5 backdrop-blur-sm">
        <h3 className="mb-4 text-sm font-semibold tracking-tight text-foreground">How it works</h3>
        <ol className="space-y-4 text-sm text-muted-foreground">
          <li className="flex gap-4">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent text-xs font-semibold text-primary-foreground">1</span>
            <span className="pt-0.5">Your file is hashed locally using SHA256 - it never leaves your device</span>
          </li>
          <li className="flex gap-4">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent text-xs font-semibold text-primary-foreground">2</span>
            <span className="pt-0.5">The hash is submitted to OpenTimestamps calendar servers (free)</span>
          </li>
          <li className="flex gap-4">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent text-xs font-semibold text-primary-foreground">3</span>
            <span className="pt-0.5">Within ~24 hours, the timestamp is anchored to the Bitcoin blockchain</span>
          </li>
          <li className="flex gap-4">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent text-xs font-semibold text-primary-foreground">4</span>
            <span className="pt-0.5">Download your .ots proof file to verify your document existed at that time</span>
          </li>
        </ol>
      </div>
    </div>
  )
}
