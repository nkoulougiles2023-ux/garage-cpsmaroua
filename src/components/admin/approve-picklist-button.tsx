"use client";

import { useState } from "react";
import { approvePicklist } from "@/lib/actions/picklists";
import { SignaturePad } from "@/components/ordres/signature-pad";
import { useRouter } from "next/navigation";

export function ApprovePicklistButton({ picklistId }: { picklistId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleApprove(signature: string) {
    setLoading(true);
    try {
      await approvePicklist(picklistId, signature);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={loading ? "pointer-events-none opacity-50" : ""}>
      <SignaturePad label="Approuver (Admin)" onSign={handleApprove} />
    </div>
  );
}
