import Link from "next/link";

export default function Sidebar() {
  return (
    <aside className="w-64 bg-black border-r border-gray-800 p-6">
      <h1 className="text-gold text-2xl font-bold mb-8">RB Admin</h1>

      <nav className="flex flex-col gap-4 text-dim">
        <Link href="/dashboard" className="hover:text-gold transition-colors">Dashboard</Link>
        <Link href="/artists" className="hover:text-gold transition-colors">Artists</Link>
        <Link href="/services" className="hover:text-gold transition-colors">Services</Link>
        <Link href="/vendors" className="hover:text-gold transition-colors">Vendors</Link>
        <Link href="/events" className="hover:text-gold transition-colors">Events</Link>
        <Link href="/memberships" className="hover:text-gold transition-colors">Memberships</Link>
        <Link href="/bookings" className="hover:text-gold transition-colors">Bookings</Link>

        <hr className="border-gray-700" />

        <Link href="/payments" className="hover:text-gold transition-colors">Payments</Link>
        <Link href="/sms" className="hover:text-gold transition-colors">SMS</Link>
        <Link href="/email" className="hover:text-gold transition-colors">Email</Link>

        <hr className="border-gray-700" />

        <Link href="/settings" className="hover:text-gold transition-colors">Site Settings</Link>
        <Link href="/theme" className="hover:text-gold transition-colors">Theme</Link>
        <Link href="/typography" className="hover:text-gold transition-colors">Typography</Link>
        <Link href="/branding" className="hover:text-gold transition-colors">Branding</Link>
        <Link href="/social" className="hover:text-gold transition-colors">Social Links</Link>

        <hr className="border-gray-700" />

        <Link href="/backups" className="hover:text-gold transition-colors">Backups</Link>
        <Link href="/system" className="hover:text-gold transition-colors">System Health</Link>
      </nav>
    </aside>
  );
}
