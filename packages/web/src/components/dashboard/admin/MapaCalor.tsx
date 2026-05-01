"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import type { OfertasPorUbicacion } from "./types";

interface MapaCalorProps {
  data?: OfertasPorUbicacion[];
  isLoading?: boolean;
}

function getHeatColor(value: number, max: number): string {
  if (max === 0) return "bg-muted";
  const intensity = value / max;
  if (intensity > 0.75) return "bg-primary/90";
  if (intensity > 0.5) return "bg-primary/70";
  if (intensity > 0.25) return "bg-primary/50";
  return "bg-primary/30";
}

function formatCurrency(value: number | null): string {
  if (!value) return "N/A";
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function MapaCalor({ data, isLoading }: MapaCalorProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const ubicaciones = data ?? [];
  const maxOfertas = Math.max(...ubicaciones.map((u) => u.total_ofertas), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Distribución Geográfica de Ofertas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          {ubicaciones.map((ubicacion) => (
            <div
              key={`${ubicacion.ciudad}-${ubicacion.pais}`}
              className={`rounded-lg p-4 ${getHeatColor(ubicacion.total_ofertas, maxOfertas)} transition-colors hover:ring-2 hover:ring-primary hover:ring-offset-2`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium">{ubicacion.ciudad}</p>
                  <p className="text-xs text-muted-foreground">{ubicacion.pais}</p>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {ubicacion.total_ofertas}
                </Badge>
              </div>
              <div className="mt-2 space-y-1">
                <p className="text-xs">
                  <span className="text-muted-foreground">Empresas: </span>
                  <span className="font-medium">{ubicacion.empresas_unicas}</span>
                </p>
                <p className="text-xs">
                  <span className="text-muted-foreground">Salario: </span>
                  <span className="font-medium">
                    {formatCurrency(ubicacion.salario_promedio_min)} - {formatCurrency(ubicacion.salario_promedio_max)}
                  </span>
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
