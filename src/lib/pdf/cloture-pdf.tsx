import React from "react";
import { Document, Page, Text, View } from "@react-pdf/renderer";
import { styles, formatMontant, formatDate } from "./shared-styles";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function CloturePdf({ data }: { data: any }) {
  const cloture = data;
  const or = cloture.ordreReparation;
  const vehicle = or?.vehicle;
  const interventions = or?.interventions || [];
  const picklists = or?.picklists || [];

  // Group interventions by section
  const interventionsBySection: Record<string, any[]> = {};
  for (const intervention of interventions) {
    const section = intervention.section || "AUTRE";
    if (!interventionsBySection[section]) {
      interventionsBySection[section] = [];
    }
    interventionsBySection[section].push(intervention);
  }

  // Collect all parts from all picklists
  const allParts: any[] = [];
  for (const picklist of picklists) {
    for (const item of picklist.items || []) {
      allParts.push({
        ...item,
        picklistNumero: picklist.numeroPicklist,
      });
    }
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.companyName}>CPS MAROUA</Text>
          <Text style={styles.title}>Fiche de Clôture</Text>
          <Text style={styles.subtitle}>N° {cloture.numeroCloture}</Text>
        </View>

        {/* Reference Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Références</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Ordre de Réparation :</Text>
            <Text style={styles.value}>{or?.numeroOR}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Date de clôture :</Text>
            <Text style={styles.value}>
              {formatDate(cloture.dateGeneration)}
            </Text>
          </View>
        </View>

        {/* Vehicle Info */}
        {vehicle && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Véhicule</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Matricule :</Text>
              <Text style={styles.value}>{vehicle.matricule}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Marque / Modèle :</Text>
              <Text style={styles.value}>
                {vehicle.marque} {vehicle.modele}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Type :</Text>
              <Text style={styles.value}>{vehicle.typeVehicule}</Text>
            </View>
          </View>
        )}

        {/* Interventions by Section */}
        {Object.entries(interventionsBySection).map(
          ([section, sectionInterventions]) => (
            <View key={section} style={styles.section}>
              <Text style={styles.sectionTitle}>
                Interventions — {section.replace(/_/g, " ")}
              </Text>
              <View style={styles.table}>
                <View style={styles.tableHeader}>
                  <Text style={styles.col1}>#</Text>
                  <Text style={styles.col2}>Description</Text>
                  <Text style={styles.col3}>Mécanicien</Text>
                  <Text style={styles.col4}>Heures</Text>
                  <Text style={styles.col5}>Statut</Text>
                </View>
                {sectionInterventions.map(
                  (intervention: any, index: number) => (
                    <View key={intervention.id} style={styles.tableRow}>
                      <Text style={styles.col1}>{index + 1}</Text>
                      <Text style={styles.col2}>
                        {intervention.description}
                      </Text>
                      <Text style={styles.col3}>
                        {intervention.mecanicienNom}
                      </Text>
                      <Text style={styles.col4}>
                        {Number(intervention.heuresTravail)}h
                      </Text>
                      <Text style={styles.col5}>{intervention.statut}</Text>
                    </View>
                  )
                )}
              </View>
            </View>
          )
        )}

        {/* Parts Used */}
        {allParts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pièces utilisées</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={styles.col1}>#</Text>
                <Text style={styles.col2}>Désignation</Text>
                <Text style={styles.col3}>Quantité</Text>
                <Text style={styles.col4}>Prix unitaire</Text>
                <Text style={styles.col5}>Total</Text>
              </View>
              {allParts.map((item: any, index: number) => (
                <View key={`${item.id}-${index}`} style={styles.tableRow}>
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

        {/* Signatures */}
        <View style={styles.signatureArea}>
          <View style={styles.signatureBox}>
            <Text>Signature Contrôleur</Text>
          </View>
          <View style={styles.signatureBox}>
            <Text>Signature Responsable</Text>
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          CPS MAROUA — Fiche de Clôture {cloture.numeroCloture} — Généré le{" "}
          {formatDate(new Date())}
        </Text>
      </Page>
    </Document>
  );
}
