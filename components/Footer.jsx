'use client';

import '../styles/footer.css';
import { FaInstagram, FaTwitter, FaDiscord } from "react-icons/fa";
import Link from "next/link";

const defaultT = {
  footer: {
    aboutUs: "Sobre nosotros",
    resources: "Recursos",
    faq: "FAQ",
    infoent: "Información de la empresa",
    socialMedia: "Redes sociales",
    aboutUsLink: "/about",
    faqLink: "/#faq",
    instagram: <FaInstagram />,
    instagramLink: "https://www.instagram.com/leroidevteam/",
    x: <FaTwitter />,
    xLink: "https://x.com/LeroiDevteam",
    discord: <FaDiscord />,
    discordLink: "https://discord.gg/Yuw2Qec9x",
  },
};

function Footer({ t = defaultT }) {
  const footer = t?.footer || defaultT.footer;

  return (
    <footer className="footer">
      <div className="footer-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
        
        {/* Redes sociales */}
        <div className="footer-section" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span>{footer.socialMedia}:</span>
          <a href={footer.instagramLink} target="_blank" rel="noopener noreferrer">{footer.instagram}</a>
          <a href={footer.xLink} target="_blank" rel="noopener noreferrer">{footer.x}</a>
          <a href={footer.discordLink} target="_blank" rel="noopener noreferrer">{footer.discord}</a>
        </div>

        {/* Sobre nosotros */}
        <div className="footer-section">
          <span>{footer.aboutUs}: </span>
          <Link href={footer.aboutUsLink}>{footer.infoent}</Link>
        </div>

        {/* Recursos */}
        <div className="footer-section">
          <span>{footer.resources}: </span>
          <Link href={footer.faqLink}>{footer.faq}</Link>
        </div>

        {/* Derechos reservados */}
        <div className="footer-section">
          <span>© 2025 Leroi. Todos los derechos reservados.</span>
        </div>

      </div>
    </footer>
  );
}

export default Footer;
