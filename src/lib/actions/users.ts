"use server";

import { db } from "@/lib/db";
import { Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

export async function getUsers() {
  return db.user.findMany({
    select: {
      id: true,
      nom: true,
      prenom: true,
      email: true,
      telephone: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createUser(data: {
  nom: string;
  prenom: string;
  email: string;
  password: string;
  telephone: string;
  role: Role;
}) {
  const existing = await db.user.findUnique({ where: { email: data.email } });
  if (existing) return { error: "Cet email existe déjà" };

  const hashedPassword = await bcrypt.hash(data.password, 12);
  const user = await db.user.create({
    data: { ...data, password: hashedPassword },
  });

  if (data.role === Role.CLIENT) {
    await db.client.create({
      data: {
        nom: data.nom,
        prenom: data.prenom,
        telephone: data.telephone,
        email: data.email,
        userId: user.id,
      },
    });
  }

  revalidatePath("/utilisateurs");
  return { data: user };
}

export async function toggleUserActive(userId: string) {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return { error: "Utilisateur non trouvé" };

  await db.user.update({
    where: { id: userId },
    data: { isActive: !user.isActive },
  });

  revalidatePath("/utilisateurs");
  return { data: { success: true } };
}
