"use client";

import useSWR from "swr";
import { api } from "../../lib/api";

export default function SystemPage() {
  const { data, error } = useSWR("/api/admin/secure/system/health", path => api(path));

  if (error) return <div className="text-red-400">Error loading system health</div>;
  if (!data) return <div className="text-dim">Loading...</div>;

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy': return 'text-green-400';
      case 'warning': return 'text-yellow-400';
      case 'error': return 'text-red-400';
      default: return 'text-dim';
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'healthy': return 'bg-green-900 text-green-200';
      case 'warning': return 'bg-yellow-900 text-yellow-200';
      case 'error': return 'bg-red-900 text-red-200';
      default: return 'bg-gray-900 text-dim';
    }
  };

  return (
    <div>
      <h1 className="text-2xl text-gold mb-6">System Health</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-gray p-6 rounded border border-gray-800">
          <h3 className="text-gold text-lg font-semibold mb-2">Overall Status</h3>
          <p className={`text-2xl font-bold ${getStatusColor(data?.overall?.status)}`}>
            {data?.overall?.status || 'Unknown'}
          </p>
          <p className="text-dim text-sm">System health</p>
        </div>
        
        <div className="bg-gray p-6 rounded border border-gray-800">
          <h3 className="text-gold text-lg font-semibold mb-2">Uptime</h3>
          <p className="text-2xl font-bold text-green-400">
            {data?.uptime || '0'}%
          </p>
          <p className="text-dim text-sm">Last 30 days</p>
        </div>
        
        <div className="bg-gray p-6 rounded border border-gray-800">
          <h3 className="text-gold text-lg font-semibold mb-2">Response Time</h3>
          <p className="text-2xl font-bold text-green-400">
            {data?.responseTime || '0'}ms
          </p>
          <p className="text-dim text-sm">Average</p>
        </div>
      </div>

      <div className="bg-gray rounded border border-gray-800">
        <div className="p-4 border-b border-gray-800">
          <h2 className="text-lg text-gold">Service Status</h2>
        </div>
        <div className="p-4">
          <div className="space-y-4">
            {data?.services?.map(service => (
              <div key={service.name} className="flex items-center justify-between p-4 bg-black rounded border border-gray-800">
                <div>
                  <h3 className="text-gold font-semibold">{service.name}</h3>
                  <p className="text-dim text-sm">{service.description}</p>
                </div>
                <div className="text-right">
                  <span className={`px-3 py-1 rounded text-sm ${getStatusBadge(service.status)}`}>
                    {service.status}
                  </span>
                  <p className="text-dim text-sm mt-1">{service.responseTime}ms</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 bg-gray rounded border border-gray-800">
        <div className="p-4 border-b border-gray-800">
          <h2 className="text-lg text-gold">System Metrics</h2>
        </div>
        <div className="p-4">
          <pre className="bg-black p-4 rounded text-sm overflow-x-auto">
            {JSON.stringify(data?.metrics, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
