"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { DemandaHabilidades } from "./types";

interface DemandaHabilidadesChartProps {
  data?: DemandaHabilidades[];
  isLoading?: boolean;
}

export function DemandaHabilidadesChart({ data, isLoading }: DemandaHabilidadesChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const chartData = (data ?? []).map((item) => ({
    habilidad: item.habilidad.length > 15 ? item.habilidad.substring(0, 15) + "..." : item.habilidad,
    total: item.total_ofertas,
    obligatoria: item.ofertas_obligatoria,
    deseable: item.ofertas_deseable,
    tipo: item.tipo,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Habilidades Más Demandadas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
              <XAxis
                type="number"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                className="text-muted-foreground"
              />
              <YAxis
                type="category"
                dataKey="habilidad"
                tick={{ fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                className="text-muted-foreground"
                width={95}
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
              <Bar dataKey="obligatoria" stackId="a" fill="hsl(var(--primary))" name="Obligatoria" />
              <Bar dataKey="deseable" stackId="a" fill="hsl(142 76% 36%)" name="Deseable" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
