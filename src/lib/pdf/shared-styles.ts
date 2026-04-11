import fs from "fs";
import path from "path";
import { StyleSheet } from "@react-pdf/renderer";

function loadImageAsDataUri(filename: string): string {
  const filePath = path.join(process.cwd(), "public", filename);
  const buffer = fs.readFileSync(filePath);
  const base64 = buffer.toString("base64");
  return `data:image/png;base64,${base64}`;
}

export const CPS1_PATH = loadImageAsDataUri("CPS1.png");
export const CPS2_PATH = loadImageAsDataUri("CPS2.png");

export type DensityPreset = "normal" | "compact" | "dense";

/**
 * Compute a density preset based on the total number of table rows the
 * document will render. Goal: keep the sheet on a single A4 page when the
 * content is reasonable, shrink gracefully when it is large.
 */
export function pickDensity(rowCount: number): DensityPreset {
  if (rowCount <= 10) return "normal";
  if (rowCount <= 20) return "compact";
  return "dense";
}

/**
 * Build a StyleSheet scaled for the given density. `normal` matches the
 * legacy styles; `compact` and `dense` shrink paddings, margins and font
 * sizes so long tables still fit on one page.
 */
export function getStyles(preset: DensityPreset = "normal") {
  const scale =
    preset === "dense" ? 0.75 : preset === "compact" ? 0.85 : 1;
  const fontBase = preset === "dense" ? 8 : preset === "compact" ? 9 : 10;
  const padV = Math.round(6 * scale);
  const tableRowPad = preset === "dense" ? 3 : preset === "compact" ? 4 : 6;
  const headerPad = preset === "dense" ? 4 : preset === "compact" ? 5 : 6;
  const sectionMargin = Math.round(12 * scale);
  const headerImageMax = preset === "dense" ? 55 : preset === "compact" ? 65 : 80;
  const footerImageMax = preset === "dense" ? 40 : preset === "compact" ? 50 : 60;
  const pagePad = preset === "dense" ? 28 : preset === "compact" ? 34 : 40;
  const pagePadBottom =
    preset === "dense" ? 70 : preset === "compact" ? 80 : 90;

  return StyleSheet.create({
    page: {
      padding: pagePad,
      paddingTop: preset === "dense" ? 10 : 15,
      paddingBottom: pagePadBottom,
      fontSize: fontBase,
      fontFamily: "Helvetica",
    },
    headerImage: {
      width: "100%",
      maxHeight: headerImageMax,
      objectFit: "contain",
      marginBottom: preset === "dense" ? 4 : 10,
    },
    header: {
      marginBottom: preset === "dense" ? 8 : preset === "compact" ? 12 : 16,
      textAlign: "center",
    },
    title: {
      fontSize: preset === "dense" ? 14 : preset === "compact" ? 16 : 18,
      fontWeight: "bold",
      color: "#166534",
    },
    subtitle: {
      fontSize: preset === "dense" ? 10 : preset === "compact" ? 11 : 12,
      color: "#666",
      marginTop: 2,
    },
    companyName: { fontSize: 14, fontWeight: "bold", marginBottom: 2 },
    section: { marginBottom: sectionMargin },
    sectionTitle: {
      fontSize: preset === "dense" ? 10 : preset === "compact" ? 11 : 12,
      fontWeight: "bold",
      borderBottom: "1 solid #166534",
      paddingBottom: preset === "dense" ? 2 : 4,
      marginBottom: preset === "dense" ? 4 : 8,
      color: "#166534",
    },
    row: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: preset === "dense" ? 2 : 4,
    },
    label: { color: "#666", width: "40%" },
    value: { fontWeight: "bold", width: "60%" },
    table: { width: "100%", marginTop: preset === "dense" ? 4 : 8 },
    tableHeader: {
      flexDirection: "row",
      backgroundColor: "#166534",
      color: "white",
      padding: headerPad,
      fontWeight: "bold",
    },
    tableRow: {
      flexDirection: "row",
      borderBottom: "0.5 solid #ddd",
      padding: tableRowPad,
    },
    col1: { width: "10%" },
    col2: { width: "30%" },
    col3: { width: "20%" },
    col4: { width: "20%" },
    col5: { width: "20%" },
    totalRow: {
      flexDirection: "row",
      justifyContent: "flex-end",
      marginTop: preset === "dense" ? 4 : 8,
      paddingTop: preset === "dense" ? 4 : 8,
      borderTop: "1 solid #166534",
    },
    totalLabel: {
      fontSize: preset === "dense" ? 10 : 12,
      fontWeight: "bold",
      marginRight: 20,
    },
    totalValue: {
      fontSize: preset === "dense" ? 12 : 14,
      fontWeight: "bold",
      color: "#166534",
    },
    signatureArea: {
      marginTop: preset === "dense" ? 14 : preset === "compact" ? 20 : 30,
      flexDirection: "row",
      justifyContent: "space-between",
    },
    signatureBox: {
      width: "45%",
      borderTop: "1 solid #000",
      paddingTop: 4,
      textAlign: "center",
    },
    signatureImage: {
      height: preset === "dense" ? 28 : preset === "compact" ? 34 : 40,
      marginBottom: 2,
      objectFit: "contain",
    },
    footerContainer: {
      position: "absolute",
      bottom: 10,
      left: pagePad,
      right: pagePad,
      alignItems: "center",
    },
    footerImage: {
      width: "100%",
      maxHeight: footerImageMax,
      objectFit: "contain",
      marginBottom: 4,
    },
    footer: {
      textAlign: "center",
      fontSize: preset === "dense" ? 7 : 8,
      color: "#999",
    },
  });
}

// Legacy default export: kept for any unmigrated PDF template.
export const styles = getStyles("normal");

export function formatMontant(montant: number): string {
  return montant.toLocaleString("fr-FR") + " FCFA";
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
