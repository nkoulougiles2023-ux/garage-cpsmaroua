"use server";

import { db } from "@/lib/db";
import { generateNumeroPicklist } from "@/lib/utils/numbering";
import { StatutPicklist, StatutPaiementPicklist, TypeMouvement } from "@prisma/client";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function createPicklist(data: {
  ordreReparationId: string;
  mecanicienNom: string;
  items: { pieceId: string; quantite: number; prixUnitaire: number }[];
}) {
  const numeroPicklist = await generateNumeroPicklist();
  const montantTotal = data.items.reduce((sum, item) => sum + item.quantite * item.prixUnitaire, 0);

  const picklist = await db.picklist.create({
    data: {
      numeroPicklist,
      ordreReparationId: data.ordreReparationId,
      mecanicienNom: data.mecanicienNom,
      montantTotal,
      items: {
        create: data.items.map((item) => ({
          pieceId: item.pieceId,
          quantite: item.quantite,
          prixUnitaire: item.prixUnitaire,
        })),
      },
    },
    include: { items: { include: { piece: true } } },
  });

  revalidatePath("/picklists");
  revalidatePath(`/ordres/${data.ordreReparationId}`);
  return { data: picklist };
}

export async function signPicklist(picklistId: string, signature: string) {
  const picklist = await db.picklist.update({
    where: { id: picklistId },
    data: { signatureControleur: signature, statut: StatutPicklist.SIGNE },
  });
  revalidatePath("/picklists");
  return { data: picklist };
}

export async function deliverPicklist(picklistId: string) {
  const session = await auth();
  if (!session?.user) return { error: "Non autorisé" };
  const userId = (session.user as any).id as string;

  const picklist = await db.picklist.findUnique({
    where: { id: picklistId },
    include: { items: true },
  });

  if (!picklist) return { error: "Picklist non trouvée" };
  if (picklist.statut !== StatutPicklist.SIGNE) return { error: "Picklist non signée" };
  if (picklist.paiementStatut !== StatutPaiementPicklist.PAYE) return { error: "Picklist non payée" };

  await db.$transaction(async (tx) => {
    for (const item of picklist.items) {
      await tx.piece.update({
        where: { id: item.pieceId },
        data: { quantiteEnStock: { decrement: item.quantite } },
      });

      await tx.mouvementStock.create({
        data: {
          pieceId: item.pieceId,
          type: TypeMouvement.SORTIE,
          quantite: item.quantite,
          picklistId: picklist.id,
          motif: `Picklist ${picklist.numeroPicklist}`,
          effectueParId: userId,
        },
      });
    }

    await tx.picklist.update({
      where: { id: picklistId },
      data: { statut: StatutPicklist.DELIVRE },
    });
  });

  revalidatePath("/picklists");
  revalidatePath("/magasin");
  return { data: { success: true } };
}

export async function getPicklists(statut?: StatutPicklist) {
  return db.picklist.findMany({
    where: statut ? { statut } : undefined,
    include: {
      ordreReparation: { select: { numeroOR: true } },
      items: { include: { piece: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}
