"use client";

import { useState } from "react";
import { signPicklist } from "@/lib/actions/picklists";
import { SignaturePad } from "@/components/ordres/signature-pad";
import { useRouter } from "next/navigation";

interface SignPicklistButtonProps {
  picklistId: string;
}

export function SignPicklistButton({ picklistId }: SignPicklistButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSign(signature: string) {
    setLoading(true);
    try {
      await signPicklist(picklistId, signature);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={loading ? "pointer-events-none opacity-50" : ""}>
      <SignaturePad label="Signer la picklist" onSign={handleSign} />
    </div>
  );
}
