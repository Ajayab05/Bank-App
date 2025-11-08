import React, { useState } from "react";
import axios from "axios";

const API_URL = "http://localhost:3000/api/accounts";

function CreateAccount({ fetchAccounts }) {
  const [name, setName] = useState("");
  const [balance, setBalance] = useState(0);

  const handleCreate = async () => {
    await axios.post(API_URL, { name, balance });
    setName("");
    setBalance(0);
    fetchAccounts();
  };

  return (
    <div>
      <h3>Create Account</h3>
      <input placeholder="Name" value={name} onChange={e => setName(e.target.value)} />
      <input type="number" placeholder="Balance" value={balance} onChange={e => setBalance(Number(e.target.value))} />
      <button onClick={handleCreate}>Create</button>
    </div>
  );
}

export default CreateAccount;
