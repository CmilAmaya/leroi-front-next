'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { Clock } from 'lucide-react';

const REMINDER_SERVICE_URL = process.env.NEXT_PUBLIC_REMINDER_SERVICE_URL || 'http://localhost:8006';

export default function ReminderConfig({ userEmail, currentSettings, onUpdated }) {
  const [frequency, setFrequency] = useState(currentSettings?.frequency || 'daily');
  const [time, setTime] = useState(currentSettings?.time || '09:00');
  const [loading, setLoading] = useState(false);

  const frequencies = [
    { value: 'daily', label: 'Diario' },
    { value: 'every_2_days', label: 'Cada 2 días' },
    { value: 'weekly', label: 'Semanal' },
    { value: 'intelligent', label: 'Inteligente (basado en tu progreso)' },
    { value: 'disabled', label: 'Desactivado' },
  ];

  const handleSaveSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${REMINDER_SERVICE_URL}/api/users/reminder-settings/${userEmail}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            reminderFrequency: frequency,
            reminderTime: time,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        onUpdated();
      } else {
        toast.error(data.message || 'Error al actualizar configuración');
      }
    } catch (error) {
      console.error('Error actualizando recordatorios:', error);
      toast.error('Error de conexión al actualizar configuración');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-section">
      <div className="section-header">
        <div className="section-icon">
          <Clock size={20} />
        </div>
        <h2 className="section-title">Configuración de Recordatorios</h2>
      </div>

      <p className="section-description">
        Personaliza cómo y cuándo quieres recibir recordatorios sobre tus rutas de aprendizaje.
      </p>

      <div className="form-group">
        <label className="form-label">Frecuencia de recordatorios</label>
        <select
          value={frequency}
          onChange={(e) => setFrequency(e.target.value)}
          className="form-select"
        >
          {frequencies.map((freq) => (
            <option key={freq.value} value={freq.value}>
              {freq.label}
            </option>
          ))}
        </select>
        <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', marginTop: '0.5rem' }}>
          Los recordatorios inteligentes se adaptan automáticamente a tu ritmo de estudio
        </p>
      </div>

      {frequency !== 'disabled' && (
        <div className="form-group">
          <label className="form-label">Hora del recordatorio</label>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="form-input"
          />
          <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', marginTop: '0.5rem' }}>
            Selecciona la hora en la que prefieres recibir tus recordatorios
          </p>
        </div>
      )}

      <button
        onClick={handleSaveSettings}
        className="btn-primary"
        disabled={loading}
      >
        {loading ? 'Guardando...' : 'Guardar Configuración'}
      </button>
    </div>
  );
}
