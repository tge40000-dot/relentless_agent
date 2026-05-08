export default function Dashboard() {
  return (
    <div>
      <h1 className="text-3xl text-gold font-bold mb-4">Welcome, Christopher</h1>
      <p className="text-dim mb-8">Your control room is ready.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-gray p-6 rounded border border-gray-800">
          <h3 className="text-gold text-lg font-semibold mb-2">Total Revenue</h3>
          <p className="text-2xl font-bold">$0.00</p>
          <p className="text-dim text-sm">This month</p>
        </div>
        
        <div className="bg-gray p-6 rounded border border-gray-800">
          <h3 className="text-gold text-lg font-semibold mb-2">Active Members</h3>
          <p className="text-2xl font-bold">0</p>
          <p className="text-dim text-sm">Across all tiers</p>
        </div>
        
        <div className="bg-gray p-6 rounded border border-gray-800">
          <h3 className="text-gold text-lg font-semibold mb-2">Pending Orders</h3>
          <p className="text-2xl font-bold">0</p>
          <p className="text-dim text-sm">Awaiting fulfillment</p>
        </div>
        
        <div className="bg-gray p-6 rounded border border-gray-800">
          <h3 className="text-gold text-lg font-semibold mb-2">System Health</h3>
          <p className="text-2xl font-bold text-green-400">Online</p>
          <p className="text-dim text-sm">All systems operational</p>
        </div>
        
        <div className="bg-gray p-6 rounded border border-gray-800">
          <h3 className="text-gold text-lg font-semibold mb-2">Content Items</h3>
          <p className="text-2xl font-bold">0</p>
          <p className="text-dim text-sm">Artists, services, events</p>
        </div>
        
        <div className="bg-gray p-6 rounded border border-gray-800">
          <h3 className="text-gold text-lg font-semibold mb-2">Scaling Budget</h3>
          <p className="text-2xl font-bold">$0.00</p>
          <p className="text-dim text-sm">10% of revenue available</p>
        </div>
      </div>
    </div>
  );
}
