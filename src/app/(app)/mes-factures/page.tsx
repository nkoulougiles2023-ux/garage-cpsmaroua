import Link from "next/link";
import { requireRole } from "@/lib/auth-utils";
import { getMyFactures } from "@/lib/actions/client-portal";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Receipt } from "lucide-react";
import { StatutFacture } from "@prisma/client";

function formatFCFA(amount: number) {
  return new Intl.NumberFormat("fr-FR").format(amount) + " FCFA";
}

export default async function MesFacturesPage() {
  await requireRole(["CLIENT"]);
  const factures = await getMyFactures();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Mes factures</h1>

      {factures.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
          <Receipt className="mb-4 h-10 w-10 text-muted-foreground" />
          <p className="text-muted-foreground">Aucune facture.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {factures.map((f) => (
            <Card key={f.id} className="transition-colors hover:bg-muted/50">
              <CardContent className="flex items-center justify-between py-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold">{f.numeroFacture}</span>
                    {f.statut === StatutFacture.PAYEE ? (
                      <Badge className="bg-green-100 text-green-800 border-green-200">
                        Payée
                      </Badge>
                    ) : (
                      <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                        En attente — Reste {formatFCFA(f.montantRestant)}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    OR : {f.ordreReparation.numeroOR} —{" "}
                    {f.ordreReparation.vehicle.marque}{" "}
                    {f.ordreReparation.vehicle.modele} (
                    {f.ordreReparation.vehicle.matricule})
                  </p>
                  <p className="text-sm font-medium">
                    Total : {formatFCFA(f.montantTotal)}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="text-sm text-muted-foreground">
                    {new Date(f.dateEmission).toLocaleDateString("fr-FR")}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    render={
                      <Link
                        href={"/api/pdf/facture/" + f.id}
                        target="_blank"
                      />
                    }
                  >
                    <FileText className="mr-1 h-3 w-3" />
                    PDF
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
