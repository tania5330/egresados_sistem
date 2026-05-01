"use client";

import { useState, useEffect, useMemo } from "react";
import { Calendar } from "lucide-react";
import { KpiCards } from "@/components/dashboard/admin/KpiCards";
import { OfertasPorMesChart } from "@/components/dashboard/admin/OfertasPorMesChart";
import { DistribucionEgresadosChart } from "@/components/dashboard/admin/DistribucionEgresadosChart";
import { DemandaHabilidadesChart } from "@/components/dashboard/admin/DemandaHabilidadesChart";
import { TasaContratacionCohorteChart } from "@/components/dashboard/admin/TasaContratacionCohorteChart";
import { MapaCalor } from "@/components/dashboard/admin/MapaCalor";
import { Filters, type DashboardFilters } from "@/components/dashboard/admin/Filters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { mockDashboardData } from "@/components/dashboard/admin/mockData";
import type { AdminDashboard } from "@/components/dashboard/admin/types";

const CARRERAS = [
  { id: "1", nombre: "Ingeniería de Sistemas" },
  { id: "2", nombre: "Ingeniería Industrial" },
  { id: "3", nombre: "Administración de Empresas" },
  { id: "4", nombre: "Contaduría Pública" },
  { id: "5", nombre: "Derecho" },
  { id: "6", nombre: "Comunicación Social" },
  { id: "7", nombre: "Psicología" },
];

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function AdminDashboardPage() {
  const [filters, setFilters] = useState<DashboardFilters>({
    fechaInicio: "",
    fechaFin: "",
    carreraId: "",
  });

  const debouncedFilters = useDebounce(filters, 500);

  const [data, setData] = useState<AdminDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [useMockData, setUseMockData] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);

      if (useMockData) {
        await new Promise((resolve) => setTimeout(resolve, 800));
        setData(mockDashboardData);
        setIsLoading(false);
        return;
      }

      try {
        await new Promise((resolve) => setTimeout(resolve, 500));
        setData(mockDashboardData);
      } catch {
        setData(mockDashboardData);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [useMockData, debouncedFilters]);

  const filteredData = useMemo(() => {
    if (!data) return null;

    let filtered = { ...data };

    if (debouncedFilters.carreraId) {
      filtered = {
        ...filtered,
        distribucionEgresados: filtered.distribucionEgresados.filter(
          (d) => d.carrera_id === debouncedFilters.carreraId
        ),
        tasaContratacionCohorte: filtered.tasaContratacionCohorte.filter(
          (t) => t.carrera.includes(CARRERAS.find((c) => c.id === debouncedFilters.carreraId)?.nombre ?? "")
        ),
      };
    }

    return filtered;
  }, [data, debouncedFilters]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Administrativo</h1>
          <p className="text-muted-foreground">Resumen y métricas del sistema</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Modo:</span>
          <button
            onClick={() => setUseMockData(!useMockData)}
            className="rounded-md bg-secondary px-3 py-1.5 text-sm font-medium hover:bg-secondary/80"
          >
            {useMockData ? "Datos de prueba" : "Modo tRPC"}
          </button>
        </div>
      </div>

      <Filters onFiltersChange={setFilters} carreras={CARRERAS} isLoading={isLoading} />

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
