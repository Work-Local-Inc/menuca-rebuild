const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// Basic health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'menuca-simple',
    version: '1.0.0'
  });
});

// Basic route
app.get('/', (req, res) => {
  res.json({
    message: 'MenuCA API Server',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Simple server running on port ${port}`);
});