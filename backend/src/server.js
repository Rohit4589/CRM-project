require('dotenv').config({ override: true });
const app = require('./app');

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`🩺 Health Check API: http://localhost:${PORT}/api/health`);
  console.log(`======================================================\n`);
});
