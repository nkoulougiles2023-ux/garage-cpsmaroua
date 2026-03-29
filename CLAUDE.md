# CPS Maroua — Garage Management System

## Project Overview
Military garage management app for **CPS Maroua (BIR Cameroon)**. Manages vehicle reception, repair orders, parts inventory, picklists, invoicing, and payments. All UI is in **French**.

## Tech Stack
- **Framework:** Next.js 16 (App Router, Turbopack)
- **UI:** shadcn/ui (base-ui variant, NOT Radix — uses `render` prop instead of `asChild`)
- **Database:** PostgreSQL on **Neon** (free tier, cold starts ~5s)
- **ORM:** Prisma 7 with `@prisma/adapter-pg`
- **Auth:** NextAuth v5 (credentials provider, JWT strategy)
- **Styling:** Tailwind CSS v4
- **Language:** TypeScript (strict)

## Key Architecture Decisions

### Database
- Prisma config in `prisma.config.ts` loads env via `dotenv/config` (reads `.env`, NOT `.env.local`)
- Both `.env` and `.env.local` must have the same `DATABASE_URL`
- Prisma seed requires `PrismaPg` adapter (see `prisma/seed.ts`)
- Run migrations: `npx prisma migrate dev --name <name>`

### Authentication & Roles
- 5 roles: `ADMIN`, `RECEPTIONNISTE`, `MAGASINIER`, `CONTROLEUR`, `CLIENT`
- Role stored in JWT token, accessed via `(session.user as any).role`
- `requireRole()` and `requireAuth()` in `src/lib/auth-utils.ts`
- Admin can toggle per-user page permissions (JSON field on User model)

### Picklist Approval Workflow
```
EN_ATTENTE → APPROUVE_ADMIN (admin signs) → SIGNE (controleur signs) → DELIVRE (magasinier delivers)
```
Admin must approve before controleur can sign. Without admin signature, picklist cannot be printed or sent to magasin.

### shadcn/ui Notes
- Uses `@base-ui/react` (NOT `@radix-ui`). Components use `render` prop pattern:
  ```tsx
  // CORRECT:
  <DialogTrigger render={<Button>Click</Button>} />
  <Button render={<Link href="/foo" />}>Link</Button>

  // WRONG (will error):
  <DialogTrigger asChild><Button>Click</Button></DialogTrigger>
  ```
- `Select.onValueChange` signature: `(value: string | null) => void`

## Project Structure
```
src/
  app/(app)/              # Authenticated routes (wrapped in AppShell)
    dashboard/            # Admin dashboard
    controleur/           # Controleur command panel
    magasin/              # Magasinier pages
      dashboard/          # Magasinier dashboard
      entree/             # Stock entry
      mouvements/         # Movement history
      alertes/            # Low stock alerts
      nouveau/            # New piece form
    reception/
      dashboard/          # Receptionist dashboard
      nouveau/            # New vehicle reception
    ordres/               # Repair orders
    picklists/            # Picklists management
    factures/             # Invoices
    paiements/            # Payments
    utilisateurs/         # User management (admin only)
  components/
    layout/               # Sidebar, Header, AppShell
    magasin/              # Stock components (search, filters, forms, barcode)
    admin/                # Admin components (user form, permissions, picklist approval)
    controleur/           # Controleur components (sign picklist)
    payments/             # Payment buttons (Orange Money, MTN MoMo)
    ordres/               # OR components (signature pad, etc.)
    ui/                   # shadcn/ui primitives
  lib/
    actions/              # Server actions (one file per domain)
    validators/           # Zod schemas
    utils/                # Helpers (numbering, etc.)
    auth.ts               # NextAuth config
    auth-utils.ts         # Auth helpers (requireRole, requireAuth)
    db.ts                 # Prisma client singleton
```

## Server Actions Pattern
All mutations use `"use server"` actions in `src/lib/actions/`. Pattern:
```ts
"use server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function doSomething(data: {...}) {
  const session = await auth();
  if (!session?.user) return { error: "Non autorisé" };
  // ... mutation with db.$transaction for multi-step
  revalidatePath("/path");
  return { data: result };
}
```

## Commands
```bash
npm run dev          # Start dev server (Turbopack)
npm run build        # Production build
npx prisma migrate dev --name <name>  # Run migration
npx prisma generate  # Regenerate client
npx tsx prisma/seed.ts  # Seed database
```

## Test Accounts (password: admin123)
| Role | Email |
|------|-------|
| Admin | admin@cpsmaroua.cm |
| Controleur | controleur@cpsmaroua.cm |
| Receptionniste | reception@cpsmaroua.cm |
| Magasinier | magasin@cpsmaroua.cm |

## Important Notes
- All "use server" functions must be `async` (Prisma 7 / Next.js 16 requirement)
- Currency is FCFA, formatted with `toLocaleString("fr-FR")`
- Dates formatted with `fr-FR` locale
- Permissions are stored as JSON on User model, filtered in sidebar
- Neon DB has cold starts — first request after idle may take 5-10s
