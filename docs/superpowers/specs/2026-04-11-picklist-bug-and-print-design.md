# Session 1 — Picklist Bug + Impression OR/Picklist

**Date :** 2026-04-11
**Périmètre :** 3 chantiers liés au flux OR / picklist
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

## Fichiers touchés (récapitulatif)

| Fichier | C1 | C2 | C3 |
|---|---|---|---|
| `src/lib/actions/ordres.ts` | ✅ | | |
| `src/app/(app)/picklists/nouveau/page.tsx` | ✅ | | |
| `src/lib/pdf/or-pdf.tsx` | | ✅ | ✅ |
| `src/lib/pdf/picklist-pdf.tsx` | | ✅ | ✅ |
| `src/lib/pdf/shared-styles.ts` | | ✅ | ✅ |
| `src/app/api/pdf/[type]/[id]/route.ts` | | ✅ (vérif) | |

---

## Plan de vérification

1. **Chantier 1** — créer un OR avec compte réception, se connecter en contrôleur, ouvrir `/picklists/nouveau`, vérifier que l'OR apparaît dans le dropdown même s'il est `EN_ATTENTE`
2. **Chantier 2** — signer un OR (chauffeur) puis générer le PDF — la signature doit apparaître. Idem pour picklist signé par contrôleur + admin
3. **Chantier 3** — générer 3 OR de tailles différentes (petit/moyen/grand) et vérifier que chacun tient sur 1 page avec une densité adaptée

---

## Hors périmètre (sessions futures)

- Mot de passe oublié + auto-changement (login + paramètres user)
- Chat privé (DM employé→employé) + canal public
- Purge automatique du chat à 24h (cron)

Ces chantiers feront l'objet de specs séparées car ils touchent à des sous-systèmes différents (auth + chat).
