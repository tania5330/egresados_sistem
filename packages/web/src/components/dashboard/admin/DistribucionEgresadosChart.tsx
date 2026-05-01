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
  Cell,
} from "recharts";
import type { DistribucionEgresados } from "./types";

interface DistribucionEgresadosChartProps {
  data?: DistribucionEgresados[];
  isLoading?: boolean;
}

const COLORS = [
  "hsl(var(--primary))",
  "hsl(142 76% 36%)",
  "hsl(280 65% 60%)",
  "hsl(190 64% 52%)",
  "hsl(25 95% 53%)",
  "hsl(340 82% 52%)",
  "hsl(200 98% 48%)",
];

export function DistribucionEgresadosChart({ data, isLoading }: DistribucionEgresadosChartProps) {
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
    name: item.carrera?.split(" ").slice(0, 2).join(" ") ?? "N/A",
    egresados: item.total_egresados,
    empleados: item.egresados_empleados,
    tasa: item.tasa_empleabilidad,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Egresados por Carrera</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 80, bottom: 5 }}>
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
                dataKey="name"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                className="text-muted-foreground"
                width={75}
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
              <Bar dataKey="egresados" fill="hsl(var(--primary))" name="Total Egresados" radius={[0, 4, 4, 0]} />
              <Bar dataKey="empleados" fill="hsl(142 76% 36%)" name="Empleados" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
