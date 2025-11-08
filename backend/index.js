// backend/index.js
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();
app.use(cors());
app.use(express.json());

// DB config - change only if your DB credentials differ
const pool = new Pool({
  user: "bankuser",
  host: "localhost",
  database: "bankdb",
  password: "bankpass",
  port: 5432,
});

// Initialize DB: accounts + transactions
async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS accounts (
      id SERIAL PRIMARY KEY,
      name VARCHAR(200) NOT NULL,
      balance NUMERIC DEFAULT 0
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS transactions (
      id SERIAL PRIMARY KEY,
      account_id INT REFERENCES accounts(id) ON DELETE CASCADE,
      amount NUMERIC NOT NULL,
      type VARCHAR(10) NOT NULL, -- credit | debit
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // ensure at least one account (optional)
  const r = await pool.query("SELECT * FROM accounts LIMIT 1");
  if (r.rows.length === 0) {
    await pool.query("INSERT INTO accounts (name, balance) VALUES ($1, $2)", ["Primary Account", 0]);
  }
}

initDB().catch(console.error);

/* ---------- Accounts CRUD ---------- */

// GET all accounts
app.get("/accounts", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM accounts ORDER BY id");
    res.json(result.rows);
  } catch (err) { console.error(err); res.status(500).json({ error: "server error" }); }
});

// GET single account
app.get("/accounts/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const r = await pool.query("SELECT * FROM accounts WHERE id=$1", [id]);
    if (r.rows.length === 0) return res.status(404).json({ error: "not found" });
    res.json(r.rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: "server error" }); }
});

// CREATE account
app.post("/accounts", async (req, res) => {
  try {
    const { name, balance } = req.body;
    const r = await pool.query(
      "INSERT INTO accounts (name, balance) VALUES ($1, $2) RETURNING *",
      [name, Number(balance) || 0]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: "server error" }); }
});

// UPDATE account
app.put("/accounts/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, balance } = req.body;
    const r = await pool.query(
      "UPDATE accounts SET name=$1, balance=$2 WHERE id=$3 RETURNING *",
      [name, Number(balance) || 0, id]
    );
    if (r.rows.length === 0) return res.status(404).json({ error: "not found" });
    res.json(r.rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: "server error" }); }
});

// DELETE account
app.delete("/accounts/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM accounts WHERE id=$1", [id]);
    res.json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ error: "server error" }); }
});

/* ---------- Transactions (deposit/withdraw/history) ---------- */

// POST deposit (credit)
app.post("/accounts/:id/deposit", async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { amount } = req.body;
    if (!amount || Number(amount) <= 0) return res.status(400).json({ error: "Invalid amount" });

    await client.query("BEGIN");
    const a = await client.query("SELECT * FROM accounts WHERE id=$1 FOR UPDATE", [id]);
    if (a.rows.length === 0) { await client.query("ROLLBACK"); return res.status(404).json({ error: "Account not found" }); }

    await client.query("UPDATE accounts SET balance = balance + $1 WHERE id=$2", [amount, id]);
    const tx = await client.query(
      "INSERT INTO transactions (account_id, amount, type) VALUES ($1,$2,'credit') RETURNING *",
      [id, amount]
    );
    await client.query("COMMIT");
    res.json({ transaction: tx.rows[0] });
  } catch (err) {
    await client.query("ROLLBACK").catch(()=>{});
    console.error(err); res.status(500).json({ error: "server error" });
  } finally { client.release(); }
});

// POST withdraw (debit)
app.post("/accounts/:id/withdraw", async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { amount } = req.body;
    if (!amount || Number(amount) <= 0) return res.status(400).json({ error: "Invalid amount" });

    await client.query("BEGIN");
    const a = await client.query("SELECT * FROM accounts WHERE id=$1 FOR UPDATE", [id]);
    if (a.rows.length === 0) { await client.query("ROLLBACK"); return res.status(404).json({ error: "Account not found" }); }
    const balance = Number(a.rows[0].balance);
    if (balance < Number(amount)) { await client.query("ROLLBACK"); return res.status(400).json({ error: "Insufficient funds" }); }

    await client.query("UPDATE accounts SET balance = balance - $1 WHERE id=$2", [amount, id]);
    const tx = await client.query(
      "INSERT INTO transactions (account_id, amount, type) VALUES ($1,$2,'debit') RETURNING *",
      [id, amount]
    );
    await client.query("COMMIT");
    res.json({ transaction: tx.rows[0] });
  } catch (err) {
    await client.query("ROLLBACK").catch(()=>{});
    console.error(err); res.status(500).json({ error: "server error" });
  } finally { client.release(); }
});

// GET transactions for account
app.get("/accounts/:id/transactions", async (req, res) => {
  try {
    const { id } = req.params;
    const r = await pool.query("SELECT * FROM transactions WHERE account_id=$1 ORDER BY created_at DESC", [id]);
    res.json(r.rows);
  } catch (err) { console.error(err); res.status(500).json({ error: "server error" }); }
});

/* ---------- health ---------- */
app.get("/", (req, res) => res.send("Bank API OK"));

/* ---------- start ---------- */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Bank Backend running on port ${PORT}`));
