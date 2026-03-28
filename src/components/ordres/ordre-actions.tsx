"use client";

import { useRouter } from "next/navigation";
import { SignaturePad } from "@/components/ordres/signature-pad";
import { signORChauffeur } from "@/lib/actions/ordres";

interface OrdreActionsProps {
  ordre: {
    id: string;
    signatureChauffeur: string | null;
  };
}

export function OrdreActions({ ordre }: OrdreActionsProps) {
  const router = useRouter();

  async function handleSign(signature: string) {
    await signORChauffeur(ordre.id, signature);
    router.refresh();
  }

  if (ordre.signatureChauffeur) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <SignaturePad
        label="Signature du chauffeur"
        onSign={handleSign}
      />
    </div>
  );
}
