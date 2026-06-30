import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const initiatePaymentInput = z.object({
  phoneNumber: z.string().min(1, "Phone number is required"),
  amount: z.number().positive(),
  description: z.string().min(1).default("Job Application Processing Fee"),
  referencePrefix: z.string().min(1).default("MAGUNAS"),
});

const checkPaymentStatusInput = z.object({
  checkoutRequestId: z.string().min(1, "Checkout request ID is required"),
});

type PaymentStatus = "pending" | "success" | "failed" | "timeout";

function parseJsonSafely(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export function normalizeKenyanPhoneNumber(input: string): string | null {
  const digitsOnly = input.replace(/\D/g, "");

  if (!digitsOnly) return null;

  if (/^254(7\d{8}|1\d{8})$/.test(digitsOnly)) return digitsOnly;
  if (/^(7\d{8}|1\d{8})$/.test(digitsOnly)) return `254${digitsOnly}`;
  if (/^0(7\d{8}|1\d{8})$/.test(digitsOnly)) return `254${digitsOnly.slice(1)}`;

  return null;
}

export function isValidKenyanPhoneNumber(input: string): boolean {
  return normalizeKenyanPhoneNumber(input) !== null;
}

export const initiateMpesaPayment = createServerFn({ method: "POST" })
  .validator((data) => initiatePaymentInput.parse(data))
  .handler(async ({ data }) => {
    const normalizedPhone = normalizeKenyanPhoneNumber(data.phoneNumber);

    if (!normalizedPhone) {
      throw new Error("Invalid phone number format. Use 07XXXXXXXX, 011XXXXXXX, 254..., or +254...");
    }

    const swiftPayApiKey =
      process.env.SWIFTPAY_API_KEY ?? "sp_fb3266cf-164b-42a2-903c-c18fbc82b806";
    const swiftPayTillId =
      process.env.SWIFTPAY_TILL_ID ?? "7b98fd1c-3776-45d1-bf9b-94ac571344ac";
    const swiftPayBaseUrl =
      process.env.SWIFTPAY_BASE_URL ?? "https://swiftpay-backend-uvv9.onrender.com";

    const reference = `${data.referencePrefix}-${Date.now()}-${Math.floor(
      Math.random() * 1000,
    )}`;

    const response = await fetch(`${swiftPayBaseUrl}/api/mpesa/stk-push-api`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${swiftPayApiKey}`,
      },
      body: JSON.stringify({
        phone_number: normalizedPhone,
        amount: data.amount,
        till_id: swiftPayTillId,
        reference,
        description: data.description,
      }),
    });

    const responseText = await response.text();
    const responseData = parseJsonSafely(responseText);

    if (!responseData) {
      throw new Error(`Payment service returned an invalid response (${response.status}).`);
    }

    const checkoutRequestId =
      responseData?.data?.checkout_id ??
      responseData?.data?.checkoutRequestId ??
      responseData?.data?.checkoutRequestID ??
      responseData?.checkout_id ??
      responseData?.checkoutRequestId ??
      responseData?.checkoutRequestID ??
      null;

    if (!response.ok || responseData?.status === "error" || !checkoutRequestId) {
      throw new Error(
        responseData?.message ||
          responseData?.CustomerMessage ||
          `Failed to initiate payment (${response.status})`,
      );
    }

    return {
      success: true,
      checkoutRequestId,
      normalizedPhone,
      reference,
    };
  });

export const checkMpesaPaymentStatus = createServerFn({ method: "POST" })
  .validator((data) => checkPaymentStatusInput.parse(data))
  .handler(async ({ data }) => {
    const swiftPayBaseUrl =
      process.env.SWIFTPAY_BASE_URL ?? "https://swiftpay-backend-uvv9.onrender.com";

    const response = await fetch(`${swiftPayBaseUrl}/api/mpesa-verification-proxy`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        checkoutId: data.checkoutRequestId,
      }),
    });

    const responseText = await response.text();
    const responseData = parseJsonSafely(responseText);

    if (!response.ok || !responseData) {
      throw new Error("Failed to verify payment status.");
    }

    const rawStatus = String(responseData?.payment?.status ?? "").toLowerCase();
    const resultDesc =
      responseData?.payment?.resultDesc ??
      responseData?.payment?.message ??
      responseData?.message ??
      "";
    const receiptNumber =
      responseData?.payment?.mpesaReceiptNumber ??
      responseData?.payment?.receipt_number ??
      null;

    let status: PaymentStatus = "pending";

    if (["completed", "success", "paid", "succeeded"].includes(rawStatus)) {
      status = "success";
    } else if (["failed", "cancelled", "rejected"].includes(rawStatus)) {
      status = "failed";
    } else if (["processing", "pending", ""].includes(rawStatus)) {
      status = "pending";
    }

    return {
      success: responseData?.success !== false,
      status,
      rawStatus,
      resultDesc,
      receiptNumber,
    };
  });
