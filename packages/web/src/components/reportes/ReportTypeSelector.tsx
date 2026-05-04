"use client";

import { cn } from "@/lib/utils";
import { FileText, BarChart3, Users, Briefcase, PieChart, TrendingUp } from "lucide-react";

export enum TipoReporte {
  OPERACIONAL = 'OPERACIONAL',
  GESTION = 'GESTION',
  LISTADO_EGRESADOS = 'LISTADO_EGRESADOS',
  LISTADO_OFERTAS = 'LISTADO_OFERTAS',
  POSTULACIONES_POR_OFERTA = 'POSTULACIONES_POR_OFERTA',
  REPORTE_EMPLEABILIDAD = 'REPORTE_EMPLEABILIDAD',
  REPORTE_DEMANDA_LABORAL = 'REPORTE_DEMANDA_LABORAL',
  REPORTE_COMPARATIVO_COHORTE = 'REPORTE_COMPARATIVO_COHORTE',
}

interface ReportTypeInfo {
  id: TipoReporte;
  name: string;
  description: string;
  icon: React.ReactNode;
}

const REPORT_TYPES: ReportTypeInfo[] = [
  {
    id: TipoReporte.OPERACIONAL,
    name: "Reporte Operacional",
    description: "Resumen de registros: egresados, empresas, ofertas y postulaciones.",
    icon: <FileText className="h-6 w-6" />,
  },
  {
    id: TipoReporte.GESTION,
    name: "Reporte de Gestión",
    description: "KPIs estratégicos: tasa de empleabilidad y habilidades demandadas.",
    icon: <BarChart3 className="h-6 w-6" />,
  },
  {
    id: TipoReporte.LISTADO_EGRESADOS,
    name: "Listado de Egresados",
    description: "Exportación detallada de la base de datos de egresados.",
    icon: <Users className="h-6 w-6" />,
  },
  {
    id: TipoReporte.REPORTE_EMPLEABILIDAD,
    name: "Empleabilidad",
    description: "Análisis de inserción laboral por carrera y cohorte.",
    icon: <PieChart className="h-6 w-6" />,
  },
];

interface ReportTypeSelectorProps {
  value: TipoReporte | "";
  onChange: (value: TipoReporte) => void;
  disabled?: boolean;
}

export function ReportTypeSelector({
  value,
  onChange,
  disabled,
}: ReportTypeSelectorProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {REPORT_TYPES.map((type) => (
        <button
          key={type.id}
          onClick={() => onChange(type.id)}
          disabled={disabled}
          className={cn(
            "flex items-start gap-4 rounded-lg border p-4 text-left transition-all hover:bg-accent",
            value === type.id ? "border-primary bg-primary/5 ring-1 ring-primary" : "bg-card",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          <div className={cn(
            "rounded-full p-2",
            value === type.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
          )}>
            {type.icon}
          </div>
          <div className="flex-1">
            <h4 className="font-bold leading-none mb-1">{type.name}</h4>
            <p className="text-sm text-muted-foreground">{type.description}</p>
          </div>
        </button>
      ))}
    </div>
  );
}
