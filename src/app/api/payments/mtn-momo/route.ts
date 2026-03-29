import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { requestToPay, checkPaymentStatus } from "@/lib/payments/mtn-momo";

/**
 * POST /api/payments/mtn-momo — Initiate MTN MoMo Request to Pay
 */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { amount, phoneNumber, ordreReparationId, picklistId, factureId, description } = body;

    if (!amount || !phoneNumber || !ordreReparationId) {
      return NextResponse.json(
        { error: "Montant, numéro de téléphone et ID ordre sont requis" },
        { status: 400 }
      );
    }

    const result = await requestToPay({
      amount,
      phoneNumber,
      ordreReparationId,
      picklistId,
      factureId,
      description: description || "Paiement CPS Maroua",
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    console.error("MTN MoMo payment error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * GET /api/payments/mtn-momo?transactionId=xxx — Check payment status
 */
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const transactionId = request.nextUrl.searchParams.get("transactionId");
  if (!transactionId) {
    return NextResponse.json({ error: "transactionId requis" }, { status: 400 });
  }

  try {
    const status = await checkPaymentStatus(transactionId);
    return NextResponse.json(status);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    console.error("MTN MoMo status check error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
