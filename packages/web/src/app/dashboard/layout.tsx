"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    const storedUser = localStorage.getItem("user");
    
    if (!token || !storedUser || storedUser === "undefined") {
      router.push("/auth/login");
      return;
    }

    try {
      const parsedUser = JSON.parse(storedUser);
      if (!parsedUser || !parsedUser.role) {
        throw new Error("Invalid user data");
      }
      setUser(parsedUser);
    } catch (error) {
      console.error("Error parsing user from localStorage:", error);
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");
      router.push("/auth/login");
    }
  }, [router]);

  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar userRole={user.role.toLowerCase()} />
      <div className="flex flex-1 flex-col">
        <Header title="Sistema Egresados" userName={user.email} />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
