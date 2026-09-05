"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

type Dispute = {
  id: number
  transaction_id: string | null
  dispute_type: string | null
  amount: number | null
  status: string | null
  opened_at: string | null
  due_date: string | null
  razorpay_dispute_id?: string | null
}

function getStatusStyle(status: string | null) {
  const value = (status || "").toLowerCase()

  if (value === "won") {
    return "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
  }

  if (value === "lost") {
    return "border-red-500/20 bg-red-500/10 text-red-400"
  }

  if (
    value.includes("evidence") ||
    value.includes("action")
  ) {
    return "border-amber-500/20 bg-amber-500/10 text-amber-400"
  }

  return "border-blue-500/20 bg-blue-500/10 text-blue-400"
}

function formatDate(date: string | null) {
  if (!date) return "—"

  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

export default function DisputesPage() {
  const [disputes, setDisputes] = useState<Dispute[]>([])
  const [loading, setLoading] = useState(true)

  const [investigatingId, setInvestigatingId] =
    useState<number | null>(null)

  const [investigatedDisputeId, setInvestigatedDisputeId] =
    useState<number | null>(null)

  const [investigation, setInvestigation] =
    useState<string | null>(null)

  const [investigationError, setInvestigationError] =
    useState("")

  const [approvalLoading, setApprovalLoading] =
    useState(false)

  const [approvalDecision, setApprovalDecision] =
    useState<"approved" | "rejected" | null>(null)

  const [approvalMessage, setApprovalMessage] =
    useState("")

  const [contestLoading, setContestLoading] =
    useState(false)

  const [contestMessage, setContestMessage] =
    useState("")

  const [contestSuccess, setContestSuccess] =
    useState(false)

  useEffect(() => {
    async function loadDisputes() {
      const { data, error } = await supabase
        .from("disputes")
        .select(
          "id, transaction_id, dispute_type, amount, status, opened_at, due_date, razorpay_dispute_id"
        )
        .order("opened_at", {
          ascending: false,
        })

      console.log(
        "DISPUTES PAGE DATA:",
        data
      )

      console.log(
        "DISPUTES PAGE ERROR:",
        error
      )

      if (!error) {
        setDisputes(data || [])
      }

      setLoading(false)
    }

    loadDisputes()
  }, [])

  // ==========================================
  // AI INVESTIGATION
  // ==========================================

  async function investigateDispute(id: number) {
    setInvestigatingId(id)
    setInvestigatedDisputeId(id)
    setInvestigation(null)
    setInvestigationError("")
    setApprovalDecision(null)
    setApprovalMessage("")
    setContestMessage("")
    setContestSuccess(false)

    try {
      const response = await fetch(
        "/api/investigate-dispute",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            disputeId: id,
          }),
        }
      )

      const responseText =
        await response.text()

      console.log(
        "AI INVESTIGATION HTTP STATUS:",
        response.status
      )

      console.log(
        "AI INVESTIGATION RAW RESPONSE:",
        responseText
      )

      let data: any = null

      try {
        data = responseText
          ? JSON.parse(responseText)
          : null
      } catch (parseError) {
        console.error(
          "AI RESPONSE JSON PARSE ERROR:",
          parseError
        )

        throw new Error(
          `Server returned an invalid response (${response.status}). Check the terminal running Next.js.`
        )
      }

      if (!response.ok) {
        throw new Error(
          data?.error ||
            `Investigation failed with status ${response.status}.`
        )
      }

      if (!data?.investigation) {
        throw new Error(
          "AI investigation was empty."
        )
      }

      setInvestigation(
        data.investigation
      )
    } catch (error: any) {
      console.error(error)

      setInvestigationError(
        error?.message ||
          "Unable to investigate dispute."
      )
    } finally {
      setInvestigatingId(null)
    }
  }

  // ==========================================
  // HUMAN APPROVAL
  // ==========================================

  async function handleApproval(
    decision: "approved" | "rejected"
  ) {
    if (
      !investigatedDisputeId ||
      !investigation
    ) {
      return
    }

    setApprovalLoading(true)
    setApprovalMessage("")
    setContestMessage("")
    setContestSuccess(false)

    try {
      const draftResponse =
        investigation
          .split("DRAFT RESPONSE")
          .slice(1)
          .join("DRAFT RESPONSE")
          .trim()

      const response = await fetch(
        "/api/dispute-approval",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            disputeId:
              investigatedDisputeId,
            decision,
            investigation,
            draftResponse,
          }),
        }
      )

      const responseText =
        await response.text()

      let data: any = null

      try {
        data = responseText
          ? JSON.parse(responseText)
          : null
      } catch {
        throw new Error(
          "Server returned an invalid response."
        )
      }

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Failed to save merchant decision."
        )
      }

      setApprovalDecision(
        decision
      )

      setApprovalMessage(
        data?.message ||
          (decision === "approved"
            ? "Human approval recorded."
            : "AI recommendation rejected.")
      )
    } catch (error: any) {
      console.error(
        "APPROVAL ERROR:",
        error
      )

      setApprovalMessage(
        error?.message ||
          "Failed to save merchant decision."
      )
    } finally {
      setApprovalLoading(false)
    }
  }

  // ==========================================
  // RAZORPAY CONTEST
  // ==========================================

  async function submitToRazorpay() {
    if (
      !investigatedDisputeId ||
      approvalDecision !== "approved"
    ) {
      return
    }

    setContestLoading(true)
    setContestMessage("")
    setContestSuccess(false)

    try {
      /*
       * Get the local dispute and its Razorpay ID.
       */
      const {
        data: dispute,
        error,
      } = await supabase
        .from("disputes")
        .select(
          "id, amount, razorpay_dispute_id"
        )
        .eq(
          "id",
          investigatedDisputeId
        )
        .maybeSingle()

      if (error) {
        throw new Error(
          "Unable to load dispute details."
        )
      }

      if (!dispute) {
        throw new Error(
          "Dispute could not be found."
        )
      }

      /*
       * Current project uses synthetic disputes.
       * We must not pretend they are real Razorpay disputes.
       */
      if (
        !dispute.razorpay_dispute_id ||
        !dispute.razorpay_dispute_id.startsWith(
          "disp_"
        )
      ) {
        setContestMessage(
          "Human approval is complete. Razorpay submission is ready, but this demo dispute does not have a real Razorpay dispute ID yet."
        )

        return
      }

      /*
       * Get evidence metadata.
       *
       * The local Evidence Center stores files,
       * but Razorpay requires Razorpay document IDs
       * for actual contest submission.
       */
      const {
        data: evidenceRows,
        error: evidenceError,
      } = await supabase
        .from("evidence")
        .select(
          "id, file_name, file_path, evidence_type"
        )
        .eq(
          "dispute_id",
          investigatedDisputeId
        )

      if (evidenceError) {
        throw new Error(
          "Unable to load dispute evidence."
        )
      }

      /*
       * Local evidence files are not automatically
       * Razorpay document IDs.
       */
      if (
        !evidenceRows ||
        evidenceRows.length === 0
      ) {
        setContestMessage(
          "Human approval is complete, but at least one evidence document is required before Razorpay submission."
        )

        return
      }

      const draftResponse =
        investigation
          ?.split("DRAFT RESPONSE")
          .slice(1)
          .join("DRAFT RESPONSE")
          .trim() || ""

      /*
       * We currently don't have Razorpay document IDs
       * because the project is using local Supabase
       * evidence files.
       *
       * Therefore we safely stop here rather than
       * sending invalid evidence IDs.
       */
      setContestMessage(
        "Human approval is complete and evidence is available. Razorpay submission will activate after the evidence is uploaded to Razorpay and receives a real document ID."
      )

      /*
       * Keep this payload structure ready for the
       * real Razorpay integration.
       */
      console.log(
        "READY FOR RAZORPAY CONTEST:",
        {
          disputeId:
            dispute.razorpay_dispute_id,
          amount:
            dispute.amount,
          summary:
            draftResponse,
          evidence:
            evidenceRows,
        }
      )
    } catch (error: any) {
      console.error(
        "RAZORPAY CONTEST ERROR:",
        error
      )

      setContestMessage(
        error?.message ||
          "Unable to prepare Razorpay submission."
      )
    } finally {
      setContestLoading(false)
    }
  }

  // ==========================================
  // SUMMARY COUNTS
  // ==========================================

  const activeDisputes =
    disputes.filter((dispute) => {
      const status =
        (dispute.status || "").toLowerCase()

      return (
        status === "evidence due" ||
        status === "submitted" ||
        status === "under review" ||
        status === "action required"
      )
    })

  const wonDisputes =
    disputes.filter(
      (dispute) =>
        (dispute.status || "").toLowerCase() ===
        "won"
    )

  const lostDisputes =
    disputes.filter(
      (dispute) =>
        (dispute.status || "").toLowerCase() ===
        "lost"
    )

  return (
    <main className="min-h-screen bg-navy px-6 py-8 text-navy-foreground">

      <a
        href="/dashboard"
        className="inline-block rounded-lg border border-navy-border px-4 py-2 text-sm text-navy-muted transition hover:text-navy-foreground"
      >
        ← Back to Dashboard
      </a>

      {/* HEADER */}
      <div className="mt-8">
        <h1 className="text-2xl font-semibold">
          Dispute Management
        </h1>

        <p className="mt-1 text-sm text-navy-muted">
          Investigate disputes, organize evidence, and
          prepare responses for human approval.
        </p>
      </div>

      {/* SUMMARY */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

        <div className="rounded-xl border border-navy-border bg-navy-card p-5">
          <p className="text-xs text-navy-muted">
            Total Disputes
          </p>

          <p className="mt-2 text-2xl font-semibold">
            {disputes.length}
          </p>
        </div>

        <div className="rounded-xl border border-navy-border bg-navy-card p-5">
          <p className="text-xs text-navy-muted">
            Active
          </p>

          <p className="mt-2 text-2xl font-semibold text-amber-400">
            {activeDisputes.length}
          </p>
        </div>

        <div className="rounded-xl border border-navy-border bg-navy-card p-5">
          <p className="text-xs text-navy-muted">
            Won
          </p>

          <p className="mt-2 text-2xl font-semibold text-emerald-400">
            {wonDisputes.length}
          </p>
        </div>

        <div className="rounded-xl border border-navy-border bg-navy-card p-5">
          <p className="text-xs text-navy-muted">
            Lost
          </p>

          <p className="mt-2 text-2xl font-semibold text-red-400">
            {lostDisputes.length}
          </p>
        </div>

      </div>

      {/* AI INVESTIGATION */}
      {investigation && (
        <div className="mt-8 rounded-xl border border-blue-500/20 bg-blue-500/[0.04] p-6">

          <div className="flex items-center justify-between">

            <div>
              <h2 className="text-sm font-semibold">
                🤖 AI Dispute Investigator
              </h2>

              <p className="mt-1 text-xs text-navy-muted">
                Gemini-powered analysis based on the dispute,
                transaction, and available evidence.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setInvestigation(null)
                setInvestigatedDisputeId(null)
                setApprovalMessage("")
                setApprovalDecision(null)
                setContestMessage("")
                setContestSuccess(false)
              }}
              className="text-xs text-navy-muted hover:text-navy-foreground"
            >
              Close
            </button>

          </div>

          <div className="mt-5 whitespace-pre-wrap rounded-lg border border-navy-border bg-navy-card p-5 text-sm leading-7 text-navy-foreground">
            {investigation}
          </div>

          {/* HUMAN APPROVAL */}
          <div className="mt-5 rounded-lg border border-amber-500/20 bg-amber-500/[0.05] p-4">

            <p className="text-sm font-semibold text-amber-400">
              👤 Human Approval Required
            </p>

            <p className="mt-1 text-xs text-navy-muted">
              AI only prepares the recommendation and draft.
              A merchant must review and approve before any
              dispute submission.
            </p>

            <div className="mt-4 flex flex-wrap gap-3">

              <button
                type="button"
                disabled={
                  approvalLoading ||
                  approvalDecision !== null
                }
                onClick={() =>
                  handleApproval("approved")
                }
                className="rounded-lg bg-white px-4 py-2 text-xs font-semibold text-black transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {approvalLoading
                  ? "Saving..."
                  : approvalDecision === "approved"
                    ? "✓ Approved"
                    : "Approve Draft"}
              </button>

              <button
                type="button"
                disabled={
                  approvalLoading ||
                  approvalDecision !== null
                }
                onClick={() =>
                  handleApproval("rejected")
                }
                className="rounded-lg border border-navy-border px-4 py-2 text-xs text-navy-foreground transition hover:bg-white/[0.07] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {approvalDecision === "rejected"
                  ? "✓ Rejected"
                  : "Reject"}
              </button>

            </div>

            {approvalMessage && (
              <div
                className={`mt-4 rounded-lg border p-3 text-xs ${
                  approvalDecision === "approved"
                    ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                    : approvalDecision === "rejected"
                      ? "border-red-500/20 bg-red-500/10 text-red-400"
                      : "border-white/10 bg-black/20 text-slate-300"
                }`}
              >
                {approvalMessage}
              </div>
            )}

            {approvalDecision === "approved" && (
              <div className="mt-4 rounded-lg border border-emerald-500/20 bg-emerald-500/[0.06] p-4">

                <p className="text-sm font-semibold text-emerald-400">
                  ✓ Case Approved
                </p>

                <p className="mt-1 text-xs text-navy-muted">
                  Human approval has been recorded.
                  The case is now authorized for the
                  next dispute-processing step.
                </p>

                <div className="mt-4">

                  <button
                    type="button"
                    disabled={contestLoading}
                    onClick={
                      submitToRazorpay
                    }
                    className="rounded-lg bg-emerald-400 px-4 py-2 text-xs font-semibold text-black transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {contestLoading
                      ? "Preparing Razorpay Submission..."
                      : "Submit to Razorpay →"}
                  </button>

                </div>

                {contestMessage && (
                  <div
                    className={`mt-4 rounded-lg border p-3 text-xs ${
                      contestSuccess
                        ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                        : "border-amber-500/20 bg-amber-500/10 text-amber-300"
                    }`}
                  >
                    {contestMessage}
                  </div>
                )}

                <div className="mt-3 rounded-lg border border-white/10 bg-black/20 p-3 text-xs text-navy-muted">
                  Real Razorpay submission requires a
                  Razorpay dispute ID and Razorpay evidence
                  document ID. Synthetic demo disputes will
                  not be submitted as fake Razorpay cases.
                </div>

              </div>
            )}

          </div>

        </div>
      )}

      {/* ERROR */}
      {investigationError && (
        <div className="mt-8 rounded-xl border border-red-500/20 bg-red-500/[0.05] p-4">

          <p className="text-sm font-medium text-red-400">
            AI investigation failed
          </p>

          <p className="mt-1 text-xs text-navy-muted">
            {investigationError}
          </p>

        </div>
      )}

      {/* DISPUTES */}
      <div className="mt-8 overflow-hidden rounded-xl border border-navy-border bg-navy-card">

        <div className="border-b border-navy-border px-5 py-4">

          <h2 className="text-sm font-semibold">
            All Disputes
          </h2>

          <p className="mt-1 text-xs text-navy-muted">
            AI-assisted dispute investigation and evidence
            preparation.
          </p>

        </div>

        {loading ? (
          <p className="p-5 text-sm text-navy-muted">
            Loading disputes...
          </p>
        ) : disputes.length === 0 ? (
          <div className="p-8 text-center">

            <p className="text-sm text-navy-muted">
              No disputes found.
            </p>

          </div>
        ) : (
          <div className="divide-y divide-navy-border">

            {disputes.map((dispute) => {

              const status =
                (dispute.status || "").toLowerCase()

              const isResolved =
                status === "won" ||
                status === "lost"

              const isInvestigating =
                investigatingId === dispute.id

              return (
                <div
                  key={dispute.id}
                  className="p-5 transition hover:bg-white/[0.02]"
                >

                  <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

                    {/* LEFT */}
                    <div className="min-w-0">

                      <div className="flex flex-wrap items-center gap-3">

                        <p className="font-semibold">
                          Dispute #{dispute.id}
                        </p>

                        <span
                          className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${getStatusStyle(
                            dispute.status
                          )}`}
                        >
                          {dispute.status ||
                            "Unknown"}
                        </span>

                      </div>

                      <p className="mt-2 text-sm text-navy-muted">
                        {dispute.dispute_type ||
                          "Payment dispute"}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-xs text-navy-muted">

                        <span>
                          Transaction:{" "}
                          <span className="text-navy-foreground">
                            {dispute.transaction_id ||
                              "—"}
                          </span>
                        </span>

                        <span>
                          Opened:{" "}
                          <span className="text-navy-foreground">
                            {formatDate(
                              dispute.opened_at
                            )}
                          </span>
                        </span>

                        <span>
                          Due:{" "}
                          <span className="text-navy-foreground">
                            {formatDate(
                              dispute.due_date
                            )}
                          </span>
                        </span>

                      </div>

                    </div>

                    {/* RIGHT */}
                    <div className="flex flex-col items-start gap-3 lg:items-end">

                      <p className="text-lg font-semibold">
                        ₹
                        {Number(
                          dispute.amount || 0
                        ).toLocaleString("en-IN")}
                      </p>

                      {!isResolved && (
                        <button
                          type="button"
                          disabled={
                            isInvestigating
                          }
                          onClick={() =>
                            investigateDispute(
                              dispute.id
                            )
                          }
                          className="rounded-lg border border-navy-border bg-white/[0.03] px-4 py-2 text-xs font-medium text-navy-foreground transition hover:bg-white/[0.07] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isInvestigating
                            ? "Investigating..."
                            : "🤖 Investigate with AI →"}
                        </button>
                      )}

                      {isResolved && (
                        <span className="text-xs text-navy-muted">
                          Dispute resolved
                        </span>
                      )}

                    </div>

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