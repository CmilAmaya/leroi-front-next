import "../../styles/pricing.css";
import { cookies } from "next/headers";
import { createPaymentSession } from "../actions/createPaymentSession";
import PriceUpdater from "./PriceUpdater"; 

export const metadata = {
  title: "Comprar Créditos | Leroi",
  description: "Compra créditos para acceder a más funcionalidades.",
};

export default async function PricingPage({ searchParams }) {
  const creditsParam = searchParams?.credits || "250";

  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  const userEmail = cookieStore.get("userEmail")?.value;

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
  const FIREBASE_API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

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

          {/* 🔁 Parte dinámica cliente */}
          <PriceUpdater
            backendUrl={BACKEND_URL}
            apiKey={FIREBASE_API_KEY}
            defaultCredits={creditsParam}
          />

          <div className="form-group terms terms-group">
            <input
              type="checkbox"
              name="acceptTerms"
              id="acceptTerms"
              required
              className="checkbox-terms"
            />
            <label htmlFor="acceptTerms" className="label-terms">
              Acepto los{" "}
              <a href="/terms" className="terms-link-btn">
                términos y condiciones
              </a>
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
