'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { PDFDocument } from 'pdf-lib';
import { getCookie, setCookie, deleteCookie } from 'cookies-next'; // ...existing code... ← agregado setCookie/deleteCookie
import Image from 'next/image';
import '../../styles/roadmap.css';

function Roadmap() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams(); 
  const locationState = searchParams.get('topicState') ? JSON.parse(searchParams.get('topicState')) : null;

  const [fileUploaded, setFileUploaded] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);  
  const [helpModal, setHelpModal] = useState(false);
  const [base64, setBase64] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showFileInfo, setShowFileInfo] = useState(false);
  const [userCredits, setUserCredits] = useState(null);
  const [previewCost, setPreviewCost] = useState("Calculando...");
  const [CanUserPay, setCanUserPay] = useState(true);
  const [topicsModal, setTopicsModal] = useState(false);
  const [topics, setTopics] = useState([]);
  const [loadingPage, setLoadingPage] = useState(false);
  const [loadingText, setLoadingText] = useState("");
  const [roadmapTopics, setRoadmapTopics] = useState({});
  const [roadmapInfo, setRoadmapInfo] = useState({});
  const [relatedTopics, setRelatedTopics] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [userData, setUserData] = useState(null);
  const [fileData, setFileData] = useState(null);

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  const authToken = getCookie('token');

  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = () => {
        const base64String = reader.result;
        const base64Data = base64String.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  useEffect(() => {
    if (base64) setPreviewFile(true);
  }, [base64]);

  useEffect(() => {
    if (topics.length > 0) {
      console.log("Topics updated:", topics);
      setTopicsModal(true);
    }
  }, [topics]);

  useEffect(() => {
    // const storedModalState = localStorage.getItem('topicsModal');
    // if (storedModalState === 'true') {
    //   if (locationState?.relatedTopics) {
    //     setTopics(locationState.relatedTopics || []);
    //   }
    //   setTopicsModal(true);
    //   localStorage.removeItem('topicsModal');
    // }
    // ↓ Nuevo: leer estado desde cookies
    const storedModalState = getCookie('topicsModal');
    if (storedModalState === 'true') {
      const topicStateCookie = getCookie('topicState');
      if (topicStateCookie) {
        try {
          const parsed = JSON.parse(topicStateCookie);
          if (parsed?.relatedTopics?.length) setTopics(parsed.relatedTopics);
        } catch (e) {
          console.error('Error al parsear topicState:', e);
        }
      } else if (locationState?.relatedTopics) {
        setTopics(locationState.relatedTopics || []);
      }
      setTopicsModal(true);
      // Limpia cookies usadas una vez
      deleteCookie('topicsModal');
      deleteCookie('topicState');
    }
  }, [locationState]);

  // useEffect(() => {
  //   if (Object.keys(roadmapTopics).length > 0) {
  //     console.log("Roadmap Topics:", roadmapTopics);
  //     setLoadingPage(false);
  //     setLoadingText("");
  //     router.push('/generatedRoadmap', { state: { roadmapTopics, relatedTopics, roadmapInfo } });
  //   }
  // }, [roadmapTopics, relatedTopics, router]);
  // ↑ Comentado: ahora navegamos cuando seteamos cookies (ver handleSelectedTopic)

  useEffect(() => {
    if (relatedTopics.length > 0) {
      console.log("Related Topics :D", relatedTopics);
    }
  }, [relatedTopics]);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!authToken) {
        router.push("/login");
        return;
      }

      try {
        const userResponse = await fetch(`${backendUrl}/users_authentication_path/user-profile`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
            'x-api-key': process.env.NEXT_PUBLIC_API_KEY
          },
        });

        if (!userResponse.ok) throw new Error("Error al obtener los datos del usuario");

        const userData = await userResponse.json();
        setUserData(userData.data);
      } catch (error) {
        console.error(error);
        router.push("/login");
      }
    };

    fetchUserData();
  }, [backendUrl, authToken, router]);

  // --- FUNCIONES DE MANEJO DE ARCHIVOS ---
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    const maxSize = 50 * 1024 * 1024; 
    if (file.size > maxSize) {
      toast.error('¡El archivo supera nuestras capacidades de procesamiento! Prueba eliminando algunas páginas o imagenes del archivo...');
      return;
    } else {
      setFileUploaded(file);
      convertToBase64(file);
    }

    setLoadingPage(true);
    setLoadingText("Cargando documento 🧐");

    try {
      const pdfDoc = await PDFDocument.load(await file.arrayBuffer());
      const newPdfDoc = await PDFDocument.create();
      const [firstPage] = await newPdfDoc.copyPages(pdfDoc, [0]); 
      newPdfDoc.addPage(firstPage);
      const pdfBytes = await newPdfDoc.save();
      const previewBlob = new Blob([pdfBytes], { type: 'application/pdf' });
      
      const base64Preview = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(previewBlob);
      });
      
      const base64Pure = await convertToBase64(previewBlob);
      setBase64(base64Preview);

      const dataToSend = {
        fileName: file.name,
        fileType: file.type, 
        fileSize: file.size,
        fileBase64: base64Pure,
      };

      setFileData(dataToSend);
      console.log("📦 Datos del archivo guardados:", dataToSend);

      function getEmailFromToken(token) {
        try {
          if (!token) return null;
          const parts = token.split('.');
          if (parts.length !== 3) return null;
          const base64Url = parts[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const padded = base64 + '==='.slice((base64.length + 3) % 4);
          const payload = JSON.parse(atob(padded));
          return payload.email || payload.sub || null;
        } catch { return null; }
      }

      const email = getEmailFromToken(authToken);
      if (!email) {
        toast.error('No se pudo obtener el correo del usuario.');
        return;
      }

      if (!userData || !userData.email) {
        toast.error("Esperando los datos del usuario...");
        return;
      }

      const user_credits = await getUserCredits();
      const credits_cost = 1;

      setPreviewCost(`Costo: ${credits_cost} crédito(s)`);
      setUserCredits(`Actualmente tienes ${user_credits} crédito(s)`);
      setShowFileInfo(true);

      const canPay = Number(user_credits) >= Number(credits_cost);
      setCanUserPay(canPay);
      if (!canPay) toast.error('Créditos insuficientes 😔');

      // const analyzePromise = fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL_PREPROCESSING}/files/analyses`, { ... });
      // ↓ Nuevo: evita /undefined/files/analyses cuando falta la env var
      //const preprocBase = process.env.NEXT_PUBLIC_BACKEND_URL_PREPROCESSING;
      const preprocBase = process.env.NEXT_PUBLIC_BACKEND_URL;
      if (!preprocBase) {
        console.error('Falta NEXT_PUBLIC_BACKEND_URL_PREPROCESSING');
      } else {
        fetch(`${preprocBase}/files/analyses`, {
          method: 'POST',
          headers: { 
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(dataToSend),
        })
          .then(async (res) => {
            const ct = res.headers.get('content-type') || '';
            const payload = ct.includes('application/json') ? await res.json() : await res.text();
            if (!res.ok) throw new Error(typeof payload === 'string' ? payload : payload?.detail || 'Error en análisis');
            return payload;
          })
          .then((analyzeResult) => {
            if (analyzeResult?.has_virus) {
              toast.error("El archivo contiene virus. El usuario ha sido eliminado.");
            }
          })
          .catch((error) => console.error('Error al analizar el archivo:', error));
      }

    } catch (error) {
      console.error('Error al obtener la vista previa de costos:', error);
      toast.error('Error al obtener el costo de procesamiento');
    } finally {
      setLoadingPage(false);
      setLoadingText("");
    }
  };

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => { setIsDragging(false); };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileChange({ target: { files: [file] } });
  };

  const handleReset = () => {
    setFileUploaded(null);
    setPreviewCost("Calculando...");
    setShowFileInfo(false);
  };

  const handleSubmitFile = async () => {
    if (!fileUploaded) return toast.error("No has subido ningún archivo");
    if (!base64 || base64.length < 50) return toast.error("El archivo aún se está procesando. Espera unos segundos e inténtalo de nuevo.");

    setLoadingPage(true);
    setLoadingText("Buscando temas relacionados... 📈🧠📚");

    try {
      const processResponse = await fetch(`${backendUrl}/learning_path/documents`, {
        method: "POST",
        headers: { Authorization: `Bearer ${authToken}`, "Content-Type": "application/json" },
        body: JSON.stringify(fileData),
      });

      if (!processResponse.ok) {
        // const errorData = await processResponse.json(); // podía fallar con HTML
        const text = await processResponse.text();
        toast.error("Error en el procesamiento del documento, vuelve a intentarlo");
        throw new Error(text || 'Error en /learning_path/documents');
      }

      const result = await processResponse.json();
      setTopics(result.themes);

    } catch (error) {
      console.error("Error en el proceso de IA:", error);
      toast.error("Error al enviar los datos al backend");
    } finally {
      setIsLoading(false);
      setLoadingPage(false);
      setLoadingText("");
    }
  };

  const getUserCredits = async () => {
    try {
      const response = await fetch(`${backendUrl}/users_authentication_path/user-credits/${encodeURIComponent(userData.email)}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
      });

      if (!response.ok) throw new Error('Error al obtener los créditos del usuario');
      const data = await response.json();
      return data.credits;

    } catch (error) {
      console.error('Error al obtener créditos:', error);
      return 0;
    }
  };

  const updateUserCredits = async (amount) => {
    try {
      const response = await fetch(`${backendUrl}/users_authentication_path/user-credits/${encodeURIComponent(userData.email)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
        body: JSON.stringify({ amount }),
      });
      if (!response.ok) throw new Error('Error al actualizar los créditos del usuario');
      setUserData(prev => ({ ...prev, credits: prev.credits + amount }));
    } catch (error) { console.error('Error al actualizar créditos:', error); }
  };

  const handleSelectedTopic = async (topic) => {  
    setTopicsModal(false);
    setLoadingPage(true);
    setLoadingText("Estamos creando tu ruta de aprendizaje 😁");

    try {
      const response = await fetch(`${backendUrl}/learning_path/roadmaps`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
        body: JSON.stringify({ topic }),
      });

      if (!response.ok) throw new Error('Error al enviar el topic al backend');
      const result = await response.json();

      const roadmapData = typeof result.roadmap === "string" ? JSON.parse(result.roadmap) : result.roadmap;
      const extraInfoData = typeof result.extra_info === "string" ? JSON.parse(result.extra_info) : result.extra_info;

      await updateUserCredits(-1);

      const responseTopics = await fetch(`${backendUrl}/learning_path/related-topics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
        body: JSON.stringify({ topic }),
      });

      if (!responseTopics.ok) throw new Error('Error al obtener los temas relacionados');
      const resultTopics = await responseTopics.json();

      // setRelatedTopics(resultTopics);
      // setRoadmapTopics(roadmapData);
      // setRoadmapInfo(extraInfoData);
      // router.push('/generatedRoadmap', { state: { roadmapTopics, relatedTopics, roadmapInfo } });
      // ↑ Comentado: ahora usamos cookies para que GeneratedRoadmap las lea

      // ↓ Nuevo: persistimos en cookies y navegamos
      const cookieOpts = {
        path: '/',
        maxAge: 60 * 60 * 24, // 24 horas
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production',
      };
      setCookie('currentRoadmap', JSON.stringify(roadmapData), cookieOpts);
      setCookie('relatedTopics', JSON.stringify(resultTopics), cookieOpts);
      setCookie('roadmapInfo', JSON.stringify(extraInfoData), cookieOpts);

      router.push('/generatedRoadmap');

    } catch (error) {
      console.error('🚨 Error detallado al generar la ruta:', error);
      if (error instanceof SyntaxError) toast.error('Error al procesar la respuesta del servidor. El formato no es válido.');
      else toast.error('No pudimos generar tu ruta de aprendizaje 😔');
    } finally {
      setLoadingPage(false);
      setLoadingText("");
    }
  };

  return (
    <>
      <div>
        {!showFileInfo ? (
          <div className="roadmap-container">
            <h1>Sube un archivo para generar tu ruta de aprendizaje</h1>
            <div className={`file-upload ${isDragging ? 'dragging' : ''}`} onClick={() => document.getElementById('fileInput').click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input id="fileInput" type="file" accept=".pdf" onChange={handleFileChange} style={{ display: 'none' }} />
              <img src="/archivo.png" alt="Icono de carga" className="upload-icon" />
              <p>{isDragging ? 'Suelta tu archivo aquí...' : 'Arrastra y suelta tu archivo PDF aquí o haz clic para subirlo (Máx 50 MB)'}</p>
            </div>
          </div>
        ) : (
          <div className="file-info-container">
            {previewFile && base64 && (
              <div className="pdf-preview">
                <iframe src={base64 + "#toolbar=0"} title="Vista previa del PDF" width="100%" height="100%" />
              </div>
            )}
            <div className="file-details">
              <h2>Detalles del Archivo</h2>
              <p>Nombre: {fileUploaded.name}</p>
              <p>Tamaño: {(fileUploaded.size / (1024 * 1024)).toFixed(2)} MB</p>
              <div className="credits-cost">
                <h2>Costo de procesamiento</h2>
                <p className="preview-cost-label">{previewCost}</p>
                <p className="user-credits-label">{userCredits}</p>
              </div>
              <div className="buttons-container">
                <button className="generate-button" onClick={handleSubmitFile} disabled={!CanUserPay}>
                  {isLoading ? 'Generando tu ruta de aprendizaje...' : 'Generar ruta de aprendizaje'}
                </button>
                <button className="reset-button" onClick={handleReset}>Subir otro archivo</button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="help-icon" onClick={() => setHelpModal(true)}>
        <Image src="/Tutorial_logo.png" alt="Ayuda" width={60} height={60} className="tutorial-icon" />
      </div>

      {helpModal && (
        <div className="preview-modal">
          <div className="preview-content">
            <video width="640" height="360" controls>
                <source src="/Tutorial_CrearRoadmap.mp4" type="video/mp4" />
                    Tu navegador no soporta el elemento de video.
            </video>
            <button onClick={() => setHelpModal(false)}>Cerrar</button>
          </div>
        </div>
      )}

      {topicsModal && (
        <div className="topics-modal">
          <h1>Temas detectados en tu archivo</h1>
          <div className="topics-content">
            {topics.map((topic, index) => (
              <button className="topic-button" key={index} onClick={() => handleSelectedTopic(topic)}>{topic}</button>
            ))}
          </div>
        </div>
      )}

      {loadingPage && (
        <div className="loading-modal">
          <div className="loading-content">
            <h2>{loadingText}</h2>
            <div className="spinner"></div>
          </div>
        </div>
      )}
    </>
  );
}

export default Roadmap;