"use client";

import { Button } from "@/components/ui/button";
import { Download, Clock, Loader2, AlertCircle, CheckCircle } from "lucide-react";

type ReportStatus = "idle" | "generating" | "completed" | "error";

interface ReportActionsProps {
  status: ReportStatus;
  onGenerate: () => void;
  onDownload: () => void;
  onSchedule?: () => void;
  downloadUrl?: string | null;
  errorMessage?: string | null;
  disabled?: boolean;
}

export function ReportActions({
  status,
  onGenerate,
  onDownload,
  onSchedule,
  downloadUrl,
  errorMessage,
  disabled,
}: ReportActionsProps) {
  return (
    <div className="flex flex-col gap-4">
      {status === "idle" && (
        <div className="flex gap-3">
          <Button
            onClick={onGenerate}
            disabled={disabled}
            className="flex-1"
          >
            Generar Reporte
          </Button>
          {onSchedule && (
            <Button
              onClick={onSchedule}
              variant="outline"
              disabled={disabled}
            >
              <Clock className="mr-2 h-4 w-4" />
              Programar
            </Button>
          )}
        </div>
      )}

      {status === "generating" && (
        <div className="flex items-center justify-center gap-2 p-4 bg-muted rounded-lg">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">Generando reporte...</span>
        </div>
      )}

      {status === "completed" && downloadUrl && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-sm text-green-800">Reporte generado exitosamente</span>
          </div>
          <Button
            onClick={onDownload}
            className="w-full"
          >
            <Download className="mr-2 h-4 w-4" />
            Descargar PDF
          </Button>
        </div>
      )}

      {status === "error" && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <span className="text-sm text-destructive">
              {errorMessage || "Error al generar el reporte"}
            </span>
          </div>
          <Button
            onClick={onGenerate}
            variant="outline"
            className="w-full"
          >
            Reintentar
          </Button>
        </div>
      )}
    </div>
  );
}