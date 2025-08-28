require('dotenv').config();
const express = require('express');

const app = express();

// Middleware
app.use(express.json());

// Test route
app.get('/test', (req, res) => {
  res.json({ message: 'Test route working' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
});
