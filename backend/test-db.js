const db = require("./src/config/db");

(async () => {
  try {
    const rows = await db.query("SELECT 1 + 1 AS result");
    console.log("DB Connected. Result:", rows);
  } catch (err) {
    console.error("DB Error:", err);
  } finally {
    process.exit();
  }
})();