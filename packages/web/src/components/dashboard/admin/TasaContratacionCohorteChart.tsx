"use client";

import { useMemo } from "react";
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
import type { TasaContratacionCohorte } from "./types";

interface TasaContratacionCohorteChartProps {
  data?: TasaContratacionCohorte[];
  isLoading?: boolean;
}

const CARRERAS_COLORS: Record<string, string> = {
  "Ingeniería de Sistemas": "hsl(var(--primary))",
  "Ingeniería Industrial": "hsl(142 76% 36%)",
  "Administración de Empresas": "hsl(280 65% 60%)",
  "default": "hsl(190 64% 52%)",
};

export function TasaContratacionCohorteChart({ data, isLoading }: TasaContratacionCohorteChartProps) {
  const { chartData, cohortes, carreras } = useMemo(() => {
    if (!data || data.length === 0) {
      return { chartData: [], cohortes: [], carreras: [] };
    }

    const uniqueCohortes = [...new Set(data.map((d) => d.anio_egreso))].sort();
    const uniqueCarreras = [...new Set(data.map((d) => d.carrera))];

    const seriesData = uniqueCohortes.map((cohorte) => {
      const dataPoint: Record<string, number | string> = { cohorte };
      uniqueCarreras.forEach((carrera) => {
        const item = data.find((d) => d.anio_egreso === cohorte && d.carrera === carrera);
        dataPoint[carrera] = item?.tasa_contratacion ?? 0;
      });
      return dataPoint;
    });

    return { chartData: seriesData, cohortes: uniqueCohortes, carreras: uniqueCarreras };
  }, [data]);

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

  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader>
        <CardTitle className="text-lg">Tasa de Contratación por Cohorte</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="cohorte"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                className="text-muted-foreground"
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                className="text-muted-foreground"
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "0.5rem",
                }}
                labelStyle={{ color: "hsl(var(--card-foreground))" }}
                formatter={(value: number) => [`${value}%`, "Tasa"]}
              />
              <Legend />
              {carreras.map((carrera) => (
                <Line
                  key={carrera}
                  type="monotone"
                  dataKey={carrera}
                  stroke={CARRERAS_COLORS[carrera] ?? CARRERAS_COLORS.default}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  name={carrera}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
