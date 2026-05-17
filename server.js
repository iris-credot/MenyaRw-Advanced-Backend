require('dotenv').config();
const app = require('./app');
const connectDB = require('./Config/db');

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Menya Rwanda server running on port ${PORT}`);
  });
});