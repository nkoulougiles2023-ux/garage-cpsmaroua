"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function createStockEntry(data: {
  pieceId: string;
  quantite: number;
  motif?: string;
}) {
  const session = await auth();
  if (!session?.user) return { error: "Non autorisé" };

  // Create entry with EN_ATTENTE status — stock is NOT incremented yet
  await db.mouvementStock.create({
    data: {
      pieceId: data.pieceId,
      type: "ENTREE",
      quantite: data.quantite,
      motif: data.motif || "Entrée de stock",
      statutValidation: "EN_ATTENTE",
      effectueParId: session.user.id!,
    },
  });

  revalidatePath("/magasin");
  revalidatePath("/magasin/mouvements");
  revalidatePath("/controleur");
  return { data: { success: true } };
}

export async function validateStockEntry(mouvementId: string) {
  const session = await auth();
  if (!session?.user) return { error: "Non autorisé" };
  const role = (session.user as any).role as string;
  if (role !== "CONTROLEUR" && role !== "ADMIN") {
    return { error: "Seul le contrôleur ou l'admin peut valider" };
  }

  const mouvement = await db.mouvementStock.findUnique({
    where: { id: mouvementId },
  });
  if (!mouvement) return { error: "Mouvement introuvable" };
  if (mouvement.statutValidation !== "EN_ATTENTE") {
    return { error: "Ce mouvement a déjà été traité" };
  }

  await db.$transaction(async (tx) => {
    await tx.piece.update({
      where: { id: mouvement.pieceId },
      data: { quantiteEnStock: { increment: mouvement.quantite } },
    });

    await tx.mouvementStock.update({
      where: { id: mouvementId },
      data: {
        statutValidation: "VALIDE",
        valideParId: session.user!.id!,
        dateValidation: new Date(),
      },
    });
  });

  revalidatePath("/magasin");
  revalidatePath("/magasin/mouvements");
  revalidatePath("/controleur");
  return { data: { success: true } };
}

export async function rejectStockEntry(mouvementId: string) {
  const session = await auth();
  if (!session?.user) return { error: "Non autorisé" };
  const role = (session.user as any).role as string;
  if (role !== "CONTROLEUR" && role !== "ADMIN") {
    return { error: "Seul le contrôleur ou l'admin peut rejeter" };
  }

  const mouvement = await db.mouvementStock.findUnique({
    where: { id: mouvementId },
  });
  if (!mouvement) return { error: "Mouvement introuvable" };
  if (mouvement.statutValidation !== "EN_ATTENTE") {
    return { error: "Ce mouvement a déjà été traité" };
  }

  await db.mouvementStock.update({
    where: { id: mouvementId },
    data: {
      statutValidation: "REJETE",
      valideParId: session.user.id!,
      dateValidation: new Date(),
    },
  });

  revalidatePath("/magasin");
  revalidatePath("/magasin/mouvements");
  revalidatePath("/controleur");
  return { data: { success: true } };
}

export async function getMouvementsStock(type?: "ENTREE" | "SORTIE") {
  return db.mouvementStock.findMany({
    where: {
      ...(type ? { type } : {}),
      OR: [
        { statutValidation: "VALIDE" },
        { type: "SORTIE" },
      ],
    },
    include: {
      piece: { select: { codeBarre: true, designation: true } },
      effectuePar: { select: { nom: true, prenom: true } },
      picklist: { select: { numeroPicklist: true } },
    },
    orderBy: { date: "desc" },
    take: 200,
  });
}
