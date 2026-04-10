"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createStockEntry } from "@/lib/actions/stock";
import { Package } from "lucide-react";

interface PieceOption {
  id: string;
  codeBarre: string;
  designation: string;
  stockActuel: number;
}

export function StockEntryForm({ pieces }: { pieces: PieceOption[] }) {
  const router = useRouter();
  const [pieceId, setPieceId] = React.useState("");
  const [quantite, setQuantite] = React.useState("");
  const [motif, setMotif] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState(false);

  const selectedPiece = pieces.find((p) => p.id === pieceId);

  async function handleSubmit() {
    if (!pieceId || !quantite || Number(quantite) <= 0) return;
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const result = await createStockEntry({
        pieceId,
        quantite: Number(quantite),
        motif: motif || undefined,
      });
      if ("error" in result && result.error) {
        setError(typeof result.error === "string" ? result.error : "Erreur");
        return;
      }
      setSuccess(true);
      setPieceId("");
      setQuantite("");
      setMotif("");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Enregistrer une entree
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
        )}
        {success && (
          <div className="rounded-lg border border-green-300 bg-green-50 p-3 text-sm text-green-800">
            Entrée enregistrée. En attente de validation par le contrôleur.
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <Label>Piece</Label>
          <Select value={pieceId} onValueChange={(v) => setPieceId(v ?? "")}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choisir une piece">
                {pieceId ? `${selectedPiece?.codeBarre} — ${selectedPiece?.designation}` : "Choisir une piece"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {pieces.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.codeBarre} — {p.designation}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedPiece && (
            <p className="text-xs text-muted-foreground">Stock actuel: {selectedPiece.stockActuel}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Quantite</Label>
          <Input
            type="number"
            min={1}
            placeholder="10"
            value={quantite}
            onChange={(e) => setQuantite(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Motif (optionnel)</Label>
          <Input
            placeholder="Livraison fournisseur, retour, etc."
            value={motif}
            onChange={(e) => setMotif(e.target.value)}
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => router.back()}>Annuler</Button>
          <Button onClick={handleSubmit} disabled={!pieceId || !quantite || Number(quantite) <= 0 || loading}>
            {loading ? "En cours..." : "Enregistrer l'entree"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
