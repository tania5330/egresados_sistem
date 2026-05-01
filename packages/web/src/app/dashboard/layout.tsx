"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar userRole="admin" />
      <div className="flex flex-1 flex-col">
        <Header title="Dashboard" userName="Administrador" />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
