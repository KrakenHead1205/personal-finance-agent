import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import transactionsRouter from './routes/transactions';
import reportsRouter from './routes/reports';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check route
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/transactions', transactionsRouter);
app.use('/api/reports', reportsRouter);

// Root route
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Autonomous Personal Finance Agent API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      transactions: '/api/transactions',
      reports: '/api/reports',
    },
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.path,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`💰 Transactions API: http://localhost:${PORT}/api/transactions`);
});

export default app;

