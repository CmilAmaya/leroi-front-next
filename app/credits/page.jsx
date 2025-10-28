import "../../styles/pricing.css";
import { cookies } from "next/headers";
import { createPaymentSession } from "../actions/createPaymentSession";

export const metadata = {
  title: "Comprar Créditos | Leroi",
  description: "Compra créditos para acceder a más funcionalidades.",
};

async function getPrice(credits) {
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
  const FIREBASE_API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

  const query = `
    query GetPrice($credits: Int!) {
      price(credits: $credits) {
        credits
        cost
        currency
      }
    }
  `;
  const variables = { credits: parseInt(credits, 10) };

  const res = await fetch(`${BACKEND_URL}/payments-be`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": FIREBASE_API_KEY,
    },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });

  const result = await res.json();
  return result.data?.price?.cost || 0;
}

export default async function PricingPage({ searchParams }) {
  const creditsParam = searchParams?.credits || "250";
  const totalCost = await getPrice(creditsParam);

  const token = cookies().get("token")?.value;
  const userEmail = cookies().get("userEmail")?.value;

  if (!token || !userEmail) {
    return (
      <div className="pricing-container-p">
        <div className="pricing-box-p">
          <h1 className="pricing-title-p">Inicia sesión</h1>
          <p>Debes iniciar sesión para comprar créditos.</p>
          <a href="/login" className="submit-button">Ir al Login</a>
        </div>
      </div>
    );
  }

  return (
    <div className="pricing-container-p">
      <div className="pricing-box-p">
        <h1 className="pricing-title-p pricing-title-icon">
          Comprar Créditos
        </h1>

        <form action={createPaymentSession}>
          <input type="hidden" name="authToken" value={token} />
          <input type="hidden" name="email" value={userEmail} />

          <div className="form-group">
            <label className="label-credits">Cantidad de créditos</label>
            <div className="credit-options">
              <select id="credits" name="credits" defaultValue={creditsParam} className="select-credits" required>
                <option value="250">250 Créditos</option>
                <option value="750">750 Créditos</option>
                <option value="1500">1500 Créditos</option>
              </select>
            </div>
          </div>

          <div className="form-group price-group">
            <label className="label-price">Precio total</label>
            <div className="price-badge-wrapper">
              <span className="price-badge">${totalCost} USD</span>
            </div>
          </div>

          <div className="form-group terms terms-group">
            <input type="checkbox" name="acceptTerms" id="acceptTerms" required className="checkbox-terms" />
            <label htmlFor="acceptTerms" className="label-terms">
              Acepto los <a href="/terms" className="terms-link-btn">términos y condiciones</a>
            </label>
          </div>

          <div className="button-container">
            <button type="submit" className="submit-button buy-btn">
              Comprar Créditos
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}