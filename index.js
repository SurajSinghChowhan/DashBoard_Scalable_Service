require('dotenv').config();
const express = require('express');
const cors = require('cors');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const dashboardRoutes = require('./routes/dashboard.routes');
const axios = require('axios');

// Validate required environment variables
const requiredEnvVars = ['PORT', 'STUDENT_SERVICE_URL', 'DRIVE_SERVICE_URL'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('Missing required environment variables:');
  missingEnvVars.forEach(envVar => console.error(`- ${envVar} is not set`));
  process.exit(1);
}

const app = express();
const port = process.env.PORT || 4003;

// Middleware
app.use(cors());
app.use(express.json());

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Dashboard Service API',
      version: '1.0.0',
      description: 'API documentation for the Dashboard Service that aggregates data from Student and Drive services',
      contact: {
        name: 'API Support',
        email: 'support@example.com'
      }
    },
    servers: [
      {
        url: `http://localhost:${port}`,
        description: 'Development server',
      },
      {
        url: `http://dashboard-service:${port}`,
        description: 'Docker container',
      }
    ],
    tags: [
      {
        name: 'Dashboard',
        description: 'Dashboard statistics and overview endpoints'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  },
  apis: ['./routes/*.js'], // Path to the API routes
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: "Dashboard Service API Documentation"
}));

// Routes
app.use('/dashboard', dashboardRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    service: 'dashboard-service',
    environment: process.env.NODE_ENV,
    studentServiceUrl: process.env.STUDENT_SERVICE_URL,
    driveServiceUrl: process.env.DRIVE_SERVICE_URL
  });
});

app.listen(port, () => {
  console.log(`Dashboard service is running on port ${port}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`Student Service URL: ${process.env.STUDENT_SERVICE_URL}`);
  console.log(`Drive Service URL: ${process.env.DRIVE_SERVICE_URL}`);
  console.log(`API Documentation available at: http://localhost:${port}/api-docs`);
}); 