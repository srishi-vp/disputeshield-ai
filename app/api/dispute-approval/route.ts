import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        {
          error: "Supabase environment variables are missing.",
        },
        { status: 500 }
      )
    }

    const body = await request.json()

    const {
      disputeId,
      decision,
      investigation,
      draftResponse,
    } = body

    if (!disputeId) {
      return NextResponse.json(
        { error: "disputeId is required." },
        { status: 400 }
      )
    }

    if (
      decision !== "approved" &&
      decision !== "rejected"
    ) {
      return NextResponse.json(
        {
          error:
            "decision must be approved or rejected.",
        },
        { status: 400 }
      )
    }

    const supabase = createClient(
      supabaseUrl,
      supabaseKey
    )

    // Verify the dispute exists
    const { data: dispute, error: disputeError } =
      await supabase
        .from("disputes")
        .select("*")
        .eq("id", disputeId)
        .single()

    if (disputeError || !dispute) {
      return NextResponse.json(
        {
          error:
            disputeError?.message ||
            "Dispute not found.",
        },
        { status: 404 }
      )
    }

    // Save merchant decision
    const { data: action, error: actionError } =
      await supabase
        .from("dispute_actions")
        .insert({
          dispute_id: disputeId,
          decision,
          investigation:
            investigation || null,
          draft_response:
            draftResponse || null,
          actor: "Merchant",
        })
        .select()
        .single()

    if (actionError) {
      console.error(
        "DISPUTE ACTION INSERT ERROR:",
        actionError
      )

      return NextResponse.json(
        {
          error: actionError.message,
        },
        { status: 500 }
      )
    }

    // Create audit log
    const { error: auditError } =
      await supabase
        .from("audit_logs")
        .insert({
          action:
            decision === "approved"
              ? "Human Approval Granted"
              : "Human Approval Rejected",
          entity_type: "dispute",
          entity_id: String(disputeId),
          actor: "Merchant",
          details: {
            transaction_id:
              dispute.transaction_id,
            dispute_type:
              dispute.dispute_type,
            amount: dispute.amount,
            decision,
          },
        })

    if (auditError) {
      console.error(
        "AUDIT LOG ERROR:",
        auditError
      )
    }

    return NextResponse.json({
      success: true,
      decision,
      action,
      message:
        decision === "approved"
          ? "Human approval recorded. Case is ready for the next dispute action."
          : "Merchant rejected the AI recommendation. No dispute action was authorized.",
    })
  } catch (error: any) {
    console.error(
      "DISPUTE APPROVAL ERROR:",
      error
    )

    return NextResponse.json(
      {
        error:
          error?.message ||
          "Failed to save approval decision.",
      },
      { status: 500 }
    )
  }
}