"use server";

import { redirect } from "next/navigation";

export async function createPaymentSession(formData) {
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

  const authToken = formData.get("authToken");
  const credits = parseInt(formData.get("credits"), 10);
  const email = formData.get("email");

  // === Paso 1: crear sesión ===
  const sessionMutation = `
    mutation CreateSession($authToken: String!, $credits: Int!, $email: String!) {
      createSession(authToken: $authToken, credits: $credits, email: $email) {
        sessionId
      }
    }
  `;

  const sessionRes = await fetch(`${BACKEND_URL}/payments-be`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: sessionMutation,
      variables: { authToken, credits, email },
    }),
  });

  const sessionData = await sessionRes.json();
  const sessionId = sessionData?.data?.createSession?.sessionId;

  if (!sessionId) {
    console.error("❌ No se pudo crear la sesión de pago:", sessionData);
    throw new Error("No se pudo crear la sesión de pago.");
  }

  // === Paso 2: crear preferencia de pago ===
  const prefMutation = `
    mutation CreatePref($input: PreferenceInput!) {
      createPreference(input: $input) {
        id
        initPoint
      }
    }
  `;

  const variables = {
    input: {
      items: [
        {
          title: `${credits} Créditos`,
          quantity: 1,
          unitPrice: 10, // ajusta si usas otro precio
          currencyId: "USD",
        },
      ],
      externalReference: `{"sessionId":"${sessionId}"}`,
    },
  };

  const prefRes = await fetch(`${BACKEND_URL}/payments-be`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({ query: prefMutation, variables }),
  });

  const prefData = await prefRes.json();
  const initPoint = prefData?.data?.createPreference?.initPoint;

  if (!initPoint) {
    console.error("❌ No se pudo crear la preferencia de pago:", prefData);
    throw new Error("No se pudo generar el enlace de pago.");
  }

  // === Paso 3: redirección SSR ===
  redirect(initPoint);
}
