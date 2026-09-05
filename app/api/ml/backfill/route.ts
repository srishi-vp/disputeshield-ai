import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

const ML_API_URL = "http://127.0.0.1:8001/predict"

export async function GET() {
  try {
    const { data: transactions, error } = await supabase
      .from("transactions")
      .select("*")
      .order("id", { ascending: true })

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 500 }
      )
    }

    if (!transactions || transactions.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No transactions found.",
        updated: 0,
      })
    }

    const results = []

    for (const transaction of transactions) {
      try {
        const response = await fetch(ML_API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          cache: "no-store",
          body: JSON.stringify({
            customer_id: String(transaction.customer_id ?? "0"),
            merchant_id: String(transaction.merchant_id ?? "0"),
            account_age_days: Number(transaction.account_age_days ?? 0),
            credit_score_band: Number(transaction.credit_score_band ?? 0),
            kyc_level: Number(transaction.kyc_level ?? 0),
            avg_monthly_spend: Number(
              transaction.avg_monthly_spend ?? 0
            ),
            merchant_risk_score: Number(
              transaction.merchant_risk_score ?? 0
            ),
            transaction_amount: Number(
              transaction.transaction_amount ?? 0
            ),
            payment_channel:
              transaction.payment_channel ?? "unknown",
            device_type:
              transaction.device_type ?? "unknown",
            is_international:
              Boolean(transaction.is_international),
            ip_risk_score: Number(
              transaction.ip_risk_score ?? 0
            ),
            txn_count_1h: Number(
              transaction.txn_count_1h ?? 0
            ),
            txn_count_24h: Number(
              transaction.txn_count_24h ?? 0
            ),
            failed_txn_count_24h: Number(
              transaction.failed_txn_count_24h ?? 0
            ),
            geo_distance_from_last_txn: Number(
              transaction.geo_distance_from_last_txn ?? 0
            ),
            amount_deviation_from_user_mean: Number(
              transaction.amount_deviation_from_user_mean ?? 0
            ),
          }),
        })

        if (!response.ok) {
          const errorText = await response.text()

          results.push({
            transaction_id: transaction.transaction_id,
            success: false,
            error: errorText,
          })

          continue
        }

        const ml = await response.json()

        const { error: updateError } = await supabase
          .from("transactions")
          .update({
            fraud_probability: ml.fraud_probability,
            risk_score: ml.risk_score,
            risk_level: ml.risk_level,
            risk_reasons: ml.risk_reasons ?? [],
            prevention_actions: ml.prevention_actions ?? [],
          })
          .eq("id", transaction.id)

        if (updateError) {
          results.push({
            transaction_id: transaction.transaction_id,
            success: false,
            error: updateError.message,
          })

          continue
        }

        results.push({
          transaction_id: transaction.transaction_id,
          success: true,
          fraud_probability: ml.fraud_probability,
          risk_score: ml.risk_score,
          risk_level: ml.risk_level,
        })
      } catch (error) {
        results.push({
          transaction_id: transaction.transaction_id,
          success: false,
          error: String(error),
        })
      }
    }

    const successful = results.filter(
      (item) => item.success
    ).length

    return NextResponse.json({
      success: true,
      total: transactions.length,
      updated: successful,
      results,
    })
  } catch (error) {
    console.error("ML BACKFILL ERROR:", error)

    return NextResponse.json(
      {
        success: false,
        error: String(error),
      },
      { status: 500 }
    )
  }
}