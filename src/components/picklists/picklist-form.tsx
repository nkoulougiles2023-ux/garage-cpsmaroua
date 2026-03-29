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
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Search } from "lucide-react";
import { getPieceByBarcode } from "@/lib/actions/pieces";
import { createPicklist } from "@/lib/actions/picklists";

interface OrdreOption {
  id: string;
  numeroOR: string;
  vehicleInfo: string;
}

interface PieceItem {
  pieceId: string;
  codeBarre: string;
  designation: string;
  prixUnitaire: number;
  quantite: number;
  stockDisponible: number;
}

export function PicklistForm({ ordres }: { ordres: OrdreOption[] }) {
  const router = useRouter();
  const [ordreId, setOrdreId] = React.useState("");
  const [mecanicien, setMecanicien] = React.useState("");
  const [barcode, setBarcode] = React.useState("");
  const [items, setItems] = React.useState<PieceItem[]>([]);
  const [searching, setSearching] = React.useState(false);
  const [error, setError] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const barcodeRef = React.useRef<HTMLInputElement>(null);

  async function handleSearchBarcode() {
    if (!barcode.trim()) return;
    setSearching(true);
    setError("");

    try {
      const piece = await getPieceByBarcode(barcode.trim());
      if (!piece) {
        setError(`Aucune piece trouvee avec le code: ${barcode}`);
        return;
      }

      const existing = items.find((i) => i.pieceId === piece.id);
      if (existing) {
        setItems(items.map((i) =>
          i.pieceId === piece.id ? { ...i, quantite: i.quantite + 1 } : i
        ));
      } else {
        setItems([...items, {
          pieceId: piece.id,
          codeBarre: piece.codeBarre,
          designation: piece.designation,
          prixUnitaire: piece.prixUnitaire,
          quantite: 1,
          stockDisponible: piece.quantiteEnStock,
        }]);
      }
      setBarcode("");
      barcodeRef.current?.focus();
    } finally {
      setSearching(false);
    }
  }

  function handleBarcodeKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearchBarcode();
    }
  }

  function updateQuantite(pieceId: string, qty: number) {
    if (qty < 1) return;
    setItems(items.map((i) => i.pieceId === pieceId ? { ...i, quantite: qty } : i));
  }

  function removeItem(pieceId: string) {
    setItems(items.filter((i) => i.pieceId !== pieceId));
  }

  const total = items.reduce((sum, i) => sum + i.prixUnitaire * i.quantite, 0);

  async function handleSubmit() {
    if (!ordreId || !mecanicien.trim() || items.length === 0) return;
    setSubmitting(true);
    setError("");

    try {
      const result = await createPicklist({
        ordreReparationId: ordreId,
        mecanicienNom: mecanicien.trim(),
        items: items.map((i) => ({
          pieceId: i.pieceId,
          quantite: i.quantite,
          prixUnitaire: i.prixUnitaire,
        })),
      });

      if ("error" in result && result.error) {
        setError(typeof result.error === "string" ? result.error : "Erreur de creation");
        return;
      }

      router.push("/picklists");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* OR + Mechanic selection */}
      <Card>
        <CardHeader>
          <CardTitle>Informations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <Label>Ordre de Reparation</Label>
            <Select value={ordreId} onValueChange={(v) => setOrdreId(v ?? "")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choisir un OR" />
              </SelectTrigger>
              <SelectContent>
                {ordres.map((o) => (
                  <SelectItem key={o.id} value={o.id}>
                    {o.numeroOR} — {o.vehicleInfo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Mecanicien</Label>
            <Input
              placeholder="Nom du mecanicien"
              value={mecanicien}
              onChange={(e) => setMecanicien(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Barcode entry */}
      <Card>
        <CardHeader>
          <CardTitle>Ajouter des pieces</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              ref={barcodeRef}
              placeholder="Scanner ou saisir le code-barre"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              onKeyDown={handleBarcodeKeyDown}
              autoFocus
            />
            <Button onClick={handleSearchBarcode} disabled={searching || !barcode.trim()}>
              <Search className="mr-2 h-4 w-4" />
              {searching ? "..." : "Chercher"}
            </Button>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Scannez le code-barre ou tapez-le et appuyez sur Entree
          </p>
        </CardContent>
      </Card>

      {/* Items list */}
      {items.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pieces selectionnees ({items.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {items.map((item) => (
              <div key={item.pieceId} className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex-1">
                  <p className="font-medium">{item.designation}</p>
                  <p className="text-xs text-muted-foreground">
                    Code: {item.codeBarre} — {item.prixUnitaire.toLocaleString("fr-FR")} FCFA/unite
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Stock: {item.stockDisponible}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={1}
                    max={item.stockDisponible}
                    value={item.quantite}
                    onChange={(e) => updateQuantite(item.pieceId, Number(e.target.value))}
                    className="w-20 text-center"
                  />
                  <Badge variant="outline">
                    {(item.prixUnitaire * item.quantite).toLocaleString("fr-FR")} FCFA
                  </Badge>
                  <Button variant="ghost" size="sm" onClick={() => removeItem(item.pieceId)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
            <div className="flex justify-end border-t pt-3">
              <p className="text-lg font-bold">
                Total: {total.toLocaleString("fr-FR")} FCFA
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Submit */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => router.back()}>Annuler</Button>
        <Button
          onClick={handleSubmit}
          disabled={!ordreId || !mecanicien.trim() || items.length === 0 || submitting}
        >
          <Plus className="mr-2 h-4 w-4" />
          {submitting ? "Creation..." : "Creer le picklist"}
        </Button>
      </div>
    </div>
  );
}
