"use client";

import { Users, Building2, Briefcase, TrendingUp } from "lucide-react";

const stats = [
  { label: "Total Egresados", value: "156", icon: Users, color: "text-blue-600" },
  { label: "Empresas Registradas", value: "42", icon: Building2, color: "text-green-600" },
  { label: "Ofertas Activas", value: "28", icon: Briefcase, color: "text-orange-600" },
  { label: "Tasa de Colocación", value: "78%", icon: TrendingUp, color: "text-purple-600" },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Bienvenido al Dashboard</h2>
        <p className="text-muted-foreground">Resumen del sistema de egresados</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="rounded-lg border bg-card p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
                <Icon className={`h-8 w-8 ${stat.color}`} />
              </div>
            </div>
          );
        })}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h3 className="font-semibold">Ofertas Recientes</h3>
          <p className="text-sm text-muted-foreground">Últimas ofertas publicadas</p>
        </div>
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h3 className="font-semibold">Nuevos Egresados</h3>
          <p className="text-sm text-muted-foreground">Egresados registrados recientemente</p>
        </div>
      </div>
    </div>
  );
}
