import "../styles/globals.css";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

export default function RootLayout({ children }) {
  return (
    <html>
      <body className="flex">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Navbar />
          <main className="p-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
