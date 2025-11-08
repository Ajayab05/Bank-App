import React from "react";

function AccountList({ accounts, setSelectedAccount }) {
  return (
    <div>
      <h3>Accounts</h3>
      <ul>
        {accounts.map(a => (
          <li key={a.id} onClick={() => setSelectedAccount(a)}>
            {a.name} - ₹{a.balance}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default AccountList;
