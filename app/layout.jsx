import "../styles/app.css"
import "../styles/styles.css"
import { Toaster } from "react-hot-toast";
import Navbar from "../components/Navbar";
import { Lexend_Deca } from "next/font/google";

export const metadata = {
  title: "Leroi",
  description: "Plataforma de rutas de aprendizaje con IA",
};

const lexend = Lexend_Deca({
  subsets: ["latin"],
  weight: ["100","200","300","400","500","600","700","800","900"],
  variable: "--font-main",
});

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={lexend.variable} data-theme="dark">
    <link rel="icon" href="/LOGO.png" />
      <body>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: "#1a1a1a",
              color: "#fff",
              border: "1px solid #835bfc",
            },
            success: {
              iconTheme: {
                primary: "#835bfc",
                secondary: "#fff",
              },
            },
          }}
        />
        <Navbar />
        <main className="App">{children}</main>
      </body>
    </html>
  );
}