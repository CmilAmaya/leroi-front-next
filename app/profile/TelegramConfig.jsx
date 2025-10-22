'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { Send, Check, AlertCircle, ExternalLink } from 'lucide-react';

const REMINDER_SERVICE_URL = process.env.NEXT_PUBLIC_REMINDER_SERVICE_URL || 'http://localhost:8006';
const TELEGRAM_BOT_USERNAME = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'leroi_reminder_bot';

export default function TelegramConfig({ userEmail, currentChatId, isEnabled, onLinked }) {
  const [chatId, setChatId] = useState(currentChatId || '');
  const [loading, setLoading] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  const handleLinkTelegram = async () => {
    if (!chatId.trim()) {
      toast.error('Por favor ingresa tu Chat ID de Telegram');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${REMINDER_SERVICE_URL}/api/users/link-telegram`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userEmail,
          telegramChatId: chatId.trim(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        onLinked();
      } else {
        toast.error(data.message || 'Error al vincular Telegram');
      }
    } catch (error) {
      console.error('Error vinculando Telegram:', error);
      toast.error('Error de conexión al vincular Telegram');
    } finally {
      setLoading(false);
    }
  };

  const handleUnlinkTelegram = async () => {
    if (!confirm('¿Estás seguro de desvincular Telegram?')) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(
        `${REMINDER_SERVICE_URL}/api/users/unlink-telegram/${userEmail}`,
        { method: 'DELETE' }
      );

      const data = await response.json();

      if (data.success) {
        toast.success('Telegram desvinculado correctamente');
        setChatId('');
        onLinked();
      } else {
        toast.error(data.message || 'Error al desvincular Telegram');
      }
    } catch (error) {
      console.error('Error desvinculando Telegram:', error);
      toast.error('Error de conexión al desvincular Telegram');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-section">
      <div className="section-header">
        <div className="section-icon">
          <Send size={20} />
        </div>
        <h2 className="section-title">Telegram</h2>
      </div>

      {isEnabled && currentChatId ? (
        <>
          <div className="status-badge success" style={{ marginBottom: '1rem' }}>
            <Check size={16} />
            Telegram vinculado: {currentChatId}
          </div>
          <button onClick={handleUnlinkTelegram} className="btn-danger" disabled={loading}>
            {loading ? 'Desvinculando...' : 'Desvincular Telegram'}
          </button>
        </>
      ) : (
        <>
          <p className="section-description">
            Vincula tu cuenta de Telegram para recibir recordatorios personalizados de tus rutas de aprendizaje.
          </p>

          <div className="info-box">
            <p>
              <strong>¿Cómo obtener tu Chat ID?</strong>
            </p>
            <ol style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
              <li>Abre Telegram y busca el bot: <strong>@{TELEGRAM_BOT_USERNAME}</strong></li>
              <li>Inicia una conversación enviando el comando: <strong>/start</strong></li>
              <li>El bot te responderá con tu Chat ID automáticamente</li>
              <li>Copia el Chat ID y pégalo abajo</li>
            </ol>
            <a
              href={`https://t.me/${TELEGRAM_BOT_USERNAME}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginTop: '1rem',
                color: '#835bfc',
                textDecoration: 'none',
                fontWeight: '500',
              }}
            >
              Abrir bot en Telegram <ExternalLink size={16} />
            </a>
          </div>

          <div className="form-group">
            <label className="form-label">Chat ID de Telegram</label>
            <input
              type="text"
              placeholder="Ejemplo: 123456789"
              value={chatId}
              onChange={(e) => setChatId(e.target.value)}
              className="form-input"
            />
          </div>

          <button
            onClick={handleLinkTelegram}
            className="btn-primary"
            disabled={loading || !chatId.trim()}
          >
            {loading ? 'Vinculando...' : 'Vincular Telegram'}
          </button>
        </>
      )}
    </div>
  );
}
