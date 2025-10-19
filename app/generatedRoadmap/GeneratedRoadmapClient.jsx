'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faDownload, faTimes, faSearchPlus, faSearchMinus, 
  faExpand, faSave, faClipboardQuestion, faLink 
} from '@fortawesome/free-solid-svg-icons';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
//import '../../../styles/roadmap.css';
import '../../styles/roadmap.css'; 

import { getCookie, setCookie, deleteCookie } from 'cookies-next';

// Importación dinámica para ReactFlow (solo cliente)
const ReactFlow = dynamic(() => import('@xyflow/react'), { 
  ssr: false,
  loading: () => <div>Cargando roadmap...</div>
});
const Background = dynamic(() => import('@xyflow/react').then(mod => ({ default: mod.Background })), { ssr: false });

// Importar CustomNode dinámicamente también
const CustomNode = dynamic(() => import('../../components/ui/CustomNode'), { ssr: false });

export default function GeneratedRoadmapClient({ searchParams }) {
  const router = useRouter();
  const urlSearchParams = useSearchParams();
  
  // Estados
  const [roadmapData, setRoadmapData] = useState(null);
  const [relatedTopics, setRelatedTopics] = useState([]);
  const [roadmapInfo, setRoadmapInfo] = useState({});
  const [linkButton, setLinkButton] = useState(undefined);
  const [relatedTopicsModal, setRelatedTopicsModal] = useState(false);
  const [showDownloadOptions, setShowDownloadOptions] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState('json');
  const [topicInfo, setTopicInfo] = useState("");
  const [modalInfo, setModalInfo] = useState(false);
  const [linkInfo, setLinkInfo] = useState([]);
  const [modalPosition, setModalPosition] = useState({});
  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  const [questionModal, setQuestionModal] = useState(false);
  const [loadingPage, setLoadingPage] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [levelOffset, setLevelOffset] = useState(400);
  const [nodeWidth, setNodeWidth] = useState(400);
  
  const roadmapRef = useRef(null);
  const reactFlowInstance = useRef(null);

  // Efecto para obtener datos del localStorage o searchParams
  useEffect(() => {
  

    //const storedRoadmap = localStorage.getItem('currentRoadmap');
    //const storedRelatedTopics = localStorage.getItem('relatedTopics');
    //const storedRoadmapInfo = localStorage.getItem('roadmapInfo');

    const storedRoadmap = getCookie('currentRoadmap');
    const storedRelatedTopics = getCookie('relatedTopics');
    const storedRoadmapInfo = getCookie('roadmapInfo');
    
    if (storedRoadmap) {
      try {
        setRoadmapData(JSON.parse(storedRoadmap));
      } catch (error) {
        console.error('Error parsing roadmap data:', error);
      }

    } else {
      console.log('No hay datos de roadmap en las cookies.');
    }
    
    if (storedRelatedTopics) {
      try {
        setRelatedTopics(JSON.parse(storedRelatedTopics));
      } catch (error) {
        console.error('Error parsing related topics:', error);
      }
    }
    
    if (storedRoadmapInfo) {
      try {
        setRoadmapInfo(JSON.parse(storedRoadmapInfo));
      } catch (error) {
        console.error('Error parsing roadmap info:', error);
      }
    }
  }, []);

  // Efecto para navegar a questions
  useEffect(() => {
    if (Object.keys(generatedQuestions).length > 0) {
      setLoadingPage(false);
      // Guardar en localStorage y navegar
      //localStorage.setItem('generatedQuestions', JSON.stringify(generatedQuestions));
      setCookie('generatedQuestions', JSON.stringify(generatedQuestions), {
        path: '/',
        maxAge: 60 * 60 * 24,
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production',
      });
      router.push('/questions');
    }
  }, [generatedQuestions, router]);

  // Efecto para dimensiones responsivas
  useEffect(() => {
    const updateDimensions = () => {
      const width = window.innerWidth;
      if (width < 480) { 
        setLevelOffset(450);
        setNodeWidth(225);
      } else if (width >= 480 && width < 768) { 
        setLevelOffset(395);
        setNodeWidth(225);
      } else { 
        setLevelOffset(400);
        setNodeWidth(400);
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const handleNodeEnter = (event, node) => {
    const name = node.data.label;
    const x = event.clientX;
    const y = event.clientY;
    setModalPosition({ x, y });

    let info = roadmapInfo[name];
    
    if (!info) {
      setTopicInfo("Sin información disponible.");
      setLinkInfo([]);
      setModalInfo(true);
      return;
    }

    let formattedText = "";
    if (typeof info === "object") {
      if (Array.isArray(info)) {
        formattedText = info.join("\n");
      } else {
        formattedText = Object.entries(info)
          .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(", ") : value}`)
          .join("\n");
      }
    } else {
      formattedText = info.toString();
    }

    const regex = /(https?:\/\/[^\s]+)/g;
    const matches = formattedText.match(regex);
    const cleanText = formattedText.replace(regex, "").trim();

    setTopicInfo(cleanText);
    setLinkInfo(matches || []);
    setModalInfo(true);
  };

  const handleNodeLeave = () => {
    setModalInfo(false);
    setModalPosition({});
  };

  const handleGenerateQuestions = async () => {
    setQuestionModal(false);
    setLoadingPage(true);
    
    try {
      //const authToken = localStorage.getItem("token");
      const authToken = getCookie("token");
      const questionsResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/learning_path/questions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ topic: JSON.stringify(roadmapInfo) }),
      });
  
      if (!questionsResponse.ok) {
        const errorData = await questionsResponse.json();
        throw new Error(errorData.detail);
      }
  
      const result = await questionsResponse.json();
      const parseResult = JSON.parse(result);
      setGeneratedQuestions(parseResult);
    } catch (error) {
      console.error("Error en el proceso:", error);
      setLoadingPage(false);
    } 
  };

  const handleShowModal = () => {
    setRelatedTopicsModal(true);
    //localStorage.setItem('topicsModal', 'true');
    setCookie('topicsModal', 'true', {
      path: '/',
      maxAge: 60 * 60 * 24,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
    });
  };

  const handleNewRoadmap = () => {
    const topicState = relatedTopicsModal ? { relatedTopics } : {};
    //localStorage.setItem('topicState', JSON.stringify(topicState));
    setCookie('topicState', JSON.stringify(topicState), {
      path: '/',
      maxAge: 60 * 60 * 24,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
    });
    router.push('/roadmap');
  };

  const closeModal = () => {
    setRelatedTopicsModal(false);
  };

  const handleShowQuestionsModal = () => {
    setQuestionModal(true);
  };

  const handleCloseQuestionsModal = () => {
    setQuestionModal(false);
  };

  const captureRoadmap = async () => {
    const roadmapElement = roadmapRef.current;
    if (!roadmapElement) return;

    try {
      const canvas = await html2canvas(roadmapElement, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      await saveImageToDB(imgData);
    } catch (error) {
      console.error('Error al capturar la imagen:', error);
    }
  };

  const saveImageToDB = async (base64Image) => {
    //const authToken = localStorage.getItem("token");
    const authToken = getCookie("token");

    if (!roadmapData || Object.keys(roadmapData).length === 0) {
      console.error("No hay datos del roadmap para guardar.");
      return;
    }

    const topic = Object.keys(roadmapData)[0]; 
    const roadmapDataString = JSON.stringify(roadmapData); 

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/save-roadmap-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
          'x-api-key': process.env.NEXT_PUBLIC_API_KEY
        },
        body: JSON.stringify({ 
          topic,  
          roadmap_data: roadmapDataString,  
          image_base64: base64Image  
        }),
      });

      if (!response.ok) {
        throw new Error('Error al guardar la imagen en la base de datos');
      }
      
      setSaveMessage("Roadmap guardado correctamente.");
      setTimeout(() => setSaveMessage(""), 3000);
    } catch (error) {
      console.error('Error al enviar el roadmap al backend:', error);
    }
  };

  const handleDownload = async (format) => {
    const roadmapElement = roadmapRef.current;

    if (format === 'json') {
      const jsonData = JSON.stringify(roadmapData, null, 2);
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'roadmap.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else if (format === 'image' || format === 'pdf') {
      try {
        if (reactFlowInstance.current) {
          reactFlowInstance.current.fitView({ padding: 0.2, duration: 500 });
        }
        await new Promise(resolve => setTimeout(resolve, 1000));

        const isMobile = window.innerWidth < 768;
        
        if (format === 'pdf' && isMobile) {
          setLevelOffset(300);
          setNodeWidth(225);
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        const canvas = await html2canvas(roadmapElement, {
          scale: 2,
          useCORS: true,
          logging: true,
          width: roadmapElement.scrollWidth,
          height: roadmapElement.scrollHeight,
          allowTaint: true,
        });

        const dataUrl = canvas.toDataURL('image/png');

        if (format === 'image') {
          const a = document.createElement('a');
          a.href = dataUrl;
          a.download = 'roadmap.png';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        } else if (format === 'pdf') {
          const pdf = new jsPDF(isMobile ? 'portrait' : 'landscape');
          const imgProps = pdf.getImageProperties(dataUrl);
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = pdf.internal.pageSize.getHeight();
          const imgRatio = imgProps.width / imgProps.height;
          let imgWidth = pdfWidth;
          let imgHeight = imgWidth / imgRatio;

          if (imgHeight > pdfHeight) {
            let position = 0;
            while (position < imgHeight) {
              if (position > 0) pdf.addPage();
              pdf.addImage(dataUrl, 'PNG', 0, -position, imgWidth, imgHeight);
              position += pdfHeight;
            }
          } else {
            pdf.addImage(dataUrl, 'PNG', 0, 0, imgWidth, imgHeight);
          }

          pdf.save('roadmap.pdf');
        }
      } catch (error) {
        console.error('Error al generar la imagen o PDF:', error);
      }
    }
  };

  const onInit = (instance) => {
    if (!reactFlowInstance.current) {
      reactFlowInstance.current = instance;
      instance.fitView({ padding: 0.2, duration: 500 });
    } 
  };

  const handleZoomIn = () => {
    if (reactFlowInstance.current) {
      reactFlowInstance.current.zoomTo(reactFlowInstance.current.getZoom() + 0.2);
    }
  };

  const handleZoomOut = () => {
    if (reactFlowInstance.current) {
      reactFlowInstance.current.zoomTo(reactFlowInstance.current.getZoom() - 0.2);
    }
  };

  const handleFitView = () => {
    if (reactFlowInstance.current) {
      reactFlowInstance.current.fitView({ padding: 0.2, duration: 500 });
    }
  };

  // Generar nodos y edges
  const nodes = [];
  const edges = [];
  let idCounter = 0;

  if (roadmapData) {
    Object.keys(roadmapData).forEach((topicKey, topicIndex) => {
      const topicNode = {
        id: `topic-${idCounter++}`,
        data: { label: topicKey, color: '#ffca00' },
        position: { x: 0, y: 500 },
        type: 'custom',
      };
      nodes.push(topicNode);

      const topic = roadmapData[topicKey];
      Object.keys(topic).forEach((subtopicKey, subtopicIndex) => {
        const subtopicNode = {
          id: `subtopic-${idCounter++}`,
          data: { label: subtopicKey, color: '#96E6B3' },
          position: { x: nodeWidth, y: topicIndex * levelOffset + subtopicIndex * levelOffset / 2 },
          type: 'custom',
        };
        nodes.push(subtopicNode);
        edges.push({ id: `e-${topicNode.id}-${subtopicNode.id}`, source: topicNode.id, target: subtopicNode.id });

        topic[subtopicKey].forEach((subSubtopic, index) => {
          const subSubtopicNode = {
            id: `subSubtopic-${idCounter++}`,
            data: { label: subSubtopic, color: '#FF92E6' },
            position: { x: nodeWidth * 2, y: topicIndex * levelOffset + subtopicIndex * levelOffset / 2 + index * 50 },
            type: 'custom',
          };
          nodes.push(subSubtopicNode);
          edges.push({ id: `e-${subtopicNode.id}-${subSubtopicNode.id}`, source: subtopicNode.id, target: subSubtopicNode.id });
        });
      });
    });
  }

  if (!roadmapData) {
    return (
      <div className="loading-container">
        <p>Cargando roadmap...</p>
      </div>
    );
  }

  return (
    <>
      {showDownloadOptions && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="close-button" onClick={() => setShowDownloadOptions(false)}>
              <FontAwesomeIcon icon={faTimes} />
            </button>
            <h3>Seleccionar formato de descarga</h3>
            <div className="download-options">
              <label className="format-option">
                <input
                  type="radio"
                  name="format"
                  value="json"
                  checked={selectedFormat === 'json'}
                  onChange={() => setSelectedFormat('json')}
                />
                <span>JSON</span>
              </label>
              <label className="format-option">
                <input
                  type="radio"
                  name="format"
                  value="image"
                  checked={selectedFormat === 'image'}
                  onChange={() => setSelectedFormat('image')}
                />
                <span>Imagen</span>
              </label>
              <label className="format-option">
                <input
                  type="radio"
                  name="format"
                  value="pdf"
                  checked={selectedFormat === 'pdf'}
                  onChange={() => setSelectedFormat('pdf')}
                />
                <span>PDF</span>
              </label>
            </div>
            <button className="download-button" onClick={() => handleDownload(selectedFormat)}>
              Descargar
            </button>
          </div>
        </div>
      )}

      {saveMessage && <div className="save-message">{saveMessage}</div>}
      
      <div className="react-flow-container" ref={roadmapRef}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={{ custom: CustomNode }}
          fit
          onInit={onInit}
          onNodeClick={handleNodeEnter}
          onMove={handleNodeLeave}
        >
          <Background />
        </ReactFlow>
      </div>

      <div className="controls-container">
        <button className="control-button" onClick={handleZoomIn}>
          <FontAwesomeIcon icon={faSearchPlus} />
        </button>
        <button className="control-button" onClick={handleZoomOut}>
          <FontAwesomeIcon icon={faSearchMinus} />
        </button>
        <button className="control-button" onClick={handleFitView}>
          <FontAwesomeIcon icon={faExpand} />
        </button>
        {(linkButton === undefined) && (
          <button className="control-button" onClick={handleShowModal}>
            <FontAwesomeIcon icon={faLink} />
          </button>
        )}
        <button className="control-button" onClick={captureRoadmap}>
          <FontAwesomeIcon icon={faSave} />
        </button>   
        <button className="icon-button" onClick={() => setShowDownloadOptions(true)}>
          <FontAwesomeIcon icon={faDownload} className="download-icon" />
        </button>
        <button className="icon-button" onClick={handleShowQuestionsModal}>
          <FontAwesomeIcon icon={faClipboardQuestion} />
        </button>
      </div>

      {relatedTopicsModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h1 className="modal-title">¿Quieres crear una ruta de un tema relacionado? 🧐</h1>
            <ul>
              {relatedTopics.map((topic, index) => (
                <li key={index}>{topic}</li>
              ))}
            </ul>
            <div className="modal-buttons">
              <button onClick={handleNewRoadmap} className="modal-button">Sí 😃</button>
              <button onClick={closeModal} className="modal-button">No 🙁</button>
            </div>
          </div>
        </div>
      )}

      {modalInfo && (
        <div 
          className="tooltip"
          style={{
            top: `${modalPosition.y}px`,
            left: `${modalPosition.x}px`,
          }}>
          <>
            {topicInfo}
            {linkInfo[0] && (
              <a href={linkInfo[0]} target="_blank" rel="noopener noreferrer">
                🔗 Enlace relacionado
              </a>
            )}
          </>
        </div>
      )}

      {questionModal && (
        <div className="modal-overlay" onClick={handleCloseQuestionsModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h1 className="modal-title">¿Quieres responder algunas preguntas respecto a los temas de la ruta de aprendizaje? 🧐</h1>
            <div className="modal-buttons">
              <button onClick={handleGenerateQuestions} className="modal-button">Sí 😃</button>
              <button onClick={handleCloseQuestionsModal} className="modal-button">No 🙁</button>
            </div>
          </div>
        </div>
      )}

      {loadingPage && (
        <div className="loading-modal">
          <div className="loading-content">
            <h2>Generando las preguntas... 🫡</h2>
            <div className="spinner"></div>
          </div>
        </div>
      )}
    </>
  );
}