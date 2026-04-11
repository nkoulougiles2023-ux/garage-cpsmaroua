"use server";

import { db } from "@/lib/db";
import { generateNumeroCloture } from "@/lib/utils/numbering";
import { StatutOR } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";

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

export async function signFicheClotureAdmin(ficheId: string, signatureAdmin: string) {
  const session = await auth();
  if (!session?.user) return { error: "Non autorisé" };
  const role = (session.user as any).role as string;
  if (role !== "ADMIN") return { error: "Seul l'admin peut signer la fiche de clôture" };

  const fiche = await db.ficheCloture.update({
    where: { id: ficheId },
    data: { signatureAdmin },
    include: { ordreReparation: true },
  });

  revalidatePath(`/ordres/${fiche.ordreReparationId}`);
  revalidatePath("/ordres");
  return { data: fiche };
}
