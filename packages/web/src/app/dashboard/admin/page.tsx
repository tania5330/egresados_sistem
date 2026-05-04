"use client";

import { useState, useMemo } from "react";
import { Calendar } from "lucide-react";
import { KpiCards } from "@/components/dashboard/admin/KpiCards";
import { OfertasPorMesChart } from "@/components/dashboard/admin/OfertasPorMesChart";
import { DistribucionEgresadosChart } from "@/components/dashboard/admin/DistribucionEgresadosChart";
import { DemandaHabilidadesChart } from "@/components/dashboard/admin/DemandaHabilidadesChart";
import { TasaContratacionCohorteChart } from "@/components/dashboard/admin/TasaContratacionCohorteChart";
import { MapaCalor } from "@/components/dashboard/admin/MapaCalor";
import { Filters, type DashboardFilters } from "@/components/dashboard/admin/Filters";
import { trpc } from "@/lib/trpc/react";

export default function AdminDashboardPage() {
  const [filters, setFilters] = useState<DashboardFilters>({
    fechaInicio: "",
    fechaFin: "",
    carreraId: "",
  });

  const { data, isLoading, refetch } = trpc.dashboard.getAdminDashboard.useQuery({
    fechaInicio: filters.fechaInicio || undefined,
    fechaFin: filters.fechaFin || undefined,
    carreraId: filters.carreraId || undefined,
  });

  const invalidateMutation = trpc.dashboard.invalidateCache.useMutation({
    onSuccess: () => refetch()
  });

  const filteredData = useMemo(() => {
    if (!data) return null;
    return data;
  }, [data]);

  if (isLoading) {
    return <div>Cargando dashboard de administrador...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Administrativo</h1>
          <p className="text-muted-foreground">Resumen y métricas del sistema</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => invalidateMutation.mutate({})}
            className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            disabled={invalidateMutation.isPending}
          >
            {invalidateMutation.isPending ? "Actualizando..." : "Actualizar Datos"}
          </button>
        </div>
      </div>

      <Filters 
        onFiltersChange={setFilters} 
        carreras={[]} 
        isLoading={isLoading} 
      />

      <KpiCards data={filteredData?.kpis} isLoading={isLoading} />

      <div className="grid gap-4 lg:grid-cols-2">
        <OfertasPorMesChart
          ofertasPorMes={filteredData?.ofertasPorMes}
          postulacionesPorMes={filteredData?.postulacionesPorMes}
          isLoading={isLoading}
        />
        <DistribucionEgresadosChart
          data={filteredData?.distribucionEgresados}
          isLoading={isLoading}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <DemandaHabilidadesChart
          data={filteredData?.demandaHabilidades}
          isLoading={isLoading}
        />
        <TasaContratacionCohorteChart
          data={filteredData?.tasaContratacionCohorte}
          isLoading={isLoading}
        />
      </div>

      <MapaCalor data={filteredData?.ofertasPorUbicacion} isLoading={isLoading} />
    </div>
  );
}
