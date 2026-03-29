"use server";

import { db } from "@/lib/db";
import { generateNumeroCloture } from "@/lib/utils/numbering";
import { StatutOR } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function createFicheCloture(ordreReparationId: string, signatureControleur: string) {
  const numeroCloture = await generateNumeroCloture();

  const fiche = await db.ficheCloture.create({
    data: {
      numeroCloture,
      ordreReparationId,
      signatureControleur,
    },
  });

  await db.ordreReparation.update({
    where: { id: ordreReparationId },
    data: {
      statut: StatutOR.CLOTURE,
      dateSortie: new Date(),
      signatureControleur,
    },
  });

  revalidatePath(`/ordres/${ordreReparationId}`);
  revalidatePath("/ordres");
  revalidatePath("/dashboard");
  return { data: fiche };
}
