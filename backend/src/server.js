require('dotenv').config({ override: true });
const app = require('./app');

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`🩺 Health Check API: http://localhost:${PORT}/api/health`);
  console.log(`======================================================\n`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n⚠️  Port ${PORT} is ALREADY IN USE by another process!`);
    console.error(`👉 The backend is already active and running.`);
    console.error(`👉 Verify live API: http://localhost:${PORT}/api/health\n`);
  } else {
    console.error('Server error:', err);
  }
});

