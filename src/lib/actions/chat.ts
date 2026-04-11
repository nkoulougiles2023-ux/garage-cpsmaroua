"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getMessages(cursor?: string) {
  const session = await auth();
  if (!session?.user) return [];

  return db.chatMessage.findMany({
    take: 50,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: { createdAt: "desc" },
    include: {
      sender: { select: { id: true, nom: true, prenom: true, role: true } },
    },
  });
}

export async function sendMessage(content: string) {
  const session = await auth();
  if (!session?.user) return { error: "Non autorisé" };

  const trimmed = content.trim();
  if (!trimmed || trimmed.length > 1000) {
    return { error: "Message invalide (1-1000 caractères)" };
  }

  const message = await db.chatMessage.create({
    data: {
      senderId: session.user.id!,
      content: trimmed,
    },
    include: {
      sender: { select: { id: true, nom: true, prenom: true, role: true } },
    },
  });

  revalidatePath("/");
  return { data: message };
}
