"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

type Evidence = {
  id: number
  dispute_id: number | null
  title: string | null
  file_name: string | null
  file_path: string | null
  file_type: string | null
  file_size: number | null
  evidence_type: string | null
  uploaded_at: string | null
}

type Dispute = {
  id: number
  transaction_id: string | null
  dispute_type: string | null
  status: string | null
}

export default function EvidenceCenterPage() {
  const [evidence, setEvidence] = useState<Evidence[]>([])
  const [disputes, setDisputes] = useState<Dispute[]>([])
  const [selectedDispute, setSelectedDispute] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState("")

  async function loadData() {
    setLoading(true)

    const [evidenceResult, disputesResult] = await Promise.all([
      supabase
        .from("evidence")
        .select(
          "id, dispute_id, title, file_name, file_path, file_type, file_size, evidence_type, uploaded_at"
        )
        .order("uploaded_at", { ascending: false }),

      supabase
        .from("disputes")
        .select("id, transaction_id, dispute_type, status")
        .order("opened_at", { ascending: false }),
    ])

    console.log("EVIDENCE:", evidenceResult.data)
    console.log("EVIDENCE ERROR:", evidenceResult.error)

    console.log("DISPUTES:", disputesResult.data)
    console.log("DISPUTES ERROR:", disputesResult.error)

    if (!evidenceResult.error) {
      setEvidence(evidenceResult.data || [])
    }

    if (!disputesResult.error) {
      setDisputes(disputesResult.data || [])
    }

    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  async function handleUpload() {
    setMessage("")

    if (!selectedFile) {
      setMessage("Please select a file.")
      return
    }

    if (!selectedDispute) {
      setMessage("Please select a dispute.")
      return
    }

    setUploading(true)

    try {
      const filePath = `dispute-${selectedDispute}/${Date.now()}-${selectedFile.name}`

      // 1. Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("evidence")
        .upload(filePath, selectedFile, {
          cacheControl: "3600",
          upsert: false,
        })

      if (uploadError) {
        console.error("STORAGE UPLOAD ERROR:", uploadError)
        setMessage(`Upload failed: ${uploadError.message}`)
        setUploading(false)
        return
      }

      // 2. Save evidence metadata
      const { error: insertError } = await supabase
        .from("evidence")
        .insert({
          dispute_id: Number(selectedDispute),

          // Required by your existing evidence table
          title: selectedFile.name,
          evidence_type: "Document",

          // File information
          file_name: selectedFile.name,
          file_path: filePath,
          file_type: selectedFile.type || "application/octet-stream",
          file_size: selectedFile.size,
        })

      if (insertError) {
        console.error("EVIDENCE DATABASE ERROR:", insertError)

        // If DB insert fails after Storage upload,
        // remove the uploaded file so we don't leave orphan files.
        await supabase.storage
          .from("evidence")
          .remove([filePath])

        setMessage(`Database error: ${insertError.message}`)
        setUploading(false)
        return
      }

      setMessage("Evidence uploaded successfully.")

      setSelectedFile(null)
      setSelectedDispute("")

      const fileInput = document.getElementById(
        "evidence-file"
      ) as HTMLInputElement | null

      if (fileInput) {
        fileInput.value = ""
      }

      await loadData()
    } catch (error) {
      console.error("UPLOAD ERROR:", error)
      setMessage("Something went wrong while uploading.")
    }

    setUploading(false)
  }

  function getFileUrl(path: string | null) {
    if (!path) {
      return null
    }

    const { data } = supabase.storage
      .from("evidence")
      .getPublicUrl(path)

    return data?.publicUrl || null
  }

  function formatSize(size: number | null) {
    if (!size) {
      return "—"
    }

    if (size < 1024) {
      return `${size} B`
    }

    if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(1)} KB`
    }

    return `${(size / (1024 * 1024)).toFixed(1)} MB`
  }

  function formatDate(date: string | null) {
    if (!date) {
      return "—"
    }

    return new Date(date).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <main className="min-h-screen bg-navy px-6 py-8 text-navy-foreground">

      {/* Back */}
      <a
        href="/dashboard"
        className="inline-block rounded-lg border border-navy-border px-4 py-2 text-sm text-navy-muted transition hover:text-navy-foreground"
      >
        ← Back to Dashboard
      </a>

      {/* Header */}
      <div className="mt-8">
        <h1 className="text-2xl font-semibold">
          Evidence Center
        </h1>

        <p className="mt-1 text-sm text-navy-muted">
          Upload and organize evidence required to defend payment disputes.
        </p>
      </div>

      {/* Upload Card */}
      <div className="mt-8 rounded-xl border border-navy-border bg-navy-card p-6">

        <div className="mb-5">
          <h2 className="text-sm font-semibold">
            Upload Evidence
          </h2>

          <p className="mt-1 text-xs text-navy-muted">
            Attach invoices, delivery proofs, customer communication,
            or other supporting documents.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_1fr_auto]">

          {/* Dispute */}
          <div>
            <label className="mb-2 block text-xs text-navy-muted">
              Dispute
            </label>

            <select
              value={selectedDispute}
              onChange={(e) =>
                setSelectedDispute(e.target.value)
              }
              className="w-full rounded-lg border border-navy-border bg-navy px-3 py-2.5 text-sm outline-none"
            >
              <option value="">
                Select dispute
              </option>

              {disputes.map((dispute) => (
                <option
                  key={dispute.id}
                  value={dispute.id}
                >
                  Dispute #{dispute.id}
                  {dispute.transaction_id
                    ? ` — ${dispute.transaction_id}`
                    : ""}
                </option>
              ))}
            </select>
          </div>

          {/* File */}
          <div>
            <label className="mb-2 block text-xs text-navy-muted">
              Evidence file
            </label>

            <input
              id="evidence-file"
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.txt"
              onChange={(e) =>
                setSelectedFile(
                  e.target.files?.[0] || null
                )
              }
              className="block w-full rounded-lg border border-navy-border bg-navy px-3 py-2 text-sm text-navy-muted file:mr-3 file:rounded-md file:border-0 file:bg-white/10 file:px-3 file:py-1.5 file:text-xs file:text-navy-foreground"
            />
          </div>

          {/* Button */}
          <div className="flex items-end">
            <button
              type="button"
              onClick={handleUpload}
              disabled={uploading}
              className="w-full rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50 lg:w-auto"
            >
              {uploading
                ? "Uploading..."
                : "Upload Evidence"}
            </button>
          </div>

        </div>

        {/* Message */}
        {message && (
          <div className="mt-4 rounded-lg border border-navy-border bg-white/[0.02] px-4 py-3">
            <p className="text-xs text-navy-muted">
              {message}
            </p>
          </div>
        )}

      </div>

      {/* Evidence List */}
      <div className="mt-8 overflow-hidden rounded-xl border border-navy-border bg-navy-card">

        <div className="border-b border-navy-border px-5 py-4">
          <h2 className="text-sm font-semibold">
            Evidence Files
          </h2>

          <p className="mt-1 text-xs text-navy-muted">
            Evidence currently attached to disputes.
          </p>
        </div>

        {loading ? (
          <p className="p-5 text-sm text-navy-muted">
            Loading evidence...
          </p>
        ) : evidence.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-navy-muted">
              No evidence uploaded yet.
            </p>

            <p className="mt-1 text-xs text-navy-muted">
              Upload your first dispute document above.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-navy-border">

            {evidence.map((item) => {
              const fileUrl = getFileUrl(item.file_path)

              return (
                <div
                  key={item.id}
                  className="flex flex-col gap-4 px-5 py-5 transition hover:bg-white/[0.02] lg:flex-row lg:items-center lg:justify-between"
                >

                  {/* File information */}
                  <div className="min-w-0">

                    <div className="flex flex-wrap items-center gap-3">

                      <p className="truncate font-medium">
                        {item.file_name ||
                          item.title ||
                          "Evidence file"}
                      </p>

                      <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-1 text-[10px] text-blue-400">
                        {item.evidence_type || "Evidence"}
                      </span>

                    </div>

                    <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-navy-muted">

                      <span>
                        Dispute #{item.dispute_id ?? "—"}
                      </span>

                      <span>
                        {formatSize(item.file_size)}
                      </span>

                      <span>
                        {formatDate(item.uploaded_at)}
                      </span>

                    </div>

                  </div>

                  {/* View button */}
                  <div className="shrink-0">

                    {fileUrl ? (
                      <a
                        href={fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block rounded-lg border border-navy-border px-4 py-2 text-xs font-medium text-navy-foreground transition hover:bg-white/[0.05]"
                      >
                        View Evidence →
                      </a>
                    ) : (
                      <span className="text-xs text-navy-muted">
                        File unavailable
                      </span>
                    )}

                  </div>

                </div>
              )
            })}

          </div>
        )}

      </div>

    </main>
  )
}