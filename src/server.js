
const express = require('express');
const cors = require('cors');
const app = express();

const corsOptions = {
  origin: 'http://localhost:3000', // Allow only this origin
  credentials: true, // Allow credentials
};

app.use(cors(corsOptions));

// ...existing code...

app.listen(3081, () => {
  console.log('Server is running on port 3081');
});