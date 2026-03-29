import { requireRole } from "@/lib/auth-utils";
import { getMouvementsStock } from "@/lib/actions/stock";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MouvementFilters } from "@/components/magasin/mouvement-filters";
import { ArrowDownCircle, ArrowUpCircle, History } from "lucide-react";

export default async function MouvementsStockPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  await requireRole(["ADMIN", "MAGASINIER"]);
  const { type } = await searchParams;
  const typeFilter = type === "ENTREE" || type === "SORTIE" ? type : undefined;
  const mouvements = await getMouvementsStock(typeFilter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <History className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Mouvements de stock</h1>
        </div>
        <MouvementFilters />
      </div>

      {mouvements.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Aucun mouvement de stock{typeFilter ? ` de type ${typeFilter.toLowerCase()}` : ""}.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {mouvements.map((m) => (
            <Card key={m.id}>
              <CardContent className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  {m.type === "ENTREE" ? (
                    <ArrowDownCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <ArrowUpCircle className="h-5 w-5 text-red-600" />
                  )}
                  <div>
                    <p className="font-medium">{m.piece.designation}</p>
                    <p className="text-xs text-muted-foreground">
                      {m.piece.codeBarre} — {m.motif || "—"}
                    </p>
                    {m.picklist && (
                      <p className="text-xs text-muted-foreground">
                        Picklist: {m.picklist.numeroPicklist}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 text-right">
                  <div>
                    <Badge
                      variant={m.type === "ENTREE" ? "default" : "destructive"}
                    >
                      {m.type === "ENTREE" ? `+${m.quantite}` : `-${m.quantite}`}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <p>
                      {m.effectuePar.prenom} {m.effectuePar.nom}
                    </p>
                    <p>
                      {new Date(m.date).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
