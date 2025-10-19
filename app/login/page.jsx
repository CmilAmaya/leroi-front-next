'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { setCookie } from 'cookies-next';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../../config/firebase';
import '../../styles/register.css';

export default function LoginPage() {
  const router = useRouter();

  // Estados del formulario y control de flujo
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isForgotPasswordSubmitting, setIsForgotPasswordSubmitting] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [isSubmittingCode, setIsSubmittingCode] = useState(false);

  // Genera código 2FA aleatorio (solo ejemplo)
  const generateVerificationCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();

  // Envía correo de verificación
  const sendVerificationEmail = async (email, code) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/users_authentication_path/send-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al enviar el código de verificación');
      }
      return await response.json();
    } catch (error) {
      console.error('Error al enviar el email:', error);
      throw error;
    }
  };

  // Valida campos del formulario
  const validateForm = () => {
    if (!formData.email || !formData.password) {
      toast.error('Por favor, completa todos los campos');
      return false;
    }
    return true;
  };

  // 🔐 Login normal
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/users_authentication_path/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Error al iniciar sesión');

      console.log('Respuesta del login:', data);

      if (data.status === '2fa_required') {
        // Si requiere verificación 2FA
        setUserEmail(formData.email);
        const code = generateVerificationCode();
        await sendVerificationEmail(formData.email, code);
        setVerificationCode(code);
        setShowVerificationModal(true);
        toast.success('Código de verificación enviado a tu correo');
      } 
      else if (data.access_token) {
        setCookie('token', data.access_token, {
          path: '/',
          maxAge: 60 * 60 * 24, 
          sameSite: 'strict',
          secure: process.env.NODE_ENV === 'production',
        });

        setCookie('userEmail', formData.email, {
          path: '/',
          maxAge: 60 * 60 * 24,
          sameSite: 'strict',
          secure: process.env.NODE_ENV === 'production',
        });

        router.push('/roadmap');
      } 
      else {
        toast.error('No se pudo iniciar sesión. Revisa tus credenciales.');
      }
    } catch (error) {
      toast.error(error.message);
      console.error('Error al iniciar sesión:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 🔐 Verificar código de 2FA
  const handleVerifyCode = async () => {
    try {
      setIsSubmittingCode(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/users_authentication_path/verify-2fa-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail, code: verificationCode }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Código incorrecto');

      // ✅ Guarda token en cookie segura
      Cookies.set('token', data.access_token, {
        expires: 1,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Strict',
        path: '/',
      });

      router.push('/roadmap');
    } catch (error) {
      toast.error(error.message);
      console.error('Error al verificar el código:', error);
    } finally {
      setIsSubmittingCode(false);
    }
  };

  // 🔄 Recuperar contraseña
  const handleForgotPassword = async () => {
    if (!forgotPasswordEmail || !forgotPasswordEmail.includes('@')) {
      toast.error('Por favor ingresa un correo válido');
      return;
    }

    setIsForgotPasswordSubmitting(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/users_authentication_path/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotPasswordEmail }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al enviar correo');
      }

      setForgotPasswordEmail('');
      setShowForgotPassword(false);
      toast.success('Correo enviado correctamente');
    } catch (error) {
      toast.error(error.message);
      console.error('Error al recuperar contraseña:', error);
    } finally {
      setIsForgotPasswordSubmitting(false);
    }
  };

  // 🔑 Login con Google
  const handleGoogleSignup = async () => {
    setIsLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const userData = { email: result.user.email, name: result.user.displayName, provider: 'google' };

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/users_authentication_path/login-google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Error al iniciar sesión con Google');

      // ✅ Guarda token en cookie segura
      Cookies.set('token', data.access_token, {
        expires: 1,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Strict',
        path: '/',
      });

      router.push('/roadmap');
    } catch (error) {
      toast.error('Error al iniciar sesión con Google');
      console.error('Error en autenticación con Google:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="register-container">
      {/* Fondo animado */}
      {['0s', '1s', '2s', '3s', '4s'].map((delay, i) => (
        <div key={i} className="light-orb" style={{ '--delay': delay }}></div>
      ))}

      <div className="register-box">
        <h1 className="register-title">Inicia sesión</h1>
        <h2 className="register-subtitle">Ingresa tus datos</h2>

        {/* Formulario principal */}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Correo electrónico</label>
            <input
              type="email"
              placeholder="Correo electrónico"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Contraseña</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Contraseña"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div className="have-account">
            <span>¿No tienes una cuenta?</span>
            <span className="login-link" onClick={() => router.push('/register')}>
              Regístrate
            </span>
          </div>

          <div className="forgot-password">
            <span className="login-link" onClick={() => setShowForgotPassword(true)}>
              ¿Olvidaste tu contraseña?
            </span>
          </div>

          <div className="button-container">
            <button type="submit" className="submit-button" disabled={isSubmitting}>
              {isSubmitting ? 'Iniciando sesión...' : 'Continuar'}
            </button>
            <button
              type="button"
              className="google-button"
              onClick={handleGoogleSignup}
              disabled={isLoading}
            >
              {isLoading ? (
                'Cargando...'
              ) : (
                <>
                  <img src="/google.png" alt="Google" className="google-icon" />
                  Inicia sesión con Google
                </>
              )}
            </button>
          </div>
        </form>

        {/* Modal de "Olvidé mi contraseña" */}
        {showForgotPassword && (
          <div className="verification-modal">
            <div className="modal-content">
              <h2>Ingresa tu correo asociado</h2>
              <input
                type="email"
                value={forgotPasswordEmail}
                onChange={(e) => setForgotPasswordEmail(e.target.value)}
                placeholder="Correo electrónico"
                required
                className="forgot-password-input"
              />
              <div className="modal-buttons">
                <button type="button" className="cancel-button" onClick={() => setShowForgotPassword(false)}>
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="submit-button"
                  onClick={handleForgotPassword}
                  disabled={isForgotPasswordSubmitting}
                >
                  {isForgotPasswordSubmitting ? 'Enviando...' : 'Enviar'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal 2FA */}
        {showVerificationModal && (
          <div className="verification-modal">
            <div className="modal-content">
              <h2>Verifica tu correo</h2>
              <p>Enviamos un código a:</p>
              <p className="email">{userEmail}</p>
              <input
                type="text"
                placeholder="* * * * * *"
                maxLength={6}
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                className="verification-input"
                disabled={isSubmittingCode}
              />
              <div className="modal-buttons">
                <button className="cancel-button" onClick={() => setShowVerificationModal(false)}>
                  Cancelar
                </button>
                <button className="verify-button" onClick={handleVerifyCode} disabled={isSubmittingCode}>
                  {isSubmittingCode ? 'Verificando...' : 'Verificar'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}