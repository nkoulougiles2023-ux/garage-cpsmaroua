import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { OrPdf } from "@/lib/pdf/or-pdf";
import { PicklistPdf } from "@/lib/pdf/picklist-pdf";
import { CloturePdf } from "@/lib/pdf/cloture-pdf";
import { FacturePdf } from "@/lib/pdf/facture-pdf";
import React from "react";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string; id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { type, id } = await params;

  try {
    let document: React.ReactElement;
    let filename: string;

    switch (type) {
      case "or": {
        const or = await db.ordreReparation.findUnique({
          where: { id },
          include: {
            vehicle: { include: { client: true } },
            pannes: true,
            interventions: true,
            picklists: { include: { items: { include: { piece: true } } } },
          },
        });
        if (!or) {
          return NextResponse.json(
            { error: "Ordre de réparation introuvable" },
            { status: 404 }
          );
        }
        document = React.createElement(OrPdf, { data: or });
        filename = `OR-${or.numeroOR}.pdf`;
        break;
      }

      case "picklist": {
        const picklist = await db.picklist.findUnique({
          where: { id },
          include: {
            ordreReparation: true,
            items: { include: { piece: true } },
          },
        });
        if (!picklist) {
          return NextResponse.json(
            { error: "Picklist introuvable" },
            { status: 404 }
          );
        }
        if (!picklist.signatureAdmin) {
          return NextResponse.json(
            { error: "Le picklist doit être approuvé et signé par l'admin avant impression" },
            { status: 403 }
          );
        }
        document = React.createElement(PicklistPdf, { data: picklist });
        filename = `Picklist-${picklist.numeroPicklist}.pdf`;
        break;
      }

      case "cloture": {
        const cloture = await db.ficheCloture.findUnique({
          where: { id },
          include: {
            ordreReparation: {
              include: {
                vehicle: true,
                interventions: true,
                picklists: { include: { items: { include: { piece: true } } } },
              },
            },
          },
        });
        if (!cloture) {
          return NextResponse.json(
            { error: "Fiche de clôture introuvable" },
            { status: 404 }
          );
        }
        document = React.createElement(CloturePdf, { data: cloture });
        filename = `Cloture-${cloture.numeroCloture}.pdf`;
        break;
      }

      case "facture": {
        const facture = await db.facture.findUnique({
          where: { id },
          include: {
            client: true,
            ordreReparation: {
              include: {
                vehicle: true,
                interventions: true,
                picklists: { include: { items: { include: { piece: true } } } },
              },
            },
          },
        });
        if (!facture) {
          return NextResponse.json(
            { error: "Facture introuvable" },
            { status: 404 }
          );
        }
        document = React.createElement(FacturePdf, { data: facture });
        filename = `Facture-${facture.numeroFacture}.pdf`;
        break;
      }

      default:
        return NextResponse.json(
          { error: "Type de PDF invalide" },
          { status: 400 }
        );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const buffer = await renderToBuffer(document as any);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Erreur génération PDF:", error);
    return NextResponse.json(
      { error: "Erreur lors de la génération du PDF" },
      { status: 500 }
    );
  }
}
