import { hexToBytes } from "./hash"

/**
 * OpenTimestamps Calendar Servers
 * These are free public servers that accept timestamp requests
 */
const CALENDAR_SERVERS = [
  "https://a.pool.opentimestamps.org",
  "https://b.pool.opentimestamps.org",
  "https://a.pool.eternitywall.com",
]

/**
 * Submit a hash to OpenTimestamps calendar servers
 * Returns the OTS proof data and the calendar URL
 */
export async function submitToOpenTimestamps(hash: string): Promise<{
  otsData: Uint8Array
  calendarUrl: string
}> {
  const hashBytes = hexToBytes(hash)

  // Try each calendar server until one succeeds
  let lastError: Error | null = null

  for (const server of CALENDAR_SERVERS) {
    try {
      const response = await fetch(`${server}/digest`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: hashBytes,
      })

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`)
      }

      const otsData = new Uint8Array(await response.arrayBuffer())

      // Build a minimal OTS file with the calendar response
      const otsFile = buildOtsFile(hashBytes, otsData, server)

      return {
        otsData: otsFile,
        calendarUrl: `${server}/timestamp/${hash}`,
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Unknown error")
      console.warn(`Calendar server ${server} failed:`, lastError.message)
      continue
    }
  }

  throw new Error(lastError?.message || "All calendar servers failed")
}

/**
 * Build a minimal OpenTimestamps file
 * OTS file format: magic bytes + version + hash type + hash + attestations
 */
function buildOtsFile(hash: Uint8Array, calendarResponse: Uint8Array, server: string): Uint8Array {
  // OTS file magic header
  const MAGIC = new Uint8Array([0x00, 0x4f, 0x70, 0x65, 0x6e, 0x54, 0x69, 0x6d, 0x65, 0x73, 0x74, 0x61, 0x6d, 0x70, 0x73, 0x00, 0x00, 0x50, 0x72, 0x6f, 0x6f, 0x66, 0x00, 0xbf, 0x89, 0xe2, 0xe8, 0x84, 0xe8, 0x92, 0x94])
  
  // Version (1 byte)
  const VERSION = new Uint8Array([0x01])
  
  // SHA256 hash type tag (0x08)
  const HASH_TYPE = new Uint8Array([0x08])
  
  // Combine: magic + version + hash_type + hash + calendar_response
  const result = new Uint8Array(
    MAGIC.length + VERSION.length + HASH_TYPE.length + hash.length + calendarResponse.length
  )
  
  let offset = 0
  result.set(MAGIC, offset); offset += MAGIC.length
  result.set(VERSION, offset); offset += VERSION.length
  result.set(HASH_TYPE, offset); offset += HASH_TYPE.length
  result.set(hash, offset); offset += hash.length
  result.set(calendarResponse, offset)
  
  return result
}

/**
 * Verify an OpenTimestamps proof
 * This is a simplified verification that checks the basic structure
 * For full verification, use the OpenTimestamps website or CLI
 */
export async function verifyTimestamp(
  hash: string,
  otsData: Uint8Array
): Promise<{
  status: "verified" | "upgraded" | "not-anchored" | "invalid"
  timestamp?: Date
  bitcoinBlock?: number
  originalHash?: string
}> {
  try {
    // Check for OTS magic header
    const magic = String.fromCharCode(...otsData.slice(1, 14))
    if (magic !== "OpenTimestamps") {
      return { status: "invalid" }
    }

    // For proper verification, we redirect to the OpenTimestamps verifier
    // This is because full verification requires Bitcoin RPC access
    const hashBytes = hexToBytes(hash)
    
    // Check if the hash in the file matches our computed hash
    // Hash starts at position 32 (after magic + version + hash type)
    const fileHash = otsData.slice(32, 64)
    
    let hashMatches = true
    for (let i = 0; i < 32; i++) {
      if (fileHash[i] !== hashBytes[i]) {
        hashMatches = false
        break
      }
    }

    if (!hashMatches) {
      return { status: "invalid", originalHash: Array.from(fileHash).map(b => b.toString(16).padStart(2, "0")).join("") }
    }

    // Look for Bitcoin attestation marker in the OTS data
    // 0x0588960d73d71901 is the Bitcoin attestation tag
    const bitcoinTag = [0x05, 0x88, 0x96, 0x0d, 0x73, 0xd7, 0x19, 0x01]
    let hasBitcoinAttestation = false
    
    for (let i = 0; i < otsData.length - bitcoinTag.length; i++) {
      let found = true
      for (let j = 0; j < bitcoinTag.length; j++) {
        if (otsData[i + j] !== bitcoinTag[j]) {
          found = false
          break
        }
      }
      if (found) {
        hasBitcoinAttestation = true
        break
      }
    }

    if (hasBitcoinAttestation) {
      return {
        status: "verified",
        timestamp: new Date(), // Actual timestamp would need Bitcoin RPC lookup
      }
    }

    // Check for pending attestation marker
    // 0x83dfe30d2ef90c8e is the pending attestation tag
    const pendingTag = [0x83, 0xdf, 0xe3, 0x0d, 0x2e, 0xf9, 0x0c, 0x8e]
    
    for (let i = 0; i < otsData.length - pendingTag.length; i++) {
      let found = true
      for (let j = 0; j < pendingTag.length; j++) {
        if (otsData[i + j] !== pendingTag[j]) {
          found = false
          break
        }
      }
      if (found) {
        return { status: "not-anchored" }
      }
    }

    return { status: "not-anchored" }
  } catch (error) {
    console.error("Verification error:", error)
    return { status: "invalid" }
  }
}

/**
 * Download an OTS proof file
 */
export function downloadOtsFile(otsData: Uint8Array, originalFileName: string) {
  const blob = new Blob([otsData], { type: "application/octet-stream" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `${originalFileName}.ots`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Get the OpenTimestamps info page URL for a hash
 */
export function getOtsInfoUrl(hash: string): string {
  return `https://opentimestamps.org/info.html?hash=${hash}`
}
