"use client";

import { useState } from "react";

import {LogOut} from "lucide-react";


export default function LogoutButton() {
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Unable to sign out");
      }

      window.location.replace("/login");
    } catch (error) {
      console.error(error);
      setLoading(false);

      alert("Unable to sign out. Please try again.");
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      aria-label="Sign out"
      title="Sign out"
      className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
    >
      <LogOut size={19} aria-hidden="true"/>
    </button>
  );
}