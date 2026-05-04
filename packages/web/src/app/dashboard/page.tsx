"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const user = JSON.parse(storedUser);
      switch (user.role) {
        case "ADMIN":
          router.push("/dashboard/admin");
          break;
        case "EGRESADO":
          router.push("/dashboard/egresado");
          break;
        case "EMPRESA":
          router.push("/dashboard/empresa");
          break;
        case "admin":
          router.push("/dashboard/admin");
          break;
        case "egresado":
          router.push("/dashboard/egresado");
          break;
        case "empresa":
          router.push("/dashboard/empresa");
          break;
        default:
          router.push("/auth/login");
      }
    } else {
      router.push("/auth/login");
    }
  }, [router]);

  return <div>Redirigiendo...</div>;
}
