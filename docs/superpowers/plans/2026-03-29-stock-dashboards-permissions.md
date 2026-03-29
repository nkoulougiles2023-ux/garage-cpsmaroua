# Stock Enhancements, Role Dashboards & Admin Permissions Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enhance stock management with search/filter/edit, add role-specific dashboards for Magasinier/Receptionist/Controleur, add admin permission management per user, and require admin signature on picklists before they go to magasin.

**Architecture:** Each role gets a dedicated dashboard page with domain-specific KPIs. Admin permissions stored as a JSON `permissions` column on User model — admin can toggle which menu items each user sees. Picklist workflow adds a new `APPROUVE_ADMIN` status between `EN_ATTENTE` and `SIGNE` so admin must approve before controleur signs.

**Tech Stack:** Next.js 15, Prisma, PostgreSQL, shadcn/ui, Tailwind CSS, server actions

---

## File Map

### New Files
- `src/lib/actions/dashboard-magasinier.ts` — Magasinier dashboard data fetching
- `src/lib/actions/dashboard-receptionniste.ts` — Receptionist dashboard data fetching
- `src/app/(app)/magasin/dashboard/page.tsx` — Magasinier dashboard page
- `src/app/(app)/reception/dashboard/page.tsx` — Receptionist dashboard page
- `src/components/magasin/piece-edit-dialog.tsx` — Edit piece dialog component
- `src/components/magasin/stock-search.tsx` — Search bar client component
- `src/components/magasin/mouvement-filters.tsx` — Movement filters client component
- `src/components/admin/user-permissions-dialog.tsx` — Admin permission toggle dialog
- `src/components/admin/approve-picklist-button.tsx` — Admin picklist approval button
- `src/lib/actions/permissions.ts` — Permission CRUD actions

### Modified Files
- `prisma/schema.prisma` — Add `permissions` JSON on User, add `APPROUVE_ADMIN` to StatutPicklist
- `src/components/layout/sidebar.tsx` — Filter nav items by user permissions
- `src/app/(app)/magasin/page.tsx` — Add search params, edit button
- `src/app/(app)/magasin/mouvements/page.tsx` — Add filter params
- `src/app/(app)/utilisateurs/page.tsx` — Add permissions button per user
- `src/lib/actions/picklists.ts` — Add `approvePicklist` action, update workflow
- `src/lib/actions/pieces.ts` — Add `updatePiece` action
- `src/app/(app)/controleur/page.tsx` — Add monthly stats
- `src/app/(app)/picklists/page.tsx` — Show admin approval status
- `src/lib/auth-utils.ts` — Add `getUserPermissions` helper

---

### Task 1: Database Schema — Add permissions and picklist approval status

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add permissions field and APPROUVE_ADMIN status**

In `prisma/schema.prisma`, add to User model after `isActive`:

```prisma
permissions  Json?    @default("{}")
```

Update `StatutPicklist` enum to:

```prisma
enum StatutPicklist {
  EN_ATTENTE
  APPROUVE_ADMIN
  SIGNE
  DELIVRE
}
```

- [ ] **Step 2: Generate and apply migration**

```bash
npx prisma migrate dev --name add-permissions-and-admin-approval
```

- [ ] **Step 3: Commit**

```bash
git add prisma/
git commit -m "feat: add user permissions JSON and APPROUVE_ADMIN picklist status"
```

---

### Task 2: Admin Picklist Approval Workflow

**Files:**
- Modify: `src/lib/actions/picklists.ts`
- Create: `src/components/admin/approve-picklist-button.tsx`
- Modify: `src/app/(app)/picklists/page.tsx`
- Modify: `src/app/(app)/controleur/page.tsx`

- [ ] **Step 1: Add approvePicklist action**

In `src/lib/actions/picklists.ts`, add:

```typescript
export async function approvePicklist(picklistId: string, signature: string) {
  const session = await auth();
  if (!session?.user) return { error: "Non autorisé" };
  const role = (session.user as any).role as string;
  if (role !== "ADMIN") return { error: "Seul l'admin peut approuver" };

  const picklist = await db.picklist.update({
    where: { id: picklistId },
    data: {
      statut: StatutPicklist.APPROUVE_ADMIN,
      signatureAdmin: signature,
    },
  });
  revalidatePath("/picklists");
  revalidatePath("/controleur");
  return { data: picklist };
}
```

Also add `signatureAdmin` field to Picklist model in schema:

```prisma
signatureAdmin        String?
```

Update `signPicklist` to only allow signing if status is `APPROUVE_ADMIN`:

```typescript
export async function signPicklist(picklistId: string, signature: string) {
  const existing = await db.picklist.findUnique({ where: { id: picklistId } });
  if (!existing || existing.statut !== StatutPicklist.APPROUVE_ADMIN) {
    return { error: "La picklist doit être approuvée par l'admin d'abord" };
  }
  const picklist = await db.picklist.update({
    where: { id: picklistId },
    data: { signatureControleur: signature, statut: StatutPicklist.SIGNE },
  });
  revalidatePath("/picklists");
  return { data: picklist };
}
```

- [ ] **Step 2: Create ApprovePicklistButton component**

Create `src/components/admin/approve-picklist-button.tsx`:

```tsx
"use client";

import { useState } from "react";
import { approvePicklist } from "@/lib/actions/picklists";
import { SignaturePad } from "@/components/ordres/signature-pad";
import { useRouter } from "next/navigation";

export function ApprovePicklistButton({ picklistId }: { picklistId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleApprove(signature: string) {
    setLoading(true);
    try {
      await approvePicklist(picklistId, signature);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={loading ? "pointer-events-none opacity-50" : ""}>
      <SignaturePad label="Approuver (Admin)" onSign={handleApprove} />
    </div>
  );
}
```

- [ ] **Step 3: Update picklists page to show approval status**

In `src/app/(app)/picklists/page.tsx`, add the `APPROUVE_ADMIN` case to `statutPicklistBadge`:

```typescript
case StatutPicklist.APPROUVE_ADMIN:
  return (
    <Badge className="bg-purple-100 text-purple-800 border-purple-200">
      Approuvé Admin
    </Badge>
  );
```

Show ApprovePicklistButton for admin when status is EN_ATTENTE. Show SignPicklistButton for controleur when status is APPROUVE_ADMIN.

- [ ] **Step 4: Update controleur page — only show picklists with APPROUVE_ADMIN for signing**

In `src/lib/actions/controleur.ts`, update `getPicklistsToSign`:

```typescript
export async function getPicklistsToSign() {
  return db.picklist.findMany({
    where: { statut: StatutPicklist.APPROUVE_ADMIN },
    include: {
      ordreReparation: { select: { numeroOR: true } },
      items: { include: { piece: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}
```

Update `picklistsEnAttente` stat to count `APPROUVE_ADMIN`:

```typescript
picklistsEnAttente: db.picklist.count({
  where: { statut: StatutPicklist.APPROUVE_ADMIN },
}),
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add admin approval step for picklists before controleur can sign"
```

---

### Task 3: Stock Enhancements — Search, Filter, Edit Piece

**Files:**
- Create: `src/components/magasin/stock-search.tsx`
- Create: `src/components/magasin/mouvement-filters.tsx`
- Create: `src/components/magasin/piece-edit-dialog.tsx`
- Modify: `src/app/(app)/magasin/page.tsx`
- Modify: `src/app/(app)/magasin/mouvements/page.tsx`
- Modify: `src/lib/actions/pieces.ts`
- Modify: `src/lib/actions/stock.ts`

- [ ] **Step 1: Create StockSearch component**

Create `src/components/magasin/stock-search.tsx`:

```tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useTransition } from "react";

export function StockSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function handleSearch(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set("q", value);
    } else {
      params.delete("q");
    }
    startTransition(() => {
      router.replace(`/magasin?${params.toString()}`);
    });
  }

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        placeholder="Rechercher par designation, code-barre, categorie..."
        defaultValue={searchParams.get("q") ?? ""}
        onChange={(e) => handleSearch(e.target.value)}
        className="pl-9"
      />
      {isPending && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">...</span>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create MouvementFilters component**

Create `src/components/magasin/mouvement-filters.tsx`:

```tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTransition } from "react";

export function MouvementFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function handleTypeChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "ALL") {
      params.set("type", value);
    } else {
      params.delete("type");
    }
    startTransition(() => {
      router.replace(`/magasin/mouvements?${params.toString()}`);
    });
  }

  return (
    <div className="flex gap-3">
      <Select defaultValue={searchParams.get("type") ?? "ALL"} onValueChange={handleTypeChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">Tous les types</SelectItem>
          <SelectItem value="ENTREE">Entrees</SelectItem>
          <SelectItem value="SORTIE">Sorties</SelectItem>
        </SelectContent>
      </Select>
      {isPending && <span className="text-xs text-muted-foreground self-center">...</span>}
    </div>
  );
}
```

- [ ] **Step 3: Add updatePiece action**

In `src/lib/actions/pieces.ts`, add:

```typescript
export async function updatePiece(id: string, data: unknown) {
  const parsed = pieceSchema.partial().safeParse(data);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const piece = await db.piece.update({
    where: { id },
    data: parsed.data,
  });
  revalidatePath("/magasin");
  return { data: piece };
}
```

- [ ] **Step 4: Create PieceEditDialog component**

Create `src/components/magasin/piece-edit-dialog.tsx`:

```tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { updatePiece } from "@/lib/actions/pieces";
import { Pencil } from "lucide-react";

interface PieceData {
  id: string;
  codeBarre: string;
  designation: string;
  categorie: string | null;
  prixUnitaire: number;
  seuilAlerte: number;
  emplacement: string | null;
}

export function PieceEditDialog({ piece }: { piece: PieceData }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    const data = {
      designation: fd.get("designation") as string,
      categorie: (fd.get("categorie") as string) || undefined,
      prixUnitaire: Number(fd.get("prixUnitaire")),
      seuilAlerte: Number(fd.get("seuilAlerte")),
      emplacement: (fd.get("emplacement") as string) || undefined,
    };
    const result = await updatePiece(piece.id, data);
    setLoading(false);
    if (result.error) {
      setError("Erreur lors de la modification");
      return;
    }
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-7 w-7">
          <Pencil className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Modifier — {piece.codeBarre}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="space-y-1.5">
            <Label>Designation</Label>
            <Input name="designation" defaultValue={piece.designation} required />
          </div>
          <div className="space-y-1.5">
            <Label>Categorie</Label>
            <Input name="categorie" defaultValue={piece.categorie ?? ""} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Prix unitaire (FCFA)</Label>
              <Input name="prixUnitaire" type="number" min={0} defaultValue={piece.prixUnitaire} required />
            </div>
            <div className="space-y-1.5">
              <Label>Seuil d'alerte</Label>
              <Input name="seuilAlerte" type="number" min={0} defaultValue={piece.seuilAlerte} required />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Emplacement</Label>
            <Input name="emplacement" defaultValue={piece.emplacement ?? ""} />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
            <Button type="submit" disabled={loading}>{loading ? "..." : "Enregistrer"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 5: Update magasin inventory page with search and edit**

Modify `src/app/(app)/magasin/page.tsx` to accept `searchParams`, pass `search` to `getPieces`, and add `PieceEditDialog` and `StockSearch`.

- [ ] **Step 6: Update movements page with filters**

Modify `src/app/(app)/magasin/mouvements/page.tsx` to accept `searchParams` and pass type filter.

Update `getMouvementsStock` in `src/lib/actions/stock.ts` to accept optional `type` parameter:

```typescript
export async function getMouvementsStock(type?: "ENTREE" | "SORTIE") {
  return db.mouvementStock.findMany({
    where: type ? { type } : undefined,
    include: {
      piece: { select: { codeBarre: true, designation: true } },
      effectuePar: { select: { nom: true, prenom: true } },
      picklist: { select: { numeroPicklist: true } },
    },
    orderBy: { date: "desc" },
    take: 200,
  });
}
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add stock search, movement filters, and piece edit dialog"
```

---

### Task 4: Magasinier Dashboard

**Files:**
- Create: `src/lib/actions/dashboard-magasinier.ts`
- Create: `src/app/(app)/magasin/dashboard/page.tsx`
- Modify: `src/components/layout/sidebar.tsx`

- [ ] **Step 1: Create Magasinier dashboard data action**

Create `src/lib/actions/dashboard-magasinier.ts`:

```typescript
"use server";

import { db } from "@/lib/db";
import { TypeMouvement } from "@prisma/client";

export async function getMagasinierDashboardStats() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const [
    totalReferences,
    totalValeur,
    piecesEnRupture,
    piecesStockBas,
    mouvementsAujourdhui,
    mouvementsCeMois,
    recentMouvements,
    topAlerts,
  ] = await Promise.all([
    db.piece.count(),
    db.piece.aggregate({ _sum: { quantiteEnStock: true } }),
    db.piece.count({ where: { quantiteEnStock: 0 } }),
    db.piece.findMany().then((pieces) =>
      pieces.filter((p) => p.quantiteEnStock > 0 && p.quantiteEnStock <= p.seuilAlerte).length
    ),
    db.mouvementStock.count({ where: { date: { gte: today } } }),
    db.mouvementStock.count({ where: { date: { gte: startOfMonth } } }),
    db.mouvementStock.findMany({
      take: 8,
      orderBy: { date: "desc" },
      include: {
        piece: { select: { codeBarre: true, designation: true } },
        effectuePar: { select: { nom: true, prenom: true } },
      },
    }),
    db.piece.findMany().then((pieces) =>
      pieces
        .filter((p) => p.quantiteEnStock <= p.seuilAlerte)
        .sort((a, b) => a.quantiteEnStock - b.quantiteEnStock)
        .slice(0, 5)
    ),
  ]);

  return {
    totalReferences,
    totalUnites: totalValeur._sum.quantiteEnStock ?? 0,
    piecesEnRupture,
    piecesStockBas,
    mouvementsAujourdhui,
    mouvementsCeMois,
    recentMouvements,
    topAlerts,
  };
}
```

- [ ] **Step 2: Create Magasinier dashboard page**

Create `src/app/(app)/magasin/dashboard/page.tsx` with:
- 4 KPI cards: Total references, Total unites en stock, En rupture (0), Stock bas
- Activity: mouvements aujourd'hui / ce mois
- Recent mouvements list (last 8)
- Top 5 low-stock alerts with quick link to `/magasin/alertes`

- [ ] **Step 3: Update sidebar — add dashboard link for Magasinier**

In `src/components/layout/sidebar.tsx`, update MAGASINIER nav:

```typescript
MAGASINIER: [
  { label: "Tableau de bord", href: "/magasin/dashboard", icon: LayoutDashboard },
  { label: "Inventaire", href: "/magasin", icon: Package },
  { label: "Entrée de stock", href: "/magasin/entree", icon: Package },
  { label: "Picklists à livrer", href: "/picklists", icon: FileText },
  { label: "Mouvements de stock", href: "/magasin/mouvements", icon: BarChart3 },
  { label: "Alertes stock bas", href: "/magasin/alertes", icon: Package },
],
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add Magasinier dashboard with stock KPIs and activity"
```

---

### Task 5: Receptionist Dashboard

**Files:**
- Create: `src/lib/actions/dashboard-receptionniste.ts`
- Create: `src/app/(app)/reception/dashboard/page.tsx`
- Modify: `src/components/layout/sidebar.tsx`

- [ ] **Step 1: Create Receptionist dashboard data action**

Create `src/lib/actions/dashboard-receptionniste.ts`:

```typescript
"use server";

import { db } from "@/lib/db";
import { StatutOR } from "@prisma/client";

export async function getReceptionnisteDashboardStats() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    vehiculesRecusCeMois,
    vehiculesRecusAujourdhui,
    ordresEnAttente,
    ordresEnCours,
    ordresClotureCeMois,
    recentOrdres,
    picklistsEnAttente,
  ] = await Promise.all([
    db.ordreReparation.count({ where: { createdAt: { gte: startOfMonth } } }),
    db.ordreReparation.count({ where: { createdAt: { gte: today } } }),
    db.ordreReparation.count({ where: { statut: StatutOR.EN_ATTENTE } }),
    db.ordreReparation.count({ where: { statut: StatutOR.EN_COURS } }),
    db.ordreReparation.count({ where: { statut: StatutOR.CLOTURE, updatedAt: { gte: startOfMonth } } }),
    db.ordreReparation.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      include: { vehicle: { include: { client: true } } },
    }),
    db.picklist.count({ where: { statut: "EN_ATTENTE" } }),
  ]);

  return {
    vehiculesRecusCeMois,
    vehiculesRecusAujourdhui,
    ordresEnAttente,
    ordresEnCours,
    ordresClotureCeMois,
    recentOrdres,
    picklistsEnAttente,
  };
}
```

- [ ] **Step 2: Create Receptionist dashboard page**

Create `src/app/(app)/reception/dashboard/page.tsx` with:
- 4 KPI cards: Vehicules recus ce mois, ORs en attente, ORs en cours, Clotures ce mois
- Quick action button: Nouvelle reception
- Recent ORs list (last 8) with status badges
- Today's activity count

- [ ] **Step 3: Update sidebar — add dashboard link for Receptionist**

In `src/components/layout/sidebar.tsx`, update RECEPTIONNISTE nav to point to `/reception/dashboard` instead of generic `/dashboard`.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add Receptionist dashboard with reception KPIs"
```

---

### Task 6: Enhance Controleur Dashboard

**Files:**
- Modify: `src/lib/actions/controleur.ts`
- Modify: `src/app/(app)/controleur/page.tsx`

- [ ] **Step 1: Add monthly stats to controleur actions**

In `src/lib/actions/controleur.ts`, update `getControleurStats`:

```typescript
export async function getControleurStats() {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [pannesNonAssignees, interventionsEnCours, picklistsEnAttente, interventionsTermineeCeMois, picklistsSigneesCeMois] =
    await Promise.all([
      db.panne.count({ where: { statut: StatutPanne.SIGNALE, mecanicienNom: null } }),
      db.intervention.count({ where: { statut: StatutIntervention.EN_COURS } }),
      db.picklist.count({ where: { statut: StatutPicklist.APPROUVE_ADMIN } }),
      db.intervention.count({ where: { statut: StatutIntervention.TERMINE, dateFin: { gte: startOfMonth } } }),
      db.picklist.count({ where: { statut: StatutPicklist.SIGNE, signatureControleur: { not: null } } }),
    ]);
  return { pannesNonAssignees, interventionsEnCours, picklistsEnAttente, interventionsTermineeCeMois, picklistsSigneesCeMois };
}
```

- [ ] **Step 2: Display new stats in controleur page**

Add two more KPI cards to the grid (make it 5 cards in a responsive grid):
- "Interventions terminees ce mois" with CheckCircle icon
- "Picklists signees" with ClipboardCheck icon

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: enhance Controleur dashboard with monthly stats"
```

---

### Task 7: Admin Permission Management

**Files:**
- Create: `src/lib/actions/permissions.ts`
- Create: `src/components/admin/user-permissions-dialog.tsx`
- Modify: `src/app/(app)/utilisateurs/page.tsx`
- Modify: `src/components/layout/sidebar.tsx`
- Modify: `src/lib/auth-utils.ts`

- [ ] **Step 1: Create permissions actions**

Create `src/lib/actions/permissions.ts`:

```typescript
"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

// Default permissions per role — all true initially
const defaultPermissionsByRole: Record<string, Record<string, boolean>> = {
  RECEPTIONNISTE: {
    "/reception/dashboard": true,
    "/reception/nouveau": true,
    "/ordres": true,
    "/picklists": true,
    "/paiements": true,
    "/factures": true,
  },
  MAGASINIER: {
    "/magasin/dashboard": true,
    "/magasin": true,
    "/magasin/entree": true,
    "/picklists": true,
    "/magasin/mouvements": true,
    "/magasin/alertes": true,
  },
  CONTROLEUR: {
    "/controleur": true,
    "/ordres": true,
    "/picklists": true,
    "/paiements": true,
    "/factures": true,
  },
};

export function getDefaultPermissions(role: string): Record<string, boolean> {
  return defaultPermissionsByRole[role] ?? {};
}

export async function getUserPermissions(userId: string, role: string): Promise<Record<string, boolean>> {
  const user = await db.user.findUnique({ where: { id: userId }, select: { permissions: true } });
  const stored = (user?.permissions as Record<string, boolean> | null) ?? {};
  const defaults = getDefaultPermissions(role);
  return { ...defaults, ...stored };
}

export async function updateUserPermissions(userId: string, permissions: Record<string, boolean>) {
  await db.user.update({
    where: { id: userId },
    data: { permissions },
  });
  revalidatePath("/utilisateurs");
  return { data: { success: true } };
}
```

- [ ] **Step 2: Create UserPermissionsDialog component**

Create `src/components/admin/user-permissions-dialog.tsx`:

A dialog that shows a checklist of all routes for that user's role. Admin can toggle each on/off. Saves via `updateUserPermissions`.

- [ ] **Step 3: Add permissions button to users page**

In `src/app/(app)/utilisateurs/page.tsx`, add a `UserPermissionsDialog` button next to each non-ADMIN, non-CLIENT user.

- [ ] **Step 4: Filter sidebar nav by user permissions**

In `src/components/layout/sidebar.tsx`, accept `permissions` prop and filter `items` to only show allowed routes.

In the layout that renders Sidebar, fetch user permissions and pass them.

- [ ] **Step 5: Update auth-utils with permission check**

In `src/lib/auth-utils.ts`, add:

```typescript
export async function checkPermission(path: string) {
  const session = await requireAuth();
  const role = (session.user as any).role as string;
  if (role === "ADMIN") return session;
  const userId = (session.user as any).id as string;
  const { getUserPermissions: getPerms } = await import("@/lib/actions/permissions");
  const perms = await getPerms(userId, role);
  if (perms[path] === false) redirect("/non-autorise");
  return session;
}
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add admin permission management per user with sidebar filtering"
```

---

### Task 8: Integration & Layout Wiring

**Files:**
- Modify: `src/app/(app)/layout.tsx`

- [ ] **Step 1: Pass permissions to Sidebar from layout**

Read the layout file. Update it to fetch user permissions and pass to Sidebar component.

- [ ] **Step 2: Verify build**

```bash
npx next build
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: wire permissions into app layout and sidebar"
```
