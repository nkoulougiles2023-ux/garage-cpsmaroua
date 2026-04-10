import Link from "next/link";
import { requireAuth } from "@/lib/auth-utils";
import { getPicklists } from "@/lib/actions/picklists";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, ClipboardCheck } from "lucide-react";
import { StatutPicklist, StatutPaiementPicklist } from "@prisma/client";
import { PicklistPaymentButton } from "@/components/payments/picklist-payment-button";
import { ApprovePicklistButton } from "@/components/admin/approve-picklist-button";
import { SignPicklistButton } from "@/components/controleur/sign-picklist-button";

function statutPicklistBadge(statut: StatutPicklist) {
  switch (statut) {
    case StatutPicklist.EN_ATTENTE:
      return (
        <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
          En attente
        </Badge>
      );
    case StatutPicklist.APPROUVE_ADMIN:
      return (
        <Badge className="bg-purple-100 text-purple-800 border-purple-200">
          Approuvé Admin
        </Badge>
      );
    case StatutPicklist.SIGNE:
      return (
        <Badge className="bg-blue-100 text-blue-800 border-blue-200">
          Signé
        </Badge>
      );
    case StatutPicklist.DELIVRE:
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200">
          Livré
        </Badge>
      );
    default:
      return <Badge variant="outline">{statut}</Badge>;
  }
}

function paiementBadge(paiementStatut: StatutPaiementPicklist) {
  switch (paiementStatut) {
    case StatutPaiementPicklist.PAYE:
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200">
          Payé
        </Badge>
      );
    case StatutPaiementPicklist.NON_PAYE:
      return (
        <Badge className="bg-gray-100 text-gray-700 border-gray-200">
          Non payé
        </Badge>
      );
    default:
      return <Badge variant="outline">{paiementStatut}</Badge>;
  }
}

export default async function PicklistsPage() {
  const session = await requireAuth();
  const role = (session.user as any).role as string;
  const picklists = await getPicklists();

  const canCreate = role === "ADMIN" || role === "CONTROLEUR";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Picklists</h1>
        {canCreate && (
          <Button nativeButton={false} render={<Link href="/picklists/nouveau" />}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Nouveau Picklist
          </Button>
        )}
      </div>

      {picklists.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
          <ClipboardCheck className="mb-4 h-10 w-10 text-muted-foreground" />
          <p className="text-muted-foreground">Aucun picklist</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {picklists.map((picklist) => (
            <Card key={picklist.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base leading-tight">
                    {picklist.numeroPicklist}
                  </CardTitle>
                  <div className="flex flex-col items-end gap-1">
                    {statutPicklistBadge(picklist.statut)}
                    {paiementBadge(picklist.paiementStatut)}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="text-muted-foreground">
                  OR :{" "}
                  <span className="font-medium text-foreground">
                    {picklist.ordreReparation.numeroOR}
                  </span>
                </p>
                <p className="text-muted-foreground">
                  Mécanicien :{" "}
                  <span className="font-medium text-foreground">
                    {picklist.mecanicienNom}
                  </span>
                </p>
                <p className="text-muted-foreground">
                  Articles :{" "}
                  <span className="font-medium text-foreground">
                    {picklist.items.length} pièce(s)
                  </span>
                </p>
                <p className="font-semibold text-base">
                  {picklist.montantTotal.toLocaleString("fr-FR")} FCFA
                </p>
                {role === "ADMIN" && picklist.statut === StatutPicklist.EN_ATTENTE && (
                  <div className="pt-2">
                    <ApprovePicklistButton picklistId={picklist.id} />
                  </div>
                )}
                {(role === "CONTROLEUR" || role === "ADMIN") && picklist.statut === StatutPicklist.APPROUVE_ADMIN && (
                  <div className="pt-2">
                    <SignPicklistButton picklistId={picklist.id} />
                  </div>
                )}
                {picklist.paiementStatut === StatutPaiementPicklist.NON_PAYE && picklist.montantTotal > 0 && (
                  <div className="pt-2">
                    <PicklistPaymentButton
                      picklistId={picklist.id}
                      ordreReparationId={picklist.ordreReparationId}
                      montant={picklist.montantTotal}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
