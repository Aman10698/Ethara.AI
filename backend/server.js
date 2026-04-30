const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

// import all routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const projectRoutes = require('./routes/projectRoutes');
const taskRoutes = require('./routes/taskRoutes');

const app = express();

// middlewares
// set allowed origins for CORS
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }
    return callback(null, true); // allow all for now
  },
  credentials: true,
}));

app.use(express.json());
app.use(morgan('dev'));

// all routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);

// test route to check if server is running
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// handle unknown routes
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// global error handler
app.use((err, req, res, next) => {
  console.log('server error:', err.message);
  res.status(err.statusCode || 500).json({
    message: err.message || 'Internal Server Error',
  });
});

const PORT = process.env.PORT || 5000;

// check if we have a real mongo uri
const isPlaceholderUri = !process.env.MONGO_URI ||
  process.env.MONGO_URI.includes('REPLACE_WITH_YOUR') ||
  process.env.MONGO_URI.includes('<username>');

async function startServer() {
  let mongoUri = process.env.MONGO_URI;

  if (isPlaceholderUri) {
    // use in memory db if no real mongo uri provided
    console.log('No MONGO_URI found, using in-memory MongoDB...');
    const { MongoMemoryServer } = require('mongodb-memory-server');
    let mongod = await MongoMemoryServer.create();
    mongoUri = mongod.getUri();
    console.log('in-memory MongoDB URI:', mongoUri);
  }

  try {
    await mongoose.connect(mongoUri);
    console.log('MongoDB connected successfully');

    app.listen(PORT, () => {
      console.log('Server running on http://localhost:' + PORT);
    });

  } catch (err) {
    console.log('MongoDB connection error:', err.message);
    process.exit(1);
  }
}

startServer();
