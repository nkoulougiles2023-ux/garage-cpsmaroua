import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { styles, formatMontant, formatDate } from "./shared-styles";

const localStyles = StyleSheet.create({
  twoCol: { flexDirection: "row", gap: 20, marginBottom: 12 },
  colHalf: { width: "48%" },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  summaryLabel: { fontSize: 11 },
  summaryValue: { fontSize: 11, fontWeight: "bold" },
  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
    paddingTop: 8,
    borderTop: "2 solid #166534",
    paddingHorizontal: 4,
  },
  grandTotalLabel: { fontSize: 14, fontWeight: "bold", color: "#166534" },
  grandTotalValue: { fontSize: 14, fontWeight: "bold", color: "#166534" },
  remainingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
    paddingHorizontal: 4,
  },
  remainingLabel: { fontSize: 12, fontWeight: "bold", color: "#dc2626" },
  remainingValue: { fontSize: 12, fontWeight: "bold", color: "#dc2626" },
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function FacturePdf({ data }: { data: any }) {
  const facture = data;
  const or = facture.ordreReparation;
  const client = facture.client;
  const vehicle = or?.vehicle;
  const interventions = or?.interventions || [];
  const picklists = or?.picklists || [];

  // Collect all parts
  const allParts: any[] = [];
  for (const picklist of picklists) {
    for (const item of picklist.items || []) {
      allParts.push(item);
    }
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.companyName}>CPS MAROUA</Text>
          <Text style={styles.title}>Facture</Text>
          <Text style={styles.subtitle}>N° {facture.numeroFacture}</Text>
        </View>

        {/* Client & Vehicle side by side */}
        <View style={localStyles.twoCol}>
          {/* Client */}
          <View style={localStyles.colHalf}>
            <Text style={styles.sectionTitle}>Client</Text>
            {client && (
              <>
                <View style={styles.row}>
                  <Text style={styles.label}>Nom :</Text>
                  <Text style={styles.value}>
                    {client.nom} {client.prenom}
                  </Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>Téléphone :</Text>
                  <Text style={styles.value}>{client.telephone}</Text>
                </View>
                {client.adresse && (
                  <View style={styles.row}>
                    <Text style={styles.label}>Adresse :</Text>
                    <Text style={styles.value}>{client.adresse}</Text>
                  </View>
                )}
              </>
            )}
          </View>

          {/* Vehicle */}
          <View style={localStyles.colHalf}>
            <Text style={styles.sectionTitle}>Véhicule</Text>
            {vehicle && (
              <>
                <View style={styles.row}>
                  <Text style={styles.label}>Matricule :</Text>
                  <Text style={styles.value}>{vehicle.matricule}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>Marque :</Text>
                  <Text style={styles.value}>
                    {vehicle.marque} {vehicle.modele}
                  </Text>
                </View>
              </>
            )}
            <View style={styles.row}>
              <Text style={styles.label}>OR :</Text>
              <Text style={styles.value}>{or?.numeroOR}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Date :</Text>
              <Text style={styles.value}>
                {formatDate(facture.dateEmission)}
              </Text>
            </View>
          </View>
        </View>

        {/* Parts Table */}
        {allParts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pièces</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={styles.col1}>#</Text>
                <Text style={styles.col2}>Désignation</Text>
                <Text style={styles.col3}>Quantité</Text>
                <Text style={styles.col4}>Prix unitaire</Text>
                <Text style={styles.col5}>Total</Text>
              </View>
              {allParts.map((item: any, index: number) => (
                <View key={`part-${item.id}-${index}`} style={styles.tableRow}>
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
        )}

        {/* Labor Table */}
        {interventions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Main d&apos;œuvre</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={styles.col1}>#</Text>
                <Text style={styles.col2}>Description</Text>
                <Text style={styles.col3}>Heures</Text>
                <Text style={styles.col4}>Taux horaire</Text>
                <Text style={styles.col5}>Total</Text>
              </View>
              {interventions.map((intervention: any, index: number) => {
                const hours = Number(intervention.heuresTravail);
                const rate = intervention.tauxHoraire;
                return (
                  <View key={intervention.id} style={styles.tableRow}>
                    <Text style={styles.col1}>{index + 1}</Text>
                    <Text style={styles.col2}>
                      {intervention.description}
                    </Text>
                    <Text style={styles.col3}>{hours}h</Text>
                    <Text style={styles.col4}>{formatMontant(rate)}</Text>
                    <Text style={styles.col5}>
                      {formatMontant(Math.round(hours * rate))}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Totals Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Récapitulatif</Text>
          <View style={localStyles.summaryRow}>
            <Text style={localStyles.summaryLabel}>Total Pièces :</Text>
            <Text style={localStyles.summaryValue}>
              {formatMontant(facture.montantPieces)}
            </Text>
          </View>
          <View style={localStyles.summaryRow}>
            <Text style={localStyles.summaryLabel}>
              Total Main d&apos;œuvre :
            </Text>
            <Text style={localStyles.summaryValue}>
              {formatMontant(facture.montantMainOeuvre)}
            </Text>
          </View>
          <View style={localStyles.grandTotalRow}>
            <Text style={localStyles.grandTotalLabel}>TOTAL :</Text>
            <Text style={localStyles.grandTotalValue}>
              {formatMontant(facture.montantTotal)}
            </Text>
          </View>
          <View style={localStyles.summaryRow}>
            <Text style={localStyles.summaryLabel}>Montant payé :</Text>
            <Text style={localStyles.summaryValue}>
              {formatMontant(facture.montantPaye)}
            </Text>
          </View>
          {facture.montantRestant > 0 && (
            <View style={localStyles.remainingRow}>
              <Text style={localStyles.remainingLabel}>Reste à payer :</Text>
              <Text style={localStyles.remainingValue}>
                {formatMontant(facture.montantRestant)}
              </Text>
            </View>
          )}
        </View>

        {/* Signatures */}
        <View style={styles.signatureArea}>
          <View style={styles.signatureBox}>
            <Text>Signature Client</Text>
          </View>
          <View style={styles.signatureBox}>
            <Text>Signature CPS MAROUA</Text>
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          CPS MAROUA — Facture {facture.numeroFacture} — Généré le{" "}
          {formatDate(new Date())}
        </Text>
      </Page>
    </Document>
  );
}
