'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Bell, Send, MessageCircle, Clock, Zap } from 'lucide-react';
import TelegramConfig from './TelegramConfig';
import WhatsAppConfig from './WhatsAppConfig';
import ChannelSelector from './ChannelSelector';
import ReminderConfig from './ReminderConfig';

const REMINDER_SERVICE_URL = process.env.NEXT_PUBLIC_REMINDER_SERVICE_URL || 'http://localhost:8006';

export default function NotificationSettings({ userEmail }) {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  // Cargar configuración del usuario
  useEffect(() => {
    if (userEmail) {
      fetchSettings();
    }
  }, [userEmail]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${REMINDER_SERVICE_URL}/api/users/settings/${userEmail}`);
      const data = await response.json();

      if (data.success) {
        setSettings(data.data);
      } else {
        // Si no existe, inicializar con valores por defecto
        setSettings({
          email: userEmail,
          telegram: { chatId: null, enabled: false },
          whatsapp: { number: null, enabled: false },
          preferredChannel: 'none',
          reminderSettings: {
            frequency: 'daily',
            time: '09:00',
            activeRoadmapTopic: null
          }
        });
      }
    } catch (error) {
      console.error('Error cargando configuración:', error);
      toast.error('Error al cargar la configuración');
    } finally {
      setLoading(false);
    }
  };

  const handleTelegramLinked = () => {
    toast.success('Telegram vinculado correctamente');
    fetchSettings();
  };

  const handleWhatsAppLinked = () => {
    toast.success('WhatsApp vinculado correctamente');
    fetchSettings();
  };

  const handleChannelChanged = () => {
    toast.success('Canal preferido actualizado');
    fetchSettings();
  };

  const handleReminderUpdated = () => {
    toast.success('Configuración de recordatorios actualizada');
    fetchSettings();
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
        <p style={{ marginTop: '1rem', color: 'var(--muted-foreground)' }}>
          Cargando configuración...
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Información general */}
      <div className="profile-section">
        <div className="section-header">
          <div className="section-icon">
            <Bell size={20} />
          </div>
          <h2 className="section-title">Configuración de Notificaciones</h2>
        </div>
        <p className="section-description">
          Vincula tus canales de comunicación para recibir recordatorios personalizados sobre tus rutas de aprendizaje.
        </p>

        {/* Estado actual */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <div className={`status-badge ${settings?.telegram?.enabled ? 'success' : ''}`}>
            <Send size={16} />
            Telegram: {settings?.telegram?.enabled ? 'Vinculado' : 'No vinculado'}
          </div>
          <div className={`status-badge ${settings?.whatsapp?.enabled ? 'success' : ''}`}>
            <MessageCircle size={16} />
            WhatsApp: {settings?.whatsapp?.enabled ? 'Vinculado' : 'No vinculado'}
          </div>
        </div>
      </div>

      {/* Configuración de Telegram */}
      <TelegramConfig
        userEmail={userEmail}
        currentChatId={settings?.telegram?.chatId}
        isEnabled={settings?.telegram?.enabled}
        onLinked={handleTelegramLinked}
      />

      {/* Configuración de WhatsApp */}
      <WhatsAppConfig
        userEmail={userEmail}
        currentNumber={settings?.whatsapp?.number}
        isEnabled={settings?.whatsapp?.enabled}
        onLinked={handleWhatsAppLinked}
      />

      {/* Selector de canal preferido */}
      <ChannelSelector
        userEmail={userEmail}
        currentChannel={settings?.preferredChannel}
        telegramEnabled={settings?.telegram?.enabled}
        whatsappEnabled={settings?.whatsapp?.enabled}
        onChannelChanged={handleChannelChanged}
      />

      {/* Configuración de recordatorios */}
      <ReminderConfig
        userEmail={userEmail}
        currentSettings={settings?.reminderSettings}
        onUpdated={handleReminderUpdated}
      />
    </div>
  );
}
