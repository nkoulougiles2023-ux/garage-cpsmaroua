import { v4 as uuidv4 } from "uuid";
import {
  type MobileMoneyPaymentRequest,
  type MobileMoneyPaymentResponse,
  type PaymentStatusResponse,
  normalizePhoneNumber,
} from "./types";

const ORANGE_BASE_URL = process.env.ORANGE_MONEY_BASE_URL || "https://api.orange.com/orange-money-webpay/dev/v1";
const ORANGE_MERCHANT_KEY = process.env.ORANGE_MONEY_MERCHANT_KEY || "";
const ORANGE_AUTH_HEADER = process.env.ORANGE_MONEY_AUTH_HEADER || "";
const ORANGE_NOTIF_URL = process.env.ORANGE_MONEY_NOTIF_URL || "";
const ORANGE_RETURN_URL = process.env.ORANGE_MONEY_RETURN_URL || "";
const ORANGE_CANCEL_URL = process.env.ORANGE_MONEY_CANCEL_URL || "";

/**
 * Get an access token from Orange API (OAuth2 client credentials)
 */
async function getAccessToken(): Promise<string> {
  const res = await fetch("https://api.orange.com/oauth/v3/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${ORANGE_AUTH_HEADER}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Orange Money token error (${res.status}): ${text}`);
  }

  const data = await res.json();
  return data.access_token;
}

/**
 * Initiate an Orange Money Web Payment
 * Returns a payment URL where the customer completes the payment
 */
export async function initiatePayment(
  request: MobileMoneyPaymentRequest
): Promise<MobileMoneyPaymentResponse> {
  const accessToken = await getAccessToken();
  const orderId = uuidv4();
  const msisdn = normalizePhoneNumber(request.phoneNumber);

  const body = {
    merchant_key: ORANGE_MERCHANT_KEY,
    currency: "OUV",
    order_id: orderId,
    amount: request.amount,
    return_url: ORANGE_RETURN_URL || `${process.env.NEXTAUTH_URL}/paiements?status=success`,
    cancel_url: ORANGE_CANCEL_URL || `${process.env.NEXTAUTH_URL}/paiements?status=cancel`,
    notif_url: ORANGE_NOTIF_URL,
    lang: "fr",
    reference: "CPS-MAROUA",
    customer: {
      phone: msisdn,
    },
  };

  const res = await fetch(`${ORANGE_BASE_URL}/webpayment`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Orange Money payment error (${res.status}): ${text}`);
  }

  const data = await res.json();

  return {
    provider: "ORANGE_MONEY",
    transactionId: data.pay_token || orderId,
    externalId: orderId,
    status: "PENDING",
    message: data.payment_url
      ? `Veuillez finaliser le paiement: ${data.payment_url}`
      : "Paiement Orange Money initié. Confirmez sur votre téléphone.",
  };
}

/**
 * Check the status of an Orange Money payment
 */
export async function checkPaymentStatus(
  payToken: string
): Promise<PaymentStatusResponse> {
  const accessToken = await getAccessToken();

  const res = await fetch(
    `${ORANGE_BASE_URL}/webpayment/${payToken}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Orange Money status check error (${res.status}): ${text}`);
  }

  const data = await res.json();

  const statusMap: Record<string, "PENDING" | "SUCCESSFUL" | "FAILED" | "EXPIRED"> = {
    SUCCESS: "SUCCESSFUL",
    PENDING: "PENDING",
    FAILED: "FAILED",
    EXPIRED: "EXPIRED",
  };

  return {
    status: statusMap[data.status] || "FAILED",
    transactionId: payToken,
    amount: data.amount || 0,
    currency: "XAF",
    message: data.message || data.status,
  };
}
