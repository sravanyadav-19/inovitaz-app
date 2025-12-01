/* validator.js - placeholder for input validation */
module.exports = {
  requireFields: (obj, fields) => {
    for (const f of fields) {
      if (!Object.prototype.hasOwnProperty.call(obj, f) || obj[f] === undefined || obj[f] === null || obj[f] === "") {
        return { ok: false, missing: f };
      }
    }
    return { ok: true };
  }
};
