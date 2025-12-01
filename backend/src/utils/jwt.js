const jwt = require("jsonwebtoken");
const SECRET = process.env.JWT_SECRET || "change_me";

module.exports = {
  sign: (payload) => jwt.sign(payload, SECRET, { expiresIn: "7d" }),
  verify: (token) => jwt.verify(token, SECRET)
};
