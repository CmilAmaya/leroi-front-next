'use client';

import { useState, useEffect } from "react";
import { ThemeToggle } from "./ui/ThemeToggle";
import { Button } from "./ui/Button";
import { User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getCookie, deleteCookie } from "cookies-next"; // 👈 usamos cookies
import "../styles/navbar.css";

function NavItem({ href, children }) {
  return (
    <Link href={href} className="nav-item">
      {children}
    </Link>
  );
}

export default function Navbar({ t = {} }) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const nav = t?.nav || {
    about: "Quiénes somos",
    credits: "Créditos",
    faq: "Preguntas frecuentes",
    contact: "Contacto",
    login: "Iniciar sesión",
    signup: "Registrarse",
    roadmap: "Roadmap",
  };

  const toggleMenu = () => setMenuOpen(!menuOpen);

  useEffect(() => {
    const token = getCookie("token");
    setIsAuthenticated(!!token);
  }, []);
  
  const handleLogout = () => {
    deleteCookie("token");
    setIsAuthenticated(false);
    router.push("/login");
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-row">
          {/* Logo */}
          <Link href="/" className="navbar-logo">
            <div className="logo-container">
              <Image src="/LOGO.png" alt="Logo" width={40} height={40} className="logo-image" />
            </div>
            <span className="logo-text">Leroi</span>
          </Link>

          {/* Menú hamburguesa */}
          <button className="hamburger-button" onClick={toggleMenu}>☰</button>

          {/* Enlaces */}
          <div className={`navbar-links ${menuOpen ? "menu-open" : ""}`}>
              <NavItem href="/about">{nav.about}</NavItem>
              <NavItem href="/credits">{nav.credits}</NavItem>
              <NavItem href="/#faq">{nav.faq}</NavItem>
              <NavItem href="/about/#team">{nav.contact}</NavItem>
              {isAuthenticated && <NavItem href="/roadmap">{nav.roadmap}</NavItem>}
          </div>

          {/* Botones */}
          <div className="navbar-buttons">
            {isAuthenticated ? (
              <>
                <Link href="/profile" className="profile-button">
                  <User size={24} color="white" />
                </Link>
                <Button variant="ghost" size="sm" className="navbar-button" onClick={handleLogout}>
                  Cerrar Sesión
                </Button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm" className="navbar-button">
                    {nav.login}
                  </Button>
                </Link>
                <Link href="/register">
                  <Button variant="ghost" size="sm" className="navbar-button">
                    {nav.signup}
                  </Button>
                </Link>
              </>
            )}
            <ThemeToggle />
          </div>
        </div>
      </div>
    </nav>
  );
}