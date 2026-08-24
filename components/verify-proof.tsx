"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { FileCheck, Upload, AlertCircle, CheckCircle2, XCircle, ExternalLink } from "lucide-react"
import { hashFile } from "@/lib/hash"
import { verifyTimestamp } from "@/lib/opentimestamps"
import { cn } from "@/lib/utils"

interface VerificationResult {
  status: "pending" | "verified" | "upgraded" | "not-anchored" | "invalid" | "error"
  originalHash?: string
  computedHash?: string
  timestamp?: Date
  bitcoinBlock?: number
  error?: string
}

export function VerifyProof() {
  const [originalFile, setOriginalFile] = useState<File | null>(null)
  const [otsFile, setOtsFile] = useState<File | null>(null)
  const [result, setResult] = useState<VerificationResult | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)

  const onDropOriginal = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      setOriginalFile(file)
      setResult(null)
    }
  }, [])

  const onDropOts = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file && file.name.endsWith(".ots")) {
      setOtsFile(file)
      setResult(null)
    }
  }, [])

  const { getRootProps: getOriginalProps, getInputProps: getOriginalInput, isDragActive: isDragOriginal } = useDropzone({
    onDrop: onDropOriginal,
    multiple: false,
  })

  const { getRootProps: getOtsProps, getInputProps: getOtsInput, isDragActive: isDragOts } = useDropzone({
    onDrop: onDropOts,
    multiple: false,
    accept: {
      "application/octet-stream": [".ots"],
    },
  })

  const verify = async () => {
    if (!originalFile || !otsFile) return

    setIsVerifying(true)
    setResult({ status: "pending" })

    try {
      // Hash the original file
      const computedHash = await hashFile(originalFile)
      
      // Read the OTS file
      const otsData = new Uint8Array(await otsFile.arrayBuffer())
      
      // Verify the timestamp
      const verification = await verifyTimestamp(computedHash, otsData)
      
      setResult({
        ...verification,
        computedHash,
      })
    } catch (error) {
      setResult({
        status: "error",
        error: error instanceof Error ? error.message : "Verification failed",
      })
    } finally {
      setIsVerifying(false)
    }
  }

  const reset = () => {
    setOriginalFile(null)
    setOtsFile(null)
    setResult(null)
  }

  return (
    <div className="space-y-6">
      {/* File Drop Zones */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Original File */}
        <div
          {...getOriginalProps()}
          className={cn(
            "group cursor-pointer rounded-xl border-2 border-dashed transition-all duration-300",
            isDragOriginal 
              ? "border-primary bg-primary/5 shadow-[0_0_20px_rgba(99,102,241,0.1)]" 
              : "border-border/50 bg-card/30 hover:border-primary/50 hover:bg-card/50",
            originalFile && "border-solid border-primary/50 bg-primary/5"
          )}
        >
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <input {...getOriginalInput()} />
            <div className={cn(
              "mb-4 flex h-14 w-14 items-center justify-center rounded-xl transition-all",
              originalFile 
                ? "bg-gradient-to-br from-primary to-accent" 
                : "bg-secondary/50 group-hover:bg-secondary"
            )}>
              {originalFile ? (
                <CheckCircle2 className="h-6 w-6 text-primary-foreground" />
              ) : (
                <Upload className="h-6 w-6 text-muted-foreground group-hover:text-foreground transition-colors" />
              )}
            </div>
            <p className="text-sm font-semibold tracking-tight text-foreground">
              {originalFile ? originalFile.name : "Original File"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {originalFile ? "Tap to change" : "Drop or tap to select"}
            </p>
          </div>
        </div>

        {/* OTS Proof File */}
        <div
          {...getOtsProps()}
          className={cn(
            "group cursor-pointer rounded-xl border-2 border-dashed transition-all duration-300",
            isDragOts 
              ? "border-primary bg-primary/5 shadow-[0_0_20px_rgba(99,102,241,0.1)]" 
              : "border-border/50 bg-card/30 hover:border-primary/50 hover:bg-card/50",
            otsFile && "border-solid border-primary/50 bg-primary/5"
          )}
        >
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <input {...getOtsInput()} />
            <div className={cn(
              "mb-4 flex h-14 w-14 items-center justify-center rounded-xl transition-all",
              otsFile 
                ? "bg-gradient-to-br from-primary to-accent" 
                : "bg-secondary/50 group-hover:bg-secondary"
            )}>
              {otsFile ? (
                <CheckCircle2 className="h-6 w-6 text-primary-foreground" />
              ) : (
                <FileCheck className="h-6 w-6 text-muted-foreground group-hover:text-foreground transition-colors" />
              )}
            </div>
            <p className="text-sm font-semibold tracking-tight text-foreground">
              {otsFile ? otsFile.name : ".ots Proof File"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {otsFile ? "Tap to change" : "Drop or tap to select"}
            </p>
          </div>
        </div>
      </div>

      {/* Verify Button */}
      <Button
        onClick={verify}
        disabled={!originalFile || !otsFile || isVerifying}
        className="w-full min-h-[48px] bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-primary/30 disabled:opacity-50 disabled:shadow-none"
        size="lg"
      >
        {isVerifying ? (
          <>
            <Spinner className="mr-2 h-4 w-4" />
            Verifying...
          </>
        ) : (
          <>
            <FileCheck className="mr-2 h-4 w-4" />
            Verify Timestamp
          </>
        )}
      </Button>

      {/* Verification Result */}
      {result && result.status !== "pending" && (
        <div className="rounded-xl border border-border/50 bg-card/50 p-5 backdrop-blur-sm">
          {result.status === "verified" && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/10">
                  <CheckCircle2 className="h-6 w-6 text-success" />
                </div>
                <div>
                  <p className="font-semibold text-success">Verified</p>
                  <p className="text-sm text-muted-foreground">
                    This file existed at the timestamped date
                  </p>
                </div>
              </div>
              {result.timestamp && (
                <div className="rounded-lg border border-border/50 bg-secondary/30 p-4">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Timestamp</p>
                  <p className="mt-1 font-mono text-sm text-foreground">
                    {result.timestamp.toLocaleString()}
                  </p>
                </div>
              )}
              {result.bitcoinBlock && (
                <div className="rounded-lg border border-border/50 bg-secondary/30 p-4">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Bitcoin Block</p>
                  <a
                    href={`https://blockstream.info/block-height/${result.bitcoinBlock}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 flex items-center gap-1 font-mono text-sm text-primary hover:underline"
                  >
                    #{result.bitcoinBlock}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
            </div>
          )}

          {result.status === "not-anchored" && (
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-500/10">
                <AlertCircle className="h-6 w-6 text-yellow-500" />
              </div>
              <div>
                <p className="font-semibold text-yellow-500">Pending Bitcoin Confirmation</p>
                <p className="text-sm text-muted-foreground">
                  The timestamp is valid but not yet anchored to Bitcoin. 
                  Check back in ~24 hours.
                </p>
              </div>
            </div>
          )}

          {result.status === "upgraded" && (
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/10">
                <CheckCircle2 className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="font-semibold text-success">Timestamp Upgraded</p>
                <p className="text-sm text-muted-foreground">
                  Your proof has been upgraded with the Bitcoin anchor
                </p>
              </div>
            </div>
          )}

          {result.status === "invalid" && (
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10">
                <XCircle className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <p className="font-semibold text-destructive">Invalid Proof</p>
                <p className="text-sm text-muted-foreground">
                  The proof does not match this file. The file may have been modified.
                </p>
              </div>
            </div>
          )}

          {result.status === "error" && (
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10">
                <AlertCircle className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <p className="font-semibold text-destructive">Verification Error</p>
                <p className="text-sm text-muted-foreground">{result.error}</p>
              </div>
            </div>
          )}

          <Button
            variant="outline"
            onClick={reset}
            className="mt-5 w-full min-h-[48px] border-border/50 bg-secondary/30 hover:bg-secondary"
          >
            Verify Another File
          </Button>
        </div>
      )}

      {/* Instructions */}
      <div className="rounded-xl border border-border/50 bg-card/30 p-5 backdrop-blur-sm">
        <h3 className="mb-4 text-sm font-semibold tracking-tight text-foreground">How to verify</h3>
        <ol className="space-y-3 text-sm text-muted-foreground">
          <li className="flex gap-4">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent text-xs font-semibold text-primary-foreground">1</span>
            <span className="pt-0.5">Select the original file you want to verify</span>
          </li>
          <li className="flex gap-4">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent text-xs font-semibold text-primary-foreground">2</span>
            <span className="pt-0.5">Select the corresponding .ots proof file</span>
          </li>
          <li className="flex gap-4">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent text-xs font-semibold text-primary-foreground">3</span>
            <span className="pt-0.5">Click verify to check if the timestamp is valid</span>
          </li>
        </ol>
      </div>
    </div>
  )
}
