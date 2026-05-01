"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Briefcase, Users, CheckCircle, TrendingUp } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ReactNode;
  trend?: { value: number; positive: boolean };
}

function StatCard({ title, value, description, icon, trend }: StatsCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        )}
        {trend && (
          <div className={`mt-2 flex items-center text-xs ${trend.positive ? "text-green-500" : "text-red-500"}`}>
            <TrendingUp className="mr-1 h-3 w-3" />
            <span>{trend.positive ? "+" : "-"}{Math.abs(trend.value)}%</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface StatsCardsProps {
  data?: {
    ofertasPublicadas: number;
    postulacionesRecibidas: number;
    candidatosContratados: number;
    ofertasTrend: number;
    postulacionesTrend: number;
    contratadosTrend: number;
  };
  isLoading?: boolean;
}

export function StatsCards({ data, isLoading }: StatsCardsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const stats = [
    {
      title: "Ofertas Publicadas",
      value: data?.ofertasPublicadas ?? 0,
      description: "Ofertas activas",
      icon: <Briefcase className="h-4 w-4" />,
      trend: data ? { value: data.ofertasTrend, positive: data.ofertasTrend >= 0 } : undefined,
    },
    {
      title: "Postulaciones Recibidas",
      value: data?.postulacionesRecibidas ?? 0,
      description: "Total de candidatos",
      icon: <Users className="h-4 w-4" />,
      trend: data ? { value: data.postulacionesTrend, positive: data.postulacionesTrend >= 0 } : undefined,
    },
    {
      title: "Candidatos Contratados",
      value: data?.candidatosContratados ?? 0,
      description: "Contrataciones exitosas",
      icon: <CheckCircle className="h-4 w-4" />,
      trend: data ? { value: data.contratadosTrend, positive: data.contratadosTrend >= 0 } : undefined,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {stats.map((stat) => (
        <StatCard key={stat.title} {...stat} />
      ))}
    </div>
  );
}