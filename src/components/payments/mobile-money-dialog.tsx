"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Smartphone, Loader2, CheckCircle, XCircle } from "lucide-react";
import { createPaiement } from "@/lib/actions/paiements";
import type { TypePaiement } from "@prisma/client";

interface MobileMoneyDialogProps {
  montant: number;
  ordreReparationId: string;
  picklistId?: string;
  factureId?: string;
  typePaiement: TypePaiement;
  onSuccess?: () => void;
}

type Step = "form" | "pending" | "success" | "error";

export function MobileMoneyDialog({
  montant,
  ordreReparationId,
  picklistId,
  factureId,
  typePaiement,
  onSuccess,
}: MobileMoneyDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [step, setStep] = React.useState<Step>("form");
  const [phoneNumber, setPhoneNumber] = React.useState("");
  const [error, setError] = React.useState("");
  const [transactionId, setTransactionId] = React.useState("");
  const [provider, setProvider] = React.useState<"orange" | "mtn" | null>(null);
  const pollingRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  function detectProvider(phone: string): "orange" | "mtn" | null {
    const cleaned = phone.replace(/[\s\-]/g, "");
    const local = cleaned.startsWith("237") ? cleaned.slice(3) :
                  cleaned.startsWith("+237") ? cleaned.slice(4) : cleaned;

    if (local.startsWith("67") || local.startsWith("650") || local.startsWith("651") ||
        local.startsWith("652") || local.startsWith("653") || local.startsWith("654") ||
        local.startsWith("680") || local.startsWith("681") || local.startsWith("682") ||
        local.startsWith("683")) {
      return "mtn";
    }
    if (local.startsWith("69") || local.startsWith("655") || local.startsWith("656") ||
        local.startsWith("657") || local.startsWith("658") || local.startsWith("659")) {
      return "orange";
    }
    return null;
  }

  function handlePhoneChange(value: string) {
    setPhoneNumber(value);
    setProvider(detectProvider(value));
    setError("");
  }

  async function handleInitiatePayment() {
    if (!phoneNumber || !provider) {
      setError("Veuillez entrer un numéro valide (Orange ou MTN)");
      return;
    }

    setStep("pending");
    setError("");

    try {
      const endpoint = provider === "mtn"
        ? "/api/payments/mtn-momo"
        : "/api/payments/orange-money";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: montant,
          phoneNumber,
          ordreReparationId,
          picklistId,
          factureId,
          description: `Paiement ${typePaiement} - CPS Maroua`,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erreur lors du paiement");
      }

      setTransactionId(data.transactionId);
      startPolling(data.transactionId, provider);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur inconnue";
      setError(msg);
      setStep("error");
    }
  }

  function startPolling(txId: string, prov: "orange" | "mtn") {
    let attempts = 0;
    const maxAttempts = 30; // 30 * 5s = 2.5 min max polling

    pollingRef.current = setInterval(async () => {
      attempts++;
      if (attempts > maxAttempts) {
        stopPolling();
        setError("Délai d'attente dépassé. Vérifiez votre téléphone.");
        setStep("error");
        return;
      }

      try {
        const endpoint = prov === "mtn"
          ? `/api/payments/mtn-momo?transactionId=${txId}`
          : `/api/payments/orange-money?transactionId=${txId}`;

        const res = await fetch(endpoint);
        const data = await res.json();

        if (data.status === "SUCCESSFUL") {
          stopPolling();
          // Record the payment in database
          await createPaiement({
            montant,
            type: typePaiement,
            methode: "MOBILE_MONEY",
            ordreReparationId,
            picklistId,
            factureId,
            referencePaiement: `${prov === "mtn" ? "MTN" : "OM"}:${txId}`,
          });
          setStep("success");
          onSuccess?.();
        } else if (data.status === "FAILED" || data.status === "EXPIRED") {
          stopPolling();
          setError(data.message || "Le paiement a échoué ou a expiré");
          setStep("error");
        }
      } catch {
        // Continue polling on network errors
      }
    }, 5000);
  }

  function stopPolling() {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }

  function handleClose(val: boolean) {
    if (!val) {
      stopPolling();
      setStep("form");
      setPhoneNumber("");
      setError("");
      setTransactionId("");
      setProvider(null);
    }
    setOpen(val);
  }

  React.useEffect(() => {
    return () => stopPolling();
  }, []);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger render={<Button variant="outline" />}>
        <Smartphone className="mr-2 h-4 w-4" />
        Mobile Money
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Paiement Mobile Money</DialogTitle>
        </DialogHeader>

        {step === "form" && (
          <div className="flex flex-col gap-4">
            <div className="rounded-lg bg-muted p-3 text-center">
              <p className="text-sm text-muted-foreground">Montant à payer</p>
              <p className="text-2xl font-bold">{montant.toLocaleString("fr-FR")} FCFA</p>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="phone">Numéro de téléphone</Label>
              <Input
                id="phone"
                placeholder="6XX XXX XXX"
                value={phoneNumber}
                onChange={(e) => handlePhoneChange(e.target.value)}
              />
              {provider && (
                <Badge variant="outline" className="w-fit">
                  {provider === "mtn" ? "MTN MoMo" : "Orange Money"}
                </Badge>
              )}
              <p className="text-xs text-muted-foreground">
                Le réseau est détecté automatiquement
              </p>
            </div>

            <div className="-mx-4 -mb-4 flex justify-end gap-2 rounded-b-xl border-t bg-muted/50 p-4">
              <Button variant="ghost" onClick={() => handleClose(false)}>
                Annuler
              </Button>
              <Button onClick={handleInitiatePayment} disabled={!provider}>
                Envoyer la demande
              </Button>
            </div>
          </div>
        )}

        {step === "pending" && (
          <div className="flex flex-col items-center gap-4 py-8">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-lg font-medium">En attente de confirmation...</p>
            <p className="text-sm text-muted-foreground text-center">
              Veuillez confirmer le paiement de{" "}
              <strong>{montant.toLocaleString("fr-FR")} FCFA</strong> sur votre téléphone
              {provider === "mtn" ? " MTN" : " Orange"}
            </p>
            <p className="text-xs text-muted-foreground">
              Réf: {transactionId.slice(0, 8)}...
            </p>
            <Button variant="outline" onClick={() => handleClose(false)}>
              Annuler
            </Button>
          </div>
        )}

        {step === "success" && (
          <div className="flex flex-col items-center gap-4 py-8">
            <CheckCircle className="h-12 w-12 text-green-600" />
            <p className="text-lg font-medium">Paiement réussi !</p>
            <p className="text-sm text-muted-foreground">
              {montant.toLocaleString("fr-FR")} FCFA reçu via{" "}
              {provider === "mtn" ? "MTN MoMo" : "Orange Money"}
            </p>
            <Button onClick={() => handleClose(false)}>Fermer</Button>
          </div>
        )}

        {step === "error" && (
          <div className="flex flex-col items-center gap-4 py-8">
            <XCircle className="h-12 w-12 text-destructive" />
            <p className="text-lg font-medium">Paiement échoué</p>
            <p className="text-sm text-destructive text-center">{error}</p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => handleClose(false)}>
                Fermer
              </Button>
              <Button onClick={() => { setStep("form"); setError(""); }}>
                Réessayer
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
