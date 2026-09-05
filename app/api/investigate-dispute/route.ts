import { NextResponse } from "next/server"
import { GoogleGenAI } from "@google/genai"
import { createClient } from "@supabase/supabase-js"

export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    // --------------------------------------------------
    // 1. Check environment variables
    // --------------------------------------------------

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    const geminiKey = process.env.GEMINI_API_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        {
          error: "Supabase environment variables are missing.",
        },
        { status: 500 }
      )
    }

    if (!geminiKey) {
      return NextResponse.json(
        {
          error: "GEMINI_API_KEY is missing from .env.local",
        },
        { status: 500 }
      )
    }

    // --------------------------------------------------
    // 2. Read request
    // --------------------------------------------------

    const body = await request.json()
    const disputeId = body?.disputeId

    if (!disputeId) {
      return NextResponse.json(
        {
          error: "disputeId is required.",
        },
        { status: 400 }
      )
    }

    // --------------------------------------------------
    // 3. Create clients
    // --------------------------------------------------

    const supabase = createClient(
      supabaseUrl,
      supabaseKey
    )

    const ai = new GoogleGenAI({
      apiKey: geminiKey,
    })

    // --------------------------------------------------
    // 4. Fetch dispute
    // --------------------------------------------------

    const { data: dispute, error: disputeError } =
      await supabase
        .from("disputes")
        .select("*")
        .eq("id", disputeId)
        .single()

    if (disputeError) {
      console.error("DISPUTE QUERY ERROR:", disputeError)

      return NextResponse.json(
        {
          error: `Failed to fetch dispute: ${disputeError.message}`,
        },
        { status: 500 }
      )
    }

    // --------------------------------------------------
    // 5. Fetch related transaction
    // --------------------------------------------------

    let transaction = null

    if (dispute.transaction_id) {
      const { data: transactionData, error: transactionError } =
        await supabase
          .from("transactions")
          .select("*")
          .eq("transaction_id", dispute.transaction_id)
          .maybeSingle()

      if (transactionError) {
        console.error(
          "TRANSACTION QUERY ERROR:",
          transactionError
        )
      }

      transaction = transactionData
    }

    // --------------------------------------------------
    // 6. Fetch evidence
    // --------------------------------------------------

    const { data: evidence, error: evidenceError } =
      await supabase
        .from("evidence")
        .select("*")
        .eq("dispute_id", disputeId)

    if (evidenceError) {
      console.error(
        "EVIDENCE QUERY ERROR:",
        evidenceError
      )
    }

    // --------------------------------------------------
    // 7. Prepare data for Gemini
    // --------------------------------------------------

    const disputeData = JSON.stringify(
      dispute,
      null,
      2
    )

    const transactionData = JSON.stringify(
      transaction ?? {},
      null,
      2
    )

    const evidenceData = JSON.stringify(
      evidence ?? [],
      null,
      2
    )

    // --------------------------------------------------
    // 8. AI investigation prompt
    // --------------------------------------------------

    const prompt = `
You are an AI dispute investigation assistant for a merchant payment-risk platform called DisputeShield.

Your job is to analyze a payment dispute using ONLY the supplied dispute, transaction, and evidence data.

IMPORTANT RULES:
- Do not invent evidence.
- Do not claim something is proven when the supplied data does not prove it.
- Clearly distinguish facts from recommendations.
- This is a defense and investigation system.
- Do not automatically submit or contest anything.
- A human merchant must approve any consequential action.

Analyze the case and produce a concise but useful investigation.

DISPUTE:
${disputeData}

TRANSACTION:
${transactionData}

EVIDENCE:
${evidenceData}

Return your investigation using exactly these sections:

CASE SUMMARY
Give a short summary of what happened.

RISK ASSESSMENT
State whether the case appears Low, Medium, or High strength from the merchant's perspective and explain why.

KEY FACTS
Give 3 to 5 important facts from the supplied data.

EVIDENCE ASSESSMENT
Explain what evidence is available and whether it supports the merchant's position.

MISSING EVIDENCE
List important evidence that would strengthen the case, if any.

RECOMMENDED ACTION
Recommend the most appropriate next step for the merchant.

DRAFT RESPONSE
Write a professional short response that the merchant could review before submitting.

HUMAN APPROVAL
End with:
"Human approval required before any dispute action."
`

    // --------------------------------------------------
    // 9. Call Gemini
    // --------------------------------------------------

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
    })

    const investigation = response.text

    if (!investigation) {
      return NextResponse.json(
        {
          error: "Gemini returned an empty investigation.",
        },
        { status: 500 }
      )
    }

    // --------------------------------------------------
    // 10. Return everything to frontend
    // --------------------------------------------------

    return NextResponse.json({
      success: true,
      dispute,
      transaction,
      evidence: evidence ?? [],
      investigation,
    })
  } catch (error: any) {
    console.error(
      "AI INVESTIGATION ERROR:",
      error
    )

    return NextResponse.json(
      {
        error:
          error?.message ||
          "Failed to investigate dispute.",
      },
      { status: 500 }
    )
  }
}