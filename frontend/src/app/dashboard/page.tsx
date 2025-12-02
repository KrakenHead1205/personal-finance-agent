'use client';

import { useEffect, useState } from 'react';
import {
  fetchTransactions,
  fetchWeeklyReport,
  createTransaction,
  type Transaction,
  type WeeklyReportResponse,
  getLastNDays,
  formatDate,
} from '@/lib/api';

export default function DashboardPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState(getLastNDays(7));

  // Weekly report state
  const [weeklyReport, setWeeklyReport] = useState<WeeklyReportResponse | null>(null);
  const [weeklyReportLoading, setWeeklyReportLoading] = useState(false);
  const [weeklyReportError, setWeeklyReportError] = useState<string | null>(null);
  const [selectedWeekStart, setSelectedWeekStart] = useState<string>(() => {
    // Default to 7 days ago
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return formatDate(date);
  });

  // New transaction form state
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    date: formatDate(new Date()),
    source: '',
  });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Load transactions
  useEffect(() => {
    async function loadTransactions() {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchTransactions(dateRange.from, dateRange.to);
        setTransactions(data.transactions);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load transactions');
        console.error('Error loading transactions:', err);
      } finally {
        setLoading(false);
      }
    }

    loadTransactions();
  }, [dateRange.from, dateRange.to]);

  // Load weekly report
  useEffect(() => {
    async function loadWeeklyReport() {
      try {
        setWeeklyReportLoading(true);
        setWeeklyReportError(null);
        const report = await fetchWeeklyReport(selectedWeekStart);
        setWeeklyReport(report);
      } catch (err) {
        setWeeklyReportError(
          err instanceof Error ? err.message : 'Failed to load weekly report'
        );
        console.error('Error loading weekly report:', err);
      } finally {
        setWeeklyReportLoading(false);
      }
    }

    loadWeeklyReport();
  }, [selectedWeekStart]);

  // Calculate total spent
  const totalSpent = transactions.reduce((sum, transaction) => sum + transaction.amount, 0);

  // Handle form input changes
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFormError(null);
  };

  // Handle form submission
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormError(null);
    setFormSuccess(false);

    try {
      // Validate amount
      const amount = parseFloat(formData.amount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error('Please enter a valid amount');
      }

      // Create transaction (no userId for now, backend should handle)
      await createTransaction({
        userId: 'user-123', // Default user for demo
        amount,
        description: formData.description.trim(),
        source: formData.source.trim(),
        date: formData.date,
      });

      // Success! Reset form and refresh transactions
      setFormSuccess(true);
      setFormData({
        amount: '',
        description: '',
        date: formatDate(new Date()),
        source: '',
      });

      // Refresh transactions list
      const data = await fetchTransactions(dateRange.from, dateRange.to);
      setTransactions(data.transactions);

      // Hide form and clear success message after 3 seconds
      setTimeout(() => {
        setFormSuccess(false);
        setShowForm(false);
      }, 3000);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create transaction');
      console.error('Error creating transaction:', err);
    } finally {
      setFormSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Personal Finance Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Track your expenses and manage your finances
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-md transition-colors flex items-center gap-2"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            New Transaction
          </button>
        </header>

        {/* New Transaction Form */}
        {showForm && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6 border-2 border-indigo-500">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                Add New Transaction
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Amount */}
                <div>
                  <label
                    htmlFor="amount"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Amount (₹) *
                  </label>
                  <input
                    type="number"
                    id="amount"
                    name="amount"
                    value={formData.amount}
                    onChange={handleFormChange}
                    required
                    step="0.01"
                    min="0"
                    placeholder="450.50"
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                {/* Date */}
                <div>
                  <label
                    htmlFor="date"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Date *
                  </label>
                  <input
                    type="date"
                    id="date"
                    name="date"
                    value={formData.date}
                    onChange={handleFormChange}
                    required
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                {/* Description */}
                <div>
                  <label
                    htmlFor="description"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Description *
                  </label>
                  <input
                    type="text"
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleFormChange}
                    required
                    placeholder="Coffee at Starbucks"
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                {/* Source */}
                <div>
                  <label
                    htmlFor="source"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Payment Source *
                  </label>
                  <input
                    type="text"
                    id="source"
                    name="source"
                    value={formData.source}
                    onChange={handleFormChange}
                    required
                    placeholder="UPI, Credit Card, Cash"
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Success Message */}
              {formSuccess && (
                <div className="flex items-center gap-2 p-3 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-md">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="font-medium">Transaction created successfully! Category will be auto-detected.</span>
                </div>
              )}

              {/* Error Message */}
              {formError && (
                <div className="flex items-center gap-2 p-3 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded-md">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="font-medium">{formError}</span>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className={`px-6 py-2 rounded-md font-semibold transition-colors ${
                    formSubmitting
                      ? 'bg-indigo-400 cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-700'
                  } text-white flex items-center gap-2`}
                >
                  {formSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Create Transaction
                    </>
                  )}
                </button>
              </div>

              <p className="text-xs text-gray-500 dark:text-gray-400">
                * Category will be automatically detected using AI or rule-based logic
              </p>
            </form>
          </div>
        )}

        {/* Date Range Info & Weekly Summary Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Date Range Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Date Range</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {dateRange.from} to {dateRange.to}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Spent</p>
                <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                  ₹{totalSpent.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Weekly Summary Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Weekly Summary
              </h2>
            </div>

            {/* Week Start Date Input */}
            <div className="mb-4">
              <label
                htmlFor="weekStart"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Select Week Start Date
              </label>
              <input
                type="date"
                id="weekStart"
                value={selectedWeekStart}
                onChange={(e) => setSelectedWeekStart(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            {weeklyReportLoading ? (
              <div className="text-center py-4">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-3 border-indigo-600 border-t-transparent"></div>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Loading report...
                </p>
              </div>
            ) : weeklyReportError ? (
              <div className="text-center py-4">
                <p className="text-red-600 dark:text-red-400 text-sm">{weeklyReportError}</p>
              </div>
            ) : weeklyReport ? (
              <div>
                <div className="mb-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Week: {weeklyReport.weekStart} to {weeklyReport.weekEnd}
                  </p>
                  <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                    ₹{weeklyReport.summary.total.toFixed(2)}
                  </p>
                </div>

                {/* Category Breakdown */}
                {Object.keys(weeklyReport.summary.byCategory).length > 0 && (
                  <div className="space-y-2">
                    {Object.entries(weeklyReport.summary.byCategory)
                      .sort(([, a], [, b]) => b - a)
                      .map(([category, amount]) => (
                        <div
                          key={category}
                          className="flex items-center justify-between text-sm"
                        >
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCategoryColor(
                              category
                            )}`}
                          >
                            {category}
                          </span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            ₹{amount.toFixed(2)}
                          </span>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>

        {/* AI Insights Section */}
        {weeklyReport && weeklyReport.insights.length > 0 && (
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg shadow-md p-6 mb-6 border border-purple-200 dark:border-purple-800">
            <div className="flex items-center gap-2 mb-4">
              <svg
                className="h-6 w-6 text-purple-600 dark:text-purple-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                AI Insights
              </h2>
            </div>
            <ul className="space-y-3">
              {weeklyReport.insights.map((insight, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-600 dark:bg-purple-500 text-white text-xs font-bold flex items-center justify-center mt-0.5">
                    {index + 1}
                  </span>
                  <p className="text-gray-700 dark:text-gray-300 flex-1">{insight}</p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Transactions Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Transactions ({transactions.length})
            </h2>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Loading transactions...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <div className="inline-block p-3 bg-red-100 dark:bg-red-900/30 rounded-full mb-4">
                <svg
                  className="h-6 w-6 text-red-600 dark:text-red-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <p className="text-red-600 dark:text-red-400 font-medium">{error}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Make sure the backend server is running on port 4000
              </p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="p-8 text-center">
              <div className="inline-block p-3 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
                <svg
                  className="h-6 w-6 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                  />
                </svg>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                No transactions found for this period
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {transactions.map((transaction) => (
                    <tr
                      key={transaction.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                        {new Date(transaction.date).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-300">
                        <div className="font-medium">{transaction.description}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {transaction.source}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCategoryColor(
                            transaction.category
                          )}`}
                        >
                          {transaction.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900 dark:text-gray-300">
                        ₹{transaction.amount.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer Stats */}
        {transactions.length > 0 && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Average Transaction
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                ₹{(totalSpent / transactions.length).toFixed(2)}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Largest Transaction
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                ₹{Math.max(...transactions.map((t) => t.amount)).toFixed(2)}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Count</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {transactions.length}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Get Tailwind color classes for different categories
 */
function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    Food: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    Transport: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    Rent: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    Bills: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    Shopping: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300',
    Entertainment: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
    Healthcare: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    Groceries: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    Other: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  };

  return colors[category] || colors.Other;
}

