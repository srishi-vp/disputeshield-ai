import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    const razorpayKeyId =
      process.env.RAZORPAY_KEY_ID

    const razorpayKeySecret =
      process.env.RAZORPAY_KEY_SECRET

    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL

    const supabaseKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

    if (
      !razorpayKeyId ||
      !razorpayKeySecret
    ) {
      return NextResponse.json(
        {
          error:
            "Razorpay API credentials are missing.",
        },
        { status: 500 }
      )
    }

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        {
          error:
            "Supabase environment variables are missing.",
        },
        { status: 500 }
      )
    }

    const body = await request.json()

    const {
      disputeId,
      action = "submit",
      amount,
      summary,
      evidence,
    } = body

    if (!disputeId) {
      return NextResponse.json(
        {
          error:
            "Razorpay dispute ID is required.",
        },
        { status: 400 }
      )
    }

    if (
      typeof disputeId !== "string" ||
      !disputeId.startsWith("disp_")
    ) {
      return NextResponse.json(
        {
          error:
            "A valid Razorpay dispute ID is required. Expected format: disp_...",
        },
        { status: 400 }
      )
    }

    if (
      action !== "draft" &&
      action !== "submit"
    ) {
      return NextResponse.json(
        {
          error:
            "Action must be either draft or submit.",
        },
        { status: 400 }
      )
    }

    /*
     * For a real submission Razorpay requires
     * at least one evidence document.
     */
    if (action === "submit") {
      if (
        !evidence ||
        typeof evidence !== "object"
      ) {
        return NextResponse.json(
          {
            error:
              "At least one Razorpay evidence document is required for submission.",
          },
          { status: 400 }
        )
      }

      const evidenceValues =
        Object.values(evidence).flat()

      if (
        evidenceValues.length === 0
      ) {
        return NextResponse.json(
          {
            error:
              "At least one Razorpay evidence document is required for submission.",
          },
          { status: 400 }
        )
      }
    }

    /*
     * Verify that the local dispute exists.
     */
    const supabase = createClient(
      supabaseUrl,
      supabaseKey
    )

    const {
      data: localDispute,
      error: disputeError,
    } = await supabase
      .from("disputes")
      .select(
        "id, transaction_id, amount, status, razorpay_dispute_id"
      )
      .eq(
        "razorpay_dispute_id",
        disputeId
      )
      .maybeSingle()

    if (disputeError) {
      console.error(
        "SUPABASE DISPUTE LOOKUP ERROR:",
        disputeError
      )

      return NextResponse.json(
        {
          error:
            "Unable to verify the local dispute.",
        },
        { status: 500 }
      )
    }

    if (!localDispute) {
      return NextResponse.json(
        {
          error:
            "This Razorpay dispute is not mapped to a local DisputeShield case.",
          disputeId,
        },
        { status: 404 }
      )
    }

    /*
     * Human approval is required before a real
     * Razorpay contest can be submitted.
     */
    const {
      data: approval,
      error: approvalError,
    } = await supabase
      .from("dispute_actions")
      .select(
        "id, decision, created_at"
      )
      .eq(
        "dispute_id",
        localDispute.id
      )
      .eq(
        "decision",
        "approved"
      )
      .order(
        "created_at",
        { ascending: false }
      )
      .limit(1)
      .maybeSingle()

    if (approvalError) {
      console.error(
        "SUPABASE APPROVAL LOOKUP ERROR:",
        approvalError
      )

      return NextResponse.json(
        {
          error:
            "Unable to verify human approval.",
        },
        { status: 500 }
      )
    }

    if (!approval) {
      return NextResponse.json(
        {
          error:
            "Human approval is required before submitting a dispute contest.",
        },
        { status: 403 }
      )
    }

    /*
     * Build Razorpay contest payload.
     */
    const razorpayPayload: Record<
      string,
      any
    > = {
      action,
    }

    if (
      amount !== undefined &&
      amount !== null
    ) {
      razorpayPayload.amount = amount
    }

    if (
      summary &&
      typeof summary === "string"
    ) {
      razorpayPayload.summary =
        summary.slice(0, 1000)
    }

    /*
     * Evidence keys supported by Razorpay:
     *
     * shipping_proof
     * billing_proof
     * cancellation_proof
     * customer_communication
     * proof_of_service
     * explanation_letter
     * refund_confirmation
     * access_activity_log
     * refund_cancellation_policy
     * term_and_conditions
     */
    const allowedEvidenceTypes = [
      "shipping_proof",
      "billing_proof",
      "cancellation_proof",
      "customer_communication",
      "proof_of_service",
      "explanation_letter",
      "refund_confirmation",
      "access_activity_log",
      "refund_cancellation_policy",
      "term_and_conditions",
    ]

    if (
      evidence &&
      typeof evidence === "object"
    ) {
      for (
        const evidenceType of allowedEvidenceTypes
      ) {
        const documents =
          evidence[evidenceType]

        if (
          Array.isArray(documents) &&
          documents.length > 0
        ) {
          razorpayPayload[evidenceType] =
            documents
        }
      }
    }

    /*
     * Razorpay uses Basic Authentication.
     */
    const authToken = Buffer.from(
      `${razorpayKeyId}:${razorpayKeySecret}`
    ).toString("base64")

    const razorpayResponse =
      await fetch(
        `https://api.razorpay.com/v1/disputes/${encodeURIComponent(
          disputeId
        )}/contest`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Basic ${authToken}`,
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify(
            razorpayPayload
          ),
        }
      )

    const responseText =
      await razorpayResponse.text()

    let razorpayData: any

    try {
      razorpayData =
        JSON.parse(responseText)
    } catch {
      razorpayData = {
        raw: responseText,
      }
    }

    /*
     * Razorpay rejected the request.
     */
    if (!razorpayResponse.ok) {
      console.error(
        "RAZORPAY CONTEST ERROR:",
        razorpayData
      )

      return NextResponse.json(
        {
          success: false,
          error:
            razorpayData?.error?.description ||
            razorpayData?.error?.reason ||
            "Razorpay rejected the contest request.",
          razorpay: razorpayData,
        },
        {
          status:
            razorpayResponse.status >= 400
              ? razorpayResponse.status
              : 400,
        }
      )
    }

    /*
     * Record successful Razorpay action.
     */
    const { error: actionError } =
      await supabase
        .from("dispute_actions")
        .insert({
          dispute_id:
            localDispute.id,
          decision: "approved",
          investigation:
            "Razorpay contest submitted successfully.",
          draft_response:
            summary || null,
          actor: "Razorpay API",
        })

    if (actionError) {
      console.error(
        "DISPUTE ACTION LOG ERROR:",
        actionError
      )
    }

    /*
     * Store an audit record.
     */
    const { error: auditError } =
      await supabase
        .from("audit_logs")
        .insert({
          action:
            `Razorpay Contest ${action}`,
          entity_type:
            "razorpay_dispute",
          entity_id:
            disputeId,
          actor:
            "DisputeShield AI",
          details: {
            dispute_id:
              disputeId,
            local_dispute_id:
              localDispute.id,
            transaction_id:
              localDispute.transaction_id,
            action,
            amount:
              amount ?? null,
            summary:
              summary ?? null,
            evidence:
              evidence ?? null,
            razorpay_response:
              razorpayData,
          },
        })

    if (auditError) {
      console.error(
        "CONTEST AUDIT ERROR:",
        auditError
      )
    }

    /*
     * Razorpay normally changes a submitted dispute
     * to under_review and emits the corresponding webhook.
     *
     * We don't fake that status locally here.
     * The webhook remains the source of truth.
     */
    return NextResponse.json({
      success: true,
      message:
        action === "submit"
          ? "Dispute contest submitted to Razorpay."
          : "Dispute contest draft saved in Razorpay.",
      disputeId,
      action,
      razorpay: razorpayData,
    })
  } catch (error: any) {
    console.error(
      "RAZORPAY CONTEST ROUTE ERROR:",
      error
    )

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          "Unable to process Razorpay contest.",
      },
      { status: 500 }
    )
  }
}