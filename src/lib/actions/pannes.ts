"use server";

import { db } from "@/lib/db";
import { Section, StatutPanne } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function assignPanne(panneId: string, section: Section, mecanicienNom: string) {
  const panne = await db.panne.update({
    where: { id: panneId },
    data: { section, mecanicienNom, statut: StatutPanne.EN_COURS },
  });
  revalidatePath(`/ordres/${panne.ordreReparationId}`);
  return { data: panne };
}

export async function updatePanneStatut(panneId: string, statut: StatutPanne) {
  const panne = await db.panne.update({
    where: { id: panneId },
    data: { statut },
  });
  revalidatePath(`/ordres/${panne.ordreReparationId}`);
  return { data: panne };
}
