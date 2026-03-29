import { v4 as uuidv4 } from "uuid";
import {
  type MobileMoneyPaymentRequest,
  type MobileMoneyPaymentResponse,
  type PaymentStatusResponse,
  normalizePhoneNumber,
} from "./types";

const MTN_BASE_URL = process.env.MTN_MOMO_BASE_URL || "https://sandbox.momodeveloper.mtn.com";
const MTN_SUBSCRIPTION_KEY = process.env.MTN_MOMO_SUBSCRIPTION_KEY || "";
const MTN_API_USER_ID = process.env.MTN_MOMO_API_USER_ID || "";
const MTN_API_KEY = process.env.MTN_MOMO_API_KEY || "";
const MTN_TARGET_ENV = process.env.MTN_MOMO_TARGET_ENV || "sandbox";
const MTN_CALLBACK_URL = process.env.MTN_MOMO_CALLBACK_URL || "";

/**
 * Get a bearer token from MTN MoMo API using Basic Auth (API User + API Key)
 */
async function getAccessToken(): Promise<string> {
  const credentials = Buffer.from(`${MTN_API_USER_ID}:${MTN_API_KEY}`).toString("base64");

  const res = await fetch(`${MTN_BASE_URL}/collection/token/`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Ocp-Apim-Subscription-Key": MTN_SUBSCRIPTION_KEY,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`MTN MoMo token error (${res.status}): ${text}`);
  }

  const data = await res.json();
  return data.access_token;
}

/**
 * Initiate a "Request to Pay" — customer receives a prompt on their phone to authorize
 */
export async function requestToPay(
  request: MobileMoneyPaymentRequest
): Promise<MobileMoneyPaymentResponse> {
  const accessToken = await getAccessToken();
  const referenceId = uuidv4();
  const msisdn = normalizePhoneNumber(request.phoneNumber);

  const body = {
    amount: String(request.amount),
    currency: "XAF",
    externalId: referenceId,
    payer: {
      partyIdType: "MSISDN",
      partyId: msisdn,
    },
    payerMessage: request.description,
    payeeNote: `CPS Maroua - OR: ${request.ordreReparationId}`,
  };

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${accessToken}`,
    "Ocp-Apim-Subscription-Key": MTN_SUBSCRIPTION_KEY,
    "X-Reference-Id": referenceId,
    "X-Target-Environment": MTN_TARGET_ENV,
  };

  if (MTN_CALLBACK_URL) {
    headers["X-Callback-Url"] = MTN_CALLBACK_URL;
  }

  const res = await fetch(`${MTN_BASE_URL}/collection/v1_0/requesttopay`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`MTN MoMo request-to-pay error (${res.status}): ${text}`);
  }

  return {
    provider: "MTN_MOMO",
    transactionId: referenceId,
    externalId: referenceId,
    status: "PENDING",
    message: "Veuillez confirmer le paiement sur votre téléphone MTN",
  };
}

/**
 * Check the status of a Request to Pay transaction
 */
export async function checkPaymentStatus(
  referenceId: string
): Promise<PaymentStatusResponse> {
  const accessToken = await getAccessToken();

  const res = await fetch(
    `${MTN_BASE_URL}/collection/v1_0/requesttopay/${referenceId}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Ocp-Apim-Subscription-Key": MTN_SUBSCRIPTION_KEY,
        "X-Target-Environment": MTN_TARGET_ENV,
      },
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`MTN MoMo status check error (${res.status}): ${text}`);
  }

  const data = await res.json();

  const statusMap: Record<string, "PENDING" | "SUCCESSFUL" | "FAILED"> = {
    SUCCESSFUL: "SUCCESSFUL",
    PENDING: "PENDING",
    FAILED: "FAILED",
  };

  return {
    status: statusMap[data.status] || "FAILED",
    transactionId: referenceId,
    amount: Number(data.amount),
    currency: data.currency || "XAF",
    message: data.reason?.message || data.status,
  };
}
