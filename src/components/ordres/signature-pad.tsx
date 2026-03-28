"use client";

import { useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PenLine } from "lucide-react";

interface SignaturePadProps {
  onSign: (signature: string) => void;
  label: string;
}

export function SignaturePad({ onSign, label }: SignaturePadProps) {
  const sigRef = useRef<SignatureCanvas>(null);
  const [open, setOpen] = useState(false);

  function handleClear() {
    sigRef.current?.clear();
  }

  function handleConfirm() {
    if (!sigRef.current || sigRef.current.isEmpty()) return;
    const dataUrl = sigRef.current.getTrimmedCanvas().toDataURL("image/png");
    onSign(dataUrl);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" />}>
        <PenLine className="mr-2 h-4 w-4" />
        {label}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>{label}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            Signez dans le cadre ci-dessous.
          </p>
          <div className="rounded-md border border-dashed border-border bg-white">
            <SignatureCanvas
              ref={sigRef}
              penColor="black"
              canvasProps={{
                width: 448,
                height: 200,
                className: "rounded-md",
              }}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClear}>
              Effacer
            </Button>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Annuler
            </Button>
            <Button onClick={handleConfirm}>Confirmer</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
