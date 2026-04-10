import React from "react";
import { Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";
import { styles, formatMontant, formatDate, CPS1_PATH, CPS2_PATH } from "./shared-styles";

const local = StyleSheet.create({
  twoCol: { flexDirection: "row", gap: 12, marginBottom: 8 },
  colHalf: { width: "49%" },
  compactSection: { marginBottom: 6 },
  compactSectionTitle: {
    fontSize: 10,
    fontWeight: "bold",
    borderBottom: "1 solid #166534",
    paddingBottom: 2,
    marginBottom: 4,
    color: "#166534",
  },
  compactRow: { flexDirection: "row", marginBottom: 2 },
  compactLabel: { color: "#666", width: "42%", fontSize: 8 },
  compactValue: { fontWeight: "bold", width: "58%", fontSize: 8 },
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function OrPdf({ data }: { data: any }) {
  const or = data;
  const vehicle = or.vehicle;
  const client = vehicle?.client;
  const interventions = or.interventions || [];
  const picklists = or.picklists || [];

  // Collect all parts from picklists
  const allParts: any[] = [];
  for (const picklist of picklists) {
    for (const item of picklist.items || []) {
      allParts.push({ ...item, picklistNumero: picklist.numeroPicklist });
    }
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header Banner */}
        <Image src={CPS1_PATH} style={styles.headerImage} />
        <View style={styles.header}>
          <Text style={styles.title}>Ordre de Réparation</Text>
          <Text style={styles.subtitle}>N° {or.numeroOR}</Text>
        </View>

        {/* Row 1: Vehicle + Client side by side */}
        <View style={local.twoCol}>
          {/* Vehicle Info */}
          <View style={local.colHalf}>
            <Text style={local.compactSectionTitle}>Véhicule</Text>
            <View style={local.compactRow}>
              <Text style={local.compactLabel}>Matricule :</Text>
              <Text style={local.compactValue}>{vehicle?.matricule}</Text>
            </View>
            <View style={local.compactRow}>
              <Text style={local.compactLabel}>Marque / Modèle :</Text>
              <Text style={local.compactValue}>
                {vehicle?.marque} {vehicle?.modele}
              </Text>
            </View>
            <View style={local.compactRow}>
              <Text style={local.compactLabel}>Type :</Text>
              <Text style={local.compactValue}>{vehicle?.typeVehicule}</Text>
            </View>
            {vehicle?.numeroChassis && (
              <View style={local.compactRow}>
                <Text style={local.compactLabel}>N° Châssis :</Text>
                <Text style={local.compactValue}>{vehicle.numeroChassis}</Text>
              </View>
            )}
          </View>

          {/* Client Info */}
          <View style={local.colHalf}>
            <Text style={local.compactSectionTitle}>Client</Text>
            {client ? (
              <>
                <View style={local.compactRow}>
                  <Text style={local.compactLabel}>Nom :</Text>
                  <Text style={local.compactValue}>
                    {client.nom} {client.prenom}
                  </Text>
                </View>
                <View style={local.compactRow}>
                  <Text style={local.compactLabel}>Téléphone :</Text>
                  <Text style={local.compactValue}>{client.telephone}</Text>
                </View>
                {client.adresse && (
                  <View style={local.compactRow}>
                    <Text style={local.compactLabel}>Adresse :</Text>
                    <Text style={local.compactValue}>{client.adresse}</Text>
                  </View>
                )}
              </>
            ) : (
              <Text style={local.compactValue}>—</Text>
            )}
          </View>
        </View>

        {/* Row 2: Chauffeur + État à l'entrée side by side */}
        <View style={local.twoCol}>
          {/* Chauffeur Info */}
          <View style={local.colHalf}>
            <Text style={local.compactSectionTitle}>Chauffeur</Text>
            <View style={local.compactRow}>
              <Text style={local.compactLabel}>Nom :</Text>
              <Text style={local.compactValue}>{or.chauffeurNom}</Text>
            </View>
            <View style={local.compactRow}>
              <Text style={local.compactLabel}>Téléphone :</Text>
              <Text style={local.compactValue}>{or.chauffeurTel}</Text>
            </View>
            {or.serviceDorigine && (
              <View style={local.compactRow}>
                <Text style={local.compactLabel}>Service :</Text>
                <Text style={local.compactValue}>{or.serviceDorigine}</Text>
              </View>
            )}
          </View>

          {/* Intake Data */}
          <View style={local.colHalf}>
            <Text style={local.compactSectionTitle}>
              État à l&apos;entrée
            </Text>
            <View style={local.compactRow}>
              <Text style={local.compactLabel}>Kilométrage :</Text>
              <Text style={local.compactValue}>
                {or.kilometrage.toLocaleString("fr-FR")} km
              </Text>
            </View>
            <View style={local.compactRow}>
              <Text style={local.compactLabel}>Carburant :</Text>
              <Text style={local.compactValue}>{or.niveauCarburant}</Text>
            </View>
            <View style={local.compactRow}>
              <Text style={local.compactLabel}>Pneus :</Text>
              <Text style={local.compactValue}>{or.niveauUsurePneus}</Text>
            </View>
            {or.lotDeBord && (
              <View style={local.compactRow}>
                <Text style={local.compactLabel}>Lot de bord :</Text>
                <Text style={local.compactValue}>{or.lotDeBord}</Text>
              </View>
            )}
            {or.prochaineVidange && (
              <View style={local.compactRow}>
                <Text style={local.compactLabel}>Proch. vidange :</Text>
                <Text style={local.compactValue}>{or.prochaineVidange}</Text>
              </View>
            )}
            <View style={local.compactRow}>
              <Text style={local.compactLabel}>Date entrée :</Text>
              <Text style={local.compactValue}>
                {formatDate(or.dateEntree)}
              </Text>
            </View>
          </View>
        </View>

        {/* Pannes */}
        {or.pannes && or.pannes.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pannes signalées</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={styles.col1}>#</Text>
                <Text style={styles.col2}>Description</Text>
                <Text style={styles.col3}>Section</Text>
                <Text style={styles.col4}>Mécanicien</Text>
                <Text style={styles.col5}>Statut</Text>
              </View>
              {or.pannes.map((panne: any, index: number) => (
                <View key={panne.id} style={styles.tableRow}>
                  <Text style={styles.col1}>{index + 1}</Text>
                  <Text style={styles.col2}>{panne.description}</Text>
                  <Text style={styles.col3}>{panne.section || "-"}</Text>
                  <Text style={styles.col4}>{panne.mecanicienNom || "-"}</Text>
                  <Text style={styles.col5}>{panne.statut}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Interventions */}
        {interventions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Interventions</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={styles.col1}>#</Text>
                <Text style={styles.col2}>Description</Text>
                <Text style={styles.col3}>Mécanicien</Text>
                <Text style={styles.col4}>Heures</Text>
                <Text style={styles.col5}>Statut</Text>
              </View>
              {interventions.map((int: any, index: number) => (
                <View key={int.id} style={styles.tableRow}>
                  <Text style={styles.col1}>{index + 1}</Text>
                  <Text style={styles.col2}>{int.description}</Text>
                  <Text style={styles.col3}>{int.mecanicienNom}</Text>
                  <Text style={styles.col4}>{Number(int.heuresTravail)}h</Text>
                  <Text style={styles.col5}>{int.statut}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Picklist / Parts */}
        {allParts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pièces (Picklists)</Text>
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
            <Text>Signature Chauffeur</Text>
          </View>
          <View style={styles.signatureBox}>
            <Text>Signature Contrôleur</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footerContainer} fixed>
          <Image src={CPS2_PATH} style={styles.footerImage} />
          <Text style={styles.footer}>
            CPS MAROUA — Ordre de Réparation {or.numeroOR} — Généré le{" "}
            {formatDate(new Date())}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
