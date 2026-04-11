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
import { TaskPicker } from "./task-picker";
import type { TacheOption } from "@/lib/actions/taches";

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
  tache: TacheOption | null;
  heuresMainOeuvre: number;
}

const DEFAULT_TAUX_HORAIRE = 10000;

export function PicklistForm({ ordres }: { ordres: OrdreOption[] }) {
  const router = useRouter();
  const [ordreId, setOrdreId] = React.useState("");
  const [mecanicien, setMecanicien] = React.useState("");
  const [tauxHoraire, setTauxHoraire] = React.useState(DEFAULT_TAUX_HORAIRE);
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
          tache: null,
          heuresMainOeuvre: 0,
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

  function updateItem(pieceId: string, patch: Partial<PieceItem>) {
    setItems((prev) =>
      prev.map((i) => (i.pieceId === pieceId ? { ...i, ...patch } : i))
    );
  }

  function removeItem(pieceId: string) {
    setItems(items.filter((i) => i.pieceId !== pieceId));
  }

  function handleTacheSelect(pieceId: string, tache: TacheOption | null) {
    if (!tache) {
      updateItem(pieceId, { tache: null, heuresMainOeuvre: 0 });
      return;
    }
    updateItem(pieceId, {
      tache,
      heuresMainOeuvre: tache.heuresStd ?? 0,
    });
  }

  const montantPieces = items.reduce(
    (sum, i) => sum + i.prixUnitaire * i.quantite,
    0
  );
  const totalHeures = items.reduce((sum, i) => sum + i.heuresMainOeuvre, 0);
  const montantMainOeuvre = Math.round(totalHeures * tauxHoraire);
  const montantTotal = montantPieces + montantMainOeuvre;

  const missingTache = items.some((i) => !i.tache);
  const missingHours = items.some(
    (i) => i.tache && i.heuresMainOeuvre <= 0
  );

  async function handleSubmit() {
    if (!ordreId || !mecanicien.trim() || items.length === 0) return;
    if (missingTache) {
      setError("Chaque pièce doit être associée à une tâche du catalogue.");
      return;
    }
    if (missingHours) {
      setError("Renseigner le nombre d'heures pour chaque tâche 'à devis'.");
      return;
    }
    if (tauxHoraire <= 0) {
      setError("Taux horaire invalide.");
      return;
    }
    setSubmitting(true);
    setError("");

    try {
      const result = await createPicklist({
        ordreReparationId: ordreId,
        mecanicienNom: mecanicien.trim(),
        tauxHoraire,
        items: items.map((i) => ({
          pieceId: i.pieceId,
          quantite: i.quantite,
          prixUnitaire: i.prixUnitaire,
          tacheId: i.tache?.id ?? null,
          heuresMainOeuvre: i.heuresMainOeuvre,
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
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="taux">Taux horaire main d&apos;œuvre (FCFA)</Label>
            <Input
              id="taux"
              type="number"
              min={0}
              value={tauxHoraire}
              onChange={(e) => setTauxHoraire(Number(e.target.value) || 0)}
            />
            <p className="text-xs text-muted-foreground">
              Utilisé pour calculer la main d&apos;œuvre de chaque tâche (heures × taux).
            </p>
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
            {items.map((item) => {
              const ligneHeures = item.heuresMainOeuvre;
              const ligneMontantMO = Math.round(ligneHeures * tauxHoraire);
              const ligneTotal =
                item.prixUnitaire * item.quantite + ligneMontantMO;
              const isADevis = item.tache?.heuresStd === null;
              return (
                <div
                  key={item.pieceId}
                  className="rounded-lg border p-3 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="font-medium">{item.designation}</p>
                      <p className="text-xs text-muted-foreground">
                        Code: {item.codeBarre} —{" "}
                        {item.prixUnitaire.toLocaleString("fr-FR")} FCFA/unité
                        · Stock: {item.stockDisponible}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(item.pieceId)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                  <div className="grid gap-2 md:grid-cols-[120px_1fr_120px]">
                    <div className="flex flex-col gap-1">
                      <Label className="text-xs">Quantité</Label>
                      <Input
                        type="number"
                        min={1}
                        max={item.stockDisponible}
                        value={item.quantite}
                        onChange={(e) =>
                          updateItem(item.pieceId, {
                            quantite: Math.max(1, Number(e.target.value) || 1),
                          })
                        }
                        className="h-8"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label className="text-xs">Tâche associée</Label>
                      <TaskPicker
                        selected={item.tache}
                        onSelect={(t) => handleTacheSelect(item.pieceId, t)}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label className="text-xs">Heures</Label>
                      <Input
                        type="number"
                        min={0}
                        step={0.5}
                        value={item.heuresMainOeuvre}
                        disabled={!item.tache || (!isADevis && item.tache.heuresStd !== null)}
                        onChange={(e) =>
                          updateItem(item.pieceId, {
                            heuresMainOeuvre: Number(e.target.value) || 0,
                          })
                        }
                        className="h-8"
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-2 text-xs">
                    <Badge variant="outline">
                      Pièces: {(item.prixUnitaire * item.quantite).toLocaleString("fr-FR")} FCFA
                    </Badge>
                    <Badge variant="outline">
                      Main d&apos;œuvre: {ligneMontantMO.toLocaleString("fr-FR")} FCFA
                    </Badge>
                    <Badge>
                      Ligne: {ligneTotal.toLocaleString("fr-FR")} FCFA
                    </Badge>
                  </div>
                </div>
              );
            })}
            <div className="border-t pt-3 space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Total pièces</span>
                <span className="font-medium">
                  {montantPieces.toLocaleString("fr-FR")} FCFA
                </span>
              </div>
              <div className="flex justify-between">
                <span>
                  Main d&apos;œuvre ({totalHeures}h ×{" "}
                  {tauxHoraire.toLocaleString("fr-FR")} FCFA)
                </span>
                <span className="font-medium">
                  {montantMainOeuvre.toLocaleString("fr-FR")} FCFA
                </span>
              </div>
              <div className="flex justify-between border-t pt-2 text-base">
                <span className="font-bold">Total picklist</span>
                <span className="font-bold">
                  {montantTotal.toLocaleString("fr-FR")} FCFA
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Submit */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => router.back()}>Annuler</Button>
        <Button
          onClick={handleSubmit}
          disabled={
            !ordreId ||
            !mecanicien.trim() ||
            items.length === 0 ||
            tauxHoraire <= 0 ||
            submitting
          }
        >
          <Plus className="mr-2 h-4 w-4" />
          {submitting ? "Creation..." : "Creer le picklist"}
        </Button>
      </div>
    </div>
  );
}
