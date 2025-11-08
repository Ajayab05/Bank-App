const express = require('express');
const cors = require('cors');
const accountsRouter = require('./routes/accounts');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/accounts', accountsRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
