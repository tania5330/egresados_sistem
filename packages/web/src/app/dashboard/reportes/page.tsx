"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ReportTypeSelector, TipoReporte } from "@/components/reportes/ReportTypeSelector";
import { ReportFilters } from "@/components/reportes/ReportFilters";
import { ReportPreview } from "@/components/reportes/ReportPreview";
import { ReportActions } from "@/components/reportes/ReportActions";
import { ReportHistory, ReportHistoryItem } from "@/components/reportes/ReportHistory";

import { trpc } from "@/lib/trpc/react";
import { toast } from "sonner";

type ReportStatus = "idle" | "generating" | "completed" | "error";

export default function ReportesPage() {
  const [selectedType, setSelectedType] = React.useState<TipoReporte | "">("");
  const [filters, setFilters] = React.useState<Record<string, unknown>>({});
  const [reportStatus, setReportStatus] = React.useState<ReportStatus>("idle");
  const [currentReportId, setCurrentReportId] = React.useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = React.useState<string | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [historyPage, setHistoryPage] = React.useState(1);

  const utils = trpc.useUtils();

  const { data: misReportes, isLoading: isLoadingHistory } = trpc.reportes.getMisReportes.useQuery({
    page: historyPage,
    limit: 10,
  });

  const generarMutation = trpc.reportes.generar.useMutation({
    onSuccess: (data) => {
      setCurrentReportId(data.reporteId);
      setReportStatus("generating");
      toast.success("Generando reporte...");
    },
    onError: (error) => {
      setReportStatus("error");
      setErrorMessage(error.message);
      toast.error("Error al solicitar el reporte");
    }
  });

  // Polling para el estado del reporte
  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (reportStatus === "generating" && currentReportId) {
      interval = setInterval(async () => {
        try {
          const status = await utils.client.reportes.getEstado.query({ id: currentReportId });
          if (status.estado === "COMPLETADO") {
            setReportStatus("completed");
            setDownloadUrl(status.archivoUrl);
            utils.reportes.getMisReportes.invalidate();
            toast.success("Reporte generado con éxito");
            clearInterval(interval);
          } else if (status.estado === "ERROR") {
            setReportStatus("error");
            setErrorMessage(status.errorMensaje || "Error desconocido");
            clearInterval(interval);
          }
        } catch (error) {
          console.error("Error polling report status", error);
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [reportStatus, currentReportId, utils]);

  const handleFiltersChange = React.useCallback((newFilters: Record<string, unknown>) => {
    setFilters(newFilters);
  }, []);

  const handleGenerate = React.useCallback(async () => {
    if (!selectedType) return;
    generarMutation.mutate({
      tipo: selectedType as any,
      filtros: filters,
    });
  }, [selectedType, filters, generarMutation]);

  const handleDownload = React.useCallback(() => {
    if (downloadUrl) {
      window.open(downloadUrl, "_blank");
    }
  }, [downloadUrl]);

  const handleSchedule = React.useCallback(() => {
    console.log("Programar reporte", { type: selectedType, filters });
  }, [selectedType, filters]);

  const handleDownloadHistory = React.useCallback((archivoUrl: string) => {
    if (archivoUrl) {
      window.open(archivoUrl, "_blank");
    }
  }, []);

  const handleHistoryPageChange = React.useCallback((page: number) => {
    setHistoryPage(page);
  }, []);

  const history = React.useMemo(() => {
    if (!misReportes) return [];
    return misReportes.data.map((r: any) => ({
      id: r.id,
      tipo: r.tipo as TipoReporte,
      estado: r.estado as any,
      createdAt: new Date(r.createdAt),
      archivoUrl: r.archivoUrl,
      parametros: r.parametros || {},
    }));
  }, [misReportes]);

  const previewData = React.useMemo(() => {
    if (!selectedType) return null;
    return {
      tipo: selectedType as TipoReporte,
      filters,
      totalRecords: Math.floor(Math.random() * 100) + 50,
    };
  }, [selectedType, filters]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Panel de Reportes</h1>
        <p className="text-muted-foreground mt-1">
          Genere reportes detallados en formato PDF con datos del sistema
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tipo de Reporte</CardTitle>
              <CardDescription>
                Seleccione el tipo de reporte que desea generar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ReportTypeSelector
                value={selectedType}
                onChange={(value) => {
                  setSelectedType(value);
                  setReportStatus("idle");
                  setCurrentReportId(null);
                  setDownloadUrl(null);
                }}
                disabled={reportStatus === "generating"}
              />
            </CardContent>
          </Card>

          {selectedType && (
            <Card>
              <CardHeader>
                <CardTitle>Filtros del Reporte</CardTitle>
                <CardDescription>
                  Configure los filtros para personalizar el reporte
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ReportFilters
                  tipoReporte={selectedType as TipoReporte}
                  onFiltersChange={handleFiltersChange}
                  disabled={reportStatus === "generating"}
                />
              </CardContent>
            </Card>
          )}

          {selectedType && (
            <ReportPreview
              previewData={previewData}
              isLoading={reportStatus === "generating"}
            />
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Acciones</CardTitle>
              <CardDescription>
                Genere o descargue el reporte
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ReportActions
                status={reportStatus}
                onGenerate={handleGenerate}
                onDownload={handleDownload}
                onSchedule={selectedType ? handleSchedule : undefined}
                downloadUrl={downloadUrl}
                errorMessage={errorMessage}
                disabled={!selectedType || reportStatus === "generating"}
              />
            </CardContent>
          </Card>

          <ReportHistory
            history={history}
            pagination={{
              page: historyPage,
              totalPages: misReportes?.meta.totalPages || 1,
              total: misReportes?.meta.total || 0,
            }}
            onPageChange={handleHistoryPageChange}
            onDownload={(id) => {
              const report = history.find(h => h.id === id);
              if (report?.archivoUrl) handleDownloadHistory(report.archivoUrl);
            }}
          />
        </div>
      </div>
    </div>
  );
}