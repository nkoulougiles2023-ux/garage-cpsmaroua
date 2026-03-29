import React from "react";
import { Document, Page, Text, View } from "@react-pdf/renderer";
import { styles, formatDate } from "./shared-styles";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function OrPdf({ data }: { data: any }) {
  const or = data;
  const vehicle = or.vehicle;
  const client = vehicle?.client;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.companyName}>CPS MAROUA</Text>
          <Text style={styles.title}>Ordre de Réparation</Text>
          <Text style={styles.subtitle}>N° {or.numeroOR}</Text>
        </View>

        {/* Vehicle Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations Véhicule</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Matricule :</Text>
            <Text style={styles.value}>{vehicle?.matricule}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Marque / Modèle :</Text>
            <Text style={styles.value}>
              {vehicle?.marque} {vehicle?.modele}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Type :</Text>
            <Text style={styles.value}>{vehicle?.typeVehicule}</Text>
          </View>
          {vehicle?.numeroChassis && (
            <View style={styles.row}>
              <Text style={styles.label}>N° Châssis :</Text>
              <Text style={styles.value}>{vehicle.numeroChassis}</Text>
            </View>
          )}
        </View>

        {/* Client Info */}
        {client && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Client</Text>
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
          </View>
        )}

        {/* Chauffeur Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Chauffeur</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Nom :</Text>
            <Text style={styles.value}>{or.chauffeurNom}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Téléphone :</Text>
            <Text style={styles.value}>{or.chauffeurTel}</Text>
          </View>
          {or.serviceDorigine && (
            <View style={styles.row}>
              <Text style={styles.label}>Service d&apos;origine :</Text>
              <Text style={styles.value}>{or.serviceDorigine}</Text>
            </View>
          )}
        </View>

        {/* Intake Data */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>État à l&apos;entrée</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Kilométrage :</Text>
            <Text style={styles.value}>
              {or.kilometrage.toLocaleString("fr-FR")} km
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Niveau carburant :</Text>
            <Text style={styles.value}>{or.niveauCarburant}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Usure pneus :</Text>
            <Text style={styles.value}>{or.niveauUsurePneus}</Text>
          </View>
          {or.lotDeBord && (
            <View style={styles.row}>
              <Text style={styles.label}>Lot de bord :</Text>
              <Text style={styles.value}>{or.lotDeBord}</Text>
            </View>
          )}
          {or.prochaineVidange && (
            <View style={styles.row}>
              <Text style={styles.label}>Prochaine vidange :</Text>
              <Text style={styles.value}>{or.prochaineVidange}</Text>
            </View>
          )}
          <View style={styles.row}>
            <Text style={styles.label}>Date d&apos;entrée :</Text>
            <Text style={styles.value}>{formatDate(or.dateEntree)}</Text>
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
        <Text style={styles.footer}>
          CPS MAROUA — Ordre de Réparation {or.numeroOR} — Généré le{" "}
          {formatDate(new Date())}
        </Text>
      </Page>
    </Document>
  );
}
