"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileHasher } from "@/components/file-hasher"
import { VerifyProof } from "@/components/verify-proof"
import { TimestampHistory } from "@/components/timestamp-history"
import { Shield, FileCheck, History, Lock, Fingerprint } from "lucide-react"

export default function HomePage() {
  const [activeTab, setActiveTab] = useState("stamp")

  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Background gradient effects */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-1/4 -top-1/4 h-[600px] w-[600px] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute -bottom-1/4 -right-1/4 h-[500px] w-[500px] rounded-full bg-accent/5 blur-[100px]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto max-w-2xl px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="relative flex h-11 w-11 items-center justify-center">
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20" />
              <div className="absolute inset-[1px] rounded-[10px] bg-card" />
              <Fingerprint className="relative h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight text-foreground">HashStamp</h1>
              <p className="text-xs text-muted-foreground">Cryptographic Proof of Existence</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="relative z-10 mx-auto max-w-2xl px-4 py-8">
        {/* Hero Section */}
        <section className="mb-10 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border/50 bg-secondary/50 px-3 py-1.5 text-xs text-muted-foreground backdrop-blur-sm">
            <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" />
            OpenTimestamps Integration Active
          </div>
          <h2 className="text-balance text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            Prove your files existed
          </h2>
          <p className="mx-auto mt-3 max-w-md text-pretty text-muted-foreground">
            Free cryptographic timestamps anchored to Bitcoin. 
            Your files never leave your device.
          </p>
        </section>

        {/* Feature Pills */}
        <div className="mb-8 flex flex-wrap justify-center gap-2">
          <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-card/50 px-3 py-2 text-xs backdrop-blur-sm">
            <Lock className="h-3.5 w-3.5 text-primary" />
            <span className="text-foreground">100% Private</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-card/50 px-3 py-2 text-xs backdrop-blur-sm">
            <Shield className="h-3.5 w-3.5 text-primary" />
            <span className="text-foreground">Bitcoin Anchored</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-card/50 px-3 py-2 text-xs backdrop-blur-sm">
            <FileCheck className="h-3.5 w-3.5 text-primary" />
            <span className="text-foreground">Free Forever</span>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid h-14 w-full grid-cols-3 gap-1 rounded-xl border border-border/50 bg-card/50 p-1.5 backdrop-blur-sm">
            <TabsTrigger 
              value="stamp" 
              className="flex min-h-[44px] items-center justify-center gap-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg"
            >
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Stamp</span>
            </TabsTrigger>
            <TabsTrigger 
              value="verify" 
              className="flex min-h-[44px] items-center justify-center gap-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg"
            >
              <FileCheck className="h-4 w-4" />
              <span className="hidden sm:inline">Verify</span>
            </TabsTrigger>
            <TabsTrigger 
              value="history" 
              className="flex min-h-[44px] items-center justify-center gap-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg"
            >
              <History className="h-4 w-4" />
              <span className="hidden sm:inline">History</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="stamp" className="mt-6">
            <FileHasher />
          </TabsContent>

          <TabsContent value="verify" className="mt-6">
            <VerifyProof />
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            <TimestampHistory />
          </TabsContent>
        </Tabs>
      </div>

      {/* Footer */}
      <footer className="relative z-10 mt-auto border-t border-border/50 bg-card/30 backdrop-blur-sm">
        <div className="mx-auto max-w-2xl px-4 py-6">
          <div className="text-center text-sm text-muted-foreground">
            <p className="mb-2">
              Powered by{" "}
              <a
                href="https://opentimestamps.org"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary underline-offset-4 transition-colors hover:underline"
              >
                OpenTimestamps
              </a>
              {" "}- Free Bitcoin Timestamping
            </p>
            <p className="text-xs text-muted-foreground/70">
              SHA256 hashing happens locally. Your files are never uploaded.
            </p>
          </div>
        </div>
      </footer>
    </main>
  )
}
