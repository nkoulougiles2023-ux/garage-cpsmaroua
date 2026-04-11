import { requireRole } from "@/lib/auth-utils";
import { getPaiements } from "@/lib/actions/paiements";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Banknote } from "lucide-react";

const typeLabels: Record<string, string> = {
  ACOMPTE: "Acompte",
  PICKLIST: "Picklist",
  SOLDE_FINAL: "Solde final",
};

const methodeLabels: Record<string, string> = {
  ESPECES: "Especes",
  MOBILE_MONEY: "Mobile Money",
  VIREMENT: "Virement",
};

const typeBadgeColors: Record<string, string> = {
  ACOMPTE: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  PICKLIST: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  SOLDE_FINAL: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
};

export default async function PaiementsPage() {
  await requireRole(["ADMIN", "CONTROLEUR"]);
  const paiements = await getPaiements();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Banknote className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Paiements</h1>
      </div>

      {paiements.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Aucun paiement enregistre.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {paiements.map((p) => (
            <Card key={p.id}>
              <CardContent className="flex items-center justify-between py-4">
                <div className="space-y-1">
                  <p className="font-bold text-lg">
                    {p.montant.toLocaleString("fr-FR")} FCFA
                  </p>
                  <p className="text-sm text-muted-foreground">
                    OR: {p.ordreReparation.numeroOR}
                    {p.picklist && ` — Picklist: ${p.picklist.numeroPicklist}`}
                  </p>
                  {p.referencePaiement && (
                    <p className="text-xs text-muted-foreground">
                      Ref: {p.referencePaiement}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {new Date(p.date).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge className={typeBadgeColors[p.type]}>
                    {typeLabels[p.type]}
                  </Badge>
                  <Badge variant="outline">
                    {methodeLabels[p.methode]}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
