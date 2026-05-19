// Deprecated payment helper.
// Use paymentsAPI from src/api/payments.js directly.

export async function initiatePayment() {
  throw new Error(
    "src/lib/payments.js is deprecated. Use paymentsAPI from src/api/payments.js."
  );
}