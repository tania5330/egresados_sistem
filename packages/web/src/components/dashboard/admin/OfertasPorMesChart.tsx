"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { OfertasPorMes, PostulacionesPorMes } from "./types";

interface OfertasPorMesChartProps {
  ofertasPorMes?: OfertasPorMes[];
  postulacionesPorMes?: PostulacionesPorMes[];
  isLoading?: boolean;
}

function formatMonth(date: Date): string {
  return new Date(date).toLocaleDateString("es-ES", { month: "short", year: "numeric" });
}

export function OfertasPorMesChart({
  ofertasPorMes,
  postulacionesPorMes,
  isLoading,
}: OfertasPorMesChartProps) {
  if (isLoading) {
    return (
      <Card className="col-span-1 lg:col-span-2">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const combinedData = (ofertasPorMes ?? []).map((oferta, index) => ({
    mes: formatMonth(new Date(oferta.mes)),
    ofertas: oferta.total_ofertas,
    postulaciones: (postulacionesPorMes ?? [])[index]?.total_postulaciones ?? 0,
  }));

  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader>
        <CardTitle className="text-lg">Ofertas vs Postulaciones por Mes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={combinedData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="mes"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                className="text-muted-foreground"
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                className="text-muted-foreground"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "0.5rem",
                }}
                labelStyle={{ color: "hsl(var(--card-foreground))" }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="ofertas"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ r: 4 }}
                name="Ofertas"
              />
              <Line
                type="monotone"
                dataKey="postulaciones"
                stroke="hsl(142 76% 36%)"
                strokeWidth={2}
                dot={{ r: 4 }}
                name="Postulaciones"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
