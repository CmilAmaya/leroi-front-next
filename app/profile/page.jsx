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
  Settings,
  CreditCard,
  Shield,
  Edit3,
  Trash2
} from 'lucide-react';
import '../../styles/profile.css';

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState('');
  
  // Estados de user_authentication
  const [userData, setUserData] = useState(null);
  const [userCredits, setUserCredits] = useState(0);
  const [roadmapsCreated, setRoadmapsCreated] = useState(0);
  
  // Estados de reminder_service
  const [userSettings, setUserSettings] = useState(null);
  const [roadmaps, setRoadmaps] = useState([]);
  
  // Estados para vinculación
  const [telegramChatId, setTelegramChatId] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  
  // Estados para configuración de recordatorios
  const [reminderFrequency, setReminderFrequency] = useState('daily');
  const [reminderTime, setReminderTime] = useState('09:00');
  const [preferredChannel, setPreferredChannel] = useState('none');
  const [activeRoadmap, setActiveRoadmap] = useState('');
  
  // Estados de modales
  const [showEditModal, setShowEditModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [new2FAStatus, setNew2FAStatus] = useState(false);
  const [editData, setEditData] = useState({ firstName: '', lastName: '' });

  useEffect(() => {
    const token = getCookie('token');
    if (!token) {
      router.push('/login');
      return;
    }

    // Decodificar email del token
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const email = payload.email || payload.sub;
      setUserEmail(email);
      
      // Cargar todos los datos
      fetchUserProfile(token, email);
      fetchUserCredits(token, email);
      fetchUserRoadmaps(token);
      fetchReminderSettings(email);
      fetchAvailableRoadmaps(email);
    } catch (error) {
      console.error('Error decoding token:', error);
      toast.error('Sesión inválida');
      router.push('/login');
    }
  }, [router]);

  // ========== FETCH USER AUTHENTICATION DATA ==========
  const fetchUserProfile = async (token, email) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/users_authentication_path/user-profile`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setUserData(data.data);
        setEditData({
          firstName: data.data.firstName || '',
          lastName: data.data.lastName || ''
        });
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserCredits = async (token, email) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/users_authentication_path/user-credits/${email}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setUserCredits(data.credits || 0);
      }
    } catch (error) {
      console.error('Error fetching user credits:', error);
    }
  };

  const fetchUserRoadmaps = async (token) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/users_authentication_path/user-roadmaps`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setRoadmapsCreated(data.data?.length || 0);
      }
    } catch (error) {
      console.error('Error fetching user roadmaps:', error);
    }
  };

  // ========== FETCH REMINDER SERVICE DATA ==========
  const fetchReminderSettings = async (email) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/reminder-service/api/users/settings/${email}`
      );
      
      if (response.ok) {
        const data = await response.json();
        setUserSettings(data.data);
        setReminderFrequency(data.data.reminderSettings.frequency);
        setReminderTime(data.data.reminderSettings.time);
        setPreferredChannel(data.data.preferredChannel);
        setActiveRoadmap(data.data.reminderSettings.activeRoadmapTopic || '');
      }
    } catch (error) {
      console.error('Error fetching reminder settings:', error);
    }
  };

  const fetchAvailableRoadmaps = async (email) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/reminder-service/api/users/roadmaps/${email}`
      );
      
      if (response.ok) {
        const data = await response.json();
        setRoadmaps(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching roadmaps:', error);
    }
  };

  // ========== TELEGRAM HANDLERS ==========
  const handleLinkTelegram = async () => {
    if (!telegramChatId) {
      toast.error('Por favor ingresa tu Chat ID de Telegram');
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/reminder-service/api/users/link-telegram`,
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
        fetchReminderSettings(userEmail);
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
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/reminder-service/api/users/unlink-telegram/${userEmail}`,
        { method: 'DELETE' }
      );

      if (response.ok) {
        toast.success('Telegram desvinculado');
        fetchReminderSettings(userEmail);
      } else {
        toast.error('Error desvinculando Telegram');
      }
    } catch (error) {
      console.error('Error unlinking Telegram:', error);
      toast.error('Error al desvincular Telegram');
    }
  };

  // ========== WHATSAPP HANDLERS ==========
  const handleLinkWhatsApp = async () => {
    if (!whatsappNumber) {
      toast.error('Por favor ingresa tu número de WhatsApp');
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/reminder-service/api/users/link-whatsapp`,
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
        fetchReminderSettings(userEmail);
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
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/reminder-service/api/users/unlink-whatsapp/${userEmail}`,
        { method: 'DELETE' }
      );

      if (response.ok) {
        toast.success('WhatsApp desvinculado');
        fetchReminderSettings(userEmail);
      } else {
        toast.error('Error desvinculando WhatsApp');
      }
    } catch (error) {
      console.error('Error unlinking WhatsApp:', error);
      toast.error('Error al desvincular WhatsApp');
    }
  };

  // ========== REMINDER SETTINGS HANDLERS ==========
  const handleUpdateReminderSettings = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/reminder-service/api/users/settings/${userEmail}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            preferredChannel,
            reminderFrequency,
            reminderTime,
            activeRoadmapTopic: activeRoadmap,
            telegramEnabled: userSettings?.telegram?.enabled,
            whatsappEnabled: userSettings?.whatsapp?.enabled,
          }),
        }
      );

      if (response.ok) {
        toast.success('Configuración de recordatorios actualizada');
        fetchReminderSettings(userEmail);
      } else {
        toast.error('Error actualizando configuración');
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error('Error al actualizar configuración');
    }
  };

  // ========== 2FA HANDLERS ==========
  const handleToggle2FA = (event) => {
    const newStatus = event.target.checked;
    setNew2FAStatus(newStatus);
    setShow2FAModal(true);
  };

  const confirmToggle2FA = async () => {
    const token = getCookie('token');
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/users_authentication_path/update-2fa`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ is_2fa_enabled: new2FAStatus }),
        }
      );

      if (!response.ok) {
        throw new Error('Error al actualizar el estado de 2FA');
      }

      setUserData({ ...userData, TFA_enabled: new2FAStatus });
      toast.success(`Autenticación de doble factor ${new2FAStatus ? 'activada' : 'desactivada'} correctamente.`);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Hubo un error al actualizar la autenticación de doble factor.');
    } finally {
      setShow2FAModal(false);
    }
  };

  // ========== ACCOUNT ACTIONS ==========
  const handleSaveEdit = async () => {
    const token = getCookie('token');
    const trimmedData = {
      name: editData.firstName.trim(),
      last_name: editData.lastName.trim(),
      email: userData.email?.trim(),
      provider: 'default'
    };

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/users_authentication_path/update-user`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(trimmedData),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.detail || 'Error al actualizar los datos');
        return;
      }

      toast.success('Datos actualizados correctamente');
      setUserData({ ...userData, firstName: editData.firstName, lastName: editData.lastName });
      setShowEditModal(false);
    } catch (error) {
      console.error('Error:', error);
      toast.error(error.message);
    }
  };

  const confirmDelete = async () => {
    const token = getCookie('token');
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/users_authentication_path/delete-user/${encodeURIComponent(userData.email)}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        let errorMsg = 'Error al borrar la cuenta';
        try {
          const errorData = await response.json();
          errorMsg = errorData.detail || errorMsg;
        } catch {}
        toast.error(errorMsg);
        return;
      }

      toast.success('Cuenta eliminada correctamente');
      setTimeout(() => {
        document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
        router.push('/login');
      }, 2000);
    } catch (error) {
      console.error('Error al borrar la cuenta:', error);
      toast.error('Hubo un error al intentar borrar la cuenta.');
    } finally {
      setShowConfirmModal(false);
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
    <div className="register-container">
      {/* Fondo animado */}
      {['0s', '1s', '2s', '3s', '4s'].map((delay, i) => (
        <div key={i} className="light-orb" style={{ '--delay': delay }}></div>
      ))}

      <div className="profile-main-container">
        <div className="profile-card">
          <div className="profile-header">
            <h1 className="profile-title">Mi perfil</h1>
          </div>

          <div className="profile-avatar-container">
            <div className="profile-avatar">
              <User className="avatar-icon" />
            </div>
          </div>

          <div className="profile-grid">
            {/* Información Personal */}
            <div className="profile-info-card">
              <div className="card-header">
                <User className="card-icon" />
                <span className="card-title">Información personal</span>
              </div>
              <div className="info-field">
                <strong>Nombre:</strong>
                <p>{userData?.firstName || 'N/A'}</p>
              </div>
              <div className="info-field">
                <strong>Apellido:</strong>
                <p>{userData?.lastName || 'N/A'}</p>
              </div>
              <div className="info-field">
                <strong>Email:</strong>
                <p>{userData?.email || userEmail}</p>
              </div>
            </div>

            {/* Saldo de Créditos */}
            <div className="profile-info-card">
              <div className="card-header">
                <CreditCard className="card-icon" />
                <span className="card-title">Saldo de créditos</span>
              </div>
              <p className="credits-amount">${userCredits}</p>
            </div>

            {/* Roadmaps Creados */}
            <div className="profile-info-card">
              <div className="card-header-roadmaps">
                <div className="card-header">
                  <BookOpen className="card-icon" />
                  <span className="card-title">Roadmaps creados</span>
                </div>
                <span className="roadmaps-count">{roadmapsCreated}</span>
              </div>
              {roadmapsCreated > 0 && (
                <button 
                  className="roadmaps-button"
                  onClick={() => router.push('/roadmap')}
                >
                  Ver Roadmaps
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Configuración de Seguridad */}
        <div className="profile-card">
          <div className="card-header security-header">
            <Shield className="section-icon" />
            <h3 className="section-title">Configuración de seguridad</h3>
          </div>
          
          <div className="security-card">
            <div className="security-content">
              <div className="security-info">
                <h4 className="security-title">Autenticación de doble factor</h4>
                <p className="security-description">Añade una capa extra de seguridad a tu cuenta</p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={userData?.TFA_enabled || false}
                  onChange={handleToggle2FA}
                />
                <div className={`toggle-slider ${userData?.TFA_enabled ? 'active' : ''}`}>
                  <div className="toggle-button"></div>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Telegram */}
        <div className="profile-card">
          <div className="card-header security-header">
            <Send className="section-icon" />
            <h3 className="section-title">Telegram</h3>
          </div>
          
          {userSettings?.telegram?.chatId ? (
            <div className="security-card">
              <div className="security-content">
                <div className="security-info">
                  <h4 className="security-title">Estado: Conectado</h4>
                  <p className="security-description">Chat ID: {userSettings.telegram.chatId}</p>
                </div>
                <button className="action-button delete-button" onClick={handleUnlinkTelegram}>
                  <X size={16} /> Desvincular
                </button>
              </div>
            </div>
          ) : (
            <div className="security-card">
              <p className="security-description" style={{ marginBottom: '1rem' }}>
                Para obtener tu Chat ID:<br />
                1. Busca en Telegram: <strong>@{process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME}</strong><br />
                2. Envía: <code>/start</code><br />
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
                <button className="action-button edit-button" onClick={handleLinkTelegram}>
                  Vincular
                </button>
              </div>
            </div>
          )}
        </div>

        {/* WhatsApp */}
        <div className="profile-card">
          <div className="card-header security-header">
            <MessageCircle className="section-icon" />
            <h3 className="section-title">WhatsApp</h3>
          </div>
          
          {userSettings?.whatsapp?.number ? (
            <div className="security-card">
              <div className="security-content">
                <div className="security-info">
                  <h4 className="security-title">Estado: Conectado</h4>
                  <p className="security-description">Número: {userSettings.whatsapp.number}</p>
                </div>
                <button className="action-button delete-button" onClick={handleUnlinkWhatsApp}>
                  <X size={16} /> Desvincular
                </button>
              </div>
            </div>
          ) : (
            <div className="security-card">
              <p className="security-description" style={{ marginBottom: '1rem' }}>
                Ingresa tu número con código de país (ej: +57 300 123 4567)
              </p>
              <div className="input-group">
                <input
                  type="tel"
                  placeholder="+57 300 123 4567"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  className="input-field"
                />
                <button className="action-button edit-button" onClick={handleLinkWhatsApp}>
                  Vincular
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Alertas y Notificaciones */}
        <div className="profile-card">
          <div className="card-header security-header">
            <Bell className="section-icon" />
            <h3 className="section-title">Alertas y Notificaciones</h3>
          </div>

          <div className="security-card">
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
                  <option value="intelligent">Inteligente</option>
                  <option value="disabled">Deshabilitado</option>
                </select>
              </div>

              <div className="form-group">
                <label>Hora del Recordatorio</label>
                <input
                  type="time"
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                  className="input-field"
                />
              </div>

              <div className="form-group">
                <label>Roadmap Activo</label>
                <select
                  value={activeRoadmap}
                  onChange={(e) => setActiveRoadmap(e.target.value)}
                  className="select-field"
                >
                  <option value="">Selecciona un roadmap</option>
                  {roadmaps.map((roadmap, index) => (
                    <option key={index} value={roadmap.topic}>
                      {roadmap.topic}
                    </option>
                  ))}
                </select>
              </div>

              <button className="action-button edit-button" onClick={handleUpdateReminderSettings}>
                <Settings size={16} /> Guardar Configuración
              </button>
            </div>
          </div>
        </div>

        {/* Acciones de Cuenta */}
        <div className="profile-card">
          <div className="card-header security-header">
            <Edit3 className="section-icon" />
            <h3 className="section-title">Acciones de cuenta</h3>
          </div>
          
          <div className="actions-container">
            <button
              className="action-button edit-button"
              onClick={() => setShowEditModal(true)}
            >
              <Edit3 className="button-icon" />
              Modificar datos
            </button>
            
            <button
              className="action-button delete-button"
              onClick={() => setShowConfirmModal(true)}
            >
              <Trash2 className="button-icon" />
              Borrar cuenta
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Edición */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Modificar Datos</h2>
            <div className="form-group">
              <label>Nombre</label>
              <input
                type="text"
                value={editData.firstName}
                onChange={(e) => setEditData({ ...editData, firstName: e.target.value })}
                className="input-field"
              />
            </div>
            <div className="form-group">
              <label>Apellido</label>
              <input
                type="text"
                value={editData.lastName}
                onChange={(e) => setEditData({ ...editData, lastName: e.target.value })}
                className="input-field"
              />
            </div>
            <div className="modal-actions">
              <button className="action-button edit-button" onClick={handleSaveEdit}>
                Guardar
              </button>
              <button className="action-button delete-button" onClick={() => setShowEditModal(false)}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmación - Borrar Cuenta */}
      {showConfirmModal && (
        <div className="modal-overlay" onClick={() => setShowConfirmModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>¿Estás seguro?</h2>
            <p>Esta acción no se puede deshacer. Perderás todos tus créditos y roadmaps.</p>
            <div className="modal-actions">
              <button className="action-button delete-button" onClick={confirmDelete}>
                Confirmar
              </button>
              <button className="action-button edit-button" onClick={() => setShowConfirmModal(false)}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de 2FA */}
      {show2FAModal && (
        <div className="modal-overlay" onClick={() => setShow2FAModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Confirmar Cambio</h2>
            <p>
              ¿Estás seguro de que deseas {new2FAStatus ? 'activar' : 'desactivar'} la autenticación de doble factor?
            </p>
            <div className="modal-actions">
              <button className="action-button edit-button" onClick={confirmToggle2FA}>
                Confirmar
              </button>
              <button className="action-button delete-button" onClick={() => setShow2FAModal(false)}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
