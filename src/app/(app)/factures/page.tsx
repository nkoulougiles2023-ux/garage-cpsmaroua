import { requireRole } from "@/lib/auth-utils";
import { getFactures } from "@/lib/actions/factures";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { FileText, Receipt } from "lucide-react";
import { FacturePaymentButton } from "@/components/payments/facture-payment-button";

export default async function FacturesPage() {
  await requireRole(["ADMIN", "RECEPTIONNISTE", "CONTROLEUR"]);
  const factures = await getFactures();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Receipt className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Factures</h1>
      </div>

      {factures.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Aucune facture.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {factures.map((f) => (
            <Card key={f.id}>
              <CardContent className="flex items-center justify-between py-4">
                <div className="space-y-1">
                  <p className="font-medium">{f.numeroFacture}</p>
                  <p className="text-sm text-muted-foreground">
                    OR: {f.ordreReparation.numeroOR} — {f.client.prenom} {f.client.nom}
                  </p>
                  <p className="text-sm">
                    Total: <span className="font-bold">{f.montantTotal.toLocaleString("fr-FR")} FCFA</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(f.dateEmission).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <Badge variant={f.statut === "PAYEE" ? "default" : "secondary"}>
                      {f.statut === "PAYEE" ? "Payee" : "En attente"}
                    </Badge>
                    {f.montantRestant > 0 && (
                      <p className="text-xs text-destructive mt-1">
                        Reste: {f.montantRestant.toLocaleString("fr-FR")} FCFA
                      </p>
                    )}
                  </div>
                  <Button nativeButton={false} variant="outline" size="sm" render={<Link href={`/api/pdf/facture/${f.id}`} target="_blank" />}>
                    <FileText className="mr-1 h-4 w-4" />
                    PDF
                  </Button>
                  {f.montantRestant > 0 && (
                    <FacturePaymentButton
                      factureId={f.id}
                      ordreReparationId={f.ordreReparationId}
                      montantRestant={f.montantRestant}
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
