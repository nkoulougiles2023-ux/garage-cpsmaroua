import { notFound } from "next/navigation";
import Link from "next/link";
import { requireAuth } from "@/lib/auth-utils";
import { getOrdreById } from "@/lib/actions/ordres";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { OrdreActions } from "@/components/ordres/ordre-actions";
import { AssignPanneDialog } from "@/components/controleur/assign-panne-dialog";
import { PicklistPaymentButton } from "@/components/payments/picklist-payment-button";
import { FacturePaymentButton } from "@/components/payments/facture-payment-button";
import { AcompteDialog } from "@/components/payments/acompte-dialog";
import { CreateInterventionDialog } from "@/components/controleur/create-intervention-dialog";
import { ClotureDialog } from "@/components/controleur/cloture-dialog";
import { SignClotureAdmin } from "@/components/admin/sign-cloture-admin";
import {
  StatutOR, StatutPanne, StatutPicklist,
  StatutPaiementPicklist, StatutIntervention,
} from "@prisma/client";
import { FileText, ClipboardList, Wrench, Banknote, Download } from "lucide-react";

interface Props {
  params: Promise<{ id: string }>;
}

const statutORColors: Record<string, string> = {
  EN_ATTENTE: "bg-yellow-100 text-yellow-800 border-yellow-200",
  EN_COURS: "bg-blue-100 text-blue-800 border-blue-200",
  CLOTURE: "bg-green-100 text-green-800 border-green-200",
};

const statutPanneColors: Record<string, string> = {
  SIGNALE: "bg-yellow-100 text-yellow-800",
  EN_COURS: "bg-blue-100 text-blue-800",
  RESOLU: "bg-green-100 text-green-800",
};

const panneLabels: Record<string, string> = {
  SIGNALE: "Signale", EN_COURS: "En cours", RESOLU: "Resolu",
};

const sectionLabels: Record<string, string> = {
  TOLERIE: "Tolerie", SOUDURE: "Soudure", ELECTRICITE: "Electricite",
  POIDS_LOURDS: "Poids Lourds", POIDS_LEGERS: "Poids Legers",
};

const typeLabels: Record<string, string> = {
  ACOMPTE: "Acompte", PICKLIST: "Picklist", SOLDE_FINAL: "Solde final",
};

const methodeLabels: Record<string, string> = {
  ESPECES: "Especes", MOBILE_MONEY: "Mobile Money", VIREMENT: "Virement",
};

export default async function OrdreDetailPage({ params }: Props) {
  const session = await requireAuth();
  const role = (session.user as any).role as string;
  const { id } = await params;
  const ordre = await getOrdreById(id);

  if (!ordre) notFound();

  const vehicle = ordre.vehicle;
  const client = vehicle.client;
  const canAssign = role === "ADMIN" || role === "CONTROLEUR";
  const canPay = role === "ADMIN" || role === "RECEPTIONNISTE";
  const totalPaye = ordre.paiements.reduce((s, p) => s + p.montant, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{ordre.numeroOR}</h1>
            <p className="text-muted-foreground">
              {vehicle.marque} {vehicle.modele} — {vehicle.matricule}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={statutORColors[ordre.statut]}>{ordre.statut.replace("_", " ")}</Badge>
            {ordre.signatureChauffeur ? (
              <Button nativeButton={false} variant="outline" size="sm" render={<Link href={`/api/pdf/or/${ordre.id}`} target="_blank" />}>
                <Download className="mr-1 h-4 w-4" /> PDF OR
              </Button>
            ) : (
              <Button variant="outline" size="sm" disabled title="Signature chauffeur requise avant l'impression">
                <Download className="mr-1 h-4 w-4" /> PDF OR
              </Button>
            )}
          </div>
        </div>
        {!ordre.signatureChauffeur && (
          <p className="text-xs text-destructive text-right">
            Signature chauffeur requise pour authentifier et imprimer la fiche OR.
          </p>
        )}
      </div>

      <Separator />

      {/* Vehicle + Chauffeur */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Vehicule & Client</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Client</span><span className="font-medium">{client.prenom} {client.nom}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Telephone</span><span className="font-medium">{client.telephone}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Matricule</span><span className="font-medium">{vehicle.matricule}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Type</span><span className="font-medium">{vehicle.typeVehicule}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Kilometrage</span><span className="font-medium">{ordre.kilometrage} km</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Carburant</span><span className="font-medium">{ordre.niveauCarburant}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Pneus</span><span className="font-medium">{ordre.niveauUsurePneus}</span></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Chauffeur</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Nom</span><span className="font-medium">{ordre.chauffeurNom}</span></div>
            {ordre.chauffeurTel && <div className="flex justify-between"><span className="text-muted-foreground">Telephone</span><span className="font-medium">{ordre.chauffeurTel}</span></div>}
            {ordre.serviceDorigine && <div className="flex justify-between"><span className="text-muted-foreground">Service</span><span className="font-medium">{ordre.serviceDorigine}</span></div>}
            <div className="flex justify-between"><span className="text-muted-foreground">Entree</span><span className="font-medium">{new Date(ordre.dateEntree).toLocaleDateString("fr-FR")}</span></div>
            {ordre.dateSortie && <div className="flex justify-between"><span className="text-muted-foreground">Sortie</span><span className="font-medium">{new Date(ordre.dateSortie).toLocaleDateString("fr-FR")}</span></div>}
            <div className="flex justify-between items-start">
              <span className="text-muted-foreground">Signature</span>
              {ordre.signatureChauffeur ? (
                <img src={ordre.signatureChauffeur} alt="Signature" className="h-12 border rounded bg-white" />
              ) : (
                <span className="text-muted-foreground italic">En attente</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pannes */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            <CardTitle>Pannes declarees</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {ordre.pannes.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune panne declaree.</p>
          ) : (
            <ul className="space-y-2">
              {ordre.pannes.map((panne) => (
                <li key={panne.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                  <div>
                    <span>{panne.description}</span>
                    {panne.mecanicienNom && (
                      <span className="ml-2 text-xs text-muted-foreground">({panne.mecanicienNom})</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {panne.section && <Badge variant="outline">{sectionLabels[panne.section] || panne.section}</Badge>}
                    <Badge className={statutPanneColors[panne.statut]}>{panneLabels[panne.statut]}</Badge>
                    {canAssign && panne.statut === StatutPanne.SIGNALE && (
                      <AssignPanneDialog panneId={panne.id} />
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Interventions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              <CardTitle>Interventions ({ordre.interventions.length})</CardTitle>
            </div>
            {canAssign && ordre.statut !== StatutOR.CLOTURE && (
              <CreateInterventionDialog ordreReparationId={ordre.id} />
            )}
          </div>
        </CardHeader>
          <CardContent>
            {ordre.interventions.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune intervention.</p>
            ) : (
              <div className="space-y-2">
                {ordre.interventions.map((int) => (
                  <div key={int.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                    <div>
                      <p className="font-medium">{int.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {int.mecanicienNom} — {sectionLabels[int.section] || int.section}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs">{Number(int.heuresTravail)}h x {int.tauxHoraire.toLocaleString("fr-FR")} FCFA</span>
                      <Badge variant={int.statut === StatutIntervention.TERMINE ? "default" : "secondary"}>
                        {int.statut === StatutIntervention.TERMINE ? "Termine" : "En cours"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

      {/* Picklists */}
      {ordre.picklists.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              <CardTitle>Picklists ({ordre.picklists.length})</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {ordre.picklists.map((pk) => (
              <div key={pk.id} className="rounded-md border p-3">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="font-medium">{pk.numeroPicklist}</span>
                    <span className="ml-2 text-sm text-muted-foreground">{pk.mecanicienNom}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{pk.statut === StatutPicklist.DELIVRE ? "Livre" : pk.statut === StatutPicklist.SIGNE ? "Signe" : "En attente"}</Badge>
                    <Badge variant={pk.paiementStatut === StatutPaiementPicklist.PAYE ? "default" : "secondary"}>
                      {pk.paiementStatut === StatutPaiementPicklist.PAYE ? "Paye" : "Non paye"}
                    </Badge>
                    {pk.signatureAdmin ? (
                      <Button nativeButton={false} variant="outline" size="sm" render={<Link href={`/api/pdf/picklist/${pk.id}`} target="_blank" />}>
                        <Download className="h-3 w-3" />
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" disabled title="En attente de signature admin">
                        <Download className="h-3 w-3 opacity-50" />
                      </Button>
                    )}
                  </div>
                </div>
                <div className="space-y-1 text-xs">
                  {pk.items.map((item) => (
                    <div key={item.id} className="flex justify-between text-muted-foreground">
                      <span>{item.piece.designation} x{item.quantite}</span>
                      <span>{(item.prixUnitaire * item.quantite).toLocaleString("fr-FR")} FCFA</span>
                    </div>
                  ))}
                  <div className="flex justify-between font-medium text-sm pt-1 border-t">
                    <span>Total</span>
                    <span>{pk.montantTotal.toLocaleString("fr-FR")} FCFA</span>
                  </div>
                </div>
                {canPay && pk.paiementStatut === StatutPaiementPicklist.NON_PAYE && pk.montantTotal > 0 && (
                  <div className="mt-2">
                    <PicklistPaymentButton picklistId={pk.id} ordreReparationId={ordre.id} montant={pk.montantTotal} />
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Paiements */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Banknote className="h-5 w-5" />
              <CardTitle>Paiements</CardTitle>
            </div>
            {canPay && ordre.statut !== StatutOR.CLOTURE && (
              <AcompteDialog ordreReparationId={ordre.id} />
            )}
          </div>
        </CardHeader>
        <CardContent>
          {ordre.paiements.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun paiement enregistre.</p>
          ) : (
            <div className="space-y-2">
              {ordre.paiements.map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                  <div>
                    <span className="font-medium">{p.montant.toLocaleString("fr-FR")} FCFA</span>
                    {p.referencePaiement && <span className="ml-2 text-xs text-muted-foreground">Ref: {p.referencePaiement}</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{typeLabels[p.type]}</Badge>
                    <Badge variant="secondary">{methodeLabels[p.methode]}</Badge>
                    <span className="text-xs text-muted-foreground">{new Date(p.date).toLocaleDateString("fr-FR")}</span>
                  </div>
                </div>
              ))}
              <div className="flex justify-end border-t pt-2">
                <p className="font-bold">Total paye: {totalPaye.toLocaleString("fr-FR")} FCFA</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Facture */}
      {ordre.facture && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                <CardTitle>Facture — {ordre.facture.numeroFacture}</CardTitle>
              </div>
              <Button nativeButton={false} variant="outline" size="sm" render={<Link href={`/api/pdf/facture/${ordre.facture.id}`} target="_blank" />}>
                <Download className="mr-1 h-4 w-4" /> PDF
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span>Pieces</span><span>{ordre.facture.montantPieces.toLocaleString("fr-FR")} FCFA</span></div>
            <div className="flex justify-between"><span>Main d&apos;oeuvre</span><span>{ordre.facture.montantMainOeuvre.toLocaleString("fr-FR")} FCFA</span></div>
            <div className="flex justify-between font-bold border-t pt-2"><span>Total</span><span>{ordre.facture.montantTotal.toLocaleString("fr-FR")} FCFA</span></div>
            <div className="flex justify-between"><span>Paye</span><span>{ordre.facture.montantPaye.toLocaleString("fr-FR")} FCFA</span></div>
            <div className="flex justify-between font-bold text-destructive"><span>Reste</span><span>{ordre.facture.montantRestant.toLocaleString("fr-FR")} FCFA</span></div>
            {canPay && ordre.facture.montantRestant > 0 && (
              <div className="pt-2">
                <FacturePaymentButton factureId={ordre.facture.id} ordreReparationId={ordre.id} montantRestant={ordre.facture.montantRestant} />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Fiche de cloture */}
      {ordre.ficheCloture && (
        <Card>
          <CardContent className="flex items-center justify-between py-4 gap-4 flex-wrap">
            <div className="space-y-1">
              <p className="font-medium">Fiche de Cloture — {ordre.ficheCloture.numeroCloture}</p>
              <p className="text-xs text-muted-foreground">{new Date(ordre.ficheCloture.dateGeneration).toLocaleDateString("fr-FR")}</p>
              <p className="text-xs">
                Signature admin :{" "}
                {ordre.ficheCloture.signatureAdmin ? (
                  <span className="font-medium text-green-700">signée</span>
                ) : (
                  <span className="italic text-muted-foreground">en attente</span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {role === "ADMIN" && !ordre.ficheCloture.signatureAdmin && (
                <SignClotureAdmin ficheId={ordre.ficheCloture.id} />
              )}
              <Button nativeButton={false} variant="outline" size="sm" render={<Link href={`/api/pdf/cloture/${ordre.ficheCloture.id}`} target="_blank" />}>
                <Download className="mr-1 h-4 w-4" /> PDF
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 flex-wrap">
        <OrdreActions ordre={{ id: ordre.id, signatureChauffeur: ordre.signatureChauffeur }} />
        {canAssign && ordre.statut === StatutOR.EN_COURS && !ordre.ficheCloture && (
          <ClotureDialog ordreReparationId={ordre.id} />
        )}
      </div>
    </div>
  );
}
