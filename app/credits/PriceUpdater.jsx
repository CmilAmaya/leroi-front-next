"use client";

import { useState, useEffect } from "react";

export default function PriceUpdater({ backendUrl, apiKey, defaultCredits }) {
  const [credits, setCredits] = useState(defaultCredits);
  const [price, setPrice] = useState(0);

  // Llamada al backend para obtener el precio
  async function fetchPrice(c) {
    const query = `
      query GetPrice($credits: Int!) {
        price(credits: $credits) {
          cost
          currency
        }
      }
    `;
    const variables = { credits: parseInt(c, 10) };

    const res = await fetch(`${backendUrl}/payments-be`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({ query, variables }),
    });

    const data = await res.json();
    const cost = data?.data?.price?.cost || 0;
    setPrice(cost);
  }

  useEffect(() => {
    fetchPrice(credits);
  }, [credits]);

  return (
    <>
      <div className="form-group">
        <label className="label-credits">Cantidad de créditos</label>
        <div className="credit-options">
          <select
            id="credits"
            name="credits"
            value={credits}
            onChange={(e) => setCredits(e.target.value)}
            className="select-credits"
            required
          >
            <option value="250">250 Créditos</option>
            <option value="750">750 Créditos</option>
            <option value="1500">1500 Créditos</option>
          </select>
        </div>
      </div>

      <div className="form-group price-group">
        <label className="label-price">Precio total</label>
        <div className="price-badge-wrapper">
          <span className="price-badge">${price} USD</span>
        </div>
      </div>
    </>
  );
}
