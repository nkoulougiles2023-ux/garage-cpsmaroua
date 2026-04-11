"use server";

import { db } from "@/lib/db";
import { Section, StatutIntervention } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { TAUX_HORAIRE_MAIN_OEUVRE } from "@/lib/constants";

export async function createIntervention(data: {
  ordreReparationId: string;
  mecanicienNom: string;
  section: Section;
  description: string;
}) {
  const intervention = await db.intervention.create({
    data: { ...data, tauxHoraire: TAUX_HORAIRE_MAIN_OEUVRE },
  });
  revalidatePath(`/ordres/${data.ordreReparationId}`);
  return { data: intervention };
}

export async function completeIntervention(interventionId: string, heuresTravail: number) {
  const intervention = await db.intervention.update({
    where: { id: interventionId },
    data: { statut: StatutIntervention.TERMINE, heuresTravail, dateFin: new Date() },
  });
  revalidatePath(`/ordres/${intervention.ordreReparationId}`);
  return { data: intervention };
}
