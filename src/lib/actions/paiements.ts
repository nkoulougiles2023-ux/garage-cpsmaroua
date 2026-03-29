"use server";

import { db } from "@/lib/db";
import { TypePaiement, MethodePaiement, StatutPaiementPicklist } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function createPaiement(data: {
  montant: number;
  type: TypePaiement;
  methode: MethodePaiement;
  ordreReparationId: string;
  picklistId?: string;
  factureId?: string;
  referencePaiement?: string;
}) {
  const paiement = await db.paiement.create({ data });

  // If paying for a picklist, mark it as paid
  if (data.type === TypePaiement.PICKLIST && data.picklistId) {
    await db.picklist.update({
      where: { id: data.picklistId },
      data: { paiementStatut: StatutPaiementPicklist.PAYE },
    });
  }

  // If paying toward a facture, update facture totals
  if (data.factureId) {
    const facture = await db.facture.findUnique({
      where: { id: data.factureId },
      include: { paiements: true },
    });
    if (facture) {
      const totalPaye = facture.paiements.reduce((s, p) => s + p.montant, 0) + data.montant;
      await db.facture.update({
        where: { id: data.factureId },
        data: {
          montantPaye: totalPaye,
          montantRestant: facture.montantTotal - totalPaye,
          statut: totalPaye >= facture.montantTotal ? "PAYEE" : "EN_ATTENTE",
        },
      });
    }
  }

  revalidatePath(`/ordres/${data.ordreReparationId}`);
  revalidatePath("/paiements");
  revalidatePath("/picklists");
  return { data: paiement };
}

export async function getPaiements(ordreReparationId?: string) {
  return db.paiement.findMany({
    where: ordreReparationId ? { ordreReparationId } : undefined,
    include: {
      ordreReparation: { select: { numeroOR: true } },
      picklist: { select: { numeroPicklist: true } },
    },
    orderBy: { date: "desc" },
  });
}
