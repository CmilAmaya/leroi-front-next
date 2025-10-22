'use client';
import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faDownload, faTimes, faSearchPlus, faSearchMinus,
    faExpand, faSave, faClipboardQuestion, faLink
} from '@fortawesome/free-solid-svg-icons';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import '../../styles/pricing.css';

function Pricing() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        credits: '',
        acceptTerms: false,
    });
    const [totalCost, setTotalCost] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [showTermsModal, setShowTermsModal] = useState(false);

    const authToken = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
    const userEmail = typeof window !== 'undefined' ? localStorage.getItem("userEmail") : null;
    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
    const FIREBASE_API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

    const fetchCreditsCost = async (amount) => {
        try {
            const query = `
                query GetPrice($credits: Int!) {
                    price(credits: $credits) {
                        credits
                        cost
                        currency
                    }
                }
            `;
            const variables = { credits: parseInt(amount, 10) };

            const response = await fetch(`${BACKEND_URL}/payments-be`, {
                method: 'POST',
                headers: {
                    'Content-type': 'application/json',
                    'x-api-key': FIREBASE_API_KEY
                },
                body: JSON.stringify({ query, variables }),
            });

            const result = await response.json();

            if (result.data?.price) {
                return result.data.price.cost;
            } else {
                console.error('Error al calcular el costo:', result.errors || result);
                return null;
            }
        } catch (error) {
            console.error('Error en la solicitud:', error);
            return null;
        }
    };

    // ✅ Reemplazo seguro del useSearchParams (solo se ejecuta en cliente)
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const creditsParam = params.get('credits');
            if (creditsParam) {
                setFormData((prevData) => ({
                    ...prevData,
                    credits: creditsParam,
                }));
                fetchCreditsCost(creditsParam).then((totalCost) => {
                    if (totalCost !== null) setTotalCost(totalCost);
                });
            }
        }
    }, []);

    const handleChange = async (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
        if (name === 'credits') {
            const totalCost = await fetchCreditsCost(value);
            if (totalCost !== null) {
                setTotalCost(totalCost);
            }
        }
    };

    const createSession = async (authToken, credits, email) => {
        const query = `
            mutation CreateSession($authToken: String!, $credits: Int!, $email: String!) {
                createSession(authToken: $authToken, credits: $credits, email: $email) {
                    sessionId
                }
            }
        `;

        const variables = { authToken, credits: parseInt(credits, 10), email };

        const response = await fetch(`${BACKEND_URL}/payments-be`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ query, variables }),
        });

        const result = await response.json();
        return result.data?.createSession?.sessionId || null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        setIsSubmitting(true);
        try {
            toast.success("Redirigiendo a la plataforma de pago...");

            const cost = await fetchCreditsCost(formData.credits);

            if (!cost) {
                toast.error("No se pudo obtener el precio de los créditos.");
                setIsSubmitting(false);
                return;
            }

            const sessionId = await createSession(authToken, formData.credits, userEmail);
            if (!sessionId) {
                toast.error("No se pudo generar la sesión segura.");
                setIsSubmitting(false);
                return;
            }

            const query = `
                mutation CreatePref($input: PreferenceInput!) {
                    createPreference(input: $input) {
                        id
                        initPoint
                        sandboxInitPoint
                    }
                }
            `;

            const variables = {
                input: {
                    items: [
                        {
                            title: `${formData.credits} Créditos`,
                            quantity: 1,
                            unitPrice: cost,
                            currencyId: "USD",
                        },
                    ],
                    externalReference: `{"sessionId":"${sessionId}"}`,
                },
            };

            const response = await fetch(`${BACKEND_URL}/payments-be`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${authToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ query, variables }),
            });

            const result = await response.json();

            const payment = result.data?.createPreference;
            if (payment) {
                console.log("Link de pago:", payment.initPoint);
                window.open(payment.initPoint, "_blank");
            } else {
                console.error("Error en GraphQL:", result.errors);
                setError("Ocurrió un error al generar el enlace de pago.");
            }
        } catch (error) {
            console.error("Error en la operación:", error);
            setError("Ocurrió un error al procesar la operación.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const validateForm = () => {
        if (!formData.credits || isNaN(formData.credits) || formData.credits <= 0) {
            toast.error('Por favor, ingresa una cantidad válida de créditos.');
            return false;
        }
        if (!formData.acceptTerms) {
            toast.error('Debes aceptar los términos y condiciones.');
            return false;
        }
        return true;
    };

    return (
        <div className="pricing-container-p">
            <div className="pricing-box-p">
                <h1 className="pricing-title-p pricing-title-icon">
                    Comprar Créditos
                </h1>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="label-credits">Cantidad de créditos</label>
                        <div className="credit-options">
                            <select
                                id="credits"
                                name="credits"
                                required
                                value={formData.credits}
                                onChange={handleChange}
                                className="select-credits"
                            >
                                <option value="" disabled>Elige una opción</option>
                                <option value="250">250 Créditos</option>
                                <option value="750">750 Créditos</option>
                                <option value="1500">1500 Créditos</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-group price-group">
                        <label className="label-price">Precio total</label>
                        <div className="price-badge-wrapper">
                            <span className="price-badge">
                                {`$${totalCost} USD`}
                            </span>
                        </div>
                    </div>

                    <div className="form-group terms terms-group">
                        <input
                            type="checkbox"
                            name="acceptTerms"
                            checked={formData.acceptTerms}
                            onChange={handleChange}
                            id="acceptTerms"
                            className="checkbox-terms"
                        />
                        <label htmlFor="acceptTerms" className="label-terms">Acepto los</label>
                        <button type="button" className="terms-link-btn" onClick={() => setShowTermsModal(true)}>
                            términos y condiciones
                        </button>
                    </div>

                    <div className="button-container">
                        <button
                            type="submit"
                            className="submit-button buy-btn"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Procesando...' : 'Comprar Créditos'}
                        </button>
                    </div>
                    {error && <p className="error-message error-msg-custom">{error}</p>}
                </form>

                {showTermsModal && (
                    <div className="verification-modal">
                        <div className="modal-content modal-terms">
                            <h2 className="modal-title">Términos y condiciones</h2>
                            <p className="terms-text modal-terms-text">
                                Al realizar un pago por medio de la pasarela de pago de Leroi, el usuario acepta que no se realizarán <br />
                                devoluciones bajo ninguna circunstancia. Leroi no se hace responsable por el uso que el usuario dé a <br />
                                los créditos adquiridos ni por cualquier transacción realizada a través de la plataforma. <br />
                                Toda responsabilidad de pago, incluyendo cargos, montos adeudados y cualquier otro compromiso financiero, <br />
                                recae exclusivamente en el usuario, quien deberá asegurarse de cumplir con sus obligaciones de pago de <br />
                                manera adecuada.
                            </p>
                            <button
                                onClick={() => setShowTermsModal(false)}
                                className="verify-button close-modal-btn"
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

export default Pricing;
