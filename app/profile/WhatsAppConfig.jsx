'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { MessageCircle, Check } from 'lucide-react';

const REMINDER_SERVICE_URL = process.env.NEXT_PUBLIC_REMINDER_SERVICE_URL || 'http://localhost:8006';

export default function WhatsAppConfig({ userEmail, currentNumber, isEnabled, onLinked }) {
  const [phoneNumber, setPhoneNumber] = useState(currentNumber || '');
  const [loading, setLoading] = useState(false);

  const handleLinkWhatsApp = async () => {
    if (!phoneNumber.trim()) {
      toast.error('Por favor ingresa tu número de WhatsApp');
      return;
    }

    // Validación básica de formato de teléfono
    const cleanNumber = phoneNumber.trim();
    if (!/^\+?[\d\s-]{10,}$/.test(cleanNumber)) {
      toast.error('Formato de número inválido. Usa formato internacional (+57...)');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${REMINDER_SERVICE_URL}/api/users/link-whatsapp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userEmail,
          whatsappNumber: cleanNumber,
        }),
      });

      const data = await response.json();

      if (data.success) {
        onLinked();
      } else {
        toast.error(data.message || 'Error al vincular WhatsApp');
      }
    } catch (error) {
      console.error('Error vinculando WhatsApp:', error);
      toast.error('Error de conexión al vincular WhatsApp');
    } finally {
      setLoading(false);
    }
  };

  const handleUnlinkWhatsApp = async () => {
    if (!confirm('¿Estás seguro de desvincular WhatsApp?')) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(
        `${REMINDER_SERVICE_URL}/api/users/unlink-whatsapp/${userEmail}`,
        { method: 'DELETE' }
      );

      const data = await response.json();

      if (data.success) {
        toast.success('WhatsApp desvinculado correctamente');
        setPhoneNumber('');
        onLinked();
      } else {
        toast.error(data.message || 'Error al desvincular WhatsApp');
      }
    } catch (error) {
      console.error('Error desvinculando WhatsApp:', error);
      toast.error('Error de conexión al desvincular WhatsApp');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-section">
      <div className="section-header">
        <div className="section-icon">
          <MessageCircle size={20} />
        </div>
        <h2 className="section-title">WhatsApp</h2>
      </div>

      {isEnabled && currentNumber ? (
        <>
          <div className="status-badge success" style={{ marginBottom: '1rem' }}>
            <Check size={16} />
            WhatsApp vinculado: {currentNumber}
          </div>
          <button onClick={handleUnlinkWhatsApp} className="btn-danger" disabled={loading}>
            {loading ? 'Desvinculando...' : 'Desvincular WhatsApp'}
          </button>
        </>
      ) : (
        <>
          <p className="section-description">
            Vincula tu número de WhatsApp para recibir notificaciones sobre tus rutas de aprendizaje.
          </p>

          <div className="info-box">
            <p>
              <strong>Importante:</strong> Usa el formato internacional incluyendo el código de país.
              <br />
              Ejemplo: <strong>+573001234567</strong> (para Colombia)
            </p>
          </div>

          <div className="form-group">
            <label className="form-label">Número de WhatsApp</label>
            <input
              type="tel"
              placeholder="+573001234567"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="form-input"
            />
            <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', marginTop: '0.5rem' }}>
              Incluye el código de país (ej: +57 para Colombia)
            </p>
          </div>

          <button
            onClick={handleLinkWhatsApp}
            className="btn-primary"
            disabled={loading || !phoneNumber.trim()}
          >
            {loading ? 'Vinculando...' : 'Vincular WhatsApp'}
          </button>
        </>
      )}
    </div>
  );
}
