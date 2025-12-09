"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "react-hot-toast";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "../../config/firebase";
import Image from "next/image";
import { useRouter } from "next/navigation";
import googleIcon from "../../public/google.png";
import "../../styles/register.css";

export default function Register() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    nombres: "",
    apellidos: "",
    email: "",
    contraseña: "",
    confirmarContraseña: "",
    aceptaTerminos: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [isSubmittingCode, setIsSubmittingCode] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  // 📌 Manejo de campos del formulario
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // 📩 Envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      setIsSubmitting(true);
      try {
        const emailCheckResponse = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/users_authentication_path/check-email`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-api-key": process.env.NEXT_PUBLIC_API_KEY,
            },
            body: JSON.stringify({ email: formData.email }),
          }
        );

        if (!emailCheckResponse.ok) {
          const errorData = await emailCheckResponse.json();
          throw new Error(errorData.detail || "Error al verificar el correo");
        }

        const emailCheckData = await emailCheckResponse.json();
        if (emailCheckData.exists) {
          toast.error("Este correo electrónico ya está registrado");
          return;
        }

        const code = generateVerificationCode();
        setUserEmail(formData.email);

        await sendVerificationEmail(formData.email, code);

        setVerificationCode(code);
        setShowVerificationModal(true);

        toast.success("Código de verificación enviado a tu correo");
      } catch (error) {
        toast.error("Error al enviar el código de verificación");
        console.error(error);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // 🔢 Generar código de verificación
  const generateVerificationCode = () =>
    Math.random().toString(36).substring(2, 8).toUpperCase();

  // 📤 Enviar email de verificación
  const sendVerificationEmail = async (email, code) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/users_authentication_path/send-verification`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": process.env.NEXT_PUBLIC_API_KEY,
          },
          body: JSON.stringify({ email, code }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Error al enviar el código");
      }

      return await response.json();
    } catch (error) {
      console.error("Error al enviar el email:", error);
      throw error;
    }
  };

  // ✅ Verificar código de verificación
  const handleVerifyCode = async (email, code) => {
    try {
      setIsSubmittingCode(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/users_authentication_path/verify-code`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": process.env.NEXT_PUBLIC_API_KEY,
          },
          body: JSON.stringify({ email, code }),
        }
      );

      if (response.ok) {
        toast.success("Código de verificación correcto");
        setShowVerificationModal(false);
        await handleRegister();
      } else {
        const errorData = await response.json();
        toast.error(errorData.detail || "Código incorrecto o expirado");
      }
    } catch (error) {
      toast.error("Error al verificar el código");
      console.error(error);
    } finally {
      setIsSubmittingCode(false);
    }
  };

  // 🔐 Registro con Google
  const handleGoogleSignup = async () => {
    setIsLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);

      const userData = {
        email: result.user.email,
        name: result.user.displayName,
        provider: "google",
      };

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/users_authentication_path/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": process.env.NEXT_PUBLIC_API_KEY,
          },
          body: JSON.stringify(userData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Error al registrar usuario");
      }

      router.push("/login");
    } catch (error) {
      console.error("Error en la autenticación:", error);
      toast.error("Error al registrarse con Google");
    } finally {
      setIsLoading(false);
    }
  };

  // 🧩 Validar formulario
  const validateForm = () => {
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    if (
      !formData.nombres ||
      !formData.apellidos ||
      !formData.email ||
      !formData.contraseña ||
      !formData.confirmarContraseña
    ) {
      toast.error("Por favor, completa todos los campos");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Por favor, ingresa un email válido");
      return false;
    }

    if (formData.contraseña !== formData.confirmarContraseña) {
      toast.error("Las contraseñas no coinciden");
      return false;
    }

    if (!passwordRegex.test(formData.contraseña)) {
      toast.error(
        "La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial"
      );
      return false;
    }

    if (!formData.aceptaTerminos) {
      toast.error("Debes aceptar los términos y condiciones");
      return false;
    }

    return true;
  };

  // 🧾 Registrar usuario
  const handleRegister = async () => {
    const userData = {
      name: formData.nombres,
      last_name: formData.apellidos,
      email: formData.email,
      password: formData.contraseña,
      provider: "email",
    };

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/users_authentication_path/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": process.env.NEXT_PUBLIC_API_KEY,
          },
          body: JSON.stringify(userData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Error al registrar el usuario");
      }

      router.push("/login");
    } catch (error) {
      console.error("Error al registrar:", error);
      toast.error("Error al registrar el usuario");
    }
  };

  return (
    <div className="register-container">
      {/* Efectos de luz */}
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="light-orb" style={{ "--delay": `${i}s` }}></div>
      ))}

      <div className="register-box">
        <h1 className="register-title">Regístrate</h1>
        <h2 className="register-subtitle">Ingresa tus datos</h2>

        <form onSubmit={handleSubmit}>
          {/* Nombres y apellidos */}
          <div className="form-row">
            <div className="form-group">
              <label>Ingresa tu nombre</label>
              <input
                type="text"
                name="nombres"
                placeholder="Nombres"
                value={formData.nombres}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Ingresa tus apellidos</label>
              <input
                type="text"
                name="apellidos"
                placeholder="Apellidos"
                value={formData.apellidos}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* Email */}
          <div className="form-group">
            <label>Ingresa tu correo electrónico</label>
            <input
              type="email"
              name="email"
              placeholder="Correo electrónico"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          {/* Contraseña */}
          <div className="form-group">
            <label>Ingresa tu contraseña</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                name="contraseña"
                placeholder="Contraseña"
                value={formData.contraseña}
                onChange={handleChange}
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

          {/* Confirmar contraseña */}
          <div className="form-group">
            <label>Confirma tu contraseña</label>
            <div className="password-input-wrapper">
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmarContraseña"
                placeholder="Repite tu contraseña"
                value={formData.confirmarContraseña}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Términos y cuenta */}
          <div className="terms-group">
            <label className="terms-label">
              <input
                type="checkbox"
                name="aceptaTerminos"
                checked={formData.aceptaTerminos}
                onChange={handleChange}
                required
              />
              <span>Acepto los </span>
              <span
                className="terms-link"
                onClick={() => setShowTermsModal(true)}
              >
                términos y condiciones
              </span>
            </label>

            <div className="have-account">
              <span className="have-account-text">
                ¿Ya tienes una cuenta?
              </span>
              <span
                className="login-link"
                onClick={() => router.push("/login")}
              >
                Iniciar sesión
              </span>
            </div>
          </div>

          {/* Botones */}
          <div className="button-container">
            <button type="submit" className="submit-button" disabled={isSubmitting}>
              {isSubmitting ? "Registrando..." : "Continuar"}
            </button>

            <button
              type="button"
              className="google-button"
              onClick={handleGoogleSignup}
              disabled={isLoading}
            >
              {isLoading ? (
                "Cargando..."
              ) : (
                <>
                  <Image
                    src={googleIcon}
                    alt="Google"
                    className="google-icon"
                    width={20}
                    height={20}
                  />
                  Regístrate con Google
                </>
              )}
            </button>
          </div>
        </form>

        {/* Modal de verificación */}
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
                onChange={(e) => setVerificationCode(e.target.value)}
                className="verification-input"
                disabled={isSubmittingCode}
              />
              <div className="modal-buttons">
                <button
                  onClick={() => setShowVerificationModal(false)}
                  className="cancel-button"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleVerifyCode(userEmail, verificationCode)}
                  className="verify-button"
                  disabled={isSubmittingCode}
                >
                  {isSubmittingCode ? "Verificando..." : "Verificar"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de términos */}
        {showTermsModal && (
          <div className="verification-modal">
            <div className="modal-content">
              <h2>Términos y condiciones</h2>
              <p className="terms-text">
                LEROI es una plataforma web diseñada para generar rutas de aprendizaje personalizadas a partir de documentos cargados por los usuarios, 
                quienes son totalmente responsables del contenido que suben y de su uso, debiendo cumplir con todas las leyes y regulaciones aplicables. LEROI en ningún caso se hace responsable del uso indebido de la plataforma, incluyendo, pero no limitado a, la generación, difusión o acceso a información que incite o facilite actividades ilegales, peligrosas o que atenten contra la seguridad pública.
                La plataforma y sus contenidos son propiedad de LEROI, y su uso indebido está prohibido. 
                LEROI no se hace responsable por daños indirectos derivados del uso de la plataforma. 
                LEROI puede modificar los servicios o los términos en cualquier momento, notificando a los usuarios registrados.
              </p>
              <button
                onClick={() => setShowTermsModal(false)}
                className="verify-button"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}