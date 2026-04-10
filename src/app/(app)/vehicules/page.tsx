import { requireRole } from "@/lib/auth-utils";
import { getVehicles } from "@/lib/actions/vehicles";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Car } from "lucide-react";

const typeLabels: Record<string, string> = {
  VOITURE: "Voiture",
  CAMION: "Camion",
  BUS: "Bus",
};

export default async function VehiculesPage() {
  await requireRole(["ADMIN"]);
  const vehicles = await getVehicles();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Véhicules</h1>
        <p className="text-sm text-muted-foreground">
          {vehicles.length} véhicule(s) enregistré(s)
        </p>
      </div>

      {vehicles.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
          <Car className="mb-4 h-10 w-10 text-muted-foreground" />
          <p className="text-muted-foreground">Aucun véhicule enregistré</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {vehicles.map((v) => (
            <Card key={v.id} className="transition-colors hover:bg-muted/50">
              <CardContent className="flex items-center justify-between py-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Car className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold">{v.matricule}</span>
                    <Badge variant="outline">
                      {typeLabels[v.typeVehicule] ?? v.typeVehicule}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {v.marque} {v.modele}
                    {v.numeroChassis ? ` — Châssis: ${v.numeroChassis}` : ""}
                  </p>
                </div>
                <div className="text-right text-sm text-muted-foreground space-y-1">
                  <p className="font-medium text-foreground">
                    {v.client.prenom} {v.client.nom}
                  </p>
                  <p>{v.client.telephone}</p>
                  <p>
                    {new Date(v.createdAt).toLocaleDateString("fr-FR")}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
