# CPS MAROUA — Application de Gestion de Garage

**Date:** 2026-03-28
**Status:** Approved
**Project:** GARAGEGSBPRO

---

## 1. Overview

Web application for **CPS MAROUA**, a civilian garage in Maroua, Cameroon. The app manages the full lifecycle of vehicle repairs: intake, diagnostics, parts management, repairs, invoicing, and payments. All UI text is in French. Currency is FCFA (XAF).

### Business Context
- Civilian commercial garage (not military)
- Handles: cars (voitures), trucks (camions), buses
- Revenue model: hourly labor rate + parts cost billed separately
- Payment methods: cash (espèces), Mobile Money (Orange/MTN), bank transfer (virement)
- Payment flow: deposit (acompte) at intake → client pays for parts per picklist → labor balance at closure

---

## 2. User Roles

| Role | Access |
|---|---|
| **Admin** | Full access: user management, reports, financials, settings, all data |
| **Réceptionniste** | Vehicle intake, client registration, OR generation, picklist entry, payments, invoice generation |
| **Magasinier** | Parts inventory (CRUD), barcode generation, picklist delivery, stock movement history, low-stock alerts |
| **Contrôleur** (Chef du Garage) | Operations command panel: assign mechanics to sections, sign picklists, sign vehicle release, monitor all active repairs, mechanic productivity |
| **Client** | View repair progress, vehicle history, invoices, payment history |

- No mechanic accounts — the Contrôleur manages all mechanic assignments and updates on their behalf.
- Admin can create/deactivate user accounts and assign roles via a management panel.

---

## 3. Workflow

### Step-by-step repair lifecycle:

**Step 1 — Réception (Réceptionniste)**
- Register or look up existing client (nom, prénom, téléphone, email, adresse)
- Register or look up existing vehicle (matricule, marque, modèle, type, numéro de châssis)
- Record intake data: kilométrage, niveau de carburant, niveau d'usure des pneus, lot de bord
- Record chauffeur info: nom, téléphone, service d'origine, date d'entrée
- Record reported problems (pannes signalées by the chauffeur)
- Check prochaine vidange (next oil change schedule)
- Generate **Ordre de Réparation (OR)** — PDF document

**Step 2 — Signature Chauffeur**
- Chauffeur reviews OR on screen and signs digitally to confirm accuracy of information

**Step 3 — Paiement Acompte (Réceptionniste)**
- Client pays an initial deposit (acompte)
- Record payment: amount, method (espèces/mobile money/virement), reference

**Step 4 — Assignation (Contrôleur)**
- Contrôleur reviews OR
- Performs deeper diagnostic check
- Assigns pannes to sections and specific mechanics
- Sections: Tôlerie, Soudure, Électricité, Poids Lourds, Poids Légers

**Step 5 — Réparation**
- Mechanics work on assigned pannes
- Contrôleur updates progress on their behalf
- When parts are needed, mechanic identifies them and gets barcodes from magasinier

**Step 6 — Picklist (Réceptionniste + Contrôleur + Magasinier)**
- Réceptionniste enters barcode(s) of needed parts into the system, linked to the OR and mechanic
- App generates **Picklist** PDF (OR number + parts with barcodes + mechanic name)
- Contrôleur signs the picklist to authorize
- Client pays for the parts on the picklist
- Magasinier receives signed picklist, delivers parts, stock is decremented
- Magasinier keeps picklist records to justify stock movements

**Steps 5-6 repeat** as needed until all repairs are complete.

**Step 7 — Test du Véhicule (Contrôleur)**
- Vehicle is tested after repairs
- If problems found → back to Step 5
- If OK → proceed to closure

**Step 8 — Fiche de Clôture (Auto-generated)**
- App generates **Fiche de Clôture** PDF containing:
  - OR reference
  - All work performed, organized by section
  - Name of each mechanic and their interventions
  - All parts taken (per mechanic, per section)

**Step 9 — Facture & Sortie (Réceptionniste + Contrôleur)**
- App generates **Facture** PDF: CPS MAROUA header, client info, vehicle info, parts total, labor total, grand total, payments received, remaining balance
- Client pays the remaining balance (labor costs)
- Contrôleur signs the OR closure to authorize vehicle release
- Vehicle exits

---

## 4. Data Model

### Enums

```
TypeVehicule: VOITURE | CAMION | BUS
Role: ADMIN | RECEPTIONNISTE | MAGASINIER | CONTROLEUR | CLIENT
Section: TOLERIE | SOUDURE | ELECTRICITE | POIDS_LOURDS | POIDS_LEGERS
StatutOR: EN_ATTENTE | EN_COURS | CLOTURE
StatutPanne: SIGNALE | EN_COURS | RESOLU
StatutIntervention: EN_COURS | TERMINE
StatutPicklist: EN_ATTENTE | SIGNE | DELIVRE
StatutPaiementPicklist: NON_PAYE | PAYE
StatutFacture: EN_ATTENTE | PAYEE
TypePaiement: ACOMPTE | PICKLIST | SOLDE_FINAL
MethodePaiement: ESPECES | MOBILE_MONEY | VIREMENT
TypeMouvement: ENTREE | SORTIE
```

### Tables

**User**
- id, nom, prenom, email (unique), password (hashed), telephone, role (enum), isActive, createdAt, updatedAt

**Client**
- id, nom, prenom, telephone (unique), email (optional), adresse, userId (FK → User, for portal login), createdAt

**Vehicle**
- id, matricule (unique), marque, modele, typeVehicule (enum), numeroChassis, clientId (FK → Client), createdAt

**OrdreReparation**
- id, numeroOR (auto: OR-YYYY-NNN), vehicleId (FK), chauffeurNom, chauffeurTel, serviceDorigine, kilometrage, niveauCarburant, niveauUsurePneus, lotDeBord (text), prochaineVidange, dateEntree, dateSortie (nullable), statut (enum), signatureChauffeur (text/base64), signatureControleur (text/base64, nullable), createdBy (FK → User), createdAt, updatedAt

**Panne**
- id, ordreReparationId (FK), description, section (enum), statut (enum), mecanicienNom (text), createdAt, updatedAt

**Intervention**
- id, ordreReparationId (FK), mecanicienNom (text), section (enum), description, heuresTravail (decimal), tauxHoraire (integer, FCFA), statut (enum), dateDebut, dateFin (nullable)

**Piece**
- id, codeBarre (unique), designation, categorie, prixUnitaire (integer, FCFA), quantiteEnStock (integer), seuilAlerte (integer), emplacement (text), createdAt, updatedAt

**Picklist**
- id, numeroPicklist (auto: PK-YYYY-NNN), ordreReparationId (FK), mecanicienNom (text), statut (enum), signatureControleur (text/base64, nullable), paiementStatut (enum), montantTotal (integer, FCFA), createdAt

**PicklistItem**
- id, picklistId (FK), pieceId (FK), quantite (integer), prixUnitaire (integer, FCFA)

**MouvementStock**
- id, pieceId (FK), type (enum), quantite (integer), picklistId (FK, nullable), motif (text), effectueParId (FK → User), date

**FicheCloture**
- id, numeroCloture (auto: FC-YYYY-NNN), ordreReparationId (FK), dateGeneration, signatureControleur (text/base64)

**Facture**
- id, numeroFacture (auto: FAC-YYYY-NNN), ordreReparationId (FK), clientId (FK), montantPieces (integer), montantMainOeuvre (integer), montantTotal (integer), montantPaye (integer), montantRestant (integer), statut (enum), dateEmission

**Paiement**
- id, montant (integer, FCFA), type (enum), methode (enum), ordreReparationId (FK), picklistId (FK, nullable), referencePaiement (text, nullable), date

---

## 5. Pages & Navigation

### Admin Dashboard
- Global KPIs: total vehicles, active repairs, revenue (day/week/month)
- Charts: revenue by payment method, repairs by section, monthly trends
- User management (CRUD, role assignment)
- Garage settings: hourly labor rate, sections, business info
- Full OR and invoice history with search/filter

### Contrôleur — Panneau de Commandes
- Real-time overview: all active ORs with status badges
- Kanban or list view: EN_ATTENTE → EN_COURS → CLOTURE
- Assignment panel: assign pannes to sections + mechanic names
- Pending picklists requiring signature
- Mechanic productivity tracking (hours, jobs completed)
- Vehicle release (sign clôture)

### Réceptionniste
- New OR form: multi-step wizard (client → vehicle → intake data → pannes → review → generate)
- Search existing clients/vehicles (auto-fill for returning clients)
- Picklist entry: scan or type barcodes, select OR and mechanic
- Payment recording: acompte, picklist payment, final balance
- Invoice generation and printing

### Magasinier
- Parts inventory: searchable table with barcode, designation, stock, price
- Add/edit parts with barcode generation
- Incoming stock registration (MouvementStock ENTREE)
- Pending picklists to deliver (signed + paid)
- Stock movement history
- Low stock alerts dashboard

### Client Portal
- Login with email/phone + password
- Repair tracking: current status with timeline visualization
- Vehicle history: all past repairs
- Invoices and payment history
- Status change notifications (in-app)

---

## 6. PDF Documents

Four auto-generated documents, all with CPS MAROUA header (logo, address, phone):

1. **Ordre de Réparation (OR)** — Vehicle info, intake data, reported pannes, driver signature area
2. **Picklist** — OR reference, list of parts (barcode + designation + quantity + price), mechanic name, Contrôleur signature area
3. **Fiche de Clôture** — OR reference, all interventions grouped by section, mechanic names, all parts used per mechanic/section
4. **Facture** — Client info, vehicle info, itemized parts, itemized labor (hours × rate per section), totals, payments received, balance

---

## 7. Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| UI Components | shadcn/ui |
| Styling | Tailwind CSS |
| Theme | Green garage theme (#166534 primary) with dark mode toggle |
| Database | PostgreSQL (hosted: Neon or Supabase DB) |
| ORM | Prisma |
| Auth | NextAuth.js v5 (credentials provider) |
| PDF Generation | @react-pdf/renderer |
| Barcode | react-barcode (generate) + html5-qrcode (scan) |
| Forms | React Hook Form + Zod |
| Client State | Zustand |
| Server State | React Query (TanStack Query) |
| Deployment | Vercel |

### Technical Decisions
- **Signatures:** Digital signature pad (react-signature-canvas), stored as base64 in database
- **Barcodes:** App generates barcodes for new parts. Picklist entry supports barcode scanner input or manual typing
- **PDF:** Server-side generation via API routes, downloadable and printable
- **Client updates:** Polling every 30 seconds on client portal (no WebSocket)
- **Currency:** FCFA (XAF), integer storage, no decimals
- **Auto-numbering:** OR-YYYY-NNN, PK-YYYY-NNN, FC-YYYY-NNN, FAC-YYYY-NNN (per year, auto-increment)
- **Responsive:** Desktop-first for staff dashboards, mobile-first for client portal
- **Mechanic tracking:** Mechanics don't have accounts — Contrôleur enters mechanic names as text fields when assigning work

---

## 8. Non-Functional Requirements

- **Performance:** Pages load under 2 seconds. Dashboard data cached with React Query.
- **Security:** Password hashing (bcrypt), role-based access control on all API routes, CSRF protection via NextAuth.
- **Data integrity:** All financial calculations server-side. Stock movements are atomic (transaction-protected).
- **Backup:** Database hosted on managed service (Neon/Supabase) with automatic backups.
- **Accessibility:** French language throughout, readable fonts, sufficient contrast on green theme.
