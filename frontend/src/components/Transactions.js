import React, { useState, useEffect } from "react";
import axios from "axios";

function Transactions({ account }) {
  const [transactions, setTransactions] = useState([]);
  const [amount, setAmount] = useState(0);

  const fetchTransactions = async () => {
    const res = await axios.get(`http://localhost:3000/api/accounts/${account.id}/transactions`);
    setTransactions(res.data);
  };

  const handleTransaction = async type => {
    await axios.post(`http://localhost:3000/api/accounts/transaction`, {
      account_id: account.id,
      type,
      amount: Number(amount)
    });
    setAmount(0);
    fetchTransactions();
  };

  useEffect(() => {
    fetchTransactions();
  }, [account]);

  return (
    <div>
      <h3>Transactions for {account.name}</h3>
      <input type="number" value={amount} onChange={e => setAmount(e.target.value)} />
      <button onClick={() => handleTransaction("credit")}>Deposit</button>
      <button onClick={() => handleTransaction("debit")}>Withdraw</button>
      <ul>
        {transactions.map(t => (
          <li key={t.id}>
            {t.type} ₹{t.amount} on {new Date(t.created_at).toLocaleString()}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Transactions;
