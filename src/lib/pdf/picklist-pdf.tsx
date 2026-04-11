import React from "react";
import { Document, Page, Text, View, Image } from "@react-pdf/renderer";
import {
  getStyles,
  pickDensity,
  formatMontant,
  formatDate,
  CPS1_PATH,
  CPS2_PATH,
} from "./shared-styles";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function PicklistPdf({ data }: { data: any }) {
  const picklist = data;
  const or = picklist.ordreReparation;

  // A tâche adds a sub-row, so count it toward density.
  const rowCount = (picklist.items || []).reduce(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (sum: number, item: any) => sum + 1 + (item.tache ? 1 : 0),
    0
  );
  const styles = getStyles(pickDensity(rowCount));

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header Banner */}
        <Image src={CPS1_PATH} style={styles.headerImage} />
        <View style={styles.header}>
          <Text style={styles.title}>Bon de Sortie Pièces (Picklist)</Text>
          <Text style={styles.subtitle}>N° {picklist.numeroPicklist}</Text>
        </View>

        {/* Reference Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Références</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Ordre de Réparation :</Text>
            <Text style={styles.value}>{or?.numeroOR}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Mécanicien :</Text>
            <Text style={styles.value}>{picklist.mecanicienNom}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Statut :</Text>
            <Text style={styles.value}>{picklist.statut}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Date :</Text>
            <Text style={styles.value}>{formatDate(picklist.createdAt)}</Text>
          </View>
        </View>

        {/* Parts Table */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pièces demandées</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.col1}>#</Text>
              <Text style={styles.col2}>Désignation / Tâche associée</Text>
              <Text style={styles.col3}>Qté / Heures</Text>
              <Text style={styles.col4}>Prix unitaire</Text>
              <Text style={styles.col5}>Total</Text>
            </View>
            {picklist.items?.map((item: any, index: number) => {
              const ligneMO = Number(item.heuresMainOeuvre || 0) * Number(picklist.tauxHoraire || 0);
              const lignePieces = Number(item.prixUnitaire) * Number(item.quantite);
              return (
                <React.Fragment key={item.id}>
                  <View style={styles.tableRow}>
                    <Text style={styles.col1}>{index + 1}</Text>
                    <Text style={styles.col2}>
                      {item.piece?.designation || "-"}
                    </Text>
                    <Text style={styles.col3}>{item.quantite}</Text>
                    <Text style={styles.col4}>
                      {formatMontant(item.prixUnitaire)}
                    </Text>
                    <Text style={styles.col5}>
                      {formatMontant(lignePieces)}
                    </Text>
                  </View>
                  {item.tache && (
                    <View style={styles.tableRow}>
                      <Text style={styles.col1}></Text>
                      <Text style={styles.col2}>
                        ↳ {item.tache.description}
                        {item.tache.categorie ? ` (${item.tache.categorie})` : ""}
                      </Text>
                      <Text style={styles.col3}>
                        {Number(item.heuresMainOeuvre || 0)} h
                      </Text>
                      <Text style={styles.col4}>
                        {formatMontant(picklist.tauxHoraire || 0)}/h
                      </Text>
                      <Text style={styles.col5}>
                        {formatMontant(ligneMO)}
                      </Text>
                    </View>
                  )}
                </React.Fragment>
              );
            })}
          </View>
        </View>

        {/* Totals breakdown */}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total pièces :</Text>
          <Text style={styles.totalValue}>
            {formatMontant(picklist.montantPieces ?? picklist.montantTotal)}
          </Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>
            Main d&apos;œuvre ({formatMontant(picklist.tauxHoraire || 0)}/h) :
          </Text>
          <Text style={styles.totalValue}>
            {formatMontant(picklist.montantMainOeuvre ?? 0)}
          </Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total général :</Text>
          <Text style={styles.totalValue}>
            {formatMontant(picklist.montantTotal)}
          </Text>
        </View>

        {/* Signatures */}
        <View style={styles.signatureArea}>
          <View style={styles.signatureBox}>
            {picklist.signatureControleur && (
              <Image
                src={picklist.signatureControleur}
                style={styles.signatureImage}
              />
            )}
            <Text>Signature Contrôleur</Text>
          </View>
          <View style={styles.signatureBox}>
            {picklist.signatureAdmin && (
              <Image
                src={picklist.signatureAdmin}
                style={styles.signatureImage}
              />
            )}
            <Text>Signature Admin</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footerContainer} fixed>
          <Image src={CPS2_PATH} style={styles.footerImage} />
          <Text style={styles.footer}>
            CPS MAROUA — Picklist {picklist.numeroPicklist} — Généré le{" "}
            {formatDate(new Date())}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
