"use client";

import Cookies from "js-cookie";

export default function Navbar() {
  function logout() {
    fetch("https://api.relentlessbillionaire.com/api/admin/logout", {
      method: "POST",
      credentials: "include"
    }).then(() => {
      Cookies.remove("session");
      window.location.href = "/login";
    });
  }

  return (
    <header className="w-full bg-black border-b border-gray-800 p-4 flex justify-between items-center">
      <h2 className="text-xl text-gold font-semibold">Admin Dashboard</h2>
      <button
        onClick={logout}
        className="bg-gold text-black px-4 py-2 rounded hover:bg-yellow-400 transition-colors"
      >
        Logout
      </button>
    </header>
  );
}
