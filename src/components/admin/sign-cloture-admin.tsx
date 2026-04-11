"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signFicheClotureAdmin } from "@/lib/actions/cloture";
import { SignaturePad } from "@/components/ordres/signature-pad";

interface SignClotureAdminProps {
  ficheId: string;
}

export function SignClotureAdmin({ ficheId }: SignClotureAdminProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSign(signature: string) {
    setLoading(true);
    try {
      await signFicheClotureAdmin(ficheId, signature);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={loading ? "pointer-events-none opacity-50" : ""}>
      <SignaturePad label="Signer (Admin)" onSign={handleSign} />
    </div>
  );
}
