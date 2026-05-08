"use client";

import useSWR from "swr";
import { api } from "../../lib/api";

export default function PaymentsPage() {
  const { data, error } = useSWR("/api/admin/secure/payments", path => api(path));

  if (error) return <div className="text-red-400">Error loading payments</div>;
  if (!data) return <div className="text-dim">Loading...</div>;

  return (
    <div>
      <h1 className="text-2xl text-gold mb-6">Payment Transactions</h1>

      <div className="bg-gray rounded border border-gray-800">
        <div className="p-4 border-b border-gray-800">
          <h2 className="text-lg text-gold">Recent Transactions</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-gold">ID</th>
                <th className="px-4 py-3 text-left text-gold">Customer</th>
                <th className="px-4 py-3 text-left text-gold">Amount</th>
                <th className="px-4 py-3 text-left text-gold">Type</th>
                <th className="px-4 py-3 text-left text-gold">Status</th>
                <th className="px-4 py-3 text-left text-gold">Date</th>
              </tr>
            </thead>
            <tbody>
              {data?.transactions?.map(transaction => (
                <tr key={transaction.id} className="border-t border-gray-800">
                  <td className="px-4 py-3 text-dim">{transaction.id}</td>
                  <td className="px-4 py-3">{transaction.customer}</td>
                  <td className="px-4 py-3 text-gold">${transaction.amount}</td>
                  <td className="px-4 py-3">{transaction.type}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs ${
                      transaction.status === 'completed' ? 'bg-green-900 text-green-200' :
                      transaction.status === 'pending' ? 'bg-yellow-900 text-yellow-200' :
                      'bg-red-900 text-red-200'
                    }`}>
                      {transaction.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-dim">{transaction.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {(!data?.transactions || data.transactions.length === 0) && (
            <div className="p-8 text-center text-dim">
              No transactions found
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
