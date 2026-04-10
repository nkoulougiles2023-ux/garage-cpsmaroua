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

export const styles = StyleSheet.create({
  page: { padding: 40, paddingTop: 15, paddingBottom: 90, fontSize: 10, fontFamily: "Helvetica" },
  headerImage: { width: "100%", maxHeight: 80, objectFit: "contain", marginBottom: 10 },
  header: { marginBottom: 16, textAlign: "center" },
  title: { fontSize: 18, fontWeight: "bold", color: "#166534" },
  subtitle: { fontSize: 12, color: "#666", marginTop: 4 },
  companyName: { fontSize: 14, fontWeight: "bold", marginBottom: 2 },
  section: { marginBottom: 12 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    borderBottom: "1 solid #166534",
    paddingBottom: 4,
    marginBottom: 8,
    color: "#166534",
  },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  label: { color: "#666", width: "40%" },
  value: { fontWeight: "bold", width: "60%" },
  table: { width: "100%", marginTop: 8 },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#166534",
    color: "white",
    padding: 6,
    fontWeight: "bold",
  },
  tableRow: {
    flexDirection: "row",
    borderBottom: "0.5 solid #ddd",
    padding: 6,
  },
  col1: { width: "10%" },
  col2: { width: "30%" },
  col3: { width: "20%" },
  col4: { width: "20%" },
  col5: { width: "20%" },
  totalRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 8,
    paddingTop: 8,
    borderTop: "1 solid #166534",
  },
  totalLabel: { fontSize: 12, fontWeight: "bold", marginRight: 20 },
  totalValue: { fontSize: 14, fontWeight: "bold", color: "#166534" },
  signatureArea: {
    marginTop: 30,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  signatureBox: {
    width: "45%",
    borderTop: "1 solid #000",
    paddingTop: 4,
    textAlign: "center",
  },
  footerContainer: {
    position: "absolute",
    bottom: 10,
    left: 40,
    right: 40,
    alignItems: "center",
  },
  footerImage: { width: "100%", maxHeight: 60, objectFit: "contain", marginBottom: 4 },
  footer: {
    textAlign: "center",
    fontSize: 8,
    color: "#999",
  },
});

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
