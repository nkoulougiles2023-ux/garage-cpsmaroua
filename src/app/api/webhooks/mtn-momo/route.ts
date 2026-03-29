import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * POST /api/webhooks/mtn-momo — MTN MoMo callback for payment status updates
 * MTN sends a callback when the customer approves or rejects the payment
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { externalId, status, financialTransactionId } = body;

    if (!externalId) {
      return NextResponse.json({ error: "Missing externalId" }, { status: 400 });
    }

    if (status === "SUCCESSFUL") {
      // Find pending payment by reference and update
      const paiement = await db.paiement.findFirst({
        where: { referencePaiement: externalId },
      });

      if (paiement) {
        await db.paiement.update({
          where: { id: paiement.id },
          data: {
            referencePaiement: `MTN:${financialTransactionId || externalId}`,
          },
        });
      }
    }

    console.log(`MTN MoMo webhook: ${externalId} → ${status}`);
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("MTN MoMo webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
