"use client";

import Barcode from "react-barcode";

export function BarcodeDisplay({ value }: { value: string }) {
  return (
    <div className="flex justify-center">
      <Barcode value={value} width={1.5} height={50} fontSize={12} margin={5} />
    </div>
  );
}
