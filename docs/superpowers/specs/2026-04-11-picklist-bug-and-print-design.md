# Session 1 — Picklist Bug + Impression OR/Picklist + Catalogue Tâches

**Date :** 2026-04-11
**Périmètre :** 4 chantiers liés au flux OR / picklist / facture
**Hors périmètre (session future) :** mot de passe oublié, chat privé/public, purge chat 24h

## Contexte

Suite au signalement utilisateur :

> « La session contrôleur n'arrive pas à créer le picklist car l'onglet OR ne se déroule pas pour choisir et continuer ensuite. Faut s'assurer que la signature sur l'OR se voit sur la fiche de l'OR lors de l'impression et faut toujours s'assurer que chaque fiche OR ou picklist doit toujours être sur une seule page. »

Ce document spécifie le fix du bug bloquant + deux améliorations d'impression PDF.

---

## Chantier 1 — Bug : dropdown OR vide sur formulaire picklist

### Problème observé

Le contrôleur ouvre `/picklists/nouveau`, clique sur le dropdown « Ordre de Réparation » et ne peut rien sélectionner.

### Cause racine

`src/app/(app)/picklists/nouveau/page.tsx:8` charge uniquement les OR avec statut `EN_COURS` :

```ts
const ordres = await getOrdres(StatutOR.EN_COURS);
```

Or :
- Le statut par défaut d'un nouvel OR est `EN_ATTENTE` (`prisma/schema.prisma:154`)
- Le passage `EN_ATTENTE → EN_COURS` n'est pas automatique
- Si tous les OR actifs sont `EN_ATTENTE`, le dropdown apparaît vide → impression de « ne pas s'ouvrir »

### Solution

Charger les OR `EN_ATTENTE` ET `EN_COURS` (exclure uniquement `CLOTURE`).

**Modifications :**

1. **`src/lib/actions/ordres.ts`** — étendre `getOrdres` pour accepter un statut unique OU un tableau :
   ```ts
   export async function getOrdres(statut?: StatutOR | StatutOR[]) {
     const where = statut
       ? { statut: Array.isArray(statut) ? { in: statut } : statut }
       : undefined;
     return db.ordreReparation.findMany({
       where,
       include: { /* ...inchangé... */ },
       orderBy: { createdAt: "desc" },
     });
   }
   ```

2. **`src/app/(app)/picklists/nouveau/page.tsx`** — appel à jour :
   ```ts
   const ordres = await getOrdres([StatutOR.EN_ATTENTE, StatutOR.EN_COURS]);
   ```

### Critères d'acceptation

- Quand au moins un OR `EN_ATTENTE` ou `EN_COURS` existe, il apparaît dans le dropdown
- Les OR `CLOTURE` ne sont jamais proposés
- Aucun appel existant à `getOrdres()` n'est cassé (signature rétro-compatible : un statut unique fonctionne toujours)

---

## Chantier 2 — Signatures visibles sur impression OR & Picklist

### Problème observé

À l'impression, les fiches OR et picklist affichent la zone « Signature » mais pas l'image de la signature, même quand elle a été enregistrée.

### Cause racine

`src/lib/pdf/or-pdf.tsx:246-253` et `src/lib/pdf/picklist-pdf.tsx:79-86` rendent uniquement un libellé texte dans la zone signature :

```tsx
<View style={styles.signatureBox}>
  <Text>Signature Chauffeur</Text>
</View>
```

Les champs `signatureChauffeur`, `signatureControleur`, `signatureAdmin` du modèle Prisma contiennent pourtant les data-URI base64 (utilisés correctement par la page web `ordres/[id]/page.tsx:115`).

### Solution

Dans chaque `signatureBox`, si la signature existe, rendre `<Image src={signature} style={...} />` AU-DESSUS du libellé.

**Modifications :**

1. **`src/lib/pdf/or-pdf.tsx`** — bloc signatures (lignes 246-253) :
   ```tsx
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

2. **`src/lib/pdf/picklist-pdf.tsx`** — même pattern pour `signatureControleur` et `signatureAdmin` (les deux signatures du picklist).

3. **`src/lib/pdf/shared-styles.ts`** — ajouter le style commun :
   ```ts
   signatureImage: {
     height: 40,
     marginBottom: 2,
     objectFit: "contain",
   }
   ```

4. **`src/app/api/pdf/[type]/[id]/route.ts`** — vérifier que la query OR sélectionne bien `signatureChauffeur` ET `signatureControleur`. Prisma sélectionne tous les champs scalaires par défaut, donc en principe c'est déjà OK — vérification de routine.

### Critères d'acceptation

- Si la signature chauffeur a été tracée sur l'OR, elle apparaît sur le PDF imprimé
- Idem pour la signature contrôleur (OR)
- Idem pour signature contrôleur + admin (picklist)
- Si aucune signature n'a été enregistrée, la zone affiche uniquement le libellé (comportement actuel préservé)

---

## Chantier 3 — Format dynamique sur 1 page (OR + picklist)

### Problème

Les PDFs actuels utilisent un layout fixe (fontSize 10, padding 40). Les OR ou picklists chargés (beaucoup de pannes/interventions/items) débordent sur une 2e page avec un grand espace blanc, ce qui n'est pas accepté en contexte militaire (chaque fiche doit être archivée sur **une feuille**).

### Solution — Densité adaptative à 3 presets

On classe le contenu en 3 niveaux selon le total de lignes (`pannes + interventions + items`) :

| Preset | Seuil de lignes | fontSize | padding | section spacing |
|---|---|---|---|---|
| `comfortable` | ≤ 12 | 10pt | 40 | normal |
| `compact` | 13–25 | 8.5pt | 25 | réduit |
| `dense` | 26–45 | 7pt | 18 | minimal |

Au-delà de 45 lignes (cas extrême), le format reste `dense` et accepte un débordement (cas exceptionnel — un OR aussi gros est rare).

### Approche technique

1. **`src/lib/pdf/shared-styles.ts`** — exporter une factory `getStyles(preset: 'comfortable' | 'compact' | 'dense')` qui retourne le `StyleSheet.create(...)` adapté. Garder `styles` par défaut (= `comfortable`) pour rétro-compatibilité avec `cloture-pdf.tsx` et `facture-pdf.tsx`.

2. **`src/lib/pdf/or-pdf.tsx`** — au début du composant :
   ```tsx
   const lineCount = (or.pannes?.length ?? 0)
                   + (or.interventions?.length ?? 0)
                   + allParts.length;
   const preset = lineCount <= 12 ? "comfortable"
                : lineCount <= 25 ? "compact"
                : "dense";
   const styles = getStyles(preset);
   ```
   Le reste du composant utilise `styles.xxx` exactement comme aujourd'hui (zéro changement structurel).

3. **`src/lib/pdf/picklist-pdf.tsx`** — même principe, basé sur `picklist.items.length` :
   ```tsx
   const lineCount = picklist.items?.length ?? 0;
   const preset = lineCount <= 10 ? "comfortable"
                : lineCount <= 22 ? "compact"
                : "dense";
   ```

4. **Bonus — étirement vertical** : la zone signature utilise `marginTop: "auto"` (au lieu de `marginTop: 30`) pour pousser les signatures vers le bas et combler le vide quand le contenu est court. Si `@react-pdf` ne supporte pas `marginTop: auto`, fallback : `flexGrow: 1` sur un spacer entre la dernière section et `signatureArea`.

### Critères d'acceptation

- Un OR avec 3 pannes + 2 interventions + 5 pièces tient en 1 page format `comfortable` (lisible)
- Un OR avec 8 pannes + 6 interventions + 15 pièces tient en 1 page format `compact`
- Un OR avec 15 pannes + 10 interventions + 18 pièces tient en 1 page format `dense`
- Un picklist avec 6 pièces utilise `comfortable`, avec 18 pièces → `compact`, avec 30 → `dense`
- Les fiches existantes `cloture-pdf.tsx` et `facture-pdf.tsx` ne sont pas affectées (out of scope)

---

---

## Chantier 4 — Catalogue de tâches → calcul auto de la facture

### Contexte

Le fichier `Image/DESCRIPTION DES TACHES AVEC LES HEURES ALADJ.xlsx` (2590 lignes) contient le référentiel des tâches du garage avec leur durée standard. Aujourd'hui, la facture est calculée à partir de :
- `montantPieces` (somme des picklist items)
- `montantMainOeuvre` (basé sur les `Intervention` saisies à la main par le contrôleur, avec heures et taux libres)

Cette saisie libre est source d'erreurs. L'objectif : associer **chaque ligne de picklist à une tâche du catalogue**, ce qui auto-remplit les heures et permet de calculer la main d'œuvre **sans erreur**.

### Décisions de conception (validées par l'utilisateur)

- **Mapping pièce ↔ tâche → Option C :** chaque ligne de picklist contient `pieceId` + `tacheId` (la tâche est sélectionnée par le contrôleur lors de la création du picklist)
- **Taux horaire → niveau picklist :** un seul taux saisi à la création du picklist, appliqué à toutes les lignes (évite la saisie ligne par ligne)

### Structure des données (Excel)

| Champ | Valeurs |
|---|---|
| `DESCRIPTION` | Nom de la tâche (libellé en MAJUSCULES) |
| `CATEGORIE` | Repair (1997) / Light Vehicle (217) / Service (130) / Autre (94) / Heavy Duty (56) / Generator (42) / Motor bike (26) / Accident (7) / VL (1) / *(20 lignes sans catégorie)* |
| `HEURE` | Nombre d'heures (1, 0.5, 2, 5…), ou la valeur littérale `AD` pour 7 tâches « Accident » signifiant « à devis » (heures à saisir manuellement), ou null (1 ligne) |

### Modifications du schéma Prisma

```prisma
model TacheCatalogue {
  id          String   @id @default(cuid())
  description String
  categorie   String?
  heuresStd   Decimal? // null si "AD" (à devis) — saisie manuelle requise
  createdAt   DateTime @default(now())

  picklistItems PicklistItem[]

  @@index([description])
  @@index([categorie])
}

model Picklist {
  // ...champs existants...
  tauxHoraire        Int  @default(0) // FCFA/h, saisi à la création
  montantPieces      Int  @default(0) // sous-total pièces
  montantMainOeuvre  Int  @default(0) // Σ(heures × tauxHoraire)
  // montantTotal devient = montantPieces + montantMainOeuvre
}

model PicklistItem {
  // ...champs existants...
  tacheId           String?         // optionnel → Option C, mais doit être renseigné pour facturation
  tache             TacheCatalogue? @relation(fields: [tacheId], references: [id])
  heuresMainOeuvre  Decimal         @default(0) // SNAPSHOT à la création (figé même si catalogue modifié plus tard)
}
```

**Pourquoi un snapshot `heuresMainOeuvre` sur l'item :** si on modifie plus tard `TacheCatalogue.heuresStd`, les picklists déjà créés ne doivent PAS changer rétroactivement (intégrité comptable).

### Migration & Seed

1. **Migration Prisma** : `add_tache_catalogue_and_picklist_pricing`
2. **Script de seed** `prisma/seed-tache-catalogue.ts` qui :
   - Lit `Image/DESCRIPTION DES TACHES AVEC LES HEURES ALADJ.xlsx` via la lib `xlsx` (npm package, ajouter en devDependency)
   - Pour chaque ligne valide : `description` non vide → upsert dans `TacheCatalogue`
   - Si `HEURE === "AD"` ou null → `heuresStd = null`
   - Sinon `heuresStd = parseFloat(...)` 
   - Idempotent : peut être ré-exécuté sans dupliquer (clé d'unicité = description normalisée en MAJ + categorie)

### Modifications côté server actions

**`src/lib/actions/picklists.ts`** :
- `createPicklist` accepte désormais `tauxHoraire: number` et `items: { pieceId, quantite, prixUnitaire, tacheId, heuresMainOeuvre }[]`
- Calcule `montantPieces`, `montantMainOeuvre = Σ(heuresMainOeuvre × tauxHoraire)`, `montantTotal = montantPieces + montantMainOeuvre`
- Si une ligne a `tacheId` mais pas `heuresMainOeuvre` (cas `AD`), impose une saisie manuelle (validation Zod : `heuresMainOeuvre > 0`)

**Nouveau server action** `src/lib/actions/taches.ts` :
- `searchTaches(query: string, categorie?: string)` : retourne max 50 résultats, recherche full-text simple sur description (`contains`, case-insensitive)

### Modifications UI — `picklist-form.tsx`

1. **Champ `tauxHoraire`** ajouté en haut du formulaire (Input number, label « Taux horaire (FCFA/h) »)
2. **Pour chaque ligne ajoutée** (après scan barcode), nouvelle colonne « Tâche » avec un **TaskPicker** :
   - Composant `TaskPicker` (nouveau) — Combobox base-ui avec recherche serveur (debounce 300ms)
   - Affiche : `[CATEGORIE] DESCRIPTION — 1.5h`
   - À la sélection : auto-remplit `heuresMainOeuvre` depuis `tache.heuresStd`
   - Si `heuresStd === null` (cas AD) : champ heures devient éditable et obligatoire
3. **Récap en bas** :
   ```
   Pièces :         X FCFA
   Main d'œuvre :   Y FCFA  (Σ heures = N h × taux)
   Total picklist : Z FCFA
   ```
4. **Bouton « Créer le picklist » désactivé** tant que toute ligne n'a pas de tâche assignée

### Impact sur la facture

`src/lib/actions/factures.ts` (à inspecter, peut-être ailleurs) :
- `Facture.montantPieces` = Σ `Picklist.montantPieces` du même OR
- `Facture.montantMainOeuvre` = Σ `Picklist.montantMainOeuvre` du même OR
- **Les `Intervention.heuresTravail` et `Intervention.tauxHoraire` ne sont plus utilisés pour le calcul de la facture** — ils restent au schéma à titre informatif (assignations contrôleur → mécanicien) mais ne nourrissent plus la facture
- ⚠️ Vérification à faire : si les factures actuelles sont calculées différemment, adapter le code et migrer les anciennes (peut-être recalculer depuis les picklists existants si possible)

### Impact sur l'impression picklist (Chantier 2 & 3)

Le PDF picklist (`src/lib/pdf/picklist-pdf.tsx`) doit afficher 2 sous-tableaux ou enrichir le tableau existant :
- Colonne « Tâche » + « Heures » par ligne
- Sous-totaux : Pièces / Main d'œuvre / Total

Cela impacte directement le Chantier 3 (densité 1-page) — il faudra recalibrer les seuils car les colonnes sont plus chargées :

| Preset | Seuil | fontSize |
|---|---|---|
| `comfortable` | ≤ 8 lignes | 10pt |
| `compact` | 9–18 lignes | 8.5pt |
| `dense` | 19–35 lignes | 7pt |

### Critères d'acceptation

- Le seed importe les ~2570 tâches valides du fichier Excel sans erreur (et ignore les lignes vides/invalides)
- Le contrôleur peut chercher une tâche dans le picker en tapant des mots-clés (« filtre huile » → trouve « RENOUVELER LE FILTRE A HUILE »)
- À la sélection d'une tâche, les heures s'affichent automatiquement
- Pour une tâche `AD`, le contrôleur doit saisir les heures manuellement, sinon il ne peut pas valider
- Le total picklist = pièces + main d'œuvre, calculé sans intervention de l'utilisateur
- La facture générée pour un OR additionne correctement tous les picklists (pièces + main d'œuvre)
- Modifier `TacheCatalogue.heuresStd` après coup ne modifie PAS un picklist déjà créé

---

## Fichiers touchés (récapitulatif)

| Fichier | C1 | C2 | C3 | C4 |
|---|---|---|---|---|
| `src/lib/actions/ordres.ts` | ✅ | | | |
| `src/app/(app)/picklists/nouveau/page.tsx` | ✅ | | | ✅ (catalogue) |
| `src/lib/pdf/or-pdf.tsx` | | ✅ | ✅ | |
| `src/lib/pdf/picklist-pdf.tsx` | | ✅ | ✅ | ✅ (colonnes tâche) |
| `src/lib/pdf/shared-styles.ts` | | ✅ | ✅ | |
| `src/app/api/pdf/[type]/[id]/route.ts` | | ✅ (vérif) | | |
| `prisma/schema.prisma` | | | | ✅ |
| `prisma/migrations/<new>/migration.sql` | | | | ✅ |
| `prisma/seed-tache-catalogue.ts` (nouveau) | | | | ✅ |
| `src/lib/actions/picklists.ts` | | | | ✅ |
| `src/lib/actions/taches.ts` (nouveau) | | | | ✅ |
| `src/lib/actions/factures.ts` | | | | ✅ |
| `src/components/picklists/picklist-form.tsx` | | | | ✅ |
| `src/components/picklists/task-picker.tsx` (nouveau) | | | | ✅ |
| `src/lib/validators/picklist.ts` | | | | ✅ |
| `package.json` (ajout `xlsx`) | | | | ✅ |

---

## Plan de vérification

1. **Chantier 1** — créer un OR avec compte réception, se connecter en contrôleur, ouvrir `/picklists/nouveau`, vérifier que l'OR apparaît dans le dropdown même s'il est `EN_ATTENTE`
2. **Chantier 2** — signer un OR (chauffeur) puis générer le PDF — la signature doit apparaître. Idem pour picklist signé par contrôleur + admin
3. **Chantier 3** — générer 3 OR de tailles différentes (petit/moyen/grand) et vérifier que chacun tient sur 1 page avec une densité adaptée
4. **Chantier 4** — exécuter le seed, vérifier le nombre de tâches importées (~2570). Créer un picklist de test avec 3 pièces + 3 tâches du catalogue + un taux horaire. Vérifier le total = pièces + (heures × taux). Générer la facture de l'OR et vérifier qu'elle reprend ces montants. Modifier ensuite la `heuresStd` d'une tâche dans le catalogue et vérifier que le picklist déjà créé n'a PAS changé.

---

## Hors périmètre (sessions futures)

- Mot de passe oublié + auto-changement (login + paramètres user)
- Chat privé (DM employé→employé) + canal public
- Purge automatique du chat à 24h (cron)

Ces chantiers feront l'objet de specs séparées car ils touchent à des sous-systèmes différents (auth + chat).
