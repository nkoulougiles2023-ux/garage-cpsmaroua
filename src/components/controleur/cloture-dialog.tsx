"use client";

import { useState } from "react";
import { createFicheCloture } from "@/lib/actions/cloture";
import { createFacture } from "@/lib/actions/factures";
import { SignaturePad } from "@/components/ordres/signature-pad";
import { useRouter } from "next/navigation";

interface ClotureDialogProps {
  ordreReparationId: string;
}

export function ClotureDialog({ ordreReparationId }: ClotureDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSign(signature: string) {
    setLoading(true);
    try {
      await createFicheCloture(ordreReparationId, signature);
      await createFacture(ordreReparationId);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={loading ? "pointer-events-none opacity-50" : ""}>
      <SignaturePad label="Cloturer l'OR" onSign={handleSign} />
    </div>
  );
}
