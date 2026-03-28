"use server";

import { db } from "@/lib/db";
import { clientSchema } from "@/lib/validators/client";
import { revalidatePath } from "next/cache";

export async function createClient(data: unknown) {
  const parsed = clientSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const existing = await db.client.findUnique({
    where: { telephone: parsed.data.telephone },
  });
  if (existing) {
    return { error: { telephone: ["Ce numéro de téléphone existe déjà"] } };
  }

  const client = await db.client.create({
    data: {
      nom: parsed.data.nom,
      prenom: parsed.data.prenom,
      telephone: parsed.data.telephone,
      email: parsed.data.email || null,
      adresse: parsed.data.adresse || null,
    },
  });

  revalidatePath("/ordres");
  return { data: client };
}

export async function getClients(search?: string) {
  return db.client.findMany({
    where: search
      ? {
          OR: [
            { nom: { contains: search, mode: "insensitive" } },
            { prenom: { contains: search, mode: "insensitive" } },
            { telephone: { contains: search } },
          ],
        }
      : undefined,
    include: { vehicles: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getClientById(id: string) {
  return db.client.findUnique({
    where: { id },
    include: { vehicles: true },
  });
}
