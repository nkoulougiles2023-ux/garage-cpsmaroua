import { db } from "@/lib/db";

export async function generateNumeroOR(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `OR-${year}-`;

  const last = await db.ordreReparation.findFirst({
    where: { numeroOR: { startsWith: prefix } },
    orderBy: { numeroOR: "desc" },
  });

  const nextNum = last
    ? parseInt(last.numeroOR.replace(prefix, ""), 10) + 1
    : 1;

  return `${prefix}${String(nextNum).padStart(3, "0")}`;
}

export async function generateNumeroPicklist(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `PK-${year}-`;

  const last = await db.picklist.findFirst({
    where: { numeroPicklist: { startsWith: prefix } },
    orderBy: { numeroPicklist: "desc" },
  });

  const nextNum = last
    ? parseInt(last.numeroPicklist.replace(prefix, ""), 10) + 1
    : 1;

  return `${prefix}${String(nextNum).padStart(3, "0")}`;
}

export async function generateNumeroCloture(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `FC-${year}-`;

  const last = await db.ficheCloture.findFirst({
    where: { numeroCloture: { startsWith: prefix } },
    orderBy: { numeroCloture: "desc" },
  });

  const nextNum = last
    ? parseInt(last.numeroCloture.replace(prefix, ""), 10) + 1
    : 1;

  return `${prefix}${String(nextNum).padStart(3, "0")}`;
}

export async function generateNumeroFacture(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `FAC-${year}-`;

  const last = await db.facture.findFirst({
    where: { numeroFacture: { startsWith: prefix } },
    orderBy: { numeroFacture: "desc" },
  });

  const nextNum = last
    ? parseInt(last.numeroFacture.replace(prefix, ""), 10) + 1
    : 1;

  return `${prefix}${String(nextNum).padStart(3, "0")}`;
}
