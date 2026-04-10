import Link from "next/link";
import { requireRole } from "@/lib/auth-utils";
import { getPieces } from "@/lib/actions/pieces";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BarcodeDisplay } from "@/components/magasin/barcode-display";
import { StockSearch } from "@/components/magasin/stock-search";
import { PieceEditDialog } from "@/components/magasin/piece-edit-dialog";
import { PlusCircle, Package } from "lucide-react";
import { cn } from "@/lib/utils";

export default async function MagasinPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireRole(["ADMIN", "MAGASINIER"]);
  const { q } = await searchParams;
  const pieces = await getPieces(q);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Magasin — Pièces détachées</h1>
        <Button nativeButton={false} render={<Link href="/magasin/nouveau" />}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Nouvelle pièce
        </Button>
      </div>

      <StockSearch />

      {pieces.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
          <Package className="mb-4 h-10 w-10 text-muted-foreground" />
          <p className="text-muted-foreground">
            {q ? "Aucune pièce trouvée" : "Aucune pièce en stock"}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {pieces.map((piece) => {
            const isLowStock = piece.quantiteEnStock <= piece.seuilAlerte;
            return (
              <Card
                key={piece.id}
                className={cn(isLowStock && "border-red-400 border-2")}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base leading-tight">
                      {piece.designation}
                    </CardTitle>
                    <div className="flex items-center gap-1">
                      {piece.categorie && (
                        <Badge variant="outline" className="shrink-0 text-xs">
                          {piece.categorie}
                        </Badge>
                      )}
                      <PieceEditDialog piece={piece} />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <BarcodeDisplay value={piece.codeBarre} />

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Prix unitaire</span>
                      <p className="font-semibold">
                        {piece.prixUnitaire.toLocaleString("fr-FR")} FCFA
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">En stock</span>
                      <p
                        className={cn(
                          "font-semibold",
                          isLowStock ? "text-red-600" : "text-green-600"
                        )}
                      >
                        {piece.quantiteEnStock} unité(s)
                      </p>
                    </div>
                  </div>

                  {isLowStock && (
                    <p className="text-xs text-red-600 font-medium">
                      Stock faible — seuil d&apos;alerte : {piece.seuilAlerte}
                    </p>
                  )}

                  {piece.emplacement && (
                    <p className="text-xs text-muted-foreground">
                      Emplacement : {piece.emplacement}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
