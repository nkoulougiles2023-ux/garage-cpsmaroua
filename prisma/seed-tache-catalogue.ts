import "dotenv/config";
import * as path from "path";
import * as XLSX from "xlsx";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

interface RawRow {
  description?: string | number;
  categorie?: string | number;
  heuresStd?: string | number;
}

function normalize(row: RawRow): {
  description: string;
  categorie: string;
  heuresStd: number | null;
} | null {
  const description = String(row.description ?? "").trim();
  if (!description) return null;
  if (description.toUpperCase() === "DESCRIPTION") return null; // header row
  const categorie = String(row.categorie ?? "").trim();

  const rawHeure = row.heuresStd;
  let heuresStd: number | null = null;
  if (rawHeure !== undefined && rawHeure !== null && rawHeure !== "") {
    if (typeof rawHeure === "number") {
      heuresStd = rawHeure;
    } else {
      const upper = String(rawHeure).trim().toUpperCase();
      if (upper === "AD") {
        heuresStd = null;
      } else {
        const parsed = Number(String(rawHeure).replace(",", "."));
        heuresStd = Number.isFinite(parsed) ? parsed : null;
      }
    }
  }

  return { description, categorie, heuresStd };
}

async function main() {
  const filePath = path.join(
    process.cwd(),
    "Image",
    "DESCRIPTION DES TACHES AVEC LES HEURES ALADJ.xlsx"
  );
  console.log(`Loading ${filePath}`);
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  // The file has no header row; the first row is literally "DESCRIPTION/CATEGORIE/HEURE".
  // Force positional headers and let normalize() drop the label row.
  const rows = XLSX.utils.sheet_to_json<RawRow>(sheet, {
    header: ["description", "categorie", "heuresStd"],
    defval: "",
  });
  console.log(`Parsed ${rows.length} rows from worksheet`);

  let processed = 0;
  let skipped = 0;
  for (const row of rows) {
    const norm = normalize(row);
    if (!norm) {
      skipped++;
      continue;
    }
    await prisma.tacheCatalogue.upsert({
      where: {
        description_categorie: {
          description: norm.description,
          categorie: norm.categorie,
        },
      },
      create: {
        description: norm.description,
        categorie: norm.categorie,
        heuresStd: norm.heuresStd,
      },
      update: {
        heuresStd: norm.heuresStd,
      },
    });
    processed++;
  }

  const total = await prisma.tacheCatalogue.count();
  console.log(`Processed ${processed} rows (skipped ${skipped})`);
  console.log(`TacheCatalogue now contains ${total} rows`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
