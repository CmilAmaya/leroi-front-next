'use client';

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

import { Fade } from "react-awesome-reveal";
import Footer from "../components/Footer";
import "../styles/styles.css";
import "../styles/home.css";

export default function Home() {
  const [activeIndex, setActiveIndex] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsAuthenticated(!!token);
  }, []);

  const faqData = [
    {
      question: "¿Cómo funciona?",
      answer:
        "Leroi analiza el contenido de los documentos subidos por los usuarios y genera un roadmap de aprendizaje jerárquico basado en los temas y subtemas identificados. Utiliza procesamiento de lenguaje natural para extraer conceptos clave y organizarlos en una secuencia lógica de aprendizaje.",
    },
    {
      question: "¿Qué tipo de documentos puedo subir?",
      answer:
        "Leroi acepta documentos en formato PDF. Se recomienda que los documentos contengan texto estructurado y contengan pocas imagenes, esto con el fin de obtener una mejor interpretación y generar roadmaps más precisos.",
    },
    {
      question: "¿Puedo personalizar los roadmaps generados?",
      answer:
        "Por ahora no, pero estamos trabajando para que los usuarios puedan ajustar los roadmaps generados por Leroi.",
    },
    {
      question: "¿Mi cuenta ha sido suspendida o eliminada?",
      answer:
        "Si tu cuenta ha sido suspendida o eliminada, puede deberse a una infracción de nuestras políticas. Recuerda que subir archivos con contenido sensible o malicioso puede llevar a la eliminación de la cuenta. Si crees que esto ha ocurrido por error, puedes ponerte en contacto con nuestro equipo de soporte.",
    },
    {
      question:
        "¿Por qué mi cuenta fue suspendida después de varios intentos fallidos de inicio de sesión?",
      answer:
        "Por razones de seguridad, si introduces varias veces una contraseña incorrecta, tu cuenta puede ser suspendida temporalmente. Te recomendamos esperar unos minutos e intentar nuevamente o restablecer tu contraseña si no la recuerdas. Si el problema persiste, contacta con nuestro equipo de soporte.",
    },
    {
      question: "¿Puedo compartir los roadmaps generados?",
      answer:
        "Sí, puedes compartir los roadmaps generados con otros usuarios al exportarlos en formato PDF, PNG o JSON para su consulta offline.",
    },
  ];

  const toggleAnswer = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const element = document.querySelector(hash);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, []);

  return (
    <>
      {/* Hook */}
      <section id="tutorial" className="hook">
        <div className="hook-content">
          <Image
            src="/gif.gif"
            alt="Tutorial Placeholder"
            className="hook-gif"
            width={500}
            height={500}
          />
          <h1>
            <Fade delay={200} cascade damping={0.02}>
              Convierte tus documentos en rutas de aprendizaje personalizadas
            </Fade>
          </h1>
          <Link
            href={isAuthenticated ? "/roadmap" : "/register"}
            className="cta-button"
          >
            {isAuthenticated
              ? "Generar ruta de aprendizaje"
              : "Sube tu primer documento"}
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="features">
        <h2>
          <Fade delay={200} cascade damping={0.02}>
            Conoce lo que es LEROI
          </Fade>
        </h2>
        <p className="definition">
          Leroi es una plataforma de aprendiz diseñada para optimizar la planificación y organización del estudio. 
          Automatiza la creación de planes de estudio, reduciendo el tiempo dedicado a estructurar qué y cómo aprender. 
          Además, identifica y jerarquiza subtemas para proporcionar un camino lógico en el aprendizaje. 
          Su capacidad de personalización permite a los usuarios cargar sus propios documentos generando rutas de estudio 
          adaptadas a su contenido específico.
        </p>
        <div className="features-container">
          <div className="feature-card">
            <div className="feature-icon">
              <img src="public/feature-1.svg" alt="Asistente de aprendizaje" />
            </div>
            <h3>Asistente de aprendizaje</h3>
            <p>
              Leroi automatiza la creación de planes de estudio, reduciendo significativamente el tiempo dedicado a planificar qué y cómo estudiar.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <img src="public/feature-2.svg" alt="Organizador" />
            </div>
            <h3>Organizador</h3>
            <p>
              Leroi identifica y organiza subtemas jerárquicamente, proporcionando un camino lógico y progresivo para el aprendizaje.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <img src="public/feature-3.svg" alt="Personalizador experto" />
            </div>
            <h3>Personalizador experto</h3>
            <p>
              Leroi permite a los usuarios cargar sus documentos (libros, artículos, apuntes) y generar rutas de aprendizaje adaptadas a ese contenido específico.
            </p>
          </div>
        </div>
      </section>
      {/*Pricing*/}
      <section id= "credits" className="pricing">
        <h2>
          <Fade delay={200} cascade damping={0.02}>
            Adquiere créditos
          </Fade>
        </h2>
        <div className="pricing-container">
          <div className="pricing-card">
            <h3>Principiante</h3>
            <p className="price">250 créditos</p>
            <ul>
              <li>Ideal para probar Leroi</li>
              <li>Procesa muchos documentos pequeños </li>
            </ul>
            <Link href={{ pathname: "/credits", query: { credits: 250 } }} className="cta-button">Comprar paquete</Link>
          </div>
          <div className="pricing-card">
            <h3>Intermedio</h3>
            <p className="price">750 créditos</p>
            <ul>
              <li>Ideal para estudiantes</li>
              <li>Suficiente para generar roadmaps con archivos medianamente grandes</li>
            </ul>
            <Link href={{ pathname: "/credits", query: { credits: 750 } }} className="cta-button">Comprar paquete</Link>
          </div>
          <div className="pricing-card">
            <h3>Avanzado</h3>
            <p className="price">1500 créditos</p>
            <ul>
              <li>Perfecto para autodidactas avanzados</li>
              <li>Genera roadmaps con archivos grandes</li>
            </ul>
            <Link href={{ pathname: "/credits", query: { credits: 1500 } }} className="cta-button">Comprar paquete</Link>
          </div>
        </div>
      </section>


      {/* Preguntas frecuentes */}
      <section id="faq" className="faq">
        <h2>
          <Fade delay={200} cascade damping={0.02}>
            Preguntas frecuentes
          </Fade>
        </h2>
        <div className="faq-container">
          {faqData.map((item, index) => (
            <div
              key={index}
              className={`faq-card ${
                activeIndex === index ? "active" : ""
              }`}
              onClick={() => toggleAnswer(index)}
              style={{ cursor: "pointer" }}
            >
              <h4>{item.question}</h4>
              {activeIndex === index && <p>{item.answer}</p>}
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </>
  );
}
