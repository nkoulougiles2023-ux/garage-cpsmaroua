"use client";

import { MobileMoneyDialog } from "./mobile-money-dialog";
import { useRouter } from "next/navigation";

interface FacturePaymentButtonProps {
  factureId: string;
  ordreReparationId: string;
  montantRestant: number;
}

export function FacturePaymentButton({
  factureId,
  ordreReparationId,
  montantRestant,
}: FacturePaymentButtonProps) {
  const router = useRouter();

  return (
    <MobileMoneyDialog
      montant={montantRestant}
      ordreReparationId={ordreReparationId}
      factureId={factureId}
      typePaiement="SOLDE_FINAL"
      onSuccess={() => router.refresh()}
    />
  );
}
