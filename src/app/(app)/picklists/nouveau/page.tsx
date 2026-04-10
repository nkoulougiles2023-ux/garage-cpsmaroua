import { requireRole } from "@/lib/auth-utils";
import { getOrdres } from "@/lib/actions/ordres";
import { StatutOR } from "@prisma/client";
import { PicklistForm } from "@/components/picklists/picklist-form";

export default async function NouveauPicklistPage() {
  await requireRole(["ADMIN", "CONTROLEUR"]);
  const ordres = await getOrdres(StatutOR.EN_COURS);

  const ordreOptions = ordres.map((o) => ({
    id: o.id,
    numeroOR: o.numeroOR,
    vehicleInfo: `${o.vehicle.marque} ${o.vehicle.modele} — ${o.vehicle.matricule}`,
  }));

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Nouveau Picklist</h1>
      <PicklistForm ordres={ordreOptions} />
    </div>
  );
}
