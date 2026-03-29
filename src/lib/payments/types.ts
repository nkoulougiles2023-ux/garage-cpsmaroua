export type MobileMoneyProvider = "ORANGE_MONEY" | "MTN_MOMO";

export type PaymentStatus = "PENDING" | "SUCCESSFUL" | "FAILED" | "EXPIRED";

export interface MobileMoneyPaymentRequest {
  amount: number;
  phoneNumber: string; // Cameroon format: 6XXXXXXXX
  ordreReparationId: string;
  picklistId?: string;
  factureId?: string;
  description: string;
}

export interface MobileMoneyPaymentResponse {
  provider: MobileMoneyProvider;
  transactionId: string;
  externalId: string;
  status: PaymentStatus;
  message?: string;
}

export interface PaymentStatusResponse {
  status: PaymentStatus;
  transactionId: string;
  amount: number;
  currency: string;
  message?: string;
}

/**
 * Normalize Cameroon phone number to MSISDN format (237XXXXXXXXX)
 * Accepts: 6XXXXXXXX, +237XXXXXXXXX, 237XXXXXXXXX, 00237XXXXXXXXX
 */
export function normalizePhoneNumber(phone: string): string {
  const cleaned = phone.replace(/[\s\-\(\)\.]/g, "");

  if (cleaned.startsWith("+237")) return cleaned.slice(1);
  if (cleaned.startsWith("00237")) return cleaned.slice(2);
  if (cleaned.startsWith("237") && cleaned.length === 12) return cleaned;
  if (cleaned.startsWith("6") && cleaned.length === 9) return `237${cleaned}`;

  throw new Error(`Format de numéro invalide: ${phone}. Utilisez le format 6XXXXXXXX`);
}

/**
 * Detect mobile money provider from phone number prefix
 * MTN Cameroon: 67X, 650-654, 680-683
 * Orange Cameroon: 69X, 655-659
 */
export function detectProvider(phone: string): MobileMoneyProvider | null {
  const msisdn = normalizePhoneNumber(phone);
  const local = msisdn.slice(3); // Remove 237

  if (local.startsWith("67") || local.startsWith("650") || local.startsWith("651") ||
      local.startsWith("652") || local.startsWith("653") || local.startsWith("654") ||
      local.startsWith("680") || local.startsWith("681") || local.startsWith("682") ||
      local.startsWith("683")) {
    return "MTN_MOMO";
  }

  if (local.startsWith("69") || local.startsWith("655") || local.startsWith("656") ||
      local.startsWith("657") || local.startsWith("658") || local.startsWith("659")) {
    return "ORANGE_MONEY";
  }

  return null;
}
