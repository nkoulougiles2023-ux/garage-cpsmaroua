"use server";

import { db } from "@/lib/db";
import { vehicleSchema } from "@/lib/validators/vehicle";
import { revalidatePath } from "next/cache";

export async function createVehicle(data: unknown) {
  const parsed = vehicleSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const existing = await db.vehicle.findUnique({
    where: { matricule: parsed.data.matricule },
  });
  if (existing) {
    return { error: { matricule: ["Ce matricule existe déjà"] } };
  }

  const vehicle = await db.vehicle.create({
    data: parsed.data,
  });

  revalidatePath("/ordres");
  return { data: vehicle };
}

export async function getVehicles(search?: string) {
  return db.vehicle.findMany({
    where: search
      ? {
          OR: [
            { matricule: { contains: search, mode: "insensitive" } },
            { marque: { contains: search, mode: "insensitive" } },
          ],
        }
      : undefined,
    include: { client: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getVehiclesByClient(clientId: string) {
  return db.vehicle.findMany({
    where: { clientId },
    orderBy: { createdAt: "desc" },
  });
}
