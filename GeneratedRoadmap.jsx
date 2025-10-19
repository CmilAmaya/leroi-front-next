import { useLocation, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import ReactFlow, { Background } from 'react-flow-renderer';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload, faTimes, faSearchPlus, faSearchMinus, faExpand,faSave, faClipboardQuestion} from '@fortawesome/free-solid-svg-icons';
import { faLink } from '@fortawesome/free-solid-svg-icons'; 
import CustomNode from '../components/CustomNode';
import '../styles/roadmap.css';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';



function GeneratedRoadmap() {
  const location = useLocation();
  const navigate = useNavigate();
  const { roadmapTopics, relatedTopics, roadmapInfo, linkButton } = location.state || {};
  const [relatedTopicsModal, setRelatedTopicsModal] = useState(false);
  const [showDownloadOptions, setShowDownloadOptions] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState('json');
  const [topicInfo, setTopicInfo] = useState("");
  const [modalInfo, setModalInfo] = useState(false);
  const [linkInfo, setLinkInfo] = useState([]);
  const [modalPosition, setModalPosition] = useState({}); 
  const roadmapRef = useRef(null);
  const reactFlowInstance = useRef(null);
  const authToken = localStorage.getItem("token");
  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  const [questionModal, setQuestionModal] = useState(false);
  const [loadingPage, setLoadingPage] = useState(false);

  useEffect(() => {
    if (Object.keys(generatedQuestions).length > 0) {
      setLoadingPage(false);
      console.log("PREGUNTASSS", generatedQuestions)
      navigate('/questions', {state: {generatedQuestions}});
    }
  }, [generatedQuestions, navigate]);

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
      const questionsResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL}/learning_path/questions`, {
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
      const parseResult = JSON.parse(result)
      setGeneratedQuestions(parseResult);
      console.log("RESULTADO", result, "resultado en json", parseResult); 
    } catch (error) {
      console.error("Error en el proceso:", error);
    } 
  }

  const handleShowModal = () => {
    setRelatedTopicsModal(true);
    localStorage.setItem('topicsModal', 'true');
  };

  const handleNewRoadmap = () => {
    const topicState = relatedTopicsModal ? { relatedTopics } : {};
    navigate('/roadmap', { state: { topicState } });
  };

  const closeModal = () => {
    setRelatedTopicsModal(false);
  };

  const handleShowQuestionsModal = () => {
    setQuestionModal(true)
  }

  const handleCloseQuestionsModal = () => {
    setQuestionModal(false)
  }

  const [levelOffset, setLevelOffset] = useState(400);
  const [nodeWidth, setNodeWidth] = useState(400);


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

  
  useEffect(() => {
    updateDimensions(); 
    window.addEventListener('resize', updateDimensions); 

    return () => {
      window.removeEventListener('resize', updateDimensions); 
    };
  }, []);
  

  const nodes = [];
  const edges = [];

  let idCounter = 0;

  if (roadmapTopics) {
    Object.keys(roadmapTopics).forEach((topicKey, topicIndex) => {
      const topicNode = {
        id: `topic-${idCounter++}`,
        data: { label: topicKey, color: '#ffca00' },
        position: { x: 0, y: 500 },
        type: 'custom',
      };
      nodes.push(topicNode);

      const topic = roadmapTopics[topicKey];
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
  const [saveMessage, setSaveMessage] = useState("");
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
      console.log('Guardando roadmap en la base de datos...');
  };

  const saveImageToDB = async (base64Image) => {
    console.log("Ejecutando saveImageToDB...");
    const authToken = localStorage.getItem("token");

    if (!roadmapTopics || Object.keys(roadmapTopics).length === 0) {
      console.error("No hay datos del roadmap para guardar.");
      return;
    }

    const topic = Object.keys(roadmapTopics)[0]; 
    const roadmapData = JSON.stringify(roadmapTopics); 

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/save-roadmap-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
          'x-api-key': import.meta.env.VITE_API_KEY
        },
        body: JSON.stringify({ 
          topic,  
          roadmap_data: roadmapData,  
          image_base64: base64Image  
        }),
      });
      console.log("ejecutandose");

      if (!response.ok) {
        throw new Error('Error al guardar la imagen en la base de datos');
      }
      setSaveMessage("Roadmap guardado correctamente."); // Mensaje de confirmación
      setTimeout(() => setSaveMessage(""), 3000); // Oculta el mensaje después de 3 segundos

      console.log('Roadmap guardado correctamente');
    } catch (error) {
      console.error('Error al enviar el roadmap al backend:', error);
    }
};

const handleDownload = async (format) => {
  const roadmapElement = roadmapRef.current;

  if (format === 'json') {
    const jsonData = JSON.stringify(roadmapTopics, null, 2);
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
      reactFlowInstance.current.fitView({ padding: 0.2, duration: 500 });
      await new Promise(resolve => setTimeout(resolve, 1000));

      const isMobile = window.innerWidth < 768; // Verifica si es un dispositivo móvil
      
      if (format === 'pdf' && isMobile) {
        setLevelOffset(300); // Ajusta el nivel de offset
        setNodeWidth(225); // Ajusta el ancho del nodo
        await new Promise(resolve => setTimeout(resolve, 500)); // Espera a que se apliquen los cambios
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
    console.log("averlo", linkButton);
    if (reactFlowInstance.current) {
      reactFlowInstance.current.fitView({ padding: 0.2, duration: 500 });
    }
  };

  return (
    <div className="generated-roadmap-container">
      {roadmapTopics && (
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
                <button className="download-button" onClick={() => handleDownload(selectedFormat)}>Descargar</button>
              </div>
            </div>
          )}

          {saveMessage && <div className="save-message">{saveMessage}</div>}  
          <div className="react-flow-container" ref={roadmapRef} > 
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
              {/* Botón de descarga */}
            <button className="icon-button" onClick={() => setShowDownloadOptions(true)}>
              <FontAwesomeIcon icon={faDownload} className="download-icon" />
            </button>
            <button className="icon-button" onClick={handleShowQuestionsModal}>
              <FontAwesomeIcon icon={faClipboardQuestion} />
            </button>
          </div>
        </>
      )}

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
              <button onClick={() => handleNewRoadmap()} className="modal-button">Sí 😃</button>
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
              <a href={linkInfo[0]} target="_blank" rel="noopener noreferrer">
                🔗 Enlace relacionado
              </a>
            </>
        </div>
      )}
      {questionModal && (
        <div className="modal-overlay" onClick={handleCloseQuestionsModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h1 className="modal-title">¿Quieres responder algunas preguntas respecto a los temas de la ruta de aprendizaje? 🧐</h1>
            <div className="modal-buttons">
              <button onClick={() => handleGenerateQuestions()} className="modal-button">Sí 😃</button>
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

 
    </div>
  );
}

export default GeneratedRoadmap;