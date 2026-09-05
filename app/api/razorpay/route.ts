import { NextResponse } from "next/server"
import crypto from "crypto"
import { createClient } from "@supabase/supabase-js"

export const runtime = "nodejs"

function verifySignature(
  rawBody: string,
  signature: string,
  secret: string
) {
  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex")

  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected),
      Buffer.from(signature)
    )
  } catch {
    return false
  }
}

export async function POST(request: Request) {
  try {
    const webhookSecret =
      process.env.RAZORPAY_WEBHOOK_SECRET

    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL

    const supabaseKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        {
          error:
            "Supabase environment variables are missing.",
        },
        { status: 500 }
      )
    }

    const rawBody = await request.text()

    const signature =
      request.headers.get(
        "x-razorpay-signature"
      )

    // Signature validation is required when a
    // webhook secret is configured.
    if (webhookSecret) {
      if (!signature) {
        return NextResponse.json(
          {
            error:
              "Missing Razorpay webhook signature.",
          },
          { status: 401 }
        )
      }

      const valid = verifySignature(
        rawBody,
        signature,
        webhookSecret
      )

      if (!valid) {
        return NextResponse.json(
          {
            error:
              "Invalid Razorpay webhook signature.",
          },
          { status: 401 }
        )
      }
    }

    const payload = JSON.parse(rawBody)

    const event = payload?.event

    const disputeEntity =
      payload?.payload?.dispute?.entity

    const paymentEntity =
      payload?.payload?.payment?.entity

    const razorpayDisputeId =
      disputeEntity?.id || null

    const razorpayPaymentId =
      paymentEntity?.id || null

    const supabase = createClient(
      supabaseUrl,
      supabaseKey
    )

    // Store the webhook in the audit trail.
    const { error: auditError } =
      await supabase
        .from("audit_logs")
        .insert({
          action: `Razorpay Webhook: ${event || "unknown"}`,
          entity_type: "razorpay_webhook",
          entity_id:
            razorpayDisputeId ||
            razorpayPaymentId ||
            "unknown",
          actor: "Razorpay",
          details: payload,
        })

    if (auditError) {
      console.error(
        "WEBHOOK AUDIT ERROR:",
        auditError
      )
    }

    // If the webhook corresponds to a dispute
    // already mapped to our local database,
    // update its Razorpay status.
    if (razorpayDisputeId) {
      const updateData: Record<string, any> = {
        razorpay_dispute_id:
          razorpayDisputeId,
      }

      if (razorpayPaymentId) {
        updateData.razorpay_payment_id =
          razorpayPaymentId
      }

      if (
        event ===
        "payment.dispute.under_review"
      ) {
        updateData.status = "Under Review"
      }

      if (
        event ===
        "payment.dispute.won"
      ) {
        updateData.status = "Won"
      }

      if (
        event ===
        "payment.dispute.lost"
      ) {
        updateData.status = "Lost"
      }

      if (
        event ===
        "payment.dispute.action_required"
      ) {
        updateData.status = "Action Required"
      }

      if (
        event ===
        "payment.dispute.created"
      ) {
        updateData.status = "Evidence due"
      }

      const { error: updateError } =
        await supabase
          .from("disputes")
          .update(updateData)
          .eq(
            "razorpay_dispute_id",
            razorpayDisputeId
          )

      if (updateError) {
        console.error(
          "DISPUTE WEBHOOK UPDATE ERROR:",
          updateError
        )
      }
    }

    return NextResponse.json({
      success: true,
      received: true,
      event,
    })
  } catch (error: any) {
    console.error(
      "RAZORPAY WEBHOOK ERROR:",
      error
    )

    return NextResponse.json(
      {
        error:
          error?.message ||
          "Invalid webhook payload.",
      },
      { status: 400 }
    )
  }
}