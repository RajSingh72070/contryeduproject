import dotenv from 'dotenv';

dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import documentRoutes from './routes/documentRoutes.js';
import knowledgeRoutes from './routes/knowledgeRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { sanitize } from './middleware/sanitizeMiddleware.js';

// Connect to Database
connectDB();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5001;

// Global Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(compression());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply rate limiter globally
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200, // 200 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    message: 'Too many requests from this IP, please try again after 15 minutes.'
  }
});
app.use(limiter);

// Input Sanitization
app.use(sanitize);

// Serve uploads directory statically
app.use('/api/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Auth routes
app.use('/api', authRoutes);
app.use('/', authRoutes);

// Document routes
app.use('/api/documents', documentRoutes);
app.use('/documents', documentRoutes);

// Knowledge Base routes
app.use('/api/knowledge', knowledgeRoutes);
app.use('/knowledge', knowledgeRoutes);

// Chat Assistant routes
app.use('/api/chat', chatRoutes);
app.use('/chat', chatRoutes);

// Admin Panel routes
app.use('/api/admin', adminRoutes);
app.use('/admin', adminRoutes);

// Swagger Documentation Resources
app.get('/api/swagger.json', (req, res) => {
  res.sendFile(path.join(__dirname, 'swagger.json'));
});
app.get('/api/postman.json', (req, res) => {
  res.sendFile(path.join(__dirname, 'postman_collection.json'));
});

// Swagger UI HTML Page
const swaggerHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>SupportGPT API Documentation</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css" />
  <style>
    body { margin: 0; background: #0b0f19; }
    .swagger-ui { filter: invert(0.88) hue-rotate(180deg); background: #0b0f19; }
    .swagger-ui .topbar { display: none; }
    .swagger-ui .info { margin: 30px 0; }
    .swagger-ui .info .title { color: #f8fafc !important; }
    .swagger-ui .info p, .swagger-ui .info li { color: #94a3b8 !important; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js" charset="UTF-8"></script>
  <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-standalone-preset.js" charset="UTF-8"></script>
  <script>
    window.onload = () => {
      window.ui = SwaggerUIBundle({
        url: '/api/swagger.json',
        dom_id: '#swagger-ui',
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        layout: "BaseLayout",
        deepLinking: true
      });
    };
  </script>
</body>
</html>
`;

app.get('/api-docs', (req, res) => {
  res.send(swaggerHtml);
});
app.get('/api/docs', (req, res) => {
  res.send(swaggerHtml);
});

// Health check / initial route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'SupportGPT API is operational',
    timestamp: new Date().toISOString()
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: 'error',
    message: err.message || 'Internal Server Error'
  });
});

app.listen(PORT, () => {
  console.log(`[SupportGPT Server] running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode.`);
});
