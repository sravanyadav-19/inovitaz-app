export const paiseToRupees = (paise) => {
  return Number(paise || 0) / 100;
};

export const rupeesToPaise = (rupees) => {
  return Math.round(Number(rupees || 0) * 100);
};

export const formatINRFromPaise = (paise) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
  }).format(paiseToRupees(paise));
};

export const formatINRFromRupees = (rupees) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
  }).format(Number(rupees || 0));
};