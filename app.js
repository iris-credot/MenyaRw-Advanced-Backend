const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const errorHandler = require('./Middleware/errorHandler');

// Route imports
const allRoutes = require('./Routes/all');


const app = express();

// ─── Core Middleware ────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({ 
    origin:  [
    "http://localhost:3000",
    "http://localhost:5174"    
  ], 
    credentials: true ,
    allowedHeaders: ['Content-Type', 'Authorization'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

// ─── API Routes ─────────────────────────────────────────────────────────────
app.use('/api/v1', allRoutes);


// ─── Health Check ───────────────────────────────────────────────────────────
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Menya Rwanda API is running' });
});

// ─── 404 Handler ────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// ─── Global Error Handler ───────────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;