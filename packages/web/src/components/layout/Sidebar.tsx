"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  GraduationCap,
  Building2,
  LayoutDashboard,
  Users,
  Briefcase,
  BarChart,
  Settings,
  LogOut,
  UserCircle,
  FileText,
  Bell,
  History,
} from "lucide-react";

const navItems = [
  // --- EGRESADO ---
  { href: "/dashboard/egresado", label: "Dashboard", icon: LayoutDashboard, roles: ["egresado"] },
  { href: "/dashboard/perfil", label: "Mi Perfil / CV", icon: UserCircle, roles: ["egresado"] },
  { href: "/dashboard/ofertas", label: "Ofertas", icon: Briefcase, roles: ["egresado"] },
  { href: "/dashboard/postulaciones", label: "Mis Postulaciones", icon: FileText, roles: ["egresado"] },
  { href: "/dashboard/notificaciones", label: "Notificaciones", icon: Bell, roles: ["egresado"] },

  // --- EMPRESA ---
  { href: "/dashboard/empresa", label: "Dashboard", icon: LayoutDashboard, roles: ["empresa"] },
  { href: "/dashboard/mis-ofertas", label: "Mis Ofertas", icon: Briefcase, roles: ["empresa"] },
  { href: "/dashboard/postulaciones", label: "Postulaciones", icon: FileText, roles: ["empresa"] },
  { href: "/dashboard/buscar-egresados", label: "Buscar Egresados", icon: Users, roles: ["empresa"] },
  { href: "/dashboard/notificaciones", label: "Notificaciones", icon: Bell, roles: ["empresa"] },

  // --- ADMINISTRADOR ---
  { href: "/dashboard/admin", label: "Dashboard General", icon: LayoutDashboard, roles: ["admin"] },
  { href: "/dashboard/admin/egresados", label: "Egresados", icon: GraduationCap, roles: ["admin"] },
  { href: "/dashboard/admin/empresas", label: "Empresas", icon: Building2, roles: ["admin"] },
  { href: "/dashboard/admin/ofertas", label: "Ofertas", icon: Briefcase, roles: ["admin"] },
  { href: "/dashboard/admin/postulaciones", label: "Postulaciones", icon: FileText, roles: ["admin"] },
  { href: "/dashboard/reportes", label: "Reportes", icon: BarChart, roles: ["admin"] },
  { href: "/dashboard/admin/configuracion", label: "Administración", icon: Settings, roles: ["admin"] },
  { href: "/dashboard/admin/bitacora", label: "Bitácora", icon: History, roles: ["admin"] },
];

interface SidebarProps {
  userRole?: "admin" | "egresado" | "empresa";
}

export function Sidebar({ userRole = "admin" }: SidebarProps) {
  const pathname = usePathname();

  const filteredNav = navItems.filter(
    (item) => !item.roles || item.roles.includes(userRole)
  );

  return (
    <aside className="flex flex-col w-64 border-r bg-card">
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/dashboard" className="font-bold text-lg">
          Sistema Egresados
        </Link>
      </div>
      <nav className="flex-1 space-y-1 p-2">
        {filteredNav.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t p-2">
        <Link
          href="/auth/login"
          className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        >
          <LogOut className="h-4 w-4" />
          Cerrar Sesión
        </Link>
      </div>
    </aside>
  );
}
