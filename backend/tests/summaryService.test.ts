import { generateWeeklySummary } from '../src/services/summaryService';
import { Transaction } from '@prisma/client';

// Mock Prisma client
jest.mock('../src/db/prisma', () => ({
  __esModule: true,
  default: {
    transaction: {
      findMany: jest.fn(),
    },
  },
}));

// Mock Google ADK client to avoid external dependencies
jest.mock('../src/services/googleAdkClient', () => ({
  runAgent: jest.fn(),
}));

import prisma from '../src/db/prisma';

describe('summaryService', () => {
  describe('generateWeeklySummary', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should return correct total and byCategory for a set of transactions', async () => {
      // Mock transactions data
      const mockTransactions: Transaction[] = [
        {
          id: '1',
          userId: 'user-123',
          amount: 500.0,
          description: 'Groceries',
          category: 'Food',
          source: 'Credit Card',
          date: new Date('2024-12-01'),
          createdAt: new Date('2024-12-01'),
        },
        {
          id: '2',
          userId: 'user-123',
          amount: 300.0,
          description: 'Uber ride',
          category: 'Transport',
          source: 'UPI',
          date: new Date('2024-12-02'),
          createdAt: new Date('2024-12-02'),
        },
        {
          id: '3',
          userId: 'user-123',
          amount: 200.0,
          description: 'Coffee',
          category: 'Food',
          source: 'Cash',
          date: new Date('2024-12-03'),
          createdAt: new Date('2024-12-03'),
        },
      ];

      // Mock Prisma findMany to return mock data
      (prisma.transaction.findMany as jest.Mock).mockResolvedValue(mockTransactions);

      // Call the function
      const result = await generateWeeklySummary('2024-12-01');

      // Assertions
      expect(result.total).toBe(1000.0);
      expect(result.byCategory).toEqual({
        Food: 700.0,
        Transport: 300.0,
      });
      expect(result.topTransactions).toHaveLength(3);
      expect(result.topTransactions[0].amount).toBe(500.0);
    });

    it('should return zero total for no transactions', async () => {
      // Mock empty transactions
      (prisma.transaction.findMany as jest.Mock).mockResolvedValue([]);

      const result = await generateWeeklySummary('2024-12-01');

      expect(result.total).toBe(0);
      expect(result.byCategory).toEqual({});
      expect(result.topTransactions).toHaveLength(0);
    });

    it('should return top 3 transactions when more than 3 exist', async () => {
      const mockTransactions: Transaction[] = [
        {
          id: '1',
          userId: 'user-123',
          amount: 1000.0,
          description: 'Laptop',
          category: 'Shopping',
          source: 'Credit Card',
          date: new Date('2024-12-01'),
          createdAt: new Date('2024-12-01'),
        },
        {
          id: '2',
          userId: 'user-123',
          amount: 800.0,
          description: 'Phone',
          category: 'Shopping',
          source: 'Credit Card',
          date: new Date('2024-12-02'),
          createdAt: new Date('2024-12-02'),
        },
        {
          id: '3',
          userId: 'user-123',
          amount: 600.0,
          description: 'Headphones',
          category: 'Shopping',
          source: 'Credit Card',
          date: new Date('2024-12-03'),
          createdAt: new Date('2024-12-03'),
        },
        {
          id: '4',
          userId: 'user-123',
          amount: 400.0,
          description: 'Shoes',
          category: 'Shopping',
          source: 'Credit Card',
          date: new Date('2024-12-04'),
          createdAt: new Date('2024-12-04'),
        },
        {
          id: '5',
          userId: 'user-123',
          amount: 200.0,
          description: 'Socks',
          category: 'Shopping',
          source: 'Cash',
          date: new Date('2024-12-05'),
          createdAt: new Date('2024-12-05'),
        },
      ];

      (prisma.transaction.findMany as jest.Mock).mockResolvedValue(mockTransactions);

      const result = await generateWeeklySummary('2024-12-01');

      expect(result.total).toBe(3000.0);
      expect(result.topTransactions).toHaveLength(3);
      expect(result.topTransactions[0].amount).toBe(1000.0);
      expect(result.topTransactions[1].amount).toBe(800.0);
      expect(result.topTransactions[2].amount).toBe(600.0);
    });

    it('should aggregate multiple transactions in the same category', async () => {
      const mockTransactions: Transaction[] = [
        {
          id: '1',
          userId: 'user-123',
          amount: 100.0,
          description: 'Coffee',
          category: 'Food',
          source: 'Cash',
          date: new Date('2024-12-01'),
          createdAt: new Date('2024-12-01'),
        },
        {
          id: '2',
          userId: 'user-123',
          amount: 200.0,
          description: 'Lunch',
          category: 'Food',
          source: 'Card',
          date: new Date('2024-12-02'),
          createdAt: new Date('2024-12-02'),
        },
        {
          id: '3',
          userId: 'user-123',
          amount: 300.0,
          description: 'Dinner',
          category: 'Food',
          source: 'UPI',
          date: new Date('2024-12-03'),
          createdAt: new Date('2024-12-03'),
        },
      ];

      (prisma.transaction.findMany as jest.Mock).mockResolvedValue(mockTransactions);

      const result = await generateWeeklySummary('2024-12-01');

      expect(result.total).toBe(600.0);
      expect(result.byCategory).toEqual({
        Food: 600.0,
      });
      expect(result.byCategory.Food).toBe(600.0);
    });

    it('should handle multiple categories correctly', async () => {
      const mockTransactions: Transaction[] = [
        {
          id: '1',
          userId: 'user-123',
          amount: 100.0,
          description: 'Groceries',
          category: 'Food',
          source: 'Card',
          date: new Date('2024-12-01'),
          createdAt: new Date('2024-12-01'),
        },
        {
          id: '2',
          userId: 'user-123',
          amount: 50.0,
          description: 'Bus fare',
          category: 'Transport',
          source: 'Cash',
          date: new Date('2024-12-02'),
          createdAt: new Date('2024-12-02'),
        },
        {
          id: '3',
          userId: 'user-123',
          amount: 1000.0,
          description: 'Rent',
          category: 'Rent',
          source: 'Bank Transfer',
          date: new Date('2024-12-03'),
          createdAt: new Date('2024-12-03'),
        },
        {
          id: '4',
          userId: 'user-123',
          amount: 150.0,
          description: 'Movie',
          category: 'Entertainment',
          source: 'Card',
          date: new Date('2024-12-04'),
          createdAt: new Date('2024-12-04'),
        },
      ];

      (prisma.transaction.findMany as jest.Mock).mockResolvedValue(mockTransactions);

      const result = await generateWeeklySummary('2024-12-01');

      expect(result.total).toBe(1300.0);
      expect(result.byCategory).toEqual({
        Food: 100.0,
        Transport: 50.0,
        Rent: 1000.0,
        Entertainment: 150.0,
      });
      expect(Object.keys(result.byCategory)).toHaveLength(4);
    });

    it('should call prisma.transaction.findMany with correct date range', async () => {
      (prisma.transaction.findMany as jest.Mock).mockResolvedValue([]);

      await generateWeeklySummary('2024-12-01');

      expect(prisma.transaction.findMany).toHaveBeenCalledWith({
        where: {
          date: {
            gte: new Date('2024-12-01'),
            lt: new Date('2024-12-08'),
          },
        },
        orderBy: {
          amount: 'desc',
        },
      });
    });
  });
});

