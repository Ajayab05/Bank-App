import React, { useState, useEffect } from "react";
import axios from "axios";
import AccountList from "./components/AccountList";
import CreateAccount from "./components/CreateAccount";
import Transactions from "./components/Transactions";

const API_URL = "http://localhost:3000/api/accounts";

function App() {
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);

  const fetchAccounts = async () => {
    const res = await axios.get(API_URL);
    setAccounts(res.data);
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h1>SBI Bank App</h1>
      <CreateAccount fetchAccounts={fetchAccounts} />
      <AccountList accounts={accounts} setSelectedAccount={setSelectedAccount} />
      {selectedAccount && <Transactions account={selectedAccount} />}
    </div>
  );
}

export default App;
