"use server";

import { db } from "@/lib/db";
import { generateNumeroFacture } from "@/lib/utils/numbering";
import { revalidatePath } from "next/cache";

export async function createFacture(ordreReparationId: string) {
  const ordre = await db.ordreReparation.findUnique({
    where: { id: ordreReparationId },
    include: {
      vehicle: { include: { client: true } },
      interventions: true,
      picklists: { include: { items: true } },
      paiements: true,
    },
  });

  if (!ordre) return { error: "OR non trouvé" };

  const montantPieces = ordre.picklists.reduce((sum, pk) => sum + pk.montantTotal, 0);
  const montantMainOeuvre = ordre.interventions.reduce(
    (sum, int) => sum + Number(int.heuresTravail) * int.tauxHoraire, 0
  );
  const montantTotal = montantPieces + montantMainOeuvre;
  const montantPaye = ordre.paiements.reduce((sum, p) => sum + p.montant, 0);
  const montantRestant = montantTotal - montantPaye;

  const numeroFacture = await generateNumeroFacture();

  const facture = await db.facture.create({
    data: {
      numeroFacture,
      ordreReparationId,
      clientId: ordre.vehicle.client.id,
      montantPieces,
      montantMainOeuvre,
      montantTotal,
      montantPaye,
      montantRestant,
      statut: montantRestant <= 0 ? "PAYEE" : "EN_ATTENTE",
    },
  });

  revalidatePath(`/ordres/${ordreReparationId}`);
  revalidatePath("/factures");
  return { data: facture };
}

export async function getFactures() {
  return db.facture.findMany({
    include: {
      ordreReparation: { select: { numeroOR: true } },
      client: true,
    },
    orderBy: { dateEmission: "desc" },
  });
}
