import React from "react";
import { Document, Page, Text, View } from "@react-pdf/renderer";
import { styles, formatMontant, formatDate } from "./shared-styles";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function PicklistPdf({ data }: { data: any }) {
  const picklist = data;
  const or = picklist.ordreReparation;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.companyName}>CPS MAROUA</Text>
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
              <Text style={styles.col2}>Désignation</Text>
              <Text style={styles.col3}>Quantité</Text>
              <Text style={styles.col4}>Prix unitaire</Text>
              <Text style={styles.col5}>Total</Text>
            </View>
            {picklist.items?.map((item: any, index: number) => (
              <View key={item.id} style={styles.tableRow}>
                <Text style={styles.col1}>{index + 1}</Text>
                <Text style={styles.col2}>
                  {item.piece?.designation || "-"}
                </Text>
                <Text style={styles.col3}>{item.quantite}</Text>
                <Text style={styles.col4}>
                  {formatMontant(item.prixUnitaire)}
                </Text>
                <Text style={styles.col5}>
                  {formatMontant(item.quantite * item.prixUnitaire)}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Total */}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total :</Text>
          <Text style={styles.totalValue}>
            {formatMontant(picklist.montantTotal)}
          </Text>
        </View>

        {/* Signatures */}
        <View style={styles.signatureArea}>
          <View style={styles.signatureBox}>
            <Text>Signature Mécanicien</Text>
          </View>
          <View style={styles.signatureBox}>
            <Text>Signature Contrôleur</Text>
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          CPS MAROUA — Picklist {picklist.numeroPicklist} — Généré le{" "}
          {formatDate(new Date())}
        </Text>
      </Page>
    </Document>
  );
}
