// app/payment/success/page.jsx
import React from "react";
import "../../styles/paymentsuccess.css";
import Link from "next/link";

export const metadata = {
  title: "Pago Exitoso | Leroi",
  description: "Tu pago se ha completado correctamente.",
};

export default async function PaymentSuccess() {
  const currentDate = new Date().toLocaleString("es-ES");

  return (
    <div className="payment-success-container">
      <div className="payment-success-card">
        {/* Icono de éxito */}
        <div className="success-icon">
          <div className="checkmark-circle">
            <div className="checkmark">✓</div>
          </div>
        </div>

        {/* Texto principal */}
        <h1 className="success-title">¡Pago Exitoso!</h1>
        <p className="success-message">Tus créditos han sido añadidos a tu cuenta.</p>
        <p className="success-details">
          Gracias por tu compra. Tu transacción se completó de forma segura.
        </p>

        {/* Bloque informativo */}
        <div className="credits-info-box">
          <h3>Créditos añadidos correctamente</h3>
          <span className="success-checkmark"></span>
          <p>Ya puedes usarlos para crear nuevos roadmaps.</p>
        </div>

        {/* Botones */}
        <div className="action-buttons">
          <Link href="/roadmap" className="btn btn-primary">
            Crear un roadmap
          </Link>
          <Link href="/profile" className="btn btn-secondary">
            Ver mi perfil
          </Link>
          <Link href="/" className="btn btn-outline">
            Ir al inicio
          </Link>
        </div>

        {/* Info adicional */}
        <div className="info-note">
          <p>
            <strong>Tu transacción fue procesada correctamente.</strong><br />
            Recibirás un correo de confirmación en los próximos minutos.
          </p>
        </div>

        {/* Timestamp */}
        <div className="timestamp">
          <small>Pago procesado: {currentDate}</small>
        </div>
      </div>
    </div>
  );
}