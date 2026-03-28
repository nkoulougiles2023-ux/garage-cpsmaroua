import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash("admin123", 12);

  await prisma.user.upsert({
    where: { email: "admin@cpsmaroua.cm" },
    update: {},
    create: {
      nom: "Admin",
      prenom: "CPS",
      email: "admin@cpsmaroua.cm",
      password: hashedPassword,
      telephone: "+237600000000",
      role: Role.ADMIN,
    },
  });

  await prisma.user.upsert({
    where: { email: "controleur@cpsmaroua.cm" },
    update: {},
    create: {
      nom: "Contrôleur",
      prenom: "Chef",
      email: "controleur@cpsmaroua.cm",
      password: hashedPassword,
      telephone: "+237600000001",
      role: Role.CONTROLEUR,
    },
  });

  await prisma.user.upsert({
    where: { email: "reception@cpsmaroua.cm" },
    update: {},
    create: {
      nom: "Réception",
      prenom: "Agent",
      email: "reception@cpsmaroua.cm",
      password: hashedPassword,
      telephone: "+237600000002",
      role: Role.RECEPTIONNISTE,
    },
  });

  await prisma.user.upsert({
    where: { email: "magasin@cpsmaroua.cm" },
    update: {},
    create: {
      nom: "Magasinier",
      prenom: "Agent",
      email: "magasin@cpsmaroua.cm",
      password: hashedPassword,
      telephone: "+237600000003",
      role: Role.MAGASINIER,
    },
  });

  console.log("Seed completed: 4 users created (password: admin123)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
