"use client";

import { MobileMoneyDialog } from "./mobile-money-dialog";
import { useRouter } from "next/navigation";

interface PicklistPaymentButtonProps {
  picklistId: string;
  ordreReparationId: string;
  montant: number;
}

export function PicklistPaymentButton({
  picklistId,
  ordreReparationId,
  montant,
}: PicklistPaymentButtonProps) {
  const router = useRouter();

  return (
    <MobileMoneyDialog
      montant={montant}
      ordreReparationId={ordreReparationId}
      picklistId={picklistId}
      typePaiement="PICKLIST"
      onSuccess={() => router.refresh()}
    />
  );
}
