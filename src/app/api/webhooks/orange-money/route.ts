import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * POST /api/webhooks/orange-money — Orange Money notification callback
 * Orange sends a notification when the payment is completed or fails
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pay_token, status, order_id } = body;

    if (!order_id && !pay_token) {
      return NextResponse.json({ error: "Missing identifiers" }, { status: 400 });
    }

    const ref = order_id || pay_token;

    if (status === "SUCCESS") {
      const paiement = await db.paiement.findFirst({
        where: { referencePaiement: ref },
      });

      if (paiement) {
        await db.paiement.update({
          where: { id: paiement.id },
          data: {
            referencePaiement: `OM:${pay_token || order_id}`,
          },
        });
      }
    }

    console.log(`Orange Money webhook: ${ref} → ${status}`);
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Orange Money webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
