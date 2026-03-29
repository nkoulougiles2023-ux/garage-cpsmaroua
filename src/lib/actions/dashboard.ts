"use server";
import { db } from "@/lib/db";
import { StatutOR } from "@prisma/client";

export async function getDashboardStats() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [vehiculesAuGarage, ordresEnCours, piecesEnStock, revenusMois, ordresRecents] =
    await Promise.all([
      db.ordreReparation.count({
        where: { statut: { not: StatutOR.CLOTURE } },
      }),
      db.ordreReparation.count({
        where: { statut: StatutOR.EN_COURS },
      }),
      db.piece.count({
        where: { quantiteEnStock: { gt: 0 } },
      }),
      db.paiement.aggregate({
        where: { date: { gte: startOfMonth } },
        _sum: { montant: true },
      }),
      db.ordreReparation.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { vehicle: { include: { client: true } } },
      }),
    ]);

  return {
    vehiculesAuGarage,
    ordresEnCours,
    piecesEnStock,
    revenusMois: revenusMois._sum.montant ?? 0,
    ordresRecents,
  };
}
