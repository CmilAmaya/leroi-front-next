import React from "react";
import Link from "next/link";
import "../../styles/paymentfailure.css";

export const metadata = {
  title: "Pago fallido | Leroi",
  description: "El pago no pudo completarse correctamente.",
};

export default async function PaymentFailure() {
  const currentDate = new Date().toLocaleString("es-ES");

  return (
    <div className="payment-failure-container">
      <div className="payment-failure-card">
        {/* Icono de error */}
        <div className="error-icon">
          <div className="error-circle">!</div>
        </div>

        {/* Título y mensaje */}
        <h1 className="failure-title">¡Oops! Algo salió mal</h1>
        <p className="failure-message">Tu pago no pudo ser procesado.</p>
        <p className="failure-details">
          No se realizó ningún cargo a tu cuenta. Por favor, intenta nuevamente.
        </p>

        {/* Botones */}
        <div className="action-buttons">
          <Link href="/credits" className="btn btn-primary">
            Intentar de nuevo
          </Link>
          <Link href="/" className="btn btn-outline">
            Ir al inicio
          </Link>
        </div>

        {/* Información adicional */}
        <div className="info-note">
          <p>
            <strong>Error al procesar el pago.</strong>
            <br />
            Si el problema persiste, contacta con soporte.
          </p>
        </div>

        {/* Timestamp */}
        <div className="timestamp">
          <small>Fecha del error: {currentDate}</small>
        </div>
      </div>
    </div>
  );
}