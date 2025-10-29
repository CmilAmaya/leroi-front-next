'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCookie } from 'cookies-next';
import toast from 'react-hot-toast';
import { 
  User, 
  Bell, 
  MessageCircle, 
  Send, 
  Check, 
  X, 
  Clock,
  BookOpen,
  Settings
} from 'lucide-react';
import '../../styles/profile.css';

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState('');
  const [userSettings, setUserSettings] = useState(null);
  const [roadmaps, setRoadmaps] = useState([]);
  
  // Estados para vinculación
  const [telegramChatId, setTelegramChatId] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  
  // Estados para configuración de recordatorios
  const [reminderFrequency, setReminderFrequency] = useState('daily');
  const [reminderTime, setReminderTime] = useState('09:00');
  const [preferredChannel, setPreferredChannel] = useState('none');

  useEffect(() => {
    const token = getCookie('token');
    if (!token) {
      router.push('/login');
      return;
    }

    // Decodificar email del token (asumiendo JWT)
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setUserEmail(payload.email || payload.sub);
      fetchUserSettings(payload.email || payload.sub);
      fetchUserRoadmaps(payload.email || payload.sub);
    } catch (error) {
      console.error('Error decoding token:', error);
      toast.error('Sesión inválida');
      router.push('/login');
    }
  }, [router]);

  const fetchUserSettings = async (email) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_REMINDER_SERVICE_URL}/api/users/settings/${email}`
      );
      
      if (response.ok) {
        const data = await response.json();
        setUserSettings(data.data);
        setReminderFrequency(data.data.reminderSettings.frequency);
        setReminderTime(data.data.reminderSettings.time);
        setPreferredChannel(data.data.preferredChannel);
      } else {
        console.log('No settings found, creating default');
      }
    } catch (error) {
      console.error('Error fetching user settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserRoadmaps = async (email) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_REMINDER_SERVICE_URL}/api/users/roadmaps/${email}`
      );
      
      if (response.ok) {
        const data = await response.json();
        setRoadmaps(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching roadmaps:', error);
    }
  };

  const handleLinkTelegram = async () => {
    if (!telegramChatId) {
      toast.error('Por favor ingresa tu Chat ID de Telegram');
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_REMINDER_SERVICE_URL}/api/users/link-telegram`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: userEmail,
            telegramChatId,
          }),
        }
      );

      if (response.ok) {
        toast.success('Telegram vinculado exitosamente');
        fetchUserSettings(userEmail);
        setTelegramChatId('');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Error vinculando Telegram');
      }
    } catch (error) {
      console.error('Error linking Telegram:', error);
      toast.error('Error al vincular Telegram');
    }
  };

  const handleUnlinkTelegram = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_REMINDER_SERVICE_URL}/api/users/unlink-telegram/${userEmail}`,
        { method: 'DELETE' }
      );

      if (response.ok) {
        toast.success('Telegram desvinculado');
        fetchUserSettings(userEmail);
      } else {
        toast.error('Error desvinculando Telegram');
      }
    } catch (error) {
      console.error('Error unlinking Telegram:', error);
      toast.error('Error al desvincular Telegram');
    }
  };

  const handleLinkWhatsApp = async () => {
    if (!whatsappNumber) {
      toast.error('Por favor ingresa tu número de WhatsApp');
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_REMINDER_SERVICE_URL}/api/users/link-whatsapp`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: userEmail,
            whatsappNumber,
          }),
        }
      );

      if (response.ok) {
        toast.success('WhatsApp vinculado exitosamente');
        fetchUserSettings(userEmail);
        setWhatsappNumber('');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Error vinculando WhatsApp');
      }
    } catch (error) {
      console.error('Error linking WhatsApp:', error);
      toast.error('Error al vincular WhatsApp');
    }
  };

  const handleUnlinkWhatsApp = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_REMINDER_SERVICE_URL}/api/users/unlink-whatsapp/${userEmail}`,
        { method: 'DELETE' }
      );

      if (response.ok) {
        toast.success('WhatsApp desvinculado');
        fetchUserSettings(userEmail);
      } else {
        toast.error('Error desvinculando WhatsApp');
      }
    } catch (error) {
      console.error('Error unlinking WhatsApp:', error);
      toast.error('Error al desvincular WhatsApp');
    }
  };

  const handleUpdateSettings = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_REMINDER_SERVICE_URL}/api/users/settings/${userEmail}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            preferredChannel,
            reminderFrequency,
            reminderTime,
            telegramEnabled: userSettings?.telegram?.enabled,
            whatsappEnabled: userSettings?.whatsapp?.enabled,
          }),
        }
      );

      if (response.ok) {
        toast.success('Configuración actualizada');
        fetchUserSettings(userEmail);
      } else {
        toast.error('Error actualizando configuración');
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error('Error al actualizar configuración');
    }
  };

  const handleActivateRoadmap = async (topic) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_REMINDER_SERVICE_URL}/api/users/active-roadmap/${userEmail}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roadmapTopic: topic }),
        }
      );

      if (response.ok) {
        toast.success(`Roadmap "${topic}" activado`);
        fetchUserSettings(userEmail);
      } else {
        toast.error('Error activando roadmap');
      }
    } catch (error) {
      console.error('Error activating roadmap:', error);
      toast.error('Error al activar roadmap');
    }
  };

  if (loading) {
    return (
      <div className="profile-container">
        <div className="loading">Cargando perfil...</div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <User size={48} />
        <h1>Mi Perfil</h1>
        <p className="user-email">{userEmail}</p>
      </div>

      {/* Sección de Telegram */}
      <div className="profile-section">
        <div className="section-header">
          <Send size={24} />
          <h2>Telegram</h2>
        </div>
        
        {userSettings?.telegram?.chatId ? (
          <div className="connected-status">
            <Check size={20} className="check-icon" />
            <span>Conectado: {userSettings.telegram.chatId}</span>
            <button className="btn-unlink" onClick={handleUnlinkTelegram}>
              <X size={16} /> Desvincular
            </button>
          </div>
        ) : (
          <div className="link-form">
            <p className="instructions">
              Para obtener tu Chat ID:
              <br />
              1. Abre Telegram y busca: <strong>@{process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME}</strong>
              <br />
              2. Envía el comando: <code>/start</code>
              <br />
              3. El bot te enviará tu Chat ID
            </p>
            <div className="input-group">
              <input
                type="text"
                placeholder="Ingresa tu Chat ID"
                value={telegramChatId}
                onChange={(e) => setTelegramChatId(e.target.value)}
                className="input-field"
              />
              <button className="btn-link" onClick={handleLinkTelegram}>
                Vincular
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Sección de WhatsApp */}
      <div className="profile-section">
        <div className="section-header">
          <MessageCircle size={24} />
          <h2>WhatsApp</h2>
        </div>
        
        {userSettings?.whatsapp?.number ? (
          <div className="connected-status">
            <Check size={20} className="check-icon" />
            <span>Conectado: {userSettings.whatsapp.number}</span>
            <button className="btn-unlink" onClick={handleUnlinkWhatsApp}>
              <X size={16} /> Desvincular
            </button>
          </div>
        ) : (
          <div className="link-form">
            <p className="instructions">
              Ingresa tu número de WhatsApp con código de país (ej: +57 300 123 4567)
            </p>
            <div className="input-group">
              <input
                type="tel"
                placeholder="+57 300 123 4567"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                className="input-field"
              />
              <button className="btn-link" onClick={handleLinkWhatsApp}>
                Vincular
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Configuración de Recordatorios */}
      <div className="profile-section">
        <div className="section-header">
          <Bell size={24} />
          <h2>Configuración de Recordatorios</h2>
        </div>

        <div className="settings-form">
          <div className="form-group">
            <label>Canal Preferido</label>
            <select
              value={preferredChannel}
              onChange={(e) => setPreferredChannel(e.target.value)}
              className="select-field"
            >
              <option value="none">Ninguno</option>
              <option value="telegram">Telegram</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="both">Ambos</option>
            </select>
          </div>

          <div className="form-group">
            <label>Frecuencia</label>
            <select
              value={reminderFrequency}
              onChange={(e) => setReminderFrequency(e.target.value)}
              className="select-field"
            >
              <option value="daily">Diario</option>
              <option value="every_2_days">Cada 2 días</option>
              <option value="weekly">Semanal</option>
              <option value="intelligent">Inteligente (según progreso)</option>
              <option value="disabled">Deshabilitado</option>
            </select>
          </div>

          <div className="form-group">
            <label>Hora</label>
            <input
              type="time"
              value={reminderTime}
              onChange={(e) => setReminderTime(e.target.value)}
              className="input-field"
            />
          </div>

          <button className="btn-save" onClick={handleUpdateSettings}>
            <Settings size={16} /> Guardar Configuración
          </button>
        </div>
      </div>

      {/* Roadmaps Disponibles */}
      <div className="profile-section">
        <div className="section-header">
          <BookOpen size={24} />
          <h2>Mis Roadmaps</h2>
        </div>

        {roadmaps.length === 0 ? (
          <p className="no-roadmaps">No tienes roadmaps creados aún</p>
        ) : (
          <div className="roadmaps-list">
            {roadmaps.map((roadmap, index) => (
              <div key={index} className="roadmap-item">
                <div className="roadmap-info">
                  <h3>{roadmap.topic}</h3>
                  <small>{new Date(roadmap.createdAt).toLocaleDateString()}</small>
                </div>
                <button
                  className={`btn-activate ${
                    userSettings?.reminderSettings?.activeRoadmapTopic === roadmap.topic
                      ? 'active'
                      : ''
                  }`}
                  onClick={() => handleActivateRoadmap(roadmap.topic)}
                  disabled={
                    userSettings?.reminderSettings?.activeRoadmapTopic === roadmap.topic
                  }
                >
                  {userSettings?.reminderSettings?.activeRoadmapTopic === roadmap.topic ? (
                    <>
                      <Check size={16} /> Activo
                    </>
                  ) : (
                    <>
                      <Clock size={16} /> Activar
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
