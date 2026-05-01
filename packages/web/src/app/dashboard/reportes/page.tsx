"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ReportTypeSelector, TipoReporte } from "@/components/reportes/ReportTypeSelector";
import { ReportFilters } from "@/components/reportes/ReportFilters";
import { ReportPreview } from "@/components/reportes/ReportPreview";
import { ReportActions } from "@/components/reportes/ReportActions";
import { ReportHistory, ReportHistoryItem } from "@/components/reportes/ReportHistory";

type ReportStatus = "idle" | "generating" | "completed" | "error";

export default function ReportesPage() {
  const [selectedType, setSelectedType] = React.useState<TipoReporte | "">("");
  const [filters, setFilters] = React.useState<Record<string, unknown>>({});
  const [reportStatus, setReportStatus] = React.useState<ReportStatus>("idle");
  const [currentReportId, setCurrentReportId] = React.useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = React.useState<string | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [historyPage, setHistoryPage] = React.useState(1);
  const [history] = React.useState<ReportHistoryItem[]>([]);

  const handleFiltersChange = React.useCallback((newFilters: Record<string, unknown>) => {
    setFilters(newFilters);
  }, []);

  const handleGenerate = React.useCallback(async () => {
    if (!selectedType) return;

    setReportStatus("generating");
    setErrorMessage(null);

    setTimeout(() => {
      const fakeReportId = `report-${Date.now()}`;
      setCurrentReportId(fakeReportId);

      setTimeout(() => {
        setReportStatus("completed");
        setDownloadUrl(`/api/reportes/${fakeReportId}/download`);
      }, 2000);
    }, 1500);
  }, [selectedType]);

  const handleDownload = React.useCallback(() => {
    if (downloadUrl) {
      window.open(downloadUrl, "_blank");
    }
  }, [downloadUrl]);

  const handleSchedule = React.useCallback(() => {
    console.log("Programar reporte", { type: selectedType, filters });
  }, [selectedType, filters]);

  const handleDownloadHistory = React.useCallback((reportId: string) => {
    console.log("Descargar reporte del historial", reportId);
  }, []);

  const handleHistoryPageChange = React.useCallback((page: number) => {
    setHistoryPage(page);
  }, []);

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
              totalPages: 5,
              total: history.length,
            }}
            onPageChange={handleHistoryPageChange}
            onDownload={handleDownloadHistory}
          />
        </div>
      </div>
    </div>
  );
}