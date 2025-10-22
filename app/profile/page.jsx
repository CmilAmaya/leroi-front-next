'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { User, Bell, Sparkles } from 'lucide-react';
import { getCookie } from 'cookies-next';
import '../../styles/profile.css';
import NotificationSettings from './NotificationSettings';

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState('notifications');
  const [userEmail, setUserEmail] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Obtener email del usuario de las cookies (Next.js usa cookies-next)
    const emailFromCookie = getCookie('userEmail');
    
    if (emailFromCookie) {
      setUserEmail(emailFromCookie);
    } else {
      // Si no hay email en cookies, intentar con localStorage como fallback
      const emailFromStorage = typeof window !== 'undefined' ? localStorage.getItem('userEmail') : null;
      
      if (emailFromStorage) {
        setUserEmail(emailFromStorage);
      } else {
        toast.error('No se encontró sesión de usuario');
      }
    }
    setLoading(false);
  }, []);

  const tabs = [
    { id: 'notifications', label: 'Notificaciones', icon: Bell },
    { id: 'account', label: 'Mi Cuenta', icon: User },
    { id: 'preferences', label: 'Preferencias', icon: Sparkles },
  ];

  if (loading) {
    return (
      <div className="profile-container">
        <div style={{ textAlign: 'center', padding: '4rem 0' }}>
          <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
          <p style={{ marginTop: '1rem', color: 'var(--muted-foreground)' }}>
            Cargando perfil...
          </p>
        </div>
      </div>
    );
  }

  if (!userEmail) {
    return (
      <div className="profile-container">
        <div style={{ textAlign: 'center', padding: '4rem 0' }}>
          <h2 style={{ color: 'var(--foreground)', marginBottom: '1rem' }}>
            Sesión no encontrada
          </h2>
          <p style={{ color: 'var(--muted-foreground)', marginBottom: '2rem' }}>
            Por favor, inicia sesión para acceder a tu perfil
          </p>
          <a href="/login" style={{
            display: 'inline-block',
            padding: '0.75rem 2rem',
            background: 'linear-gradient(135deg, #835bfc 0%, #6b4ad4 100%)',
            color: 'white',
            borderRadius: 'var(--radius)',
            textDecoration: 'none',
            fontWeight: 600
          }}>
            Iniciar Sesión
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      {/* Header */}
      <div className="profile-header">
        <h1 className="profile-title">Mi Perfil</h1>
        <p className="profile-subtitle">
          Gestiona tu cuenta y preferencias de notificaciones
        </p>
      </div>

      {/* Tabs Navigation */}
      <div className="profile-tabs">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              className={`profile-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon size={18} style={{ display: 'inline', marginRight: '0.5rem' }} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="profile-content">
        {activeTab === 'notifications' && <NotificationSettings userEmail={userEmail} />}
        
        {activeTab === 'account' && (
          <div className="profile-section">
            <div className="section-header">
              <div className="section-icon">
                <User size={20} />
              </div>
              <h2 className="section-title">Información de Cuenta</h2>
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                value={userEmail}
                disabled
                className="form-input"
                style={{ opacity: 0.7 }}
              />
            </div>
            <p style={{ color: 'var(--muted-foreground)', fontSize: '0.875rem' }}>
              Para cambiar tu email o contraseña, contacta al soporte.
            </p>
          </div>
        )}

        {activeTab === 'preferences' && (
          <div className="profile-section">
            <div className="section-header">
              <div className="section-icon">
                <Sparkles size={20} />
              </div>
              <h2 className="section-title">Preferencias</h2>
            </div>
            <p style={{ color: 'var(--muted-foreground)' }}>
              Próximamente: Configuración de tema, idioma y más...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
