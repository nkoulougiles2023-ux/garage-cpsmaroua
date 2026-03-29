"use server";

import { db } from "@/lib/db";
import { TypeMouvement } from "@prisma/client";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function createStockEntry(data: {
  pieceId: string;
  quantite: number;
  motif?: string;
}) {
  const session = await auth();
  if (!session?.user) return { error: "Non autorisé" };

  await db.$transaction(async (tx) => {
    await tx.piece.update({
      where: { id: data.pieceId },
      data: { quantiteEnStock: { increment: data.quantite } },
    });

    await tx.mouvementStock.create({
      data: {
        pieceId: data.pieceId,
        type: TypeMouvement.ENTREE,
        quantite: data.quantite,
        motif: data.motif || "Entrée de stock",
        effectueParId: session.user!.id!,
      },
    });
  });

  revalidatePath("/magasin");
  revalidatePath("/magasin/mouvements");
  return { data: { success: true } };
}

export async function getMouvementsStock(type?: "ENTREE" | "SORTIE") {
  return db.mouvementStock.findMany({
    where: type ? { type } : undefined,
    include: {
      piece: { select: { codeBarre: true, designation: true } },
      effectuePar: { select: { nom: true, prenom: true } },
      picklist: { select: { numeroPicklist: true } },
    },
    orderBy: { date: "desc" },
    take: 200,
  });
}
