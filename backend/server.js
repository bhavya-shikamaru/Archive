const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const { testConnection } = require('./config/db');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const frontendDir = path.join(__dirname, '../frontend');
app.use(express.static(frontendDir));

app.get('/login', (req, res) => res.sendFile(path.join(frontendDir, 'login.html')));
app.get('/register', (req, res) => res.sendFile(path.join(frontendDir, 'register.html')));
app.get('/student', (req, res) => res.sendFile(path.join(frontendDir, 'student.html')));
app.get('/company', (req, res) => res.sendFile(path.join(frontendDir, 'company.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(frontendDir, 'admin.html')));

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    timestamp: new Date().toISOString(),
    system: 'College Placement Management System API (ADWT PBL)'
  });
});

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/students', require('./routes/studentRoutes'));
app.use('/api/companies', require('./routes/companyRoutes'));
app.use('/api/drives', require('./routes/driveRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

app.use((req, res, next) => {
  if (req.originalUrl.startsWith('/api')) {
    return res.status(404).json({
      success: false,
      message: `API endpoint not found: ${req.method} ${req.originalUrl}`
    });
  }
  res.sendFile(path.join(frontendDir, 'index.html'));
});

app.use((err, req, res, next) => {
  console.error('💥 Uncaught Application Error:', err);

  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size exceeds maximum limit of 5MB.'
      });
    }
    return res.status(400).json({
      success: false,
      message: `File upload error: ${err.message}`
    });
  }

  if (err.message && err.message.includes('PDF')) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }

  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      success: false,
      message: 'Duplicate record constraint violation.'
    });
  }

  const statusCode = err.statusCode || 500;
  return res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error. Please contact administrator.',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

const startServer = async () => {
  await testConnection();
  app.listen(PORT, () => {
    console.log(`🚀 Placement API Server running on port ${PORT}`);
    console.log(`📡 Base URL: http://localhost:${PORT}/api`);
  });
};

startServer();

module.exports = app;
