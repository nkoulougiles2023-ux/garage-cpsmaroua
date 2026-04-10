"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createPiece } from "@/lib/actions/pieces";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type FieldErrors = Record<string, string[] | undefined>;

export default function NouvellePiecePage() {
  const router = useRouter();
  const [errors, setErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      codeBarre: formData.get("codeBarre") as string,
      designation: formData.get("designation") as string,
      categorie: formData.get("categorie") as string || undefined,
      prixUnitaire: formData.get("prixUnitaire"),
      quantiteEnStock: formData.get("quantiteEnStock"),
      seuilAlerte: formData.get("seuilAlerte"),
      emplacement: formData.get("emplacement") as string || undefined,
    };

    const result = await createPiece(data);
    setLoading(false);

    if (result.error) {
      setErrors(result.error as FieldErrors);
      return;
    }

    router.push("/magasin");
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Nouvelle pièce</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informations de la pièce</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Code-barre */}
              <div className="space-y-1.5">
                <Label htmlFor="codeBarre">Code-barre *</Label>
                <Input
                  id="codeBarre"
                  name="codeBarre"
                  placeholder="Ex: 1234567890"
                  aria-invalid={!!errors.codeBarre}
                />
                {errors.codeBarre && (
                  <p className="text-xs text-destructive">{errors.codeBarre[0]}</p>
                )}
              </div>

              {/* Désignation */}
              <div className="space-y-1.5">
                <Label htmlFor="designation">Désignation *</Label>
                <Input
                  id="designation"
                  name="designation"
                  placeholder="Ex: Filtre à huile"
                  aria-invalid={!!errors.designation}
                />
                {errors.designation && (
                  <p className="text-xs text-destructive">{errors.designation[0]}</p>
                )}
              </div>

              {/* Catégorie */}
              <div className="space-y-1.5">
                <Label htmlFor="categorie">Catégorie</Label>
                <Input
                  id="categorie"
                  name="categorie"
                  placeholder="Ex: Filtration, Freinage…"
                  aria-invalid={!!errors.categorie}
                />
                {errors.categorie && (
                  <p className="text-xs text-destructive">{errors.categorie[0]}</p>
                )}
              </div>

              {/* Prix unitaire */}
              <div className="space-y-1.5">
                <Label htmlFor="prixUnitaire">Prix unitaire (FCFA) *</Label>
                <Input
                  id="prixUnitaire"
                  name="prixUnitaire"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="0"
                  aria-invalid={!!errors.prixUnitaire}
                />
                {errors.prixUnitaire && (
                  <p className="text-xs text-destructive">{errors.prixUnitaire[0]}</p>
                )}
              </div>

              {/* Quantité en stock */}
              <div className="space-y-1.5">
                <Label htmlFor="quantiteEnStock">Quantité en stock *</Label>
                <Input
                  id="quantiteEnStock"
                  name="quantiteEnStock"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="0"
                  aria-invalid={!!errors.quantiteEnStock}
                />
                {errors.quantiteEnStock && (
                  <p className="text-xs text-destructive">{errors.quantiteEnStock[0]}</p>
                )}
              </div>

              {/* Seuil d'alerte */}
              <div className="space-y-1.5">
                <Label htmlFor="seuilAlerte">Seuil d&apos;alerte</Label>
                <Input
                  id="seuilAlerte"
                  name="seuilAlerte"
                  type="number"
                  min="0"
                  step="1"
                  defaultValue="5"
                  aria-invalid={!!errors.seuilAlerte}
                />
                {errors.seuilAlerte && (
                  <p className="text-xs text-destructive">{errors.seuilAlerte[0]}</p>
                )}
              </div>

              {/* Emplacement */}
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="emplacement">Emplacement</Label>
                <Input
                  id="emplacement"
                  name="emplacement"
                  placeholder="Ex: Étagère A - Rangée 3"
                  aria-invalid={!!errors.emplacement}
                />
                {errors.emplacement && (
                  <p className="text-xs text-destructive">{errors.emplacement[0]}</p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button nativeButton={false} variant="outline" render={<Link href="/magasin" />}>
                Annuler
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Enregistrement…" : "Enregistrer"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
