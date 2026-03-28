# CPS MAROUA Garage App — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete garage management web app for CPS MAROUA that handles vehicle intake, repair tracking, parts inventory, invoicing, and payments — all in French.

**Architecture:** Next.js 15 App Router monolith with PostgreSQL (Neon) via Prisma ORM. Server Actions for mutations, API routes for PDF generation. Role-based access with NextAuth.js v5. Green garage theme with shadcn/ui.

**Tech Stack:** Next.js 15, React 19, TypeScript, Prisma, PostgreSQL, NextAuth.js v5, shadcn/ui, Tailwind CSS, @react-pdf/renderer, React Hook Form, Zod, Zustand, TanStack Query, react-barcode, react-signature-canvas

---

## Phase 1: Project Foundation

### Task 1: Initialize Next.js Project

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.ts`
- Create: `tailwind.config.ts`
- Create: `.env.local`
- Create: `.gitignore`
- Create: `src/app/layout.tsx`
- Create: `src/app/page.tsx`

- [ ] **Step 1: Create Next.js project**

Run:
```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
```
Expected: Project scaffolded with src/app directory structure.

- [ ] **Step 2: Verify project runs**

Run:
```bash
npm run dev
```
Expected: Dev server starts on http://localhost:3000, shows Next.js welcome page.

- [ ] **Step 3: Create .env.local**

```env
DATABASE_URL="postgresql://user:password@localhost:5432/cps_maroua"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-change-in-production"
```

- [ ] **Step 4: Update .gitignore**

Add to `.gitignore`:
```
.env.local
.env.production
.superpowers/
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: initialize Next.js 15 project with TypeScript and Tailwind"
```

---

### Task 2: Install Dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install core dependencies**

Run:
```bash
npm install prisma @prisma/client next-auth@5 @auth/prisma-adapter
npm install react-hook-form @hookform/resolvers zod
npm install @tanstack/react-query zustand
npm install @react-pdf/renderer react-barcode react-signature-canvas
npm install bcryptjs
npm install lucide-react class-variance-authority clsx tailwind-merge
```

- [ ] **Step 2: Install dev dependencies**

Run:
```bash
npm install -D @types/bcryptjs @types/react-signature-canvas prisma
```

- [ ] **Step 3: Initialize shadcn/ui**

Run:
```bash
npx shadcn@latest init
```
Select: New York style, Zinc base color, CSS variables: yes.

- [ ] **Step 4: Add shadcn components we need**

Run:
```bash
npx shadcn@latest add button card input label select table badge dialog sheet dropdown-menu form separator tabs toast avatar command popover calendar
```

- [ ] **Step 5: Verify build**

Run:
```bash
npm run build
```
Expected: Build succeeds with no errors.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: install all project dependencies and shadcn/ui"
```

---

### Task 3: Prisma Schema & Database

**Files:**
- Create: `prisma/schema.prisma`
- Create: `src/lib/db.ts`

- [ ] **Step 1: Initialize Prisma**

Run:
```bash
npx prisma init
```

- [ ] **Step 2: Write the complete Prisma schema**

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  ADMIN
  RECEPTIONNISTE
  MAGASINIER
  CONTROLEUR
  CLIENT
}

enum TypeVehicule {
  VOITURE
  CAMION
  BUS
}

enum Section {
  TOLERIE
  SOUDURE
  ELECTRICITE
  POIDS_LOURDS
  POIDS_LEGERS
}

enum StatutOR {
  EN_ATTENTE
  EN_COURS
  CLOTURE
}

enum StatutPanne {
  SIGNALE
  EN_COURS
  RESOLU
}

enum StatutIntervention {
  EN_COURS
  TERMINE
}

enum StatutPicklist {
  EN_ATTENTE
  SIGNE
  DELIVRE
}

enum StatutPaiementPicklist {
  NON_PAYE
  PAYE
}

enum StatutFacture {
  EN_ATTENTE
  PAYEE
}

enum TypePaiement {
  ACOMPTE
  PICKLIST
  SOLDE_FINAL
}

enum MethodePaiement {
  ESPECES
  MOBILE_MONEY
  VIREMENT
}

enum TypeMouvement {
  ENTREE
  SORTIE
}

model User {
  id            String    @id @default(cuid())
  nom           String
  prenom        String
  email         String    @unique
  password      String
  telephone     String?
  role          Role      @default(CLIENT)
  isActive      Boolean   @default(true)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  client             Client?
  ordresCreated      OrdreReparation[]
  mouvementsStock    MouvementStock[]
}

model Client {
  id          String    @id @default(cuid())
  nom         String
  prenom      String
  telephone   String    @unique
  email       String?
  adresse     String?
  userId      String?   @unique
  user        User?     @relation(fields: [userId], references: [id])
  createdAt   DateTime  @default(now())

  vehicles    Vehicle[]
  factures    Facture[]
}

model Vehicle {
  id              String        @id @default(cuid())
  matricule       String        @unique
  marque          String
  modele          String
  typeVehicule    TypeVehicule
  numeroChassis   String?
  clientId        String
  client          Client        @relation(fields: [clientId], references: [id])
  createdAt       DateTime      @default(now())

  ordresReparation OrdreReparation[]
}

model OrdreReparation {
  id                    String      @id @default(cuid())
  numeroOR              String      @unique
  vehicleId             String
  vehicle               Vehicle     @relation(fields: [vehicleId], references: [id])
  chauffeurNom          String
  chauffeurTel          String
  serviceDorigine       String?
  kilometrage           Int
  niveauCarburant       String
  niveauUsurePneus      String
  lotDeBord             String?
  prochaineVidange      String?
  dateEntree            DateTime    @default(now())
  dateSortie            DateTime?
  statut                StatutOR    @default(EN_ATTENTE)
  signatureChauffeur    String?
  signatureControleur   String?
  createdById           String
  createdBy             User        @relation(fields: [createdById], references: [id])
  createdAt             DateTime    @default(now())
  updatedAt             DateTime    @updatedAt

  pannes          Panne[]
  interventions   Intervention[]
  picklists       Picklist[]
  ficheCloture    FicheCloture?
  facture         Facture?
  paiements       Paiement[]
}

model Panne {
  id                  String       @id @default(cuid())
  ordreReparationId   String
  ordreReparation     OrdreReparation @relation(fields: [ordreReparationId], references: [id])
  description         String
  section             Section?
  statut              StatutPanne  @default(SIGNALE)
  mecanicienNom       String?
  createdAt           DateTime     @default(now())
  updatedAt           DateTime     @updatedAt
}

model Intervention {
  id                  String             @id @default(cuid())
  ordreReparationId   String
  ordreReparation     OrdreReparation    @relation(fields: [ordreReparationId], references: [id])
  mecanicienNom       String
  section             Section
  description         String
  heuresTravail       Decimal            @default(0)
  tauxHoraire         Int                @default(0)
  statut              StatutIntervention @default(EN_COURS)
  dateDebut           DateTime           @default(now())
  dateFin             DateTime?
}

model Piece {
  id              String    @id @default(cuid())
  codeBarre       String    @unique
  designation     String
  categorie       String?
  prixUnitaire    Int
  quantiteEnStock Int       @default(0)
  seuilAlerte     Int       @default(5)
  emplacement     String?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  picklistItems     PicklistItem[]
  mouvementsStock   MouvementStock[]
}

model Picklist {
  id                    String                @id @default(cuid())
  numeroPicklist        String                @unique
  ordreReparationId     String
  ordreReparation       OrdreReparation       @relation(fields: [ordreReparationId], references: [id])
  mecanicienNom         String
  statut                StatutPicklist        @default(EN_ATTENTE)
  signatureControleur   String?
  paiementStatut        StatutPaiementPicklist @default(NON_PAYE)
  montantTotal          Int                   @default(0)
  createdAt             DateTime              @default(now())

  items       PicklistItem[]
  paiements   Paiement[]
  mouvements  MouvementStock[]
}

model PicklistItem {
  id            String    @id @default(cuid())
  picklistId    String
  picklist      Picklist  @relation(fields: [picklistId], references: [id])
  pieceId       String
  piece         Piece     @relation(fields: [pieceId], references: [id])
  quantite      Int
  prixUnitaire  Int
}

model MouvementStock {
  id              String        @id @default(cuid())
  pieceId         String
  piece           Piece         @relation(fields: [pieceId], references: [id])
  type            TypeMouvement
  quantite        Int
  picklistId      String?
  picklist        Picklist?     @relation(fields: [picklistId], references: [id])
  motif           String?
  effectueParId   String
  effectuePar     User          @relation(fields: [effectueParId], references: [id])
  date            DateTime      @default(now())
}

model FicheCloture {
  id                    String          @id @default(cuid())
  numeroCloture         String          @unique
  ordreReparationId     String          @unique
  ordreReparation       OrdreReparation @relation(fields: [ordreReparationId], references: [id])
  signatureControleur   String?
  dateGeneration        DateTime        @default(now())
}

model Facture {
  id                  String          @id @default(cuid())
  numeroFacture       String          @unique
  ordreReparationId   String          @unique
  ordreReparation     OrdreReparation @relation(fields: [ordreReparationId], references: [id])
  clientId            String
  client              Client          @relation(fields: [clientId], references: [id])
  montantPieces       Int             @default(0)
  montantMainOeuvre   Int             @default(0)
  montantTotal        Int             @default(0)
  montantPaye         Int             @default(0)
  montantRestant      Int             @default(0)
  statut              StatutFacture   @default(EN_ATTENTE)
  dateEmission        DateTime        @default(now())

  paiements   Paiement[]
}

model Paiement {
  id                  String          @id @default(cuid())
  montant             Int
  type                TypePaiement
  methode             MethodePaiement
  ordreReparationId   String
  ordreReparation     OrdreReparation @relation(fields: [ordreReparationId], references: [id])
  picklistId          String?
  picklist            Picklist?       @relation(fields: [picklistId], references: [id])
  factureId           String?
  facture             Facture?        @relation(fields: [factureId], references: [id])
  referencePaiement   String?
  date                DateTime        @default(now())
}
```

- [ ] **Step 3: Create Prisma client singleton**

```typescript
// src/lib/db.ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
```

- [ ] **Step 4: Generate Prisma client**

Run:
```bash
npx prisma generate
```
Expected: Prisma Client generated successfully.

- [ ] **Step 5: Push schema to database**

Run:
```bash
npx prisma db push
```
Expected: Database schema synced. (Requires DATABASE_URL to point to a running PostgreSQL instance.)

- [ ] **Step 6: Commit**

```bash
git add prisma/schema.prisma src/lib/db.ts
git commit -m "feat: add complete Prisma schema with all models and enums"
```

---

### Task 4: Authentication Setup (NextAuth.js v5)

**Files:**
- Create: `src/lib/auth.ts`
- Create: `src/app/api/auth/[...nextauth]/route.ts`
- Create: `src/lib/auth-utils.ts`
- Create: `src/middleware.ts`

- [ ] **Step 1: Create NextAuth configuration**

```typescript
// src/lib/auth.ts
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await db.user.findUnique({
          where: { email: credentials.email as string },
          include: { client: true },
        });

        if (!user || !user.isActive) return null;

        const passwordMatch = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!passwordMatch) return null;

        return {
          id: user.id,
          email: user.email,
          name: `${user.prenom} ${user.nom}`,
          role: user.role,
          clientId: user.client?.id ?? null,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.clientId = (user as any).clientId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        (session.user as any).role = token.role;
        (session.user as any).clientId = token.clientId;
      }
      return session;
    },
  },
  pages: {
    signIn: "/connexion",
  },
  session: {
    strategy: "jwt",
  },
});
```

- [ ] **Step 2: Create auth route handler**

```typescript
// src/app/api/auth/[...nextauth]/route.ts
import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;
```

- [ ] **Step 3: Create auth utility functions**

```typescript
// src/lib/auth-utils.ts
import { auth } from "@/lib/auth";
import { Role } from "@prisma/client";
import { redirect } from "next/navigation";

export async function getSession() {
  return await auth();
}

export async function requireAuth() {
  const session = await auth();
  if (!session?.user) redirect("/connexion");
  return session;
}

export async function requireRole(allowedRoles: Role[]) {
  const session = await requireAuth();
  const role = (session.user as any).role as Role;
  if (!allowedRoles.includes(role)) redirect("/non-autorise");
  return session;
}
```

- [ ] **Step 4: Create middleware for route protection**

```typescript
// src/middleware.ts
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Public routes
  const publicRoutes = ["/connexion", "/api/auth"];
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Require auth for all other routes
  if (!req.auth) {
    return NextResponse.redirect(new URL("/connexion", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/auth.ts src/lib/auth-utils.ts src/app/api/auth/ src/middleware.ts
git commit -m "feat: configure NextAuth.js v5 with credentials provider and role-based auth"
```

---

### Task 5: Green Theme & Layout Shell

**Files:**
- Create: `src/app/globals.css` (modify existing)
- Create: `src/components/layout/sidebar.tsx`
- Create: `src/components/layout/header.tsx`
- Create: `src/components/layout/app-shell.tsx`
- Create: `src/lib/utils.ts` (modify existing)
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Configure green theme in globals.css**

Replace the contents of `src/app/globals.css` with:

```css
@import "tailwindcss";
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
  --color-sidebar-ring: var(--sidebar-ring);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar: var(--sidebar);
  --color-chart-5: var(--chart-5);
  --color-chart-4: var(--chart-4);
  --color-chart-3: var(--chart-3);
  --color-chart-2: var(--chart-2);
  --color-chart-1: var(--chart-1);
  --color-ring: var(--ring);
  --color-input: var(--input);
  --color-border: var(--border);
  --color-destructive: var(--destructive);
  --color-accent-foreground: var(--accent-foreground);
  --color-accent: var(--accent);
  --color-muted-foreground: var(--muted-foreground);
  --color-muted: var(--muted);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-secondary: var(--secondary);
  --color-primary-foreground: var(--primary-foreground);
  --color-primary: var(--primary);
  --color-popover-foreground: var(--popover-foreground);
  --color-popover: var(--popover);
  --color-card-foreground: var(--card-foreground);
  --color-card: var(--card);
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
}

:root {
  --radius: 0.625rem;
  --background: oklch(0.98 0.01 150);
  --foreground: oklch(0.2 0.04 150);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.2 0.04 150);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.2 0.04 150);
  --primary: oklch(0.42 0.12 150);
  --primary-foreground: oklch(0.98 0.01 150);
  --secondary: oklch(0.94 0.03 150);
  --secondary-foreground: oklch(0.3 0.06 150);
  --muted: oklch(0.94 0.03 150);
  --muted-foreground: oklch(0.5 0.03 150);
  --accent: oklch(0.94 0.03 150);
  --accent-foreground: oklch(0.3 0.06 150);
  --destructive: oklch(0.55 0.2 25);
  --border: oklch(0.88 0.03 150);
  --input: oklch(0.88 0.03 150);
  --ring: oklch(0.42 0.12 150);
  --chart-1: oklch(0.42 0.12 150);
  --chart-2: oklch(0.55 0.15 150);
  --chart-3: oklch(0.65 0.1 150);
  --chart-4: oklch(0.75 0.08 150);
  --chart-5: oklch(0.85 0.05 150);
  --sidebar: oklch(0.22 0.06 150);
  --sidebar-foreground: oklch(0.9 0.02 150);
  --sidebar-primary: oklch(0.55 0.15 150);
  --sidebar-primary-foreground: oklch(0.98 0.01 150);
  --sidebar-accent: oklch(0.3 0.07 150);
  --sidebar-accent-foreground: oklch(0.9 0.02 150);
  --sidebar-border: oklch(0.3 0.05 150);
  --sidebar-ring: oklch(0.42 0.12 150);
}

.dark {
  --background: oklch(0.15 0.03 150);
  --foreground: oklch(0.9 0.02 150);
  --card: oklch(0.2 0.04 150);
  --card-foreground: oklch(0.9 0.02 150);
  --popover: oklch(0.2 0.04 150);
  --popover-foreground: oklch(0.9 0.02 150);
  --primary: oklch(0.55 0.15 150);
  --primary-foreground: oklch(0.1 0.02 150);
  --secondary: oklch(0.25 0.05 150);
  --secondary-foreground: oklch(0.9 0.02 150);
  --muted: oklch(0.25 0.05 150);
  --muted-foreground: oklch(0.6 0.03 150);
  --accent: oklch(0.25 0.05 150);
  --accent-foreground: oklch(0.9 0.02 150);
  --destructive: oklch(0.55 0.2 25);
  --border: oklch(0.3 0.05 150);
  --input: oklch(0.3 0.05 150);
  --ring: oklch(0.55 0.15 150);
  --chart-1: oklch(0.55 0.15 150);
  --chart-2: oklch(0.45 0.12 150);
  --chart-3: oklch(0.65 0.1 150);
  --chart-4: oklch(0.35 0.08 150);
  --chart-5: oklch(0.75 0.05 150);
  --sidebar: oklch(0.15 0.04 150);
  --sidebar-foreground: oklch(0.9 0.02 150);
  --sidebar-primary: oklch(0.55 0.15 150);
  --sidebar-primary-foreground: oklch(0.98 0.01 150);
  --sidebar-accent: oklch(0.22 0.05 150);
  --sidebar-accent-foreground: oklch(0.9 0.02 150);
  --sidebar-border: oklch(0.25 0.04 150);
  --sidebar-ring: oklch(0.55 0.15 150);
}
```

- [ ] **Step 2: Create sidebar component**

```tsx
// src/components/layout/sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardList,
  Car,
  Package,
  FileText,
  CreditCard,
  Users,
  Settings,
  Gauge,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = {
  label: string;
  href: string;
  icon: React.ElementType;
};

const navByRole: Record<string, NavItem[]> = {
  ADMIN: [
    { label: "Tableau de bord", href: "/dashboard", icon: LayoutDashboard },
    { label: "Ordres de réparation", href: "/ordres", icon: ClipboardList },
    { label: "Véhicules", href: "/vehicules", icon: Car },
    { label: "Magasin", href: "/magasin", icon: Package },
    { label: "Factures", href: "/factures", icon: FileText },
    { label: "Paiements", href: "/paiements", icon: CreditCard },
    { label: "Rapports", href: "/rapports", icon: BarChart3 },
    { label: "Utilisateurs", href: "/utilisateurs", icon: Users },
    { label: "Paramètres", href: "/parametres", icon: Settings },
  ],
  CONTROLEUR: [
    { label: "Panneau de commandes", href: "/dashboard", icon: Gauge },
    { label: "Ordres de réparation", href: "/ordres", icon: ClipboardList },
    { label: "Assignations", href: "/assignations", icon: Users },
    { label: "Picklists", href: "/picklists", icon: FileText },
  ],
  RECEPTIONNISTE: [
    { label: "Tableau de bord", href: "/dashboard", icon: LayoutDashboard },
    { label: "Nouvelle réception", href: "/reception/nouveau", icon: Car },
    { label: "Ordres de réparation", href: "/ordres", icon: ClipboardList },
    { label: "Picklists", href: "/picklists", icon: FileText },
    { label: "Paiements", href: "/paiements", icon: CreditCard },
    { label: "Factures", href: "/factures", icon: FileText },
  ],
  MAGASINIER: [
    { label: "Inventaire", href: "/magasin", icon: Package },
    { label: "Picklists à livrer", href: "/picklists", icon: FileText },
    { label: "Mouvements de stock", href: "/magasin/mouvements", icon: BarChart3 },
  ],
  CLIENT: [
    { label: "Mes réparations", href: "/mes-reparations", icon: Car },
    { label: "Mes factures", href: "/mes-factures", icon: FileText },
  ],
};

export function Sidebar({ role }: { role: string }) {
  const pathname = usePathname();
  const items = navByRole[role] ?? [];

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
      <div className="flex h-16 items-center gap-3 px-6 border-b border-sidebar-border">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground font-bold text-sm">
          CPS
        </div>
        <div>
          <p className="font-semibold text-sm">CPS Maroua</p>
          <p className="text-xs text-sidebar-foreground/60">Gestion Garage</p>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {items.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
```

- [ ] **Step 3: Create header component**

```tsx
// src/components/layout/header.tsx
"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { LogOut, Menu, Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/theme-provider";

export function Header({
  userName,
  role,
  onToggleSidebar,
}: {
  userName: string;
  role: string;
  onToggleSidebar: () => void;
}) {
  const { theme, setTheme } = useTheme();

  const roleLabels: Record<string, string> = {
    ADMIN: "Administrateur",
    CONTROLEUR: "Contrôleur",
    RECEPTIONNISTE: "Réceptionniste",
    MAGASINIER: "Magasinier",
    CLIENT: "Client",
  };

  return (
    <header className="flex h-16 items-center justify-between border-b px-4 md:px-6 bg-card">
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={onToggleSidebar}
      >
        <Menu className="h-5 w-5" />
      </Button>
      <div className="hidden md:block" />
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
        <div className="text-right">
          <p className="text-sm font-medium">{userName}</p>
          <p className="text-xs text-muted-foreground">{roleLabels[role] ?? role}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={() => signOut()}>
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
```

- [ ] **Step 4: Create theme provider**

```tsx
// src/components/theme-provider.tsx
"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

const ThemeContext = createContext<{
  theme: Theme;
  setTheme: (theme: Theme) => void;
}>({
  theme: "light",
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const stored = localStorage.getItem("theme") as Theme | null;
    if (stored) setTheme(stored);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
```

- [ ] **Step 5: Create app shell**

```tsx
// src/components/layout/app-shell.tsx
"use client";

import { useState } from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { cn } from "@/lib/utils";

export function AppShell({
  children,
  userName,
  role,
}: {
  children: React.ReactNode;
  userName: string;
  role: string;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 transform transition-transform md:relative md:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <Sidebar role={role} />
      </div>
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header
          userName={userName}
          role={role}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Update root layout**

```tsx
// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CPS Maroua — Gestion de Garage",
  description: "Application de gestion de garage automobile CPS Maroua",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 7: Commit**

```bash
git add src/app/globals.css src/app/layout.tsx src/components/
git commit -m "feat: add green theme, sidebar navigation, header, and app shell layout"
```

---

### Task 6: Login Page & Seed Admin User

**Files:**
- Create: `src/app/connexion/page.tsx`
- Create: `prisma/seed.ts`
- Modify: `package.json` (add seed script)

- [ ] **Step 1: Create login page**

```tsx
// src/app/connexion/page.tsx
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ConnexionPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Email ou mot de passe incorrect");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-xl">
            CPS
          </div>
          <CardTitle className="text-2xl">CPS Maroua</CardTitle>
          <p className="text-sm text-muted-foreground">
            Connectez-vous à votre compte
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="votre@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Connexion..." : "Se connecter"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 2: Create seed script**

```typescript
// prisma/seed.ts
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
```

- [ ] **Step 3: Add seed script to package.json**

Add to `package.json`:
```json
"prisma": {
  "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
}
```

Also add dev dependency:
```bash
npm install -D ts-node
```

- [ ] **Step 4: Run seed**

Run:
```bash
npx prisma db seed
```
Expected: "Seed completed: 4 users created (password: admin123)"

- [ ] **Step 5: Commit**

```bash
git add src/app/connexion/ prisma/seed.ts package.json
git commit -m "feat: add login page and seed script with default users"
```

---

### Task 7: Dashboard Layout with Role-Based Redirect

**Files:**
- Create: `src/app/(app)/layout.tsx`
- Create: `src/app/(app)/dashboard/page.tsx`
- Create: `src/app/non-autorise/page.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Create authenticated layout**

```tsx
// src/app/(app)/layout.tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/connexion");

  const role = (session.user as any).role as string;
  const userName = session.user.name ?? "Utilisateur";

  return (
    <AppShell userName={userName} role={role}>
      {children}
    </AppShell>
  );
}
```

- [ ] **Step 2: Create dashboard page (placeholder per role)**

```tsx
// src/app/(app)/dashboard/page.tsx
import { requireAuth } from "@/lib/auth-utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardList, Car, Package, CreditCard } from "lucide-react";

export default async function DashboardPage() {
  const session = await requireAuth();
  const role = (session.user as any).role as string;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">
        {role === "CONTROLEUR" ? "Panneau de Commandes" : "Tableau de Bord"}
      </h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Véhicules au garage</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">En attente de réparation</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">OR en cours</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Réparations actives</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pièces en stock</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Références disponibles</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Revenus du mois</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0 FCFA</div>
            <p className="text-xs text-muted-foreground">Mars 2026</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create unauthorized page**

```tsx
// src/app/non-autorise/page.tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NonAutorisePage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">403</h1>
        <p className="text-muted-foreground">
          Vous n&apos;êtes pas autorisé à accéder à cette page.
        </p>
        <Button asChild>
          <Link href="/dashboard">Retour au tableau de bord</Link>
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Update root page to redirect**

```tsx
// src/app/page.tsx
import { redirect } from "next/navigation";

export default function Home() {
  redirect("/dashboard");
}
```

- [ ] **Step 5: Verify the full flow**

Run `npm run dev`, go to http://localhost:3000. Should redirect to /connexion. Login with admin@cpsmaroua.cm / admin123. Should see the dashboard with green theme and sidebar.

- [ ] **Step 6: Commit**

```bash
git add src/app/
git commit -m "feat: add dashboard layout, role-based navigation, and auth redirect"
```

---

## Phase 2: Client & Vehicle Management

### Task 8: Client CRUD — Server Actions

**Files:**
- Create: `src/lib/actions/clients.ts`
- Create: `src/lib/validators/client.ts`

- [ ] **Step 1: Create client validation schema**

```typescript
// src/lib/validators/client.ts
import { z } from "zod";

export const clientSchema = z.object({
  nom: z.string().min(1, "Le nom est requis"),
  prenom: z.string().min(1, "Le prénom est requis"),
  telephone: z.string().min(9, "Numéro de téléphone invalide"),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  adresse: z.string().optional(),
});

export type ClientFormData = z.infer<typeof clientSchema>;
```

- [ ] **Step 2: Create client server actions**

```typescript
// src/lib/actions/clients.ts
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
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/actions/clients.ts src/lib/validators/client.ts
git commit -m "feat: add client validation schema and server actions"
```

---

### Task 9: Vehicle CRUD — Server Actions

**Files:**
- Create: `src/lib/actions/vehicles.ts`
- Create: `src/lib/validators/vehicle.ts`

- [ ] **Step 1: Create vehicle validation schema**

```typescript
// src/lib/validators/vehicle.ts
import { z } from "zod";
import { TypeVehicule } from "@prisma/client";

export const vehicleSchema = z.object({
  matricule: z.string().min(1, "Le matricule est requis"),
  marque: z.string().min(1, "La marque est requise"),
  modele: z.string().min(1, "Le modèle est requis"),
  typeVehicule: z.nativeEnum(TypeVehicule),
  numeroChassis: z.string().optional(),
  clientId: z.string().min(1, "Le client est requis"),
});

export type VehicleFormData = z.infer<typeof vehicleSchema>;
```

- [ ] **Step 2: Create vehicle server actions**

```typescript
// src/lib/actions/vehicles.ts
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
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/actions/vehicles.ts src/lib/validators/vehicle.ts
git commit -m "feat: add vehicle validation schema and server actions"
```

---

## Phase 3: Ordre de Réparation (OR) Workflow

### Task 10: OR Server Actions & Auto-Numbering

**Files:**
- Create: `src/lib/actions/ordres.ts`
- Create: `src/lib/validators/ordre.ts`
- Create: `src/lib/utils/numbering.ts`

- [ ] **Step 1: Create auto-numbering utility**

```typescript
// src/lib/utils/numbering.ts
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
```

- [ ] **Step 2: Create OR validation schema**

```typescript
// src/lib/validators/ordre.ts
import { z } from "zod";

export const ordreSchema = z.object({
  vehicleId: z.string().min(1, "Le véhicule est requis"),
  chauffeurNom: z.string().min(1, "Le nom du chauffeur est requis"),
  chauffeurTel: z.string().min(9, "Le numéro du chauffeur est requis"),
  serviceDorigine: z.string().optional(),
  kilometrage: z.coerce.number().min(0, "Le kilométrage doit être positif"),
  niveauCarburant: z.string().min(1, "Le niveau de carburant est requis"),
  niveauUsurePneus: z.string().min(1, "Le niveau d'usure est requis"),
  lotDeBord: z.string().optional(),
  prochaineVidange: z.string().optional(),
  pannes: z.array(z.object({
    description: z.string().min(1, "La description est requise"),
  })).min(1, "Au moins une panne doit être signalée"),
});

export type OrdreFormData = z.infer<typeof ordreSchema>;
```

- [ ] **Step 3: Create OR server actions**

```typescript
// src/lib/actions/ordres.ts
"use server";

import { db } from "@/lib/db";
import { ordreSchema } from "@/lib/validators/ordre";
import { generateNumeroOR } from "@/lib/utils/numbering";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { StatutOR, StatutPanne } from "@prisma/client";

export async function createOrdreReparation(data: unknown) {
  const session = await auth();
  if (!session?.user) return { error: "Non autorisé" };

  const parsed = ordreSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const numeroOR = await generateNumeroOR();

  const ordre = await db.ordreReparation.create({
    data: {
      numeroOR,
      vehicleId: parsed.data.vehicleId,
      chauffeurNom: parsed.data.chauffeurNom,
      chauffeurTel: parsed.data.chauffeurTel,
      serviceDorigine: parsed.data.serviceDorigine || null,
      kilometrage: parsed.data.kilometrage,
      niveauCarburant: parsed.data.niveauCarburant,
      niveauUsurePneus: parsed.data.niveauUsurePneus,
      lotDeBord: parsed.data.lotDeBord || null,
      prochaineVidange: parsed.data.prochaineVidange || null,
      createdById: session.user.id!,
      pannes: {
        create: parsed.data.pannes.map((p) => ({
          description: p.description,
          statut: StatutPanne.SIGNALE,
        })),
      },
    },
    include: { pannes: true, vehicle: { include: { client: true } } },
  });

  revalidatePath("/ordres");
  revalidatePath("/dashboard");
  return { data: ordre };
}

export async function getOrdres(statut?: StatutOR) {
  return db.ordreReparation.findMany({
    where: statut ? { statut } : undefined,
    include: {
      vehicle: { include: { client: true } },
      pannes: true,
      _count: { select: { picklists: true, interventions: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getOrdreById(id: string) {
  return db.ordreReparation.findUnique({
    where: { id },
    include: {
      vehicle: { include: { client: true } },
      pannes: true,
      interventions: true,
      picklists: { include: { items: { include: { piece: true } } } },
      paiements: true,
      facture: true,
      ficheCloture: true,
      createdBy: { select: { nom: true, prenom: true } },
    },
  });
}

export async function signORChauffeur(ordreId: string, signature: string) {
  const ordre = await db.ordreReparation.update({
    where: { id: ordreId },
    data: { signatureChauffeur: signature },
  });
  revalidatePath(`/ordres/${ordreId}`);
  return { data: ordre };
}

export async function updateOrdreStatut(ordreId: string, statut: StatutOR) {
  const ordre = await db.ordreReparation.update({
    where: { id: ordreId },
    data: {
      statut,
      ...(statut === StatutOR.CLOTURE ? { dateSortie: new Date() } : {}),
    },
  });
  revalidatePath(`/ordres/${ordreId}`);
  revalidatePath("/ordres");
  revalidatePath("/dashboard");
  return { data: ordre };
}
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/actions/ordres.ts src/lib/validators/ordre.ts src/lib/utils/numbering.ts
git commit -m "feat: add OR server actions with auto-numbering and validation"
```

---

### Task 11: Réception Multi-Step Form (New OR)

**Files:**
- Create: `src/app/(app)/reception/nouveau/page.tsx`
- Create: `src/components/reception/step-client.tsx`
- Create: `src/components/reception/step-vehicle.tsx`
- Create: `src/components/reception/step-intake.tsx`
- Create: `src/components/reception/step-pannes.tsx`
- Create: `src/components/reception/step-review.tsx`

- [ ] **Step 1: Create the multi-step form page**

```tsx
// src/app/(app)/reception/nouveau/page.tsx
import { requireRole } from "@/lib/auth-utils";
import { ReceptionForm } from "@/components/reception/reception-form";

export default async function NouvelleReceptionPage() {
  await requireRole(["ADMIN", "RECEPTIONNISTE"]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Nouvelle Réception</h1>
      <ReceptionForm />
    </div>
  );
}
```

- [ ] **Step 2: Create the reception form orchestrator**

```tsx
// src/components/reception/reception-form.tsx
"use client";

import { useState } from "react";
import { StepClient } from "./step-client";
import { StepVehicle } from "./step-vehicle";
import { StepIntake } from "./step-intake";
import { StepPannes } from "./step-pannes";
import { StepReview } from "./step-review";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const steps = [
  { label: "Client", num: 1 },
  { label: "Véhicule", num: 2 },
  { label: "État du véhicule", num: 3 },
  { label: "Pannes", num: 4 },
  { label: "Récapitulatif", num: 5 },
];

export type ReceptionData = {
  client: { id?: string; nom: string; prenom: string; telephone: string; email?: string; adresse?: string } | null;
  vehicle: { id?: string; matricule: string; marque: string; modele: string; typeVehicule: string; numeroChassis?: string } | null;
  intake: {
    chauffeurNom: string;
    chauffeurTel: string;
    serviceDorigine: string;
    kilometrage: number;
    niveauCarburant: string;
    niveauUsurePneus: string;
    lotDeBord: string;
    prochaineVidange: string;
  } | null;
  pannes: { description: string }[];
};

export function ReceptionForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<ReceptionData>({
    client: null,
    vehicle: null,
    intake: null,
    pannes: [],
  });

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {steps.map((step) => (
          <div key={step.num} className="flex items-center gap-2">
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium",
                currentStep === step.num
                  ? "bg-primary text-primary-foreground"
                  : currentStep > step.num
                  ? "bg-primary/20 text-primary"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {step.num}
            </div>
            <span className="hidden sm:inline text-sm">{step.label}</span>
            {step.num < steps.length && (
              <div className="h-px w-8 bg-border" />
            )}
          </div>
        ))}
      </div>

      <Card>
        <CardContent className="pt-6">
          {currentStep === 1 && (
            <StepClient
              data={data.client}
              onNext={(client) => {
                setData({ ...data, client });
                setCurrentStep(2);
              }}
            />
          )}
          {currentStep === 2 && (
            <StepVehicle
              clientId={data.client?.id}
              data={data.vehicle}
              onNext={(vehicle) => {
                setData({ ...data, vehicle });
                setCurrentStep(3);
              }}
              onBack={() => setCurrentStep(1)}
            />
          )}
          {currentStep === 3 && (
            <StepIntake
              data={data.intake}
              onNext={(intake) => {
                setData({ ...data, intake });
                setCurrentStep(4);
              }}
              onBack={() => setCurrentStep(2)}
            />
          )}
          {currentStep === 4 && (
            <StepPannes
              data={data.pannes}
              onNext={(pannes) => {
                setData({ ...data, pannes });
                setCurrentStep(5);
              }}
              onBack={() => setCurrentStep(3)}
            />
          )}
          {currentStep === 5 && (
            <StepReview
              data={data}
              onBack={() => setCurrentStep(4)}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 3: Create StepClient component**

```tsx
// src/components/reception/step-client.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getClients, createClient } from "@/lib/actions/clients";
import type { ReceptionData } from "./reception-form";

export function StepClient({
  data,
  onNext,
}: {
  data: ReceptionData["client"];
  onNext: (client: NonNullable<ReceptionData["client"]>) => void;
}) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [isNew, setIsNew] = useState(false);
  const [form, setForm] = useState({
    nom: data?.nom ?? "",
    prenom: data?.prenom ?? "",
    telephone: data?.telephone ?? "",
    email: data?.email ?? "",
    adresse: data?.adresse ?? "",
  });
  const [error, setError] = useState<string | null>(null);

  async function handleSearch() {
    if (!search.trim()) return;
    const clients = await getClients(search);
    setResults(clients);
  }

  function selectClient(client: any) {
    onNext({
      id: client.id,
      nom: client.nom,
      prenom: client.prenom,
      telephone: client.telephone,
      email: client.email ?? "",
      adresse: client.adresse ?? "",
    });
  }

  async function handleCreate() {
    setError(null);
    const result = await createClient(form);
    if ("error" in result && result.error) {
      const errors = result.error as Record<string, string[]>;
      setError(Object.values(errors).flat().join(", "));
      return;
    }
    if ("data" in result && result.data) {
      onNext({
        id: result.data.id,
        nom: result.data.nom,
        prenom: result.data.prenom,
        telephone: result.data.telephone,
        email: result.data.email ?? "",
        adresse: result.data.adresse ?? "",
      });
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Étape 1 : Client</h2>

      {!isNew ? (
        <>
          <div className="flex gap-2">
            <Input
              placeholder="Rechercher par nom ou téléphone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <Button onClick={handleSearch}>Rechercher</Button>
          </div>

          {results.length > 0 && (
            <div className="space-y-2">
              {results.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between rounded-lg border p-3 cursor-pointer hover:bg-accent"
                  onClick={() => selectClient(c)}
                >
                  <div>
                    <p className="font-medium">{c.prenom} {c.nom}</p>
                    <p className="text-sm text-muted-foreground">{c.telephone}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {c.vehicles?.length ?? 0} véhicule(s)
                  </span>
                </div>
              ))}
            </div>
          )}

          <Button variant="outline" onClick={() => setIsNew(true)}>
            + Nouveau client
          </Button>
        </>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Prénom *</Label>
              <Input value={form.prenom} onChange={(e) => setForm({ ...form, prenom: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Nom *</Label>
              <Input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Téléphone *</Label>
              <Input value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Adresse</Label>
              <Input value={form.adresse} onChange={(e) => setForm({ ...form, adresse: e.target.value })} />
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsNew(false)}>Annuler</Button>
            <Button onClick={handleCreate}>Créer et continuer</Button>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Create StepVehicle component**

```tsx
// src/components/reception/step-vehicle.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getVehiclesByClient, createVehicle } from "@/lib/actions/vehicles";
import type { ReceptionData } from "./reception-form";

export function StepVehicle({
  clientId,
  data,
  onNext,
  onBack,
}: {
  clientId?: string;
  data: ReceptionData["vehicle"];
  onNext: (vehicle: NonNullable<ReceptionData["vehicle"]>) => void;
  onBack: () => void;
}) {
  const [existing, setExisting] = useState<any[]>([]);
  const [isNew, setIsNew] = useState(false);
  const [form, setForm] = useState({
    matricule: data?.matricule ?? "",
    marque: data?.marque ?? "",
    modele: data?.modele ?? "",
    typeVehicule: data?.typeVehicule ?? "VOITURE",
    numeroChassis: data?.numeroChassis ?? "",
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (clientId) {
      getVehiclesByClient(clientId).then(setExisting);
    }
  }, [clientId]);

  function selectVehicle(v: any) {
    onNext({
      id: v.id,
      matricule: v.matricule,
      marque: v.marque,
      modele: v.modele,
      typeVehicule: v.typeVehicule,
      numeroChassis: v.numeroChassis ?? "",
    });
  }

  async function handleCreate() {
    if (!clientId) return;
    setError(null);
    const result = await createVehicle({ ...form, clientId });
    if ("error" in result && result.error) {
      const errors = result.error as Record<string, string[]>;
      setError(Object.values(errors).flat().join(", "));
      return;
    }
    if ("data" in result && result.data) {
      onNext({
        id: result.data.id,
        matricule: result.data.matricule,
        marque: result.data.marque,
        modele: result.data.modele,
        typeVehicule: result.data.typeVehicule,
        numeroChassis: result.data.numeroChassis ?? "",
      });
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Étape 2 : Véhicule</h2>

      {existing.length > 0 && !isNew && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Véhicules existants du client :</p>
          {existing.map((v) => (
            <div
              key={v.id}
              className="flex items-center justify-between rounded-lg border p-3 cursor-pointer hover:bg-accent"
              onClick={() => selectVehicle(v)}
            >
              <div>
                <p className="font-medium">{v.matricule}</p>
                <p className="text-sm text-muted-foreground">{v.marque} {v.modele}</p>
              </div>
              <span className="text-xs text-muted-foreground">{v.typeVehicule}</span>
            </div>
          ))}
        </div>
      )}

      {!isNew ? (
        <Button variant="outline" onClick={() => setIsNew(true)}>
          + Nouveau véhicule
        </Button>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Matricule *</Label>
              <Input value={form.matricule} onChange={(e) => setForm({ ...form, matricule: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Type *</Label>
              <Select value={form.typeVehicule} onValueChange={(v) => setForm({ ...form, typeVehicule: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="VOITURE">Voiture</SelectItem>
                  <SelectItem value="CAMION">Camion</SelectItem>
                  <SelectItem value="BUS">Bus</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Marque *</Label>
              <Input value={form.marque} onChange={(e) => setForm({ ...form, marque: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Modèle *</Label>
              <Input value={form.modele} onChange={(e) => setForm({ ...form, modele: e.target.value })} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Numéro de châssis</Label>
              <Input value={form.numeroChassis} onChange={(e) => setForm({ ...form, numeroChassis: e.target.value })} />
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsNew(false)}>Annuler</Button>
            <Button onClick={handleCreate}>Créer et continuer</Button>
          </div>
        </div>
      )}

      <div className="flex justify-between pt-4 border-t">
        <Button variant="outline" onClick={onBack}>Retour</Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Create StepIntake component**

```tsx
// src/components/reception/step-intake.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ReceptionData } from "./reception-form";

export function StepIntake({
  data,
  onNext,
  onBack,
}: {
  data: ReceptionData["intake"];
  onNext: (intake: NonNullable<ReceptionData["intake"]>) => void;
  onBack: () => void;
}) {
  const [form, setForm] = useState({
    chauffeurNom: data?.chauffeurNom ?? "",
    chauffeurTel: data?.chauffeurTel ?? "",
    serviceDorigine: data?.serviceDorigine ?? "",
    kilometrage: data?.kilometrage ?? 0,
    niveauCarburant: data?.niveauCarburant ?? "",
    niveauUsurePneus: data?.niveauUsurePneus ?? "",
    lotDeBord: data?.lotDeBord ?? "",
    prochaineVidange: data?.prochaineVidange ?? "",
  });

  function handleSubmit() {
    if (!form.chauffeurNom || !form.chauffeurTel || !form.niveauCarburant || !form.niveauUsurePneus) return;
    onNext(form);
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Étape 3 : État du véhicule</h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Nom du chauffeur *</Label>
          <Input value={form.chauffeurNom} onChange={(e) => setForm({ ...form, chauffeurNom: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Téléphone du chauffeur *</Label>
          <Input value={form.chauffeurTel} onChange={(e) => setForm({ ...form, chauffeurTel: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Service d&apos;origine</Label>
          <Input value={form.serviceDorigine} onChange={(e) => setForm({ ...form, serviceDorigine: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Kilométrage *</Label>
          <Input type="number" value={form.kilometrage} onChange={(e) => setForm({ ...form, kilometrage: parseInt(e.target.value) || 0 })} />
        </div>
        <div className="space-y-2">
          <Label>Niveau de carburant *</Label>
          <Select value={form.niveauCarburant} onValueChange={(v) => setForm({ ...form, niveauCarburant: v })}>
            <SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
            <SelectContent>
              <SelectItem value="VIDE">Vide</SelectItem>
              <SelectItem value="1/4">1/4</SelectItem>
              <SelectItem value="1/2">1/2</SelectItem>
              <SelectItem value="3/4">3/4</SelectItem>
              <SelectItem value="PLEIN">Plein</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Niveau d&apos;usure des pneus *</Label>
          <Select value={form.niveauUsurePneus} onValueChange={(v) => setForm({ ...form, niveauUsurePneus: v })}>
            <SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
            <SelectContent>
              <SelectItem value="BON">Bon état</SelectItem>
              <SelectItem value="MOYEN">Moyen</SelectItem>
              <SelectItem value="USE">Usé</SelectItem>
              <SelectItem value="CRITIQUE">Critique</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Lot de bord</Label>
          <Input value={form.lotDeBord} onChange={(e) => setForm({ ...form, lotDeBord: e.target.value })} placeholder="Ex: triangle, gilet, cric..." />
        </div>
        <div className="space-y-2">
          <Label>Prochaine vidange</Label>
          <Input value={form.prochaineVidange} onChange={(e) => setForm({ ...form, prochaineVidange: e.target.value })} placeholder="Ex: 85 000 km" />
        </div>
      </div>

      <div className="flex justify-between pt-4 border-t">
        <Button variant="outline" onClick={onBack}>Retour</Button>
        <Button onClick={handleSubmit}>Suivant</Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Create StepPannes component**

```tsx
// src/components/reception/step-pannes.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Plus } from "lucide-react";
import type { ReceptionData } from "./reception-form";

export function StepPannes({
  data,
  onNext,
  onBack,
}: {
  data: ReceptionData["pannes"];
  onNext: (pannes: ReceptionData["pannes"]) => void;
  onBack: () => void;
}) {
  const [pannes, setPannes] = useState<{ description: string }[]>(
    data.length > 0 ? data : [{ description: "" }]
  );

  function addPanne() {
    setPannes([...pannes, { description: "" }]);
  }

  function removePanne(index: number) {
    setPannes(pannes.filter((_, i) => i !== index));
  }

  function updatePanne(index: number, description: string) {
    setPannes(pannes.map((p, i) => (i === index ? { description } : p)));
  }

  function handleSubmit() {
    const valid = pannes.filter((p) => p.description.trim());
    if (valid.length === 0) return;
    onNext(valid);
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Étape 4 : Pannes signalées</h2>
      <p className="text-sm text-muted-foreground">
        Listez les problèmes signalés par le chauffeur
      </p>

      <div className="space-y-3">
        {pannes.map((panne, index) => (
          <div key={index} className="flex gap-2">
            <Input
              placeholder={`Panne ${index + 1}...`}
              value={panne.description}
              onChange={(e) => updatePanne(index, e.target.value)}
            />
            {pannes.length > 1 && (
              <Button variant="ghost" size="icon" onClick={() => removePanne(index)}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
      </div>

      <Button variant="outline" onClick={addPanne} className="gap-2">
        <Plus className="h-4 w-4" /> Ajouter une panne
      </Button>

      <div className="flex justify-between pt-4 border-t">
        <Button variant="outline" onClick={onBack}>Retour</Button>
        <Button onClick={handleSubmit}>Suivant</Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 7: Create StepReview component**

```tsx
// src/components/reception/step-review.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { createOrdreReparation } from "@/lib/actions/ordres";
import type { ReceptionData } from "./reception-form";

export function StepReview({
  data,
  onBack,
}: {
  data: ReceptionData;
  onBack: () => void;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!data.vehicle?.id || !data.intake) return;
    setLoading(true);
    setError(null);

    const result = await createOrdreReparation({
      vehicleId: data.vehicle.id,
      chauffeurNom: data.intake.chauffeurNom,
      chauffeurTel: data.intake.chauffeurTel,
      serviceDorigine: data.intake.serviceDorigine,
      kilometrage: data.intake.kilometrage,
      niveauCarburant: data.intake.niveauCarburant,
      niveauUsurePneus: data.intake.niveauUsurePneus,
      lotDeBord: data.intake.lotDeBord,
      prochaineVidange: data.intake.prochaineVidange,
      pannes: data.pannes,
    });

    setLoading(false);

    if ("error" in result && result.error) {
      setError(typeof result.error === "string" ? result.error : "Erreur lors de la création");
      return;
    }

    if ("data" in result && result.data) {
      router.push(`/ordres/${result.data.id}`);
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Étape 5 : Récapitulatif</h2>

      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-1">Client</h3>
          <p className="font-medium">{data.client?.prenom} {data.client?.nom}</p>
          <p className="text-sm">{data.client?.telephone}</p>
        </div>

        <Separator />

        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-1">Véhicule</h3>
          <p className="font-medium">{data.vehicle?.matricule}</p>
          <p className="text-sm">{data.vehicle?.marque} {data.vehicle?.modele} — {data.vehicle?.typeVehicule}</p>
        </div>

        <Separator />

        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-1">État du véhicule</h3>
          <div className="grid gap-2 sm:grid-cols-2 text-sm">
            <p><span className="text-muted-foreground">Chauffeur:</span> {data.intake?.chauffeurNom}</p>
            <p><span className="text-muted-foreground">Tél:</span> {data.intake?.chauffeurTel}</p>
            <p><span className="text-muted-foreground">Kilométrage:</span> {data.intake?.kilometrage?.toLocaleString()} km</p>
            <p><span className="text-muted-foreground">Carburant:</span> {data.intake?.niveauCarburant}</p>
            <p><span className="text-muted-foreground">Pneus:</span> {data.intake?.niveauUsurePneus}</p>
            <p><span className="text-muted-foreground">Lot de bord:</span> {data.intake?.lotDeBord || "—"}</p>
          </div>
        </div>

        <Separator />

        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-1">
            Pannes signalées ({data.pannes.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {data.pannes.map((p, i) => (
              <Badge key={i} variant="secondary">{p.description}</Badge>
            ))}
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex justify-between pt-4 border-t">
        <Button variant="outline" onClick={onBack}>Retour</Button>
        <Button onClick={handleSubmit} disabled={loading}>
          {loading ? "Création en cours..." : "Créer l'Ordre de Réparation"}
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 8: Commit**

```bash
git add src/app/\(app\)/reception/ src/components/reception/
git commit -m "feat: add multi-step reception form for creating new OR"
```

---

### Task 12: OR Detail Page with Signature

**Files:**
- Create: `src/app/(app)/ordres/[id]/page.tsx`
- Create: `src/components/ordres/signature-pad.tsx`

- [ ] **Step 1: Create signature pad component**

```tsx
// src/components/ordres/signature-pad.tsx
"use client";

import { useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function SignaturePad({
  onSign,
  label,
}: {
  onSign: (signature: string) => void;
  label: string;
}) {
  const sigRef = useRef<SignatureCanvas>(null);
  const [open, setOpen] = useState(false);

  function handleConfirm() {
    if (sigRef.current?.isEmpty()) return;
    const dataUrl = sigRef.current?.toDataURL("image/png") ?? "";
    onSign(dataUrl);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">{label}</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{label}</DialogTitle>
        </DialogHeader>
        <div className="border rounded-lg bg-white">
          <SignatureCanvas
            ref={sigRef}
            canvasProps={{ className: "w-full h-48" }}
            backgroundColor="white"
          />
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={() => sigRef.current?.clear()}>
            Effacer
          </Button>
          <Button onClick={handleConfirm}>Confirmer</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Create OR detail page**

```tsx
// src/app/(app)/ordres/[id]/page.tsx
import { requireAuth } from "@/lib/auth-utils";
import { getOrdreById } from "@/lib/actions/ordres";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { OrdreActions } from "@/components/ordres/ordre-actions";

const statutColors: Record<string, string> = {
  EN_ATTENTE: "bg-yellow-100 text-yellow-800",
  EN_COURS: "bg-blue-100 text-blue-800",
  CLOTURE: "bg-green-100 text-green-800",
};

export default async function OrdreDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAuth();
  const { id } = await params;
  const ordre = await getOrdreById(id);
  if (!ordre) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{ordre.numeroOR}</h1>
          <p className="text-muted-foreground">
            {ordre.vehicle.marque} {ordre.vehicle.modele} — {ordre.vehicle.matricule}
          </p>
        </div>
        <Badge className={statutColors[ordre.statut]}>{ordre.statut.replace("_", " ")}</Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Informations véhicule</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><span className="text-muted-foreground">Client:</span> {ordre.vehicle.client.prenom} {ordre.vehicle.client.nom}</p>
            <p><span className="text-muted-foreground">Matricule:</span> {ordre.vehicle.matricule}</p>
            <p><span className="text-muted-foreground">Type:</span> {ordre.vehicle.typeVehicule}</p>
            <p><span className="text-muted-foreground">Kilométrage:</span> {ordre.kilometrage.toLocaleString()} km</p>
            <p><span className="text-muted-foreground">Carburant:</span> {ordre.niveauCarburant}</p>
            <p><span className="text-muted-foreground">Pneus:</span> {ordre.niveauUsurePneus}</p>
            <p><span className="text-muted-foreground">Lot de bord:</span> {ordre.lotDeBord || "—"}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Chauffeur</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><span className="text-muted-foreground">Nom:</span> {ordre.chauffeurNom}</p>
            <p><span className="text-muted-foreground">Téléphone:</span> {ordre.chauffeurTel}</p>
            <p><span className="text-muted-foreground">Service:</span> {ordre.serviceDorigine || "—"}</p>
            <p><span className="text-muted-foreground">Date d&apos;entrée:</span> {new Date(ordre.dateEntree).toLocaleDateString("fr-FR")}</p>
            {ordre.signatureChauffeur ? (
              <div>
                <p className="text-muted-foreground mb-1">Signature:</p>
                <img src={ordre.signatureChauffeur} alt="Signature chauffeur" className="h-16 border rounded" />
              </div>
            ) : (
              <p className="text-yellow-600">En attente de signature</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Pannes signalées ({ordre.pannes.length})</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {ordre.pannes.map((panne) => (
              <div key={panne.id} className="flex items-center justify-between rounded-lg border p-3">
                <p className="text-sm">{panne.description}</p>
                <div className="flex items-center gap-2">
                  {panne.section && <Badge variant="outline">{panne.section.replace("_", " ")}</Badge>}
                  <Badge className={
                    panne.statut === "RESOLU" ? "bg-green-100 text-green-800" :
                    panne.statut === "EN_COURS" ? "bg-blue-100 text-blue-800" :
                    "bg-yellow-100 text-yellow-800"
                  }>{panne.statut}</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <OrdreActions ordre={ordre} />
    </div>
  );
}
```

- [ ] **Step 3: Create ordre actions component**

```tsx
// src/components/ordres/ordre-actions.tsx
"use client";

import { useRouter } from "next/navigation";
import { SignaturePad } from "./signature-pad";
import { signORChauffeur } from "@/lib/actions/ordres";

export function OrdreActions({ ordre }: { ordre: any }) {
  const router = useRouter();

  async function handleSignChauffeur(signature: string) {
    await signORChauffeur(ordre.id, signature);
    router.refresh();
  }

  return (
    <div className="flex gap-2">
      {!ordre.signatureChauffeur && (
        <SignaturePad
          label="Signature du chauffeur"
          onSign={handleSignChauffeur}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/\(app\)/ordres/ src/components/ordres/
git commit -m "feat: add OR detail page with driver signature pad"
```

---

### Task 13: OR List Page

**Files:**
- Create: `src/app/(app)/ordres/page.tsx`

- [ ] **Step 1: Create OR list page**

```tsx
// src/app/(app)/ordres/page.tsx
import { requireAuth } from "@/lib/auth-utils";
import { getOrdres } from "@/lib/actions/ordres";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";

const statutColors: Record<string, string> = {
  EN_ATTENTE: "bg-yellow-100 text-yellow-800",
  EN_COURS: "bg-blue-100 text-blue-800",
  CLOTURE: "bg-green-100 text-green-800",
};

export default async function OrdresPage() {
  const session = await requireAuth();
  const role = (session.user as any).role as string;
  const ordres = await getOrdres();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Ordres de Réparation</h1>
        {["ADMIN", "RECEPTIONNISTE"].includes(role) && (
          <Button asChild>
            <Link href="/reception/nouveau"><Plus className="mr-2 h-4 w-4" /> Nouvelle réception</Link>
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {ordres.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Aucun ordre de réparation pour le moment.
            </CardContent>
          </Card>
        ) : (
          ordres.map((or) => (
            <Link key={or.id} href={`/ordres/${or.id}`}>
              <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
                <CardContent className="flex items-center justify-between py-4">
                  <div>
                    <p className="font-medium">{or.numeroOR}</p>
                    <p className="text-sm text-muted-foreground">
                      {or.vehicle.marque} {or.vehicle.modele} — {or.vehicle.matricule}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Client: {or.vehicle.client.prenom} {or.vehicle.client.nom} | {new Date(or.dateEntree).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right text-xs text-muted-foreground">
                      <p>{or._count.interventions} intervention(s)</p>
                      <p>{or._count.picklists} picklist(s)</p>
                    </div>
                    <Badge className={statutColors[or.statut]}>{or.statut.replace("_", " ")}</Badge>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/\(app\)/ordres/page.tsx
git commit -m "feat: add OR list page with status badges and navigation"
```

---

## Phase 4: Contrôleur Panel & Assignments

### Task 14: Panne Assignment & Intervention Tracking

**Files:**
- Create: `src/lib/actions/pannes.ts`
- Create: `src/lib/actions/interventions.ts`
- Create: `src/components/controleur/assign-panne-dialog.tsx`
- Create: `src/components/controleur/intervention-form.tsx`

- [ ] **Step 1: Create panne server actions**

```typescript
// src/lib/actions/pannes.ts
"use server";

import { db } from "@/lib/db";
import { Section, StatutPanne } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function assignPanne(
  panneId: string,
  section: Section,
  mecanicienNom: string
) {
  const panne = await db.panne.update({
    where: { id: panneId },
    data: {
      section,
      mecanicienNom,
      statut: StatutPanne.EN_COURS,
    },
  });
  revalidatePath(`/ordres/${panne.ordreReparationId}`);
  return { data: panne };
}

export async function updatePanneStatut(panneId: string, statut: StatutPanne) {
  const panne = await db.panne.update({
    where: { id: panneId },
    data: { statut },
  });
  revalidatePath(`/ordres/${panne.ordreReparationId}`);
  return { data: panne };
}
```

- [ ] **Step 2: Create intervention server actions**

```typescript
// src/lib/actions/interventions.ts
"use server";

import { db } from "@/lib/db";
import { Section, StatutIntervention } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function createIntervention(data: {
  ordreReparationId: string;
  mecanicienNom: string;
  section: Section;
  description: string;
  tauxHoraire: number;
}) {
  const intervention = await db.intervention.create({
    data: {
      ordreReparationId: data.ordreReparationId,
      mecanicienNom: data.mecanicienNom,
      section: data.section,
      description: data.description,
      tauxHoraire: data.tauxHoraire,
    },
  });
  revalidatePath(`/ordres/${data.ordreReparationId}`);
  return { data: intervention };
}

export async function completeIntervention(
  interventionId: string,
  heuresTravail: number
) {
  const intervention = await db.intervention.update({
    where: { id: interventionId },
    data: {
      statut: StatutIntervention.TERMINE,
      heuresTravail,
      dateFin: new Date(),
    },
  });
  revalidatePath(`/ordres/${intervention.ordreReparationId}`);
  return { data: intervention };
}
```

- [ ] **Step 3: Create assign panne dialog**

```tsx
// src/components/controleur/assign-panne-dialog.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { assignPanne } from "@/lib/actions/pannes";
import { Section } from "@prisma/client";

const sectionLabels: Record<string, string> = {
  TOLERIE: "Tôlerie",
  SOUDURE: "Soudure",
  ELECTRICITE: "Électricité",
  POIDS_LOURDS: "Poids Lourds",
  POIDS_LEGERS: "Poids Légers",
};

export function AssignPanneDialog({ panneId }: { panneId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [section, setSection] = useState<string>("");
  const [mecanicien, setMecanicien] = useState("");

  async function handleAssign() {
    if (!section || !mecanicien) return;
    await assignPanne(panneId, section as Section, mecanicien);
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">Assigner</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assigner la panne</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Section</Label>
            <Select value={section} onValueChange={setSection}>
              <SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
              <SelectContent>
                {Object.entries(sectionLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Mécanicien</Label>
            <Input
              value={mecanicien}
              onChange={(e) => setMecanicien(e.target.value)}
              placeholder="Nom du mécanicien"
            />
          </div>
          <Button onClick={handleAssign} className="w-full">Assigner</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/actions/pannes.ts src/lib/actions/interventions.ts src/components/controleur/
git commit -m "feat: add panne assignment and intervention tracking"
```

---

## Phase 5: Stock & Inventory Management

### Task 15: Piece CRUD & Barcode Generation

**Files:**
- Create: `src/lib/actions/pieces.ts`
- Create: `src/lib/validators/piece.ts`
- Create: `src/app/(app)/magasin/page.tsx`
- Create: `src/app/(app)/magasin/nouveau/page.tsx`
- Create: `src/components/magasin/piece-form.tsx`
- Create: `src/components/magasin/barcode-display.tsx`

- [ ] **Step 1: Create piece validation and actions**

```typescript
// src/lib/validators/piece.ts
import { z } from "zod";

export const pieceSchema = z.object({
  codeBarre: z.string().min(1, "Le code-barre est requis"),
  designation: z.string().min(1, "La désignation est requise"),
  categorie: z.string().optional(),
  prixUnitaire: z.coerce.number().min(0, "Le prix doit être positif"),
  quantiteEnStock: z.coerce.number().min(0, "La quantité doit être positive"),
  seuilAlerte: z.coerce.number().min(0).default(5),
  emplacement: z.string().optional(),
});

export type PieceFormData = z.infer<typeof pieceSchema>;
```

```typescript
// src/lib/actions/pieces.ts
"use server";

import { db } from "@/lib/db";
import { pieceSchema } from "@/lib/validators/piece";
import { revalidatePath } from "next/cache";

export async function createPiece(data: unknown) {
  const parsed = pieceSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const existing = await db.piece.findUnique({
    where: { codeBarre: parsed.data.codeBarre },
  });
  if (existing) {
    return { error: { codeBarre: ["Ce code-barre existe déjà"] } };
  }

  const piece = await db.piece.create({ data: parsed.data });
  revalidatePath("/magasin");
  return { data: piece };
}

export async function getPieces(search?: string) {
  return db.piece.findMany({
    where: search
      ? {
          OR: [
            { codeBarre: { contains: search, mode: "insensitive" } },
            { designation: { contains: search, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { designation: "asc" },
  });
}

export async function getPieceByBarcode(codeBarre: string) {
  return db.piece.findUnique({ where: { codeBarre } });
}

export async function updatePieceStock(pieceId: string, quantite: number) {
  const piece = await db.piece.update({
    where: { id: pieceId },
    data: { quantiteEnStock: quantite },
  });
  revalidatePath("/magasin");
  return { data: piece };
}

export async function getLowStockPieces() {
  return db.piece.findMany({
    where: {
      quantiteEnStock: { lte: db.piece.fields.seuilAlerte as any },
    },
  });
}

export async function getPiecesLowStock() {
  const pieces = await db.piece.findMany();
  return pieces.filter((p) => p.quantiteEnStock <= p.seuilAlerte);
}
```

- [ ] **Step 2: Create barcode display component**

```tsx
// src/components/magasin/barcode-display.tsx
"use client";

import Barcode from "react-barcode";

export function BarcodeDisplay({ value }: { value: string }) {
  return (
    <div className="flex justify-center">
      <Barcode
        value={value}
        width={1.5}
        height={50}
        fontSize={12}
        margin={5}
      />
    </div>
  );
}
```

- [ ] **Step 3: Create inventory page**

```tsx
// src/app/(app)/magasin/page.tsx
import { requireRole } from "@/lib/auth-utils";
import { getPieces } from "@/lib/actions/pieces";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { BarcodeDisplay } from "@/components/magasin/barcode-display";

export default async function MagasinPage() {
  await requireRole(["ADMIN", "MAGASINIER"]);
  const pieces = await getPieces();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Inventaire des Pièces</h1>
        <Button asChild>
          <Link href="/magasin/nouveau"><Plus className="mr-2 h-4 w-4" /> Nouvelle pièce</Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {pieces.map((piece) => (
          <Card key={piece.id} className={piece.quantiteEnStock <= piece.seuilAlerte ? "border-destructive" : ""}>
            <CardContent className="pt-4 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">{piece.designation}</p>
                  <p className="text-sm text-muted-foreground">{piece.codeBarre}</p>
                  {piece.categorie && <Badge variant="outline" className="mt-1">{piece.categorie}</Badge>}
                </div>
                <div className="text-right">
                  <p className="font-bold">{piece.prixUnitaire.toLocaleString()} FCFA</p>
                  <p className={`text-sm ${piece.quantiteEnStock <= piece.seuilAlerte ? "text-destructive font-medium" : "text-muted-foreground"}`}>
                    Stock: {piece.quantiteEnStock}
                  </p>
                </div>
              </div>
              <BarcodeDisplay value={piece.codeBarre} />
              {piece.emplacement && (
                <p className="text-xs text-muted-foreground">Emplacement: {piece.emplacement}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create new piece form page**

```tsx
// src/app/(app)/magasin/nouveau/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createPiece } from "@/lib/actions/pieces";

export default function NouvellePiecePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    codeBarre: "",
    designation: "",
    categorie: "",
    prixUnitaire: 0,
    quantiteEnStock: 0,
    seuilAlerte: 5,
    emplacement: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await createPiece(form);

    setLoading(false);
    if ("error" in result && result.error) {
      const errors = result.error as Record<string, string[]>;
      setError(Object.values(errors).flat().join(", "));
      return;
    }
    router.push("/magasin");
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Nouvelle Pièce</h1>
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Code-barre *</Label>
                <Input value={form.codeBarre} onChange={(e) => setForm({ ...form, codeBarre: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Désignation *</Label>
                <Input value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Catégorie</Label>
                <Input value={form.categorie} onChange={(e) => setForm({ ...form, categorie: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Prix unitaire (FCFA) *</Label>
                <Input type="number" value={form.prixUnitaire} onChange={(e) => setForm({ ...form, prixUnitaire: parseInt(e.target.value) || 0 })} required />
              </div>
              <div className="space-y-2">
                <Label>Quantité en stock *</Label>
                <Input type="number" value={form.quantiteEnStock} onChange={(e) => setForm({ ...form, quantiteEnStock: parseInt(e.target.value) || 0 })} required />
              </div>
              <div className="space-y-2">
                <Label>Seuil d&apos;alerte</Label>
                <Input type="number" value={form.seuilAlerte} onChange={(e) => setForm({ ...form, seuilAlerte: parseInt(e.target.value) || 5 })} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Emplacement</Label>
                <Input value={form.emplacement} onChange={(e) => setForm({ ...form, emplacement: e.target.value })} placeholder="Ex: Étagère A3" />
              </div>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => router.back()}>Annuler</Button>
              <Button type="submit" disabled={loading}>{loading ? "Enregistrement..." : "Enregistrer"}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/actions/pieces.ts src/lib/validators/piece.ts src/app/\(app\)/magasin/ src/components/magasin/
git commit -m "feat: add inventory management with barcode generation"
```

---

## Phase 6: Picklist Workflow

### Task 16: Picklist Creation & Signing

**Files:**
- Create: `src/lib/actions/picklists.ts`
- Create: `src/app/(app)/picklists/page.tsx`
- Create: `src/app/(app)/picklists/nouveau/page.tsx`
- Create: `src/components/picklist/picklist-form.tsx`

- [ ] **Step 1: Create picklist server actions**

```typescript
// src/lib/actions/picklists.ts
"use server";

import { db } from "@/lib/db";
import { generateNumeroPicklist } from "@/lib/utils/numbering";
import { StatutPicklist, StatutPaiementPicklist, TypeMouvement } from "@prisma/client";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function createPicklist(data: {
  ordreReparationId: string;
  mecanicienNom: string;
  items: { pieceId: string; quantite: number; prixUnitaire: number }[];
}) {
  const numeroPicklist = await generateNumeroPicklist();
  const montantTotal = data.items.reduce((sum, item) => sum + item.quantite * item.prixUnitaire, 0);

  const picklist = await db.picklist.create({
    data: {
      numeroPicklist,
      ordreReparationId: data.ordreReparationId,
      mecanicienNom: data.mecanicienNom,
      montantTotal,
      items: {
        create: data.items.map((item) => ({
          pieceId: item.pieceId,
          quantite: item.quantite,
          prixUnitaire: item.prixUnitaire,
        })),
      },
    },
    include: { items: { include: { piece: true } } },
  });

  revalidatePath("/picklists");
  revalidatePath(`/ordres/${data.ordreReparationId}`);
  return { data: picklist };
}

export async function signPicklist(picklistId: string, signature: string) {
  const picklist = await db.picklist.update({
    where: { id: picklistId },
    data: {
      signatureControleur: signature,
      statut: StatutPicklist.SIGNE,
    },
  });
  revalidatePath("/picklists");
  return { data: picklist };
}

export async function deliverPicklist(picklistId: string) {
  const session = await auth();
  if (!session?.user) return { error: "Non autorisé" };

  const picklist = await db.picklist.findUnique({
    where: { id: picklistId },
    include: { items: true },
  });

  if (!picklist) return { error: "Picklist non trouvée" };
  if (picklist.statut !== StatutPicklist.SIGNE) return { error: "Picklist non signée" };
  if (picklist.paiementStatut !== StatutPaiementPicklist.PAYE) return { error: "Picklist non payée" };

  await db.$transaction(async (tx) => {
    for (const item of picklist.items) {
      await tx.piece.update({
        where: { id: item.pieceId },
        data: { quantiteEnStock: { decrement: item.quantite } },
      });

      await tx.mouvementStock.create({
        data: {
          pieceId: item.pieceId,
          type: TypeMouvement.SORTIE,
          quantite: item.quantite,
          picklistId: picklist.id,
          motif: `Picklist ${picklist.numeroPicklist}`,
          effectueParId: session.user.id!,
        },
      });
    }

    await tx.picklist.update({
      where: { id: picklistId },
      data: { statut: StatutPicklist.DELIVRE },
    });
  });

  revalidatePath("/picklists");
  revalidatePath("/magasin");
  return { data: { success: true } };
}

export async function getPicklists(statut?: StatutPicklist) {
  return db.picklist.findMany({
    where: statut ? { statut } : undefined,
    include: {
      ordreReparation: { select: { numeroOR: true } },
      items: { include: { piece: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}
```

- [ ] **Step 2: Create picklist list page**

```tsx
// src/app/(app)/picklists/page.tsx
import { requireAuth } from "@/lib/auth-utils";
import { getPicklists } from "@/lib/actions/picklists";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";

const statutColors: Record<string, string> = {
  EN_ATTENTE: "bg-yellow-100 text-yellow-800",
  SIGNE: "bg-blue-100 text-blue-800",
  DELIVRE: "bg-green-100 text-green-800",
};

export default async function PicklistsPage() {
  const session = await requireAuth();
  const role = (session.user as any).role as string;
  const picklists = await getPicklists();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Picklists</h1>
        {["ADMIN", "RECEPTIONNISTE"].includes(role) && (
          <Button asChild>
            <Link href="/picklists/nouveau"><Plus className="mr-2 h-4 w-4" /> Nouveau Picklist</Link>
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {picklists.map((pk) => (
          <Card key={pk.id}>
            <CardContent className="flex items-center justify-between py-4">
              <div>
                <p className="font-medium">{pk.numeroPicklist}</p>
                <p className="text-sm text-muted-foreground">
                  OR: {pk.ordreReparation.numeroOR} | Mécanicien: {pk.mecanicienNom}
                </p>
                <p className="text-xs text-muted-foreground">
                  {pk.items.length} pièce(s) — {pk.montantTotal.toLocaleString()} FCFA
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={statutColors[pk.statut]}>{pk.statut.replace("_", " ")}</Badge>
                <Badge variant={pk.paiementStatut === "PAYE" ? "default" : "secondary"}>
                  {pk.paiementStatut === "PAYE" ? "Payé" : "Non payé"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/actions/picklists.ts src/app/\(app\)/picklists/
git commit -m "feat: add picklist creation, signing, and delivery with stock decrement"
```

---

## Phase 7: Payments & Invoicing

### Task 17: Payment Server Actions

**Files:**
- Create: `src/lib/actions/paiements.ts`

- [ ] **Step 1: Create payment server actions**

```typescript
// src/lib/actions/paiements.ts
"use server";

import { db } from "@/lib/db";
import { TypePaiement, MethodePaiement, StatutPaiementPicklist } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function createPaiement(data: {
  montant: number;
  type: TypePaiement;
  methode: MethodePaiement;
  ordreReparationId: string;
  picklistId?: string;
  factureId?: string;
  referencePaiement?: string;
}) {
  const paiement = await db.paiement.create({ data });

  if (data.type === TypePaiement.PICKLIST && data.picklistId) {
    await db.picklist.update({
      where: { id: data.picklistId },
      data: { paiementStatut: StatutPaiementPicklist.PAYE },
    });
  }

  if (data.factureId) {
    const facture = await db.facture.findUnique({
      where: { id: data.factureId },
      include: { paiements: true },
    });
    if (facture) {
      const totalPaye = facture.paiements.reduce((s, p) => s + p.montant, 0) + data.montant;
      await db.facture.update({
        where: { id: data.factureId },
        data: {
          montantPaye: totalPaye,
          montantRestant: facture.montantTotal - totalPaye,
          statut: totalPaye >= facture.montantTotal ? "PAYEE" : "EN_ATTENTE",
        },
      });
    }
  }

  revalidatePath(`/ordres/${data.ordreReparationId}`);
  revalidatePath("/paiements");
  revalidatePath("/picklists");
  return { data: paiement };
}

export async function getPaiements(ordreReparationId?: string) {
  return db.paiement.findMany({
    where: ordreReparationId ? { ordreReparationId } : undefined,
    include: {
      ordreReparation: { select: { numeroOR: true } },
      picklist: { select: { numeroPicklist: true } },
    },
    orderBy: { date: "desc" },
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/actions/paiements.ts
git commit -m "feat: add payment server actions with picklist and facture updates"
```

---

### Task 18: Facture Generation & Clôture

**Files:**
- Create: `src/lib/actions/factures.ts`
- Create: `src/lib/actions/cloture.ts`

- [ ] **Step 1: Create clôture server action**

```typescript
// src/lib/actions/cloture.ts
"use server";

import { db } from "@/lib/db";
import { generateNumeroCloture } from "@/lib/utils/numbering";
import { StatutOR } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function createFicheCloture(ordreReparationId: string, signatureControleur: string) {
  const numeroCloture = await generateNumeroCloture();

  const fiche = await db.ficheCloture.create({
    data: {
      numeroCloture,
      ordreReparationId,
      signatureControleur,
    },
  });

  await db.ordreReparation.update({
    where: { id: ordreReparationId },
    data: {
      statut: StatutOR.CLOTURE,
      dateSortie: new Date(),
      signatureControleur,
    },
  });

  revalidatePath(`/ordres/${ordreReparationId}`);
  revalidatePath("/ordres");
  revalidatePath("/dashboard");
  return { data: fiche };
}
```

- [ ] **Step 2: Create facture server action**

```typescript
// src/lib/actions/factures.ts
"use server";

import { db } from "@/lib/db";
import { generateNumeroFacture } from "@/lib/utils/numbering";
import { revalidatePath } from "next/cache";

export async function createFacture(ordreReparationId: string) {
  const ordre = await db.ordreReparation.findUnique({
    where: { id: ordreReparationId },
    include: {
      vehicle: { include: { client: true } },
      interventions: true,
      picklists: { include: { items: true } },
      paiements: true,
    },
  });

  if (!ordre) return { error: "OR non trouvé" };

  const montantPieces = ordre.picklists.reduce((sum, pk) => sum + pk.montantTotal, 0);
  const montantMainOeuvre = ordre.interventions.reduce(
    (sum, int) => sum + Number(int.heuresTravail) * int.tauxHoraire,
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

export async function getFactures() {
  return db.facture.findMany({
    include: {
      ordreReparation: { select: { numeroOR: true } },
      client: true,
    },
    orderBy: { dateEmission: "desc" },
  });
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/actions/cloture.ts src/lib/actions/factures.ts
git commit -m "feat: add fiche de clôture and facture generation with auto-calculations"
```

---

## Phase 8: PDF Generation

### Task 19: PDF Templates (OR, Picklist, Clôture, Facture)

**Files:**
- Create: `src/lib/pdf/or-pdf.tsx`
- Create: `src/lib/pdf/picklist-pdf.tsx`
- Create: `src/lib/pdf/cloture-pdf.tsx`
- Create: `src/lib/pdf/facture-pdf.tsx`
- Create: `src/lib/pdf/shared-styles.ts`
- Create: `src/app/api/pdf/[type]/[id]/route.ts`

- [ ] **Step 1: Create shared PDF styles**

```typescript
// src/lib/pdf/shared-styles.ts
import { StyleSheet } from "@react-pdf/renderer";

export const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica" },
  header: { marginBottom: 20, textAlign: "center" },
  title: { fontSize: 18, fontWeight: "bold", color: "#166534" },
  subtitle: { fontSize: 12, color: "#666", marginTop: 4 },
  companyName: { fontSize: 14, fontWeight: "bold", marginBottom: 2 },
  section: { marginBottom: 12 },
  sectionTitle: { fontSize: 12, fontWeight: "bold", borderBottom: "1 solid #166534", paddingBottom: 4, marginBottom: 8, color: "#166534" },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  label: { color: "#666", width: "40%" },
  value: { fontWeight: "bold", width: "60%" },
  table: { width: "100%", marginTop: 8 },
  tableHeader: { flexDirection: "row", backgroundColor: "#166534", color: "white", padding: 6, fontWeight: "bold" },
  tableRow: { flexDirection: "row", borderBottom: "0.5 solid #ddd", padding: 6 },
  col1: { width: "10%" },
  col2: { width: "30%" },
  col3: { width: "20%" },
  col4: { width: "20%" },
  col5: { width: "20%" },
  totalRow: { flexDirection: "row", justifyContent: "flex-end", marginTop: 8, paddingTop: 8, borderTop: "1 solid #166534" },
  totalLabel: { fontSize: 12, fontWeight: "bold", marginRight: 20 },
  totalValue: { fontSize: 14, fontWeight: "bold", color: "#166534" },
  signatureArea: { marginTop: 30, flexDirection: "row", justifyContent: "space-between" },
  signatureBox: { width: "45%", borderTop: "1 solid #000", paddingTop: 4, textAlign: "center" },
  footer: { position: "absolute", bottom: 30, left: 40, right: 40, textAlign: "center", fontSize: 8, color: "#999" },
});
```

- [ ] **Step 2: Create facture PDF template**

```tsx
// src/lib/pdf/facture-pdf.tsx
import { Document, Page, Text, View } from "@react-pdf/renderer";
import { styles } from "./shared-styles";

export function FacturePDF({ facture, ordre, client, interventions, picklists, paiements }: any) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.companyName}>CPS MAROUA</Text>
          <Text style={styles.subtitle}>Garage Automobile — Maroua, Cameroun</Text>
          <Text style={{ ...styles.title, marginTop: 10 }}>FACTURE</Text>
          <Text style={styles.subtitle}>{facture.numeroFacture}</Text>
        </View>

        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 16 }}>
          <View style={{ width: "48%" }}>
            <Text style={styles.sectionTitle}>Client</Text>
            <Text>{client.prenom} {client.nom}</Text>
            <Text>{client.telephone}</Text>
            {client.adresse && <Text>{client.adresse}</Text>}
          </View>
          <View style={{ width: "48%" }}>
            <Text style={styles.sectionTitle}>Véhicule</Text>
            <Text>Matricule: {ordre.vehicle.matricule}</Text>
            <Text>{ordre.vehicle.marque} {ordre.vehicle.modele}</Text>
            <Text>OR: {ordre.numeroOR}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pièces</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.col1}>#</Text>
              <Text style={styles.col2}>Désignation</Text>
              <Text style={styles.col3}>Qté</Text>
              <Text style={styles.col4}>Prix unit.</Text>
              <Text style={styles.col5}>Total</Text>
            </View>
            {picklists.flatMap((pk: any, pi: number) =>
              pk.items.map((item: any, ii: number) => (
                <View key={`${pi}-${ii}`} style={styles.tableRow}>
                  <Text style={styles.col1}>{pi * 10 + ii + 1}</Text>
                  <Text style={styles.col2}>{item.piece.designation}</Text>
                  <Text style={styles.col3}>{item.quantite}</Text>
                  <Text style={styles.col4}>{item.prixUnitaire.toLocaleString()} FCFA</Text>
                  <Text style={styles.col5}>{(item.quantite * item.prixUnitaire).toLocaleString()} FCFA</Text>
                </View>
              ))
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Main d&apos;œuvre</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.col1}>#</Text>
              <Text style={styles.col2}>Description</Text>
              <Text style={styles.col3}>Heures</Text>
              <Text style={styles.col4}>Taux/h</Text>
              <Text style={styles.col5}>Total</Text>
            </View>
            {interventions.map((int: any, i: number) => (
              <View key={i} style={styles.tableRow}>
                <Text style={styles.col1}>{i + 1}</Text>
                <Text style={styles.col2}>{int.description} ({int.mecanicienNom})</Text>
                <Text style={styles.col3}>{Number(int.heuresTravail)}h</Text>
                <Text style={styles.col4}>{int.tauxHoraire.toLocaleString()} FCFA</Text>
                <Text style={styles.col5}>{(Number(int.heuresTravail) * int.tauxHoraire).toLocaleString()} FCFA</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={{ borderTop: "2 solid #166534", paddingTop: 10, marginTop: 10 }}>
          <View style={styles.row}>
            <Text>Total Pièces:</Text>
            <Text style={{ fontWeight: "bold" }}>{facture.montantPieces.toLocaleString()} FCFA</Text>
          </View>
          <View style={styles.row}>
            <Text>Total Main d&apos;œuvre:</Text>
            <Text style={{ fontWeight: "bold" }}>{facture.montantMainOeuvre.toLocaleString()} FCFA</Text>
          </View>
          <View style={{ ...styles.row, marginTop: 4, paddingTop: 4, borderTop: "1 solid #ddd" }}>
            <Text style={{ fontSize: 14, fontWeight: "bold" }}>TOTAL:</Text>
            <Text style={{ fontSize: 14, fontWeight: "bold", color: "#166534" }}>{facture.montantTotal.toLocaleString()} FCFA</Text>
          </View>
          <View style={styles.row}>
            <Text>Montant payé:</Text>
            <Text>{facture.montantPaye.toLocaleString()} FCFA</Text>
          </View>
          <View style={styles.row}>
            <Text style={{ fontWeight: "bold" }}>Reste à payer:</Text>
            <Text style={{ fontWeight: "bold", color: facture.montantRestant > 0 ? "#dc2626" : "#166534" }}>{facture.montantRestant.toLocaleString()} FCFA</Text>
          </View>
        </View>

        <View style={styles.signatureArea}>
          <View style={styles.signatureBox}><Text>Le Client</Text></View>
          <View style={styles.signatureBox}><Text>CPS Maroua</Text></View>
        </View>

        <Text style={styles.footer}>CPS Maroua — {new Date().toLocaleDateString("fr-FR")}</Text>
      </Page>
    </Document>
  );
}
```

- [ ] **Step 3: Create PDF API route**

```typescript
// src/app/api/pdf/[type]/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { db } from "@/lib/db";
import { FacturePDF } from "@/lib/pdf/facture-pdf";
import { auth } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string; id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { type, id } = await params;

  if (type === "facture") {
    const facture = await db.facture.findUnique({
      where: { id },
      include: {
        ordreReparation: {
          include: {
            vehicle: { include: { client: true } },
            interventions: true,
            picklists: { include: { items: { include: { piece: true } } } },
            paiements: true,
          },
        },
        client: true,
      },
    });

    if (!facture) return NextResponse.json({ error: "Non trouvé" }, { status: 404 });

    const buffer = await renderToBuffer(
      FacturePDF({
        facture,
        ordre: facture.ordreReparation,
        client: facture.client,
        interventions: facture.ordreReparation.interventions,
        picklists: facture.ordreReparation.picklists,
        paiements: facture.ordreReparation.paiements,
      }) as any
    );

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${facture.numeroFacture}.pdf"`,
      },
    });
  }

  return NextResponse.json({ error: "Type non supporté" }, { status: 400 });
}
```

Note: OR, Picklist, and Clôture PDF templates follow the same pattern as FacturePDF. Each uses shared-styles.ts and is served via the same API route with different `type` parameter. Implement them following the FacturePDF structure, adapting the data displayed.

- [ ] **Step 4: Commit**

```bash
git add src/lib/pdf/ src/app/api/pdf/
git commit -m "feat: add PDF generation for factures with API route"
```

---

## Phase 9: Client Portal

### Task 20: Client Portal Pages

**Files:**
- Create: `src/app/(app)/mes-reparations/page.tsx`
- Create: `src/app/(app)/mes-factures/page.tsx`
- Create: `src/lib/actions/client-portal.ts`

- [ ] **Step 1: Create client portal server actions**

```typescript
// src/lib/actions/client-portal.ts
"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function getMyReparations() {
  const session = await auth();
  if (!session?.user) return [];

  const clientId = (session.user as any).clientId;
  if (!clientId) return [];

  return db.ordreReparation.findMany({
    where: { vehicle: { clientId } },
    include: {
      vehicle: true,
      pannes: true,
      interventions: true,
      _count: { select: { picklists: true } },
    },
    orderBy: { dateEntree: "desc" },
  });
}

export async function getMyFactures() {
  const session = await auth();
  if (!session?.user) return [];

  const clientId = (session.user as any).clientId;
  if (!clientId) return [];

  return db.facture.findMany({
    where: { clientId },
    include: {
      ordreReparation: {
        select: { numeroOR: true, vehicle: { select: { matricule: true, marque: true, modele: true } } },
      },
    },
    orderBy: { dateEmission: "desc" },
  });
}
```

- [ ] **Step 2: Create mes-reparations page**

```tsx
// src/app/(app)/mes-reparations/page.tsx
import { requireRole } from "@/lib/auth-utils";
import { getMyReparations } from "@/lib/actions/client-portal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const statutColors: Record<string, string> = {
  EN_ATTENTE: "bg-yellow-100 text-yellow-800",
  EN_COURS: "bg-blue-100 text-blue-800",
  CLOTURE: "bg-green-100 text-green-800",
};

export default async function MesReparationsPage() {
  await requireRole(["CLIENT"]);
  const reparations = await getMyReparations();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Mes Réparations</h1>

      {reparations.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Aucune réparation en cours.
          </CardContent>
        </Card>
      ) : (
        reparations.map((rep) => (
          <Card key={rep.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{rep.numeroOR}</CardTitle>
                <Badge className={statutColors[rep.statut]}>{rep.statut.replace("_", " ")}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm">
                {rep.vehicle.marque} {rep.vehicle.modele} — {rep.vehicle.matricule}
              </p>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Pannes:</p>
                {rep.pannes.map((p) => (
                  <div key={p.id} className="flex items-center justify-between text-sm py-1">
                    <span>{p.description}</span>
                    <Badge variant="outline" className="text-xs">
                      {p.statut === "RESOLU" ? "Résolu" : p.statut === "EN_COURS" ? "En cours" : "En attente"}
                    </Badge>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Entrée: {new Date(rep.dateEntree).toLocaleDateString("fr-FR")}
                {rep.dateSortie && ` — Sortie: ${new Date(rep.dateSortie).toLocaleDateString("fr-FR")}`}
              </p>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
```

- [ ] **Step 3: Create mes-factures page**

```tsx
// src/app/(app)/mes-factures/page.tsx
import { requireRole } from "@/lib/auth-utils";
import { getMyFactures } from "@/lib/actions/client-portal";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { FileText } from "lucide-react";

export default async function MesFacturesPage() {
  await requireRole(["CLIENT"]);
  const factures = await getMyFactures();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Mes Factures</h1>

      {factures.map((f) => (
        <Card key={f.id}>
          <CardContent className="flex items-center justify-between py-4">
            <div>
              <p className="font-medium">{f.numeroFacture}</p>
              <p className="text-sm text-muted-foreground">
                OR: {f.ordreReparation.numeroOR} — {f.ordreReparation.vehicle.marque} {f.ordreReparation.vehicle.modele}
              </p>
              <p className="text-sm font-medium mt-1">{f.montantTotal.toLocaleString()} FCFA</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={f.statut === "PAYEE" ? "default" : "secondary"}>
                {f.statut === "PAYEE" ? "Payée" : `Reste: ${f.montantRestant.toLocaleString()} FCFA`}
              </Badge>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/api/pdf/facture/${f.id}`} target="_blank">
                  <FileText className="mr-2 h-4 w-4" /> PDF
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/\(app\)/mes-reparations/ src/app/\(app\)/mes-factures/ src/lib/actions/client-portal.ts
git commit -m "feat: add client portal with repair tracking and invoice viewing"
```

---

## Phase 10: Admin Dashboard & Reports

### Task 21: Live Dashboard with Real Data

**Files:**
- Modify: `src/app/(app)/dashboard/page.tsx`
- Create: `src/lib/actions/dashboard.ts`

- [ ] **Step 1: Create dashboard data actions**

```typescript
// src/lib/actions/dashboard.ts
"use server";

import { db } from "@/lib/db";
import { StatutOR } from "@prisma/client";

export async function getDashboardStats() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [vehiculesAuGarage, ordresEnCours, piecesEnStock, revenusMois, ordresRecents] =
    await Promise.all([
      db.ordreReparation.count({
        where: { statut: { not: StatutOR.CLOTURE } },
      }),
      db.ordreReparation.count({
        where: { statut: StatutOR.EN_COURS },
      }),
      db.piece.count({
        where: { quantiteEnStock: { gt: 0 } },
      }),
      db.paiement.aggregate({
        where: { date: { gte: startOfMonth } },
        _sum: { montant: true },
      }),
      db.ordreReparation.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { vehicle: { include: { client: true } } },
      }),
    ]);

  return {
    vehiculesAuGarage,
    ordresEnCours,
    piecesEnStock,
    revenusMois: revenusMois._sum.montant ?? 0,
    ordresRecents,
  };
}
```

- [ ] **Step 2: Update dashboard page to use real data**

Replace the placeholder dashboard with the real one using `getDashboardStats()`. Follow the same card layout from Task 7 but populate with real values from the action.

- [ ] **Step 3: Commit**

```bash
git add src/lib/actions/dashboard.ts src/app/\(app\)/dashboard/
git commit -m "feat: add live dashboard with real-time statistics from database"
```

---

### Task 22: User Management (Admin)

**Files:**
- Create: `src/app/(app)/utilisateurs/page.tsx`
- Create: `src/lib/actions/users.ts`
- Create: `src/components/admin/user-form-dialog.tsx`

- [ ] **Step 1: Create user management actions**

```typescript
// src/lib/actions/users.ts
"use server";

import { db } from "@/lib/db";
import { Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

export async function getUsers() {
  return db.user.findMany({
    select: { id: true, nom: true, prenom: true, email: true, telephone: true, role: true, isActive: true, createdAt: true },
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
```

- [ ] **Step 2: Create user management page and dialog**

Build a page listing all users with a button to add new users via a dialog form. Include role assignment and the ability to activate/deactivate users. Follow the same patterns used in the magasin pages.

- [ ] **Step 3: Commit**

```bash
git add src/app/\(app\)/utilisateurs/ src/lib/actions/users.ts src/components/admin/
git commit -m "feat: add user management page for admin role"
```

---

### Task 23: Factures & Paiements List Pages

**Files:**
- Create: `src/app/(app)/factures/page.tsx`
- Create: `src/app/(app)/paiements/page.tsx`

- [ ] **Step 1: Create factures list page**

Build a page showing all factures with status badges, amounts, and PDF download links. Use `getFactures()` action. Follow the pattern from the OR list page.

- [ ] **Step 2: Create paiements list page**

Build a page showing all payments with type (acompte/picklist/solde), method, amount, and related OR. Use `getPaiements()` action. Follow the same card list pattern.

- [ ] **Step 3: Commit**

```bash
git add src/app/\(app\)/factures/ src/app/\(app\)/paiements/
git commit -m "feat: add factures and paiements list pages"
```

---

### Task 24: Final Integration & Verification

**Files:**
- All existing files

- [ ] **Step 1: Verify all pages render**

Run `npm run dev` and manually navigate to:
- /connexion (login)
- /dashboard (after login)
- /reception/nouveau (multi-step form)
- /ordres (list)
- /ordres/[id] (detail)
- /magasin (inventory)
- /magasin/nouveau (add part)
- /picklists (list)
- /factures (list)
- /paiements (list)
- /utilisateurs (admin only)

- [ ] **Step 2: Verify build succeeds**

Run:
```bash
npm run build
```
Expected: Build completes with no errors.

- [ ] **Step 3: Add .gitignore for superpowers**

```bash
echo ".superpowers/" >> .gitignore
```

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete CPS Maroua garage management app — all phases integrated"
```
