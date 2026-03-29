"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { createPaiement } from "@/lib/actions/paiements";
import type { MethodePaiement } from "@prisma/client";

interface AcompteDialogProps {
  ordreReparationId: string;
}

const METHODES: { label: string; value: MethodePaiement }[] = [
  { label: "Especes", value: "ESPECES" },
  { label: "Mobile Money", value: "MOBILE_MONEY" },
  { label: "Virement", value: "VIREMENT" },
];

export function AcompteDialog({ ordreReparationId }: AcompteDialogProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [montant, setMontant] = React.useState("");
  const [methode, setMethode] = React.useState<MethodePaiement | "">("");
  const [reference, setReference] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  async function handleSubmit() {
    if (!montant || !methode) return;
    setLoading(true);
    try {
      await createPaiement({
        montant: Number(montant),
        type: "ACOMPTE",
        methode: methode as MethodePaiement,
        ordreReparationId,
        referencePaiement: reference || undefined,
      });
      setOpen(false);
      setMontant("");
      setMethode("");
      setReference("");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <Plus className="mr-1 h-4 w-4" /> Acompte
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enregistrer un acompte</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Montant (FCFA)</Label>
            <Input
              type="number"
              placeholder="50000"
              value={montant}
              onChange={(e) => setMontant(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Methode</Label>
            <Select value={methode} onValueChange={(v) => setMethode(v as MethodePaiement)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choisir" />
              </SelectTrigger>
              <SelectContent>
                {METHODES.map((m) => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Reference (optionnel)</Label>
            <Input
              placeholder="N° transaction"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
            />
          </div>
        </div>
        <div className="-mx-4 -mb-4 flex justify-end gap-2 rounded-b-xl border-t bg-muted/50 p-4">
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={loading}>Annuler</Button>
          <Button onClick={handleSubmit} disabled={!montant || !methode || loading}>
            {loading ? "En cours..." : "Enregistrer"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
