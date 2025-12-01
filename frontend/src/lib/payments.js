import { createOrder, verifyPayment } from "../api/payments";

export async function initiatePayment(amount, meta = {}) {
  try {
    const res = await createOrder(amount);
    const order = res.data.order;
    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: order.amount,
      currency: order.currency,
      name: meta.title || "Inovitaz Purchase",
      order_id: order.id,
      handler: async function (resp) {
        const verifyRes = await verifyPayment(resp);
        if (verifyRes.data?.success) {
          alert("Payment complete — verified.");
        } else {
          alert("Payment failed verification.");
        }
      },
      theme: { color: "#06b6d4" },
    };
    const rzp = new window.Razorpay(options);
    rzp.open();
  } catch (e) {
    console.error("Payment error", e);
    alert("Could not create order.");
  }
}

if (typeof window !== "undefined") {
  window.addEventListener("buy", (e) => {
    const amount = e?.detail?.amount || 49900;
    const project = e?.detail?.project || {};
    initiatePayment(amount, { title: project.title });
  });
}
