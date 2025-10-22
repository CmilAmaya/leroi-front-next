'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { Zap, Send, MessageCircle, Ban } from 'lucide-react';

const REMINDER_SERVICE_URL = process.env.NEXT_PUBLIC_REMINDER_SERVICE_URL || 'http://localhost:8006';

export default function ChannelSelector({ 
  userEmail, 
  currentChannel, 
  telegramEnabled, 
  whatsappEnabled,
  onChannelChanged 
}) {
  const [selectedChannel, setSelectedChannel] = useState(currentChannel || 'none');
  const [loading, setLoading] = useState(false);

  const channels = [
    {
      id: 'telegram',
      label: 'Solo Telegram',
      icon: Send,
      disabled: !telegramEnabled,
      description: 'Recibe notificaciones únicamente por Telegram'
    },
    {
      id: 'whatsapp',
      label: 'Solo WhatsApp',
      icon: MessageCircle,
      disabled: !whatsappEnabled,
      description: 'Recibe notificaciones únicamente por WhatsApp'
    },
    {
      id: 'both',
      label: 'Ambos canales',
      icon: Zap,
      disabled: !telegramEnabled || !whatsappEnabled,
      description: 'Recibe notificaciones por Telegram y WhatsApp'
    },
    {
      id: 'none',
      label: 'Desactivar notificaciones',
      icon: Ban,
      disabled: false,
      description: 'No recibir notificaciones por ningún canal'
    }
  ];

  const handleChannelChange = async (channelId) => {
    const channel = channels.find(c => c.id === channelId);
    
    if (channel?.disabled) {
      toast.error('Debes vincular los canales necesarios primero');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(
        `${REMINDER_SERVICE_URL}/api/users/preferred-channel/${userEmail}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            preferredChannel: channelId,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setSelectedChannel(channelId);
        onChannelChanged();
      } else {
        toast.error(data.message || 'Error al actualizar canal preferido');
      }
    } catch (error) {
      console.error('Error actualizando canal:', error);
      toast.error('Error de conexión al actualizar canal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-section">
      <div className="section-header">
        <div className="section-icon">
          <Zap size={20} />
        </div>
        <h2 className="section-title">Canal Preferido</h2>
      </div>

      <p className="section-description">
        Selecciona cómo quieres recibir tus recordatorios de estudio.
      </p>

      {!telegramEnabled && !whatsappEnabled && (
        <div className="info-box" style={{ background: 'rgba(251, 191, 36, 0.1)', borderColor: 'rgba(251, 191, 36, 0.3)' }}>
          <p style={{ color: '#fbbf24' }}>
            ⚠️ Debes vincular al menos un canal (Telegram o WhatsApp) para recibir notificaciones.
          </p>
        </div>
      )}

      <div style={{ display: 'grid', gap: '1rem', marginTop: '1.5rem' }}>
        {channels.map((channel) => {
          const Icon = channel.icon;
          const isSelected = selectedChannel === channel.id;
          const isDisabled = channel.disabled;

          return (
            <button
              key={channel.id}
              onClick={() => handleChannelChange(channel.id)}
              disabled={isDisabled || loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '1.25rem',
                background: isSelected ? 'rgba(131, 91, 252, 0.1)' : 'var(--background)',
                border: isSelected ? '2px solid #835bfc' : '2px solid var(--border)',
                borderRadius: 'var(--radius)',
                cursor: isDisabled ? 'not-allowed' : 'pointer',
                opacity: isDisabled ? 0.5 : 1,
                transition: 'all 0.3s ease',
                textAlign: 'left',
              }}
            >
              <div
                style={{
                  width: '3rem',
                  height: '3rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: isSelected ? 'rgba(131, 91, 252, 0.2)' : 'var(--muted)',
                  borderRadius: 'var(--radius)',
                  flexShrink: 0,
                }}
              >
                <Icon size={24} color={isSelected ? '#835bfc' : 'var(--foreground)'} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ 
                  fontWeight: 600, 
                  fontSize: '1.1rem',
                  color: isSelected ? '#835bfc' : 'var(--foreground)',
                  marginBottom: '0.25rem'
                }}>
                  {channel.label}
                  {isDisabled && ' (No disponible)'}
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
                  {channel.description}
                </div>
              </div>
              {isSelected && (
                <div
                  style={{
                    width: '1.5rem',
                    height: '1.5rem',
                    background: '#835bfc',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path
                      d="M13.3332 4L5.99984 11.3333L2.6665 8"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
