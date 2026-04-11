# Picklist Bug Fix + Print Improvements + Catalogue Tâches — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the empty-OR-dropdown bug on `/picklists/nouveau`, render signatures on OR/Picklist PDFs, fit each PDF on a single page via adaptive density, and import the 2590-task Excel catalogue so the picklist auto-computes labour cost without manual entry.

**Architecture:**
- C1 widens `getOrdres()` filter to accept multiple statuses (1 server-action change + 1 page change)
- C2 renders `Image` for stored base64 signatures inside the existing PDF signature boxes
- C3 introduces a `getStyles(preset)` factory in `shared-styles.ts`; OR/Picklist PDFs pick the preset based on row count
- C4 adds a `TacheCatalogue` model + Prisma migration, an idempotent seed script that parses the XLSX, extends `Picklist` and `PicklistItem` with task/labour fields, and rewrites the picklist form + facture aggregation accordingly

**Tech Stack:** Next.js 16 App Router, Prisma 7 + Neon Postgres, base-ui shadcn variant, `@react-pdf/renderer`, new dependency `xlsx` (read-only XLSX parser) for the seed script.

**Source spec:** `docs/superpowers/specs/2026-04-11-picklist-bug-and-print-design.md`

**Verification approach:** This codebase has no automated test suite. Verification is **(a) `npx tsc --noEmit`** for type-correctness after each task, plus **(b) explicit manual UI verification steps** at the end of each chantier. No test files are added.

**Execution order (locked):**
1. Chantier 1 — bug fix (smallest, unblocks contrôleur)
2. Chantier 2 — signatures on PDF (small, no schema change)
3. Chantier 4 — catalogue de tâches (largest, schema migration)
4. Chantier 3 — adaptive 1-page PDF format (must come after C4 since picklist columns change)

---

## Chantier 1 — Fix dropdown OR vide

### Task 1.1: Étendre `getOrdres()` pour accepter un tableau de statuts

**Files:**
- Modify: `src/lib/actions/ordres.ts:59-69`

- [ ] **Step 1: Update `getOrdres` signature and where clause**

Replace lines 59-69 of `src/lib/actions/ordres.ts`:

```ts
export async function getOrdres(statut?: StatutOR | StatutOR[]) {
  const where = statut
    ? { statut: Array.isArray(statut) ? { in: statut } : statut }
    : undefined;
  return db.ordreReparation.findMany({
    where,
    include: {
      vehicle: { include: { client: true } },
      pannes: true,
      _count: { select: { picklists: true, interventions: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}
```

- [ ] **Step 2: Run typecheck**

Run: `npx tsc --noEmit`
Expected: zero errors. If existing callers using `getOrdres(StatutOR.EN_COURS)` complain, the new signature is rétro-compatible (single value still works).

- [ ] **Step 3: Commit**

```bash
git add src/lib/actions/ordres.ts
git commit -m "feat(ordres): allow getOrdres to accept multiple statuses"
```

### Task 1.2: Charger les OR EN_ATTENTE et EN_COURS dans le formulaire picklist

**Files:**
- Modify: `src/app/(app)/picklists/nouveau/page.tsx:8`

- [ ] **Step 1: Update the call to load both statuses**

In `src/app/(app)/picklists/nouveau/page.tsx`, replace line 8:

```ts
const ordres = await getOrdres([StatutOR.EN_ATTENTE, StatutOR.EN_COURS]);
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: zero errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/(app)/picklists/nouveau/page.tsx
git commit -m "fix(picklist): include EN_ATTENTE OR in dropdown so controleur can pick newly received OR"
```

### Task 1.3: Vérification manuelle UI — Chantier 1

- [ ] **Step 1: Start dev server**

Run: `npm run dev`

- [ ] **Step 2: Manual flow**

1. Login as `reception@cpsmaroua.cm` / `admin123`
2. Navigate to `/reception/nouveau`, create a new vehicle reception (which creates a fresh OR with status `EN_ATTENTE`)
3. Logout, login as `controleur@cpsmaroua.cm` / `admin123`
4. Navigate to `/picklists/nouveau`
5. Click the « Ordre de Réparation » Select trigger
6. **Expected:** the newly-created OR appears in the dropdown options

- [ ] **Step 3: Stop dev server (Ctrl+C)**

---

## Chantier 2 — Signatures visibles sur les PDF

### Task 2.1: Ajouter le style commun `signatureImage`

**Files:**
- Modify: `src/lib/pdf/shared-styles.ts:61-71`

- [ ] **Step 1: Add `signatureImage` style**

In `src/lib/pdf/shared-styles.ts`, replace the `signatureArea` / `signatureBox` block (around lines 61-71) with:

```ts
  signatureArea: {
    marginTop: 30,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  signatureBox: {
    width: "45%",
    borderTop: "1 solid #000",
    paddingTop: 4,
    textAlign: "center",
  },
  signatureImage: {
    height: 40,
    marginBottom: 2,
    objectFit: "contain",
  },
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: zero errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/pdf/shared-styles.ts
git commit -m "feat(pdf): add signatureImage style for embedding signatures in PDF boxes"
```

### Task 2.2: Rendre la signature chauffeur + contrôleur sur le PDF OR

**Files:**
- Modify: `src/lib/pdf/or-pdf.tsx:245-253`

- [ ] **Step 1: Update the signatures block**

In `src/lib/pdf/or-pdf.tsx`, replace the `Signatures` block (lines 245-253) with:

```tsx
        {/* Signatures */}
        <View style={styles.signatureArea}>
          <View style={styles.signatureBox}>
            {or.signatureChauffeur && (
              <Image src={or.signatureChauffeur} style={styles.signatureImage} />
            )}
            <Text>Signature Chauffeur</Text>
          </View>
          <View style={styles.signatureBox}>
            {or.signatureControleur && (
              <Image src={or.signatureControleur} style={styles.signatureImage} />
            )}
            <Text>Signature Contrôleur</Text>
          </View>
        </View>
```

`Image` is already imported at the top (line 2). No new import needed.

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: zero errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/pdf/or-pdf.tsx
git commit -m "feat(pdf-or): render saved signatures inside PDF signature boxes"
```

### Task 2.3: Rendre les signatures contrôleur + admin sur le PDF Picklist

**Files:**
- Modify: `src/lib/pdf/picklist-pdf.tsx:78-86`

- [ ] **Step 1: Update the signatures block**

In `src/lib/pdf/picklist-pdf.tsx`, replace the `Signatures` block (lines 78-86) with:

```tsx
        {/* Signatures */}
        <View style={styles.signatureArea}>
          <View style={styles.signatureBox}>
            {picklist.signatureControleur && (
              <Image src={picklist.signatureControleur} style={styles.signatureImage} />
            )}
            <Text>Signature Contrôleur</Text>
          </View>
          <View style={styles.signatureBox}>
            {picklist.signatureAdmin && (
              <Image src={picklist.signatureAdmin} style={styles.signatureImage} />
            )}
            <Text>Signature Admin</Text>
          </View>
        </View>
```

`Image` is already imported at the top. No new import needed.

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: zero errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/pdf/picklist-pdf.tsx
git commit -m "feat(pdf-picklist): render saved signatures inside PDF signature boxes"
```

### Task 2.4: Vérification manuelle UI — Chantier 2

- [ ] **Step 1: Start dev server**

Run: `npm run dev`

- [ ] **Step 2: OR signature flow**

1. Login as receptionniste, open an OR detail page that has **no signature yet**
2. Use the `OrdreActions` flow to capture the chauffeur signature (signature pad)
3. Click the « PDF OR » button (top-right of OR detail)
4. **Expected:** the generated PDF shows the chauffeur signature image above the « Signature Chauffeur » label

- [ ] **Step 3: Picklist signature flow**

1. Create a picklist (controleur), then have admin approve it (signs `signatureAdmin`), then controleur signs it (`signatureControleur`)
2. From the OR detail page, click the « PDF » button on that picklist
3. **Expected:** the PDF shows BOTH signatures rendered inside their boxes

- [ ] **Step 4: Stop dev server**

---

## Chantier 4 — Catalogue de tâches & calcul auto facture

### Task 4.1: Installer la dépendance `xlsx`

**Files:**
- Modify: `package.json`, `package-lock.json`

- [ ] **Step 1: Install xlsx as a dev dependency**

Run: `npm install --save-dev xlsx`
Expected: package added to `devDependencies` in `package.json`.

- [ ] **Step 2: Verify install**

Run: `node -e "console.log(require('xlsx').version)"`
Expected: prints a version string (e.g., `0.18.5` or similar).

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore(deps): add xlsx for tache catalogue seed script"
```

### Task 4.2: Ajouter le modèle `TacheCatalogue` au schéma Prisma

**Files:**
- Modify: `prisma/schema.prisma` (after the `Piece` model, before `Picklist`)

- [ ] **Step 1: Add the model**

In `prisma/schema.prisma`, insert this block right after the closing `}` of the `Piece` model (after line 210):

```prisma
model TacheCatalogue {
  id          String   @id @default(cuid())
  description String
  categorie   String   @default("")  // empty string when not provided in source XLSX
  heuresStd   Decimal? // null = "AD" (à devis), saisie manuelle requise
  createdAt   DateTime @default(now())

  picklistItems PicklistItem[]

  @@unique([description, categorie])
  @@index([categorie])
}
```

**Why `categorie` is non-null:** the source Excel has 20 lines without a categorie. Storing `""` instead of `null` keeps the `@@unique([description, categorie])` constraint reliable under Postgres null-distinct semantics, and makes the upsert in the seed straightforward.

- [ ] **Step 2: Add Picklist pricing fields**

In the `Picklist` model (around line 212), add three fields **before** the `montantTotal` line:

```prisma
  tauxHoraire        Int  @default(0)
  montantPieces      Int  @default(0)
  montantMainOeuvre  Int  @default(0)
```

So the relevant block becomes:

```prisma
model Picklist {
  id                    String                @id @default(cuid())
  numeroPicklist        String                @unique
  ordreReparationId     String
  ordreReparation       OrdreReparation       @relation(fields: [ordreReparationId], references: [id])
  mecanicienNom         String
  statut                StatutPicklist        @default(EN_ATTENTE)
  signatureControleur   String?
  signatureAdmin        String?
  paiementStatut        StatutPaiementPicklist @default(NON_PAYE)
  tauxHoraire           Int                   @default(0)
  montantPieces         Int                   @default(0)
  montantMainOeuvre     Int                   @default(0)
  montantTotal          Int                   @default(0)
  createdAt             DateTime              @default(now())

  items       PicklistItem[]
  paiements   Paiement[]
  mouvements  MouvementStock[]
}
```

- [ ] **Step 3: Add `tacheId` and `heuresMainOeuvre` to PicklistItem**

In the `PicklistItem` model (around line 230), replace the model with:

```prisma
model PicklistItem {
  id                String          @id @default(cuid())
  picklistId        String
  picklist          Picklist        @relation(fields: [picklistId], references: [id])
  pieceId           String
  piece             Piece           @relation(fields: [pieceId], references: [id])
  quantite          Int
  prixUnitaire      Int
  tacheId           String?
  tache             TacheCatalogue? @relation(fields: [tacheId], references: [id])
  heuresMainOeuvre  Decimal         @default(0)
}
```

- [ ] **Step 4: Generate the migration**

Run: `npx prisma migrate dev --name add_tache_catalogue_and_picklist_pricing`
Expected: Prisma creates a new migration directory and applies it. Existing data preserved (all new columns are nullable or have defaults).

- [ ] **Step 5: Regenerate the Prisma client**

Run: `npx prisma generate`
Expected: « Generated Prisma Client »

- [ ] **Step 6: Typecheck**

Run: `npx tsc --noEmit`
Expected: zero errors. The new types are now available; existing code that didn't reference these fields still compiles.

- [ ] **Step 7: Commit**

```bash
git add prisma/schema.prisma prisma/migrations
git commit -m "feat(db): add TacheCatalogue + picklist labour pricing fields"
```

### Task 4.3: Rédiger le seed du catalogue depuis le fichier Excel

**Files:**
- Create: `prisma/seed-tache-catalogue.ts`

- [ ] **Step 1: Write the seed script**

The script normalizes missing `categorie` to the empty string `""` (the schema field stays `String?` for forward flexibility but the seed always writes a non-null value, which keeps the `@@unique([description, categorie])` constraint reliable under Postgres null-distinct semantics).

Create `prisma/seed-tache-catalogue.ts` with this content:

```ts
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import * as XLSX from "xlsx";
import path from "path";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const FILE = path.join(
  process.cwd(),
  "Image",
  "DESCRIPTION DES TACHES AVEC LES HEURES ALADJ.xlsx"
);

interface RawRow {
  DESCRIPTION?: string | null;
  CATEGORIE?: string | null;
  HEURE?: string | number | null;
}

async function main() {
  console.log("Reading", FILE);
  const wb = XLSX.readFile(FILE);
  const sheetName = wb.SheetNames[0];
  const rows = XLSX.utils.sheet_to_json<RawRow>(wb.Sheets[sheetName], {
    defval: null,
  });

  console.log(`Parsed ${rows.length} raw rows`);

  let processed = 0;
  let skipped = 0;

  for (const row of rows) {
    const description = (row.DESCRIPTION ?? "").toString().trim();
    if (!description) {
      skipped++;
      continue;
    }
    // Normalize missing categorie to empty string for stable uniqueness
    const categorie = row.CATEGORIE ? row.CATEGORIE.toString().trim() : "";

    let heuresStd: number | null = null;
    if (row.HEURE !== null && row.HEURE !== undefined && row.HEURE !== "") {
      const raw = row.HEURE.toString().trim();
      if (raw.toUpperCase() === "AD") {
        heuresStd = null;
      } else {
        const parsed = parseFloat(raw);
        heuresStd = Number.isFinite(parsed) ? parsed : null;
      }
    }

    await prisma.tacheCatalogue.upsert({
      where: {
        description_categorie: { description, categorie },
      },
      create: { description, categorie, heuresStd },
      update: { heuresStd },
    });
    processed++;
  }

  const total = await prisma.tacheCatalogue.count();
  console.log(`Done. Processed: ${processed}, Skipped: ${skipped}, DB total: ${total}`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

- [ ] **Step 2: Add npm script for the seed**

In `package.json`, add to the `scripts` block:

```json
"seed:taches": "tsx prisma/seed-tache-catalogue.ts"
```

- [ ] **Step 3: Run the seed**

Run: `npm run seed:taches`
Expected: prints `Parsed 2592 raw rows` then `Done. Processed: ~2570, Skipped: ~22`. (Exact counts depend on empty rows.)

- [ ] **Step 4: Verify in DB**

Run:
```bash
npx prisma studio
```
Expected: a `TacheCatalogue` table with ~2570 rows. Close studio after verification.

Alternatively run a quick count via psql or a one-off node script:
```bash
node -e "const{PrismaClient}=require('@prisma/client');const{PrismaPg}=require('@prisma/adapter-pg');require('dotenv/config');const p=new PrismaClient({adapter:new PrismaPg({connectionString:process.env.DATABASE_URL})});p.tacheCatalogue.count().then(c=>{console.log('count:',c);return p.\$disconnect()})"
```

- [ ] **Step 5: Re-run the seed to verify idempotence**

Run: `npm run seed:taches` a second time.
Expected: the row count in DB is unchanged (upsert finds existing rows).

- [ ] **Step 6: Commit**

```bash
git add prisma/seed-tache-catalogue.ts package.json package-lock.json
git commit -m "feat(seed): import 2590 tâches from Excel catalogue into TacheCatalogue"
```

### Task 4.4: Server action `searchTaches`

**Files:**
- Create: `src/lib/actions/taches.ts`

- [ ] **Step 1: Create the file**

Create `src/lib/actions/taches.ts`:

```ts
"use server";

import { db } from "@/lib/db";

export async function searchTaches(query: string, categorie?: string) {
  const trimmed = query.trim();
  const where: Record<string, unknown> = {};
  if (trimmed.length >= 2) {
    where.description = { contains: trimmed, mode: "insensitive" };
  }
  if (categorie) {
    where.categorie = categorie;
  }

  const taches = await db.tacheCatalogue.findMany({
    where,
    orderBy: { description: "asc" },
    take: 50,
  });

  return taches.map((t) => ({
    id: t.id,
    description: t.description,
    categorie: t.categorie, // string (empty string if not provided)
    heuresStd: t.heuresStd === null ? null : Number(t.heuresStd),
  }));
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: zero errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/actions/taches.ts
git commit -m "feat(taches): add searchTaches server action for autocomplete"
```

### Task 4.5: Composant `TaskPicker` (combobox recherchable)

**Files:**
- Create: `src/components/picklists/task-picker.tsx`

- [ ] **Step 1: Create the component**

Create `src/components/picklists/task-picker.tsx`:

```tsx
"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { searchTaches } from "@/lib/actions/taches";
import { Search, Check } from "lucide-react";

export interface TacheOption {
  id: string;
  description: string;
  categorie: string; // empty string when source had none
  heuresStd: number | null;
}

interface Props {
  value: TacheOption | null;
  onChange: (tache: TacheOption | null) => void;
}

export function TaskPicker({ value, onChange }: Props) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<TacheOption[]>([]);
  const [loading, setLoading] = React.useState(false);

  // Debounced search
  React.useEffect(() => {
    if (!open) return;
    const handle = setTimeout(async () => {
      if (query.trim().length < 2) {
        setResults([]);
        return;
      }
      setLoading(true);
      try {
        const r = await searchTaches(query);
        setResults(r);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [query, open]);

  if (value) {
    return (
      <div className="flex items-center gap-2 rounded-md border px-2 py-1 text-xs">
        <Check className="h-3 w-3 text-green-600" />
        <span className="flex-1 truncate">{value.description}</span>
        <span className="text-muted-foreground">
          {value.heuresStd === null ? "AD" : `${value.heuresStd}h`}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            onChange(null);
            setQuery("");
          }}
        >
          Changer
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="flex gap-2">
        <Input
          placeholder="Chercher une tâche (min. 2 caractères)…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
        />
        <Search className="h-4 w-4 self-center text-muted-foreground" />
      </div>
      {open && query.trim().length >= 2 && (
        <div className="max-h-48 overflow-y-auto rounded-md border bg-popover">
          {loading ? (
            <p className="p-2 text-xs text-muted-foreground">Recherche…</p>
          ) : results.length === 0 ? (
            <p className="p-2 text-xs text-muted-foreground">Aucun résultat</p>
          ) : (
            results.map((t) => (
              <button
                key={t.id}
                type="button"
                className="block w-full text-left px-2 py-1 text-xs hover:bg-accent"
                onClick={() => {
                  onChange(t);
                  setOpen(false);
                  setQuery("");
                }}
              >
                <span className="font-medium">{t.description}</span>
                <span className="ml-2 text-muted-foreground">
                  [{t.categorie || "—"}]{" "}
                  {t.heuresStd === null ? "AD" : `${t.heuresStd}h`}
                </span>
                {/* "—" shown when categorie is empty string */}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: zero errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/picklists/task-picker.tsx
git commit -m "feat(picklist): add TaskPicker combobox with debounced server search"
```

### Task 4.6: Étendre `createPicklist` pour accepter taux + tâches

**Files:**
- Modify: `src/lib/actions/picklists.ts:10-54`

- [ ] **Step 1: Update `createPicklist`**

Replace lines 10-54 of `src/lib/actions/picklists.ts` with:

```ts
export async function createPicklist(data: {
  ordreReparationId: string;
  mecanicienNom: string;
  tauxHoraire: number;
  items: {
    pieceId: string;
    quantite: number;
    prixUnitaire: number;
    tacheId: string;
    heuresMainOeuvre: number;
  }[];
}) {
  const session = await auth();
  if (!session?.user) return { error: "Non autorisé" };
  const role = (session.user as any).role as string;
  if (role !== "CONTROLEUR" && role !== "ADMIN") {
    return { error: "Seul le contrôleur peut créer un picklist" };
  }

  if (data.tauxHoraire <= 0) {
    return { error: "Le taux horaire doit être supérieur à 0" };
  }
  if (data.items.length === 0) {
    return { error: "Le picklist doit contenir au moins une pièce" };
  }
  for (const item of data.items) {
    if (!item.tacheId) {
      return { error: "Chaque ligne doit avoir une tâche assignée" };
    }
    if (item.heuresMainOeuvre <= 0) {
      return { error: "Heures de main d'œuvre invalides pour une ligne" };
    }
  }

  const numeroPicklist = await generateNumeroPicklist();
  const montantPieces = data.items.reduce(
    (sum, item) => sum + item.quantite * item.prixUnitaire,
    0
  );
  const totalHeures = data.items.reduce(
    (sum, item) => sum + item.heuresMainOeuvre,
    0
  );
  const montantMainOeuvre = Math.round(totalHeures * data.tauxHoraire);
  const montantTotal = montantPieces + montantMainOeuvre;

  const picklist = await db.picklist.create({
    data: {
      numeroPicklist,
      ordreReparationId: data.ordreReparationId,
      mecanicienNom: data.mecanicienNom,
      tauxHoraire: data.tauxHoraire,
      montantPieces,
      montantMainOeuvre,
      montantTotal,
      items: {
        create: data.items.map((item) => ({
          pieceId: item.pieceId,
          quantite: item.quantite,
          prixUnitaire: item.prixUnitaire,
          tacheId: item.tacheId,
          heuresMainOeuvre: item.heuresMainOeuvre,
        })),
      },
    },
    include: { items: { include: { piece: true, tache: true } } },
  });

  revalidatePath("/picklists");
  revalidatePath(`/ordres/${data.ordreReparationId}`);

  await createNotificationForAllStaff(
    "Nouveau picklist créé",
    `Picklist ${numeroPicklist} — ${data.items.length} pièce(s), ${montantTotal.toLocaleString("fr-FR")} FCFA`,
    `/picklists`,
    session.user.id!
  );

  return { data: picklist };
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: errors will appear in `picklist-form.tsx` because the form still calls the old signature. We'll fix that next.

- [ ] **Step 3: Do NOT commit yet**

Wait until Task 4.7 fixes the form.

### Task 4.7: Mettre à jour `picklist-form.tsx` (taux + TaskPicker par ligne)

**Files:**
- Modify: `src/components/picklists/picklist-form.tsx` (full rewrite of the form state and JSX, keeping the existing structure)

- [ ] **Step 1: Replace the file**

Open `src/components/picklists/picklist-form.tsx` and rewrite it as follows. The structure stays close to the current one — the additions are: `tauxHoraire` state, a `tache` field on each `PieceItem`, the `TaskPicker` per row, and the totals breakdown.

```tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Search } from "lucide-react";
import { getPieceByBarcode } from "@/lib/actions/pieces";
import { createPicklist } from "@/lib/actions/picklists";
import { TaskPicker, type TacheOption } from "./task-picker";

interface OrdreOption {
  id: string;
  numeroOR: string;
  vehicleInfo: string;
}

interface PieceItem {
  pieceId: string;
  codeBarre: string;
  designation: string;
  prixUnitaire: number;
  quantite: number;
  stockDisponible: number;
  tache: TacheOption | null;
  heuresMainOeuvre: number;
}

export function PicklistForm({ ordres }: { ordres: OrdreOption[] }) {
  const router = useRouter();
  const [ordreId, setOrdreId] = React.useState("");
  const [mecanicien, setMecanicien] = React.useState("");
  const [tauxHoraire, setTauxHoraire] = React.useState<number>(0);
  const [barcode, setBarcode] = React.useState("");
  const [items, setItems] = React.useState<PieceItem[]>([]);
  const [searching, setSearching] = React.useState(false);
  const [error, setError] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const barcodeRef = React.useRef<HTMLInputElement>(null);

  async function handleSearchBarcode() {
    if (!barcode.trim()) return;
    setSearching(true);
    setError("");

    try {
      const piece = await getPieceByBarcode(barcode.trim());
      if (!piece) {
        setError(`Aucune piece trouvee avec le code: ${barcode}`);
        return;
      }

      const existing = items.find((i) => i.pieceId === piece.id);
      if (existing) {
        setItems(items.map((i) =>
          i.pieceId === piece.id ? { ...i, quantite: i.quantite + 1 } : i
        ));
      } else {
        setItems([...items, {
          pieceId: piece.id,
          codeBarre: piece.codeBarre,
          designation: piece.designation,
          prixUnitaire: piece.prixUnitaire,
          quantite: 1,
          stockDisponible: piece.quantiteEnStock,
          tache: null,
          heuresMainOeuvre: 0,
        }]);
      }
      setBarcode("");
      barcodeRef.current?.focus();
    } finally {
      setSearching(false);
    }
  }

  function handleBarcodeKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearchBarcode();
    }
  }

  function updateQuantite(pieceId: string, qty: number) {
    if (qty < 1) return;
    setItems(items.map((i) => i.pieceId === pieceId ? { ...i, quantite: qty } : i));
  }

  function updateTache(pieceId: string, tache: TacheOption | null) {
    setItems(items.map((i) => {
      if (i.pieceId !== pieceId) return i;
      // when a task is selected with known heuresStd, auto-fill; if AD, leave 0 for manual entry
      const heures = tache?.heuresStd ?? 0;
      return { ...i, tache, heuresMainOeuvre: heures };
    }));
  }

  function updateHeures(pieceId: string, heures: number) {
    if (heures < 0) return;
    setItems(items.map((i) => i.pieceId === pieceId ? { ...i, heuresMainOeuvre: heures } : i));
  }

  function removeItem(pieceId: string) {
    setItems(items.filter((i) => i.pieceId !== pieceId));
  }

  const totalPieces = items.reduce((sum, i) => sum + i.prixUnitaire * i.quantite, 0);
  const totalHeures = items.reduce((sum, i) => sum + i.heuresMainOeuvre, 0);
  const totalMainOeuvre = Math.round(totalHeures * tauxHoraire);
  const totalGeneral = totalPieces + totalMainOeuvre;

  const allTasksAssigned = items.length > 0 && items.every((i) => i.tache && i.heuresMainOeuvre > 0);
  const canSubmit = !!ordreId && !!mecanicien.trim() && tauxHoraire > 0 && items.length > 0 && allTasksAssigned;

  async function handleSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    setError("");

    try {
      const result = await createPicklist({
        ordreReparationId: ordreId,
        mecanicienNom: mecanicien.trim(),
        tauxHoraire,
        items: items.map((i) => ({
          pieceId: i.pieceId,
          quantite: i.quantite,
          prixUnitaire: i.prixUnitaire,
          tacheId: i.tache!.id,
          heuresMainOeuvre: i.heuresMainOeuvre,
        })),
      });

      if ("error" in result && result.error) {
        setError(typeof result.error === "string" ? result.error : "Erreur de creation");
        return;
      }

      router.push("/picklists");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* OR + Mechanic + Taux */}
      <Card>
        <CardHeader>
          <CardTitle>Informations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <Label>Ordre de Reparation</Label>
            <Select value={ordreId} onValueChange={(v) => setOrdreId(v ?? "")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choisir un OR" />
              </SelectTrigger>
              <SelectContent>
                {ordres.map((o) => (
                  <SelectItem key={o.id} value={o.id}>
                    {o.numeroOR} — {o.vehicleInfo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Mecanicien</Label>
            <Input
              placeholder="Nom du mecanicien"
              value={mecanicien}
              onChange={(e) => setMecanicien(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Taux horaire (FCFA / h)</Label>
            <Input
              type="number"
              min={0}
              placeholder="Ex: 5000"
              value={tauxHoraire || ""}
              onChange={(e) => setTauxHoraire(Number(e.target.value) || 0)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Barcode entry */}
      <Card>
        <CardHeader>
          <CardTitle>Ajouter des pieces</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              ref={barcodeRef}
              placeholder="Scanner ou saisir le code-barre"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              onKeyDown={handleBarcodeKeyDown}
              autoFocus
            />
            <Button onClick={handleSearchBarcode} disabled={searching || !barcode.trim()}>
              <Search className="mr-2 h-4 w-4" />
              {searching ? "..." : "Chercher"}
            </Button>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Scannez le code-barre ou tapez-le et appuyez sur Entree
          </p>
        </CardContent>
      </Card>

      {/* Items list */}
      {items.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pieces selectionnees ({items.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {items.map((item) => (
              <div key={item.pieceId} className="rounded-lg border p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium">{item.designation}</p>
                    <p className="text-xs text-muted-foreground">
                      Code: {item.codeBarre} — {item.prixUnitaire.toLocaleString("fr-FR")} FCFA/unite — Stock: {item.stockDisponible}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={1}
                      max={item.stockDisponible}
                      value={item.quantite}
                      onChange={(e) => updateQuantite(item.pieceId, Number(e.target.value))}
                      className="w-20 text-center"
                    />
                    <Badge variant="outline">
                      {(item.prixUnitaire * item.quantite).toLocaleString("fr-FR")} FCFA
                    </Badge>
                    <Button variant="ghost" size="sm" onClick={() => removeItem(item.pieceId)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 items-end">
                  <div>
                    <Label className="text-xs">Tâche associée</Label>
                    <TaskPicker
                      value={item.tache}
                      onChange={(t) => updateTache(item.pieceId, t)}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">
                      Heures {item.tache && item.tache.heuresStd === null ? "(AD — saisir)" : ""}
                    </Label>
                    <Input
                      type="number"
                      step="0.25"
                      min={0}
                      value={item.heuresMainOeuvre || ""}
                      onChange={(e) => updateHeures(item.pieceId, Number(e.target.value) || 0)}
                      disabled={!item.tache || (item.tache.heuresStd !== null)}
                    />
                  </div>
                </div>
              </div>
            ))}
            {/* Totals */}
            <div className="border-t pt-3 space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Pièces</span>
                <span>{totalPieces.toLocaleString("fr-FR")} FCFA</span>
              </div>
              <div className="flex justify-between">
                <span>
                  Main d'œuvre ({totalHeures}h × {tauxHoraire.toLocaleString("fr-FR")} FCFA/h)
                </span>
                <span>{totalMainOeuvre.toLocaleString("fr-FR")} FCFA</span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-1 border-t">
                <span>Total</span>
                <span>{totalGeneral.toLocaleString("fr-FR")} FCFA</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Submit */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => router.back()}>Annuler</Button>
        <Button
          onClick={handleSubmit}
          disabled={!canSubmit || submitting}
        >
          <Plus className="mr-2 h-4 w-4" />
          {submitting ? "Creation..." : "Creer le picklist"}
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: zero errors. The form now matches the new `createPicklist` signature.

- [ ] **Step 3: Commit (form + server action)**

```bash
git add src/lib/actions/picklists.ts src/components/picklists/picklist-form.tsx
git commit -m "feat(picklist): require task + hours per line + per-picklist hourly rate"
```

### Task 4.8: Mettre à jour `createFacture` pour utiliser les nouveaux montants picklist

**Files:**
- Modify: `src/lib/actions/factures.ts:7-47`

- [ ] **Step 1: Update the calculation**

Replace lines 7-47 of `src/lib/actions/factures.ts` with:

```ts
export async function createFacture(ordreReparationId: string) {
  const ordre = await db.ordreReparation.findUnique({
    where: { id: ordreReparationId },
    include: {
      vehicle: { include: { client: true } },
      picklists: true,
      paiements: true,
    },
  });

  if (!ordre) return { error: "OR non trouvé" };

  const montantPieces = ordre.picklists.reduce(
    (sum, pk) => sum + pk.montantPieces,
    0
  );
  const montantMainOeuvre = ordre.picklists.reduce(
    (sum, pk) => sum + pk.montantMainOeuvre,
    0
  );
  const montantTotal = montantPieces + montantMainOeuvre;
  const montantPaye = ordre.paiements.reduce((sum, p) => sum + p.montant, 0);
  const montantRestant = montantTotal - montantPaye;

  const numeroFacture = await generateNumeroFacture();

  const facture = await db.facture.create({
    data: {
      numeroFacture,
      ordreReparationId,
      clientId: ordre.vehicle.client.id,
      montantPieces,
      montantMainOeuvre,
      montantTotal,
      montantPaye,
      montantRestant,
      statut: montantRestant <= 0 ? "PAYEE" : "EN_ATTENTE",
    },
  });

  revalidatePath(`/ordres/${ordreReparationId}`);
  revalidatePath("/factures");
  return { data: facture };
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: zero errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/actions/factures.ts
git commit -m "feat(facture): compute total from picklist montantPieces + montantMainOeuvre"
```

### Task 4.9: Adapter le PDF picklist pour afficher tâche + heures par ligne

**Files:**
- Modify: `src/app/api/pdf/[type]/[id]/route.ts:48-71`
- Modify: `src/lib/pdf/picklist-pdf.tsx`

- [ ] **Step 1: Include `tache` in the picklist query of the PDF route**

In `src/app/api/pdf/[type]/[id]/route.ts`, replace the picklist `findUnique` block (lines 48-71) with:

```ts
      case "picklist": {
        const picklist = await db.picklist.findUnique({
          where: { id },
          include: {
            ordreReparation: true,
            items: { include: { piece: true, tache: true } },
          },
        });
        if (!picklist) {
          return NextResponse.json(
            { error: "Picklist introuvable" },
            { status: 404 }
          );
        }
        if (!picklist.signatureAdmin) {
          return NextResponse.json(
            { error: "Le picklist doit être approuvé et signé par l'admin avant impression" },
            { status: 403 }
          );
        }
        document = React.createElement(PicklistPdf, { data: picklist });
        filename = `Picklist-${picklist.numeroPicklist}.pdf`;
        break;
      }
```

- [ ] **Step 2: Update the `PicklistPdf` component**

Open `src/lib/pdf/picklist-pdf.tsx`. Replace the « Parts Table » + « Total » blocks (lines 41-76) with the following table that has 6 columns (#, Désignation, Tâche, Heures, Qté, Prix, Total) and a totals breakdown:

```tsx
        {/* Parts + Tasks Table */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pièces & Tâches</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={{ width: "5%" }}>#</Text>
              <Text style={{ width: "25%" }}>Désignation</Text>
              <Text style={{ width: "30%" }}>Tâche</Text>
              <Text style={{ width: "10%" }}>Heures</Text>
              <Text style={{ width: "10%" }}>Qté</Text>
              <Text style={{ width: "20%" }}>Total ligne</Text>
            </View>
            {picklist.items?.map((item: any, index: number) => (
              <View key={item.id} style={styles.tableRow}>
                <Text style={{ width: "5%" }}>{index + 1}</Text>
                <Text style={{ width: "25%" }}>{item.piece?.designation || "-"}</Text>
                <Text style={{ width: "30%" }}>{item.tache?.description || "-"}</Text>
                <Text style={{ width: "10%" }}>{Number(item.heuresMainOeuvre)}h</Text>
                <Text style={{ width: "10%" }}>{item.quantite}</Text>
                <Text style={{ width: "20%" }}>
                  {formatMontant(item.quantite * item.prixUnitaire)}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Totals breakdown */}
        <View style={{ marginTop: 8, paddingTop: 8, borderTop: "1 solid #166534" }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 2 }}>
            <Text>Sous-total Pièces :</Text>
            <Text>{formatMontant(picklist.montantPieces)}</Text>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 2 }}>
            <Text>
              Main d&apos;œuvre ({picklist.tauxHoraire.toLocaleString("fr-FR")} FCFA/h) :
            </Text>
            <Text>{formatMontant(picklist.montantMainOeuvre)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total :</Text>
            <Text style={styles.totalValue}>
              {formatMontant(picklist.montantTotal)}
            </Text>
          </View>
        </View>
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: zero errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/pdf/[type]/[id]/route.ts src/lib/pdf/picklist-pdf.tsx
git commit -m "feat(pdf-picklist): show task, hours, and labour breakdown per line"
```

### Task 4.10: Vérification manuelle UI — Chantier 4

- [ ] **Step 1: Start dev server**

Run: `npm run dev`

- [ ] **Step 2: End-to-end picklist creation**

1. Login as `controleur@cpsmaroua.cm` / `admin123`
2. Navigate to `/picklists/nouveau`
3. Pick an OR from the dropdown
4. Enter mécanicien name + taux horaire **5000**
5. Scan or type a barcode of an existing piece
6. In the new « Tâche associée » row, type `filtre` → list of matching tasks appears → pick one (e.g., « RENOUVELER LE FILTRE A HUILE »)
7. **Expected:** « Heures » input auto-fills with the catalogue value (e.g., 1) and is read-only
8. Verify the totals box at the bottom shows: Pièces / Main d'œuvre / Total computed correctly
9. Click « Creer le picklist »
10. **Expected:** redirect to `/picklists`, the new picklist appears with the correct total

- [ ] **Step 3: Test AD (à devis) flow**

1. Same form, pick a tâche with `heuresStd = null` (search « TOLERIE MASTICAGE » in the picker)
2. **Expected:** the « Heures » input becomes editable (label suffixed « AD — saisir »)
3. Try to submit with heures left at 0 → submit button stays disabled

- [ ] **Step 4: Test facture computation**

1. From the OR detail page of the picklist's parent OR, generate a facture
2. **Expected:** facture `montantPieces` + `montantMainOeuvre` correctly aggregate the picklist's two subtotals

- [ ] **Step 5: Test catalogue immutability snapshot**

1. Open Prisma Studio (`npx prisma studio`)
2. Find the `TacheCatalogue` row for the task you used
3. Edit `heuresStd` to a different value (e.g., from 1 to 2)
4. Reload the picklist detail / regenerate its PDF
5. **Expected:** the picklist's `heuresMainOeuvre` snapshot is **unchanged** (still the original value)

- [ ] **Step 6: Stop dev server**

---

## Chantier 3 — Format dynamique 1 page (OR + Picklist)

This chantier comes last because the picklist columns introduced in C4 affect the seuils.

### Task 3.1: Factory `getStyles(preset)` dans `shared-styles.ts`

**Files:**
- Modify: `src/lib/pdf/shared-styles.ts`

- [ ] **Step 1: Add the factory next to the existing `styles` export**

At the bottom of `src/lib/pdf/shared-styles.ts` (after the `formatDate` function), add:

```ts
export type DensityPreset = "comfortable" | "compact" | "dense";

export function getStyles(preset: DensityPreset = "comfortable") {
  const fontSize = preset === "comfortable" ? 10 : preset === "compact" ? 8.5 : 7;
  const padding = preset === "comfortable" ? 40 : preset === "compact" ? 25 : 18;
  const sectionMargin = preset === "comfortable" ? 12 : preset === "compact" ? 8 : 5;
  const sectionTitleSize = preset === "comfortable" ? 12 : preset === "compact" ? 10 : 9;
  const tableCellPadding = preset === "comfortable" ? 6 : preset === "compact" ? 4 : 3;

  return StyleSheet.create({
    page: { padding, paddingTop: 15, paddingBottom: 90, fontSize, fontFamily: "Helvetica" },
    headerImage: { width: "100%", maxHeight: 80, objectFit: "contain", marginBottom: 10 },
    header: { marginBottom: sectionMargin, textAlign: "center" },
    title: { fontSize: 18, fontWeight: "bold", color: "#166534" },
    subtitle: { fontSize: 12, color: "#666", marginTop: 4 },
    companyName: { fontSize: 14, fontWeight: "bold", marginBottom: 2 },
    section: { marginBottom: sectionMargin },
    sectionTitle: {
      fontSize: sectionTitleSize,
      fontWeight: "bold",
      borderBottom: "1 solid #166534",
      paddingBottom: 4,
      marginBottom: sectionMargin / 2,
      color: "#166534",
    },
    row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
    label: { color: "#666", width: "40%" },
    value: { fontWeight: "bold", width: "60%" },
    table: { width: "100%", marginTop: 8 },
    tableHeader: {
      flexDirection: "row",
      backgroundColor: "#166534",
      color: "white",
      padding: tableCellPadding,
      fontWeight: "bold",
    },
    tableRow: {
      flexDirection: "row",
      borderBottom: "0.5 solid #ddd",
      padding: tableCellPadding,
    },
    col1: { width: "10%" },
    col2: { width: "30%" },
    col3: { width: "20%" },
    col4: { width: "20%" },
    col5: { width: "20%" },
    totalRow: {
      flexDirection: "row",
      justifyContent: "flex-end",
      marginTop: 8,
      paddingTop: 8,
      borderTop: "1 solid #166534",
    },
    totalLabel: { fontSize: 12, fontWeight: "bold", marginRight: 20 },
    totalValue: { fontSize: 14, fontWeight: "bold", color: "#166534" },
    signatureArea: {
      marginTop: "auto",
      paddingTop: 20,
      flexDirection: "row",
      justifyContent: "space-between",
    },
    signatureBox: {
      width: "45%",
      borderTop: "1 solid #000",
      paddingTop: 4,
      textAlign: "center",
    },
    signatureImage: {
      height: preset === "dense" ? 30 : 40,
      marginBottom: 2,
      objectFit: "contain",
    },
    footerContainer: {
      position: "absolute",
      bottom: 10,
      left: padding,
      right: padding,
      alignItems: "center",
    },
    footerImage: { width: "100%", maxHeight: 60, objectFit: "contain", marginBottom: 4 },
    footer: {
      textAlign: "center",
      fontSize: 8,
      color: "#999",
    },
  });
}
```

**Important:** also export `DensityPreset` from this file (already done above with `export type`).

The existing `styles` export stays as-is for `cloture-pdf.tsx` and `facture-pdf.tsx` rétro-compatibility (out of scope).

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: zero errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/pdf/shared-styles.ts
git commit -m "feat(pdf): add getStyles density preset factory (comfortable/compact/dense)"
```

### Task 3.2: Appliquer la densité adaptive sur le PDF OR

**Files:**
- Modify: `src/lib/pdf/or-pdf.tsx`

- [ ] **Step 1: Import the factory and compute preset**

In `src/lib/pdf/or-pdf.tsx`, replace the import line 3:

```tsx
import { getStyles, formatMontant, formatDate, CPS1_PATH, CPS2_PATH } from "./shared-styles";
```

Then, inside the `OrPdf` function body, **before the `return`**, add:

```tsx
  const lineCount = (or.pannes?.length ?? 0)
                  + interventions.length
                  + allParts.length;
  const preset =
    lineCount <= 12 ? "comfortable" :
    lineCount <= 25 ? "compact" :
    "dense";
  const styles = getStyles(preset);
```

This shadows the imported `styles` (which we removed from imports). All `styles.xxx` references in the JSX continue to work unchanged.

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: zero errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/pdf/or-pdf.tsx
git commit -m "feat(pdf-or): adaptive density preset based on row count"
```

### Task 3.3: Appliquer la densité adaptive sur le PDF Picklist

**Files:**
- Modify: `src/lib/pdf/picklist-pdf.tsx`

- [ ] **Step 1: Import the factory and compute preset**

In `src/lib/pdf/picklist-pdf.tsx`, replace the import line 3:

```tsx
import { getStyles, formatMontant, formatDate, CPS1_PATH, CPS2_PATH } from "./shared-styles";
```

Then inside `PicklistPdf`, before `return`, add:

```tsx
  const lineCount = picklist.items?.length ?? 0;
  const preset =
    lineCount <= 8 ? "comfortable" :
    lineCount <= 18 ? "compact" :
    "dense";
  const styles = getStyles(preset);
```

(Seuils plus serrés que pour l'OR car les colonnes du picklist sont plus chargées : 6 colonnes au lieu de 5.)

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: zero errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/pdf/picklist-pdf.tsx
git commit -m "feat(pdf-picklist): adaptive density preset based on item count"
```

### Task 3.4: Vérification manuelle UI — Chantier 3

- [ ] **Step 1: Start dev server**

Run: `npm run dev`

- [ ] **Step 2: Generate small/medium/large OR PDFs**

1. Find or create 3 OR :
   - **Petit** : 1 panne, 1 intervention, 2 pièces (≈ 4 lignes → `comfortable`)
   - **Moyen** : 4 pannes, 4 interventions, 8 pièces (≈ 16 lignes → `compact`)
   - **Grand** : 8 pannes, 8 interventions, 15 pièces (≈ 31 lignes → `dense`)
2. Generate the OR PDF for each
3. **Expected for each:** the PDF fits on a single A4 page; signatures appear at the bottom (not above the content)

- [ ] **Step 3: Generate small/medium/large picklist PDFs**

1. Picklist with 5 items → `comfortable`
2. Picklist with 12 items → `compact`
3. Picklist with 22 items → `dense`
4. Generate each PDF
5. **Expected:** each fits on one A4 page

- [ ] **Step 4: Stop dev server**

---

## Final Verification

- [ ] **Step 1: Run build**

Run: `npm run build`
Expected: build succeeds with no TypeScript errors.

- [ ] **Step 2: Smoke test the full flow once more**

1. Reception creates an OR (status `EN_ATTENTE`)
2. Contrôleur navigates to `/picklists/nouveau` → OR appears in dropdown ✅ (C1)
3. Contrôleur creates a picklist with 3 pieces + 3 tâches + taux 5000 ✅ (C4)
4. Admin approves the picklist (signature) ✅
5. Contrôleur signs the picklist ✅
6. Contrôleur generates the PDF picklist → tasks shown, signatures shown, fits on 1 page ✅ (C2 + C4 + C3)
7. Reception generates a facture for the OR → totals are pieces + main d'œuvre from the picklist ✅ (C4)
8. Reception signs the OR (chauffeur signature) → OR PDF generated → signature visible, fits on 1 page ✅ (C2 + C3)

- [ ] **Step 3: Final commit if any housekeeping changes pending**

Run: `git status`. If clean, no commit needed.

- [ ] **Step 4: Push (only when user confirms)**

Wait for explicit user confirmation before running `git push`.

---

## Out of Scope (next sessions)

- Mot de passe oublié + auto-changement (login + paramètres user)
- Chat privé (DM employé→employé) + canal public
- Purge automatique du chat à 24h (cron)
- Refactor `cloture-pdf.tsx` and `facture-pdf.tsx` to use the same density preset (only OR + Picklist were requested)
