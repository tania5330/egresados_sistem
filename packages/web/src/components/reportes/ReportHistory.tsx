"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Download, FileText, Loader2 } from "lucide-react";
import { TipoReporte } from "./ReportTypeSelector";

export interface ReportHistoryItem {
  id: string;
  tipo: TipoReporte;
  estado: "PENDIENTE" | "PROCESANDO" | "COMPLETADO" | "ERROR";
  archivoUrl: string | null;
  createdAt: Date;
  parametros: Record<string, unknown>;
}

interface ReportHistoryProps {
  history: ReportHistoryItem[];
  isLoading?: boolean;
  pagination: {
    page: number;
    totalPages: number;
    total: number;
  };
  onPageChange: (page: number) => void;
  onDownload: (reportId: string) => void;
}

const MOCK_HISTORY: ReportHistoryItem[] = [
  {
    id: "r1",
    tipo: "LISTADO_EGRESADOS",
    estado: "COMPLETADO",
    archivoUrl: "/reports/reporte-1.pdf",
    createdAt: new Date("2024-04-20"),
    parametros: { carreraIds: ["c1"], anioEgresoDesde: "2020" },
  },
  {
    id: "r2",
    tipo: "REPORTE_EMPLEABILIDAD",
    estado: "COMPLETADO",
    archivoUrl: "/reports/reporte-2.pdf",
    createdAt: new Date("2024-04-19"),
    parametros: { anioEgresoDesde: "2021", anioEgresoHasta: "2023" },
  },
  {
    id: "r3",
    tipo: "REPORTE_DEMANDA_LABORAL",
    estado: "PROCESANDO",
    archivoUrl: null,
    createdAt: new Date("2024-04-21"),
    parametros: { topHabilidades: 20 },
  },
  {
    id: "r4",
    tipo: "LISTADO_OFERTAS",
    estado: "COMPLETADO",
    archivoUrl: "/reports/reporte-4.pdf",
    createdAt: new Date("2024-04-18"),
    parametros: { activa: true },
  },
  {
    id: "r5",
    tipo: "REPORTE_COMPARATIVO_COHORTE",
    estado: "ERROR",
    archivoUrl: null,
    createdAt: new Date("2024-04-17"),
    parametros: { anioDesde: "2020", anioHasta: "2024" },
  },
];

function getTipoLabel(tipo: TipoReporte): string {
  const labels: Record<TipoReporte, string> = {
    LISTADO_EGRESADOS: "Listado de Egresados",
    LISTADO_OFERTAS: "Listado de Ofertas",
    POSTULACIONES_POR_OFERTA: "Postulaciones por Oferta",
    REPORTE_EMPLEABILIDAD: "Empleabilidad",
    REPORTE_DEMANDA_LABORAL: "Demanda Laboral",
    REPORTE_COMPARATIVO_COHORTE: "Comparativo Cohorte",
  };
  return labels[tipo] || tipo;
}

function getEstadoBadgevariant(estado: ReportHistoryItem["estado"]): "default" | "secondary" | "destructive" | "outline" {
  switch (estado) {
    case "COMPLETADO":
      return "default";
    case "PROCESANDO":
    case "PENDIENTE":
      return "secondary";
    case "ERROR":
      return "destructive";
    default:
      return "outline";
  }
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function ReportHistory({
  history = MOCK_HISTORY,
  isLoading = false,
  pagination = { page: 1, totalPages: 5, total: 23 },
  onPageChange,
  onDownload,
}: ReportHistoryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Historial de Reportes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : history.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground">
            No hay reportes generados todavía
          </p>
        ) : (
          <>
            <div className="space-y-2">
              {history.map((report) => (
                <div
                  key={report.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">{getTipoLabel(report.tipo)}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(report.createdAt)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={getEstadoBadgevariant(report.estado)}>
                      {report.estado}
                    </Badge>
                    {report.estado === "COMPLETADO" && report.archivoUrl && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onDownload(report.id)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <span className="text-sm text-muted-foreground">
                Página {pagination.page} de {pagination.totalPages} ({pagination.total} reportes)
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onPageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onPageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}