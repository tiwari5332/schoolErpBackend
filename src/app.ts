import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import routes from './routes';
import { requestResponseLogger } from './middleware/logger.middleware';
import { jwtAuthFilter } from './middleware/auth.middleware';
import { tenantInterceptor } from './middleware/tenant.middleware';
import { globalErrorHandler } from './middleware/error.middleware';
import { ApiResponse } from './utils/response';
import { ALLOWED_ORIGINS } from './config/env';

const app: Application = express();

app.use(helmet());
app.use(cors({
  origin: ALLOWED_ORIGINS,
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Core Middleware Pipeline
app.use(requestResponseLogger);
app.use(jwtAuthFilter);
app.use(tenantInterceptor);

// Public Root & Health Check
app.get('/', (req, res) => ApiResponse.success(res, { app: 'School ERP Node.js Backend API', status: 'RUNNING' }));
app.get('/health', (req, res) => ApiResponse.success(res, { status: 'UP', timestamp: new Date().toISOString() }));

// Mount API Routes
app.use('/api', routes);

// Global Error Handler
app.use(globalErrorHandler);

export default app;
