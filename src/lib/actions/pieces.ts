"use server";

import { db } from "@/lib/db";
import { pieceSchema } from "@/lib/validators/piece";
import { revalidatePath } from "next/cache";

export async function createPiece(data: unknown) {
  const parsed = pieceSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const existing = await db.piece.findUnique({ where: { codeBarre: parsed.data.codeBarre } });
  if (existing) return { error: { codeBarre: ["Ce code-barre existe déjà"] } };

  const piece = await db.piece.create({ data: parsed.data });
  revalidatePath("/magasin");
  return { data: piece };
}

export async function getPieces(search?: string) {
  return db.piece.findMany({
    where: search ? {
      OR: [
        { codeBarre: { contains: search, mode: "insensitive" } },
        { designation: { contains: search, mode: "insensitive" } },
        { categorie: { contains: search, mode: "insensitive" } },
      ],
    } : undefined,
    orderBy: { designation: "asc" },
  });
}

export async function updatePiece(id: string, data: unknown) {
  const parsed = pieceSchema.partial().safeParse(data);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const piece = await db.piece.update({
    where: { id },
    data: parsed.data,
  });
  revalidatePath("/magasin");
  return { data: piece };
}

export async function getPieceByBarcode(codeBarre: string) {
  return db.piece.findUnique({ where: { codeBarre } });
}

export async function getPiecesLowStock() {
  const pieces = await db.piece.findMany();
  return pieces.filter((p) => p.quantiteEnStock <= p.seuilAlerte);
}
