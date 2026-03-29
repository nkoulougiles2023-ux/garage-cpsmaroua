import { requireRole } from "@/lib/auth-utils";
import { getPiecesLowStock } from "@/lib/actions/pieces";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";

export default async function AlertesStockPage() {
  await requireRole(["ADMIN", "MAGASINIER"]);
  const pieces = await getPiecesLowStock();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <AlertTriangle className="h-6 w-6 text-destructive" />
        <h1 className="text-2xl font-bold">Alertes stock bas</h1>
        <Badge variant="destructive">{pieces.length}</Badge>
      </div>

      {pieces.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Aucune alerte. Tous les stocks sont au-dessus du seuil.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {pieces.map((p) => (
            <Card key={p.id} className="border-destructive/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{p.designation}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground">Code: {p.codeBarre}</p>
                {p.categorie && <p className="text-sm text-muted-foreground">Categorie: {p.categorie}</p>}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm">
                      Stock: <span className="font-bold text-destructive">{p.quantiteEnStock}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">Seuil: {p.seuilAlerte}</p>
                  </div>
                  <Badge variant="destructive">
                    {p.quantiteEnStock === 0 ? "Rupture" : "Stock bas"}
                  </Badge>
                </div>
                <p className="text-sm font-medium">{p.prixUnitaire.toLocaleString("fr-FR")} FCFA</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
