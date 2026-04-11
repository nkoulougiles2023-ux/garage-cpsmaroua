import Link from "next/link";
import { requireRole } from "@/lib/auth-utils";
import { getReceptionnisteDashboardStats } from "@/lib/actions/dashboard-receptionniste";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Car,
  Clock,
  CheckCircle,
  Wrench,
  PlusCircle,
  Users,
  ClipboardList,
  CalendarDays,
  Phone,
  FileCheck,
} from "lucide-react";
import { StatutOR, StatutPicklist } from "@prisma/client";

const statutColors: Record<StatutOR, string> = {
  EN_ATTENTE: "bg-yellow-100 text-yellow-800",
  EN_COURS: "bg-blue-100 text-blue-800",
  CLOTURE: "bg-green-100 text-green-800",
};

const statutLabels: Record<StatutOR, string> = {
  EN_ATTENTE: "En attente",
  EN_COURS: "En cours",
  CLOTURE: "Cloturé",
};

const statutPicklistLabels: Record<StatutPicklist, string> = {
  EN_ATTENTE: "En attente",
  APPROUVE_ADMIN: "Approuvé",
  SIGNE: "Signé",
  DELIVRE: "Livré",
};

const statutPicklistColors: Record<StatutPicklist, string> = {
  EN_ATTENTE: "bg-yellow-100 text-yellow-800",
  APPROUVE_ADMIN: "bg-purple-100 text-purple-800",
  SIGNE: "bg-blue-100 text-blue-800",
  DELIVRE: "bg-green-100 text-green-800",
};

export default async function ReceptionDashboardPage() {
  await requireRole(["ADMIN", "RECEPTIONNISTE"]);
  const stats = await getReceptionnisteDashboardStats();

  const currentMonth = new Date().toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tableau de bord — Réception</h1>
        <Button nativeButton={false} render={<Link href="/reception/nouveau" />}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Nouvelle réception
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Véhicules reçus ce mois</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.vehiculesRecusCeMois}</div>
            <p className="text-xs text-muted-foreground">{currentMonth}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">OR en attente</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.ordresEnAttente}</div>
            <p className="text-xs text-muted-foreground">à traiter</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">OR en cours</CardTitle>
            <Wrench className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.ordresEnCours}</div>
            <p className="text-xs text-muted-foreground">en réparation</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Clôtures ce mois</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.ordresClotureCeMois}</div>
            <p className="text-xs text-muted-foreground">réparations terminées</p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Reçus aujourd&apos;hui</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.vehiculesRecusAujourdhui}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClients}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Véhicules enregistrés</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.vehicles.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Derniers OR */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-blue-500" />
            <CardTitle>Derniers ordres de réparation</CardTitle>
          </div>
          <Button nativeButton={false} variant="ghost" size="sm" render={<Link href="/ordres" />}>
            Voir tout
          </Button>
        </CardHeader>
        <CardContent>
          {stats.recentOrdres.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun ordre de réparation.</p>
          ) : (
            <div className="space-y-3">
              {stats.recentOrdres.map((or) => (
                <div key={or.id} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                  <div className="space-y-1">
                    <Link href={`/ordres/${or.id}`} className="text-sm font-medium hover:underline">
                      {or.numeroOR}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {or.vehicle.matricule} — {or.vehicle.marque}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Client: {or.vehicle.client.nom} {or.vehicle.client.prenom}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={statutColors[or.statut]}>{statutLabels[or.statut]}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(or.createdAt).toLocaleDateString("fr-FR")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Picklists */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCheck className="h-5 w-5 text-purple-500" />
            <CardTitle>Derniers picklists</CardTitle>
          </div>
          <Button nativeButton={false} variant="ghost" size="sm" render={<Link href="/picklists" />}>
            Voir tout
          </Button>
        </CardHeader>
        <CardContent>
          {stats.picklists.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun picklist.</p>
          ) : (
            <div className="space-y-3">
              {stats.picklists.map((pl) => (
                <div key={pl.id} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{pl.numeroPicklist}</p>
                    <p className="text-xs text-muted-foreground">
                      OR: {pl.ordreReparation.numeroOR} — {pl.items.length} pièce(s)
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Mécanicien: {pl.mecanicienNom}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={statutPicklistColors[pl.statut]}>
                      {statutPicklistLabels[pl.statut]}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {pl.montantTotal.toLocaleString("fr-FR")} FCFA
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Fiches de clôture */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <CardTitle>Dernières fiches de clôture</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {stats.fichesCloture.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune fiche de clôture.</p>
          ) : (
            <div className="space-y-3">
              {stats.fichesCloture.map((fc) => (
                <div key={fc.id} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{fc.numeroCloture}</p>
                    <p className="text-xs text-muted-foreground">
                      OR: {fc.ordreReparation.numeroOR} — {fc.ordreReparation.vehicle.matricule} {fc.ordreReparation.vehicle.marque}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button nativeButton={false} variant="outline" size="sm" render={<Link href={`/api/pdf/cloture/${fc.id}`} target="_blank" />}>
                      PDF
                    </Button>
                    <span className="text-xs text-muted-foreground">
                      {new Date(fc.dateGeneration).toLocaleDateString("fr-FR")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Liste des véhicules */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Car className="h-5 w-5 text-indigo-500" />
              <CardTitle>Véhicules</CardTitle>
            </div>
            <Button nativeButton={false} variant="ghost" size="sm" render={<Link href="/vehicules" />}>
              Voir tout
            </Button>
          </CardHeader>
          <CardContent>
            {stats.vehicles.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun véhicule enregistré.</p>
            ) : (
              <div className="space-y-2">
                {stats.vehicles.map((v) => (
                  <div key={v.id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                    <div>
                      <p className="text-sm font-medium">{v.matricule}</p>
                      <p className="text-xs text-muted-foreground">
                        {v.marque} {v.modele} — {v.client.nom} {v.client.prenom}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">{v.typeVehicule}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Carnet d'adresse clients */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-orange-500" />
              <CardTitle>Carnet d&apos;adresse — Clients</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {stats.clients.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun client.</p>
            ) : (
              <div className="space-y-2">
                {stats.clients.map((c) => (
                  <div key={c.id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                    <div>
                      <p className="text-sm font-medium">{c.nom} {c.prenom}</p>
                      <p className="text-xs text-muted-foreground">
                        {c.telephone} {c.email ? `— ${c.email}` : ""}
                      </p>
                      {c.vehicles.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                          Véhicules: {c.vehicles.map((v) => v.matricule).join(", ")}
                        </p>
                      )}
                    </div>
                    {c.adresse && (
                      <span className="text-xs text-muted-foreground max-w-[120px] truncate">
                        {c.adresse}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
