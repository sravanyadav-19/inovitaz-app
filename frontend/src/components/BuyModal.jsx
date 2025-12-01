import React, { useEffect, useState } from "react";
import { createOrder, confirmPayment } from "../api/payments";

export default function BuyModal({ project, token, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!document.getElementById("razorpay-script")) {
      const s = document.createElement("script");
      s.src = "https://checkout.razorpay.com/v1/checkout.js";
      s.id = "razorpay-script";
      document.body.appendChild(s);
    }
  }, []);

  async function handlePay() {
    setLoading(true);
    const resp = await createOrder(token, project.id);
    if (!resp.order) { alert("order failed"); setLoading(false); return; }
    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID || "",
      amount: resp.order.amount,
      currency: resp.order.currency || "INR",
      name: "InovitaZ",
      description: project.title,
      order_id: resp.order.id,
      handler: async function (response) {
        const confirm = await confirmPayment(token, {
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_order_id: response.razorpay_order_id,
          signature: response.razorpay_signature
        });
        if (confirm.ok) {
          onSuccess && onSuccess();
          onClose && onClose();
        } else {
          alert("Payment verification failed");
        }
      }
    };
    const rzp = new window.Razorpay(options);
    rzp.open();
    setLoading(false);
  }

  return (
    <div style={{ position: "fixed", inset: 0, display: "grid", placeItems: "center", background: "rgba(0,0,0,0.6)" }}>
      <div style={{ background: "#fff", color: "#000", padding: 20, width: 560, borderRadius: 8 }}>
        <h3>Buy {project.title}</h3>
        <p>Price: â‚¹{Math.round(project.price/100)}</p>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button onClick={onClose}>Close</button>
          <button onClick={handlePay} disabled={loading}>{loading ? "..." : "Pay"}</button>
        </div>
      </div>
    </div>
  );
}
