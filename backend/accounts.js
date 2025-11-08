const express = require('express');
const router = express.Router();
const pool = require('../db');

// Get all accounts
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM accounts ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create account
router.post('/', async (req, res) => {
  const { name, balance } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO accounts(name, balance) VALUES($1, $2) RETURNING *',
      [name, balance]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Deposit/Withdraw
router.post('/transaction', async (req, res) => {
  const { account_id, type, amount } = req.body;
  try {
    const account = await pool.query('SELECT * FROM accounts WHERE id=$1', [account_id]);
    if (!account.rows.length) return res.status(404).json({ error: 'Account not found' });

    let newBalance = account.rows[0].balance;
    if (type === 'credit') newBalance += amount;
    else if (type === 'debit') newBalance -= amount;
    else return res.status(400).json({ error: 'Invalid transaction type' });

    await pool.query('UPDATE accounts SET balance=$1 WHERE id=$2', [newBalance, account_id]);
    await pool.query(
      'INSERT INTO transactions(account_id, type, amount) VALUES($1, $2, $3)',
      [account_id, type, amount]
    );

    res.json({ account_id, newBalance });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get transactions of account
router.get('/:id/transactions', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM transactions WHERE account_id=$1 ORDER BY created_at DESC',
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
