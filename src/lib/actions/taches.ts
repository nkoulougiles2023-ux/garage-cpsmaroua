"use server";

import { db } from "@/lib/db";

export interface TacheOption {
  id: string;
  description: string;
  categorie: string;
  heuresStd: number | null;
}

export async function searchTaches(query: string, limit = 20): Promise<TacheOption[]> {
  const trimmed = query.trim();
  const taches = await db.tacheCatalogue.findMany({
    where: trimmed
      ? {
          OR: [
            { description: { contains: trimmed, mode: "insensitive" } },
            { categorie: { contains: trimmed, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: [{ categorie: "asc" }, { description: "asc" }],
    take: limit,
  });

  return taches.map((t) => ({
    id: t.id,
    description: t.description,
    categorie: t.categorie,
    heuresStd: t.heuresStd !== null ? Number(t.heuresStd) : null,
  }));
}
