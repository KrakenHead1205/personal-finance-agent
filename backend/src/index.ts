import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import transactionsRouter from './routes/transactions';
import reportsRouter from './routes/reports';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check route
app.get('/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    database: 'PostgreSQL',
    port: PORT
  });
});

// API Routes
app.use('/transactions', transactionsRouter);
app.use('/reports', reportsRouter);

// Root route
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Autonomous Personal Finance Agent API (PostgreSQL)',
    version: '2.0.0',
    database: 'PostgreSQL with pg library',
    endpoints: {
      health: '/health',
      transactions: '/transactions',
      reports: '/reports',
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
  console.log(`💰 Transactions API: http://localhost:${PORT}/transactions`);
  console.log(`📈 Reports API: http://localhost:${PORT}/reports`);
  console.log(`🗄️  Database: PostgreSQL`);
});

export default app;
