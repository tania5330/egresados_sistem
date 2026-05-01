"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TipoReporte } from "./ReportTypeSelector";

interface PreviewData {
  tipo: TipoReporte;
  filters: Record<string, unknown>;
  data?: any;
  totalRecords?: number;
}

interface ReportPreviewProps {
  previewData: PreviewData | null;
  isLoading?: boolean;
}

const MOCK_PREVIEW_DATA: Record<TipoReporte, { headers: string[]; rows: string[][] }> = {
  LISTADO_EGRESADOS: {
    headers: ["Nombre", "Email", "Carrera", "Año Egreso", "Empleado"],
    rows: [
      ["María García", "maria.g@email.com", "Ing. Sistemas", "2022", "Sí"],
      ["Carlos López", "carlos.l@email.com", "Ing. Industrial", "2021", "No"],
      ["Ana Martínez", "ana.m@email.com", "Administración", "2023", "Sí"],
    ],
  },
  LISTADO_OFERTAS: {
    headers: ["Título", "Empresa", "Ciudad", "Modalidad", "Salario"],
    rows: [
      ["Desarrollador Full Stack", "TechCorp", "Caracas", "Remoto", "$2,000 - $3,000"],
      ["Analista de Datos", "DataSoft", "Maracaibo", "Híbrido", "$1,500 - $2,500"],
      ["Ingeniero DevOps", "CloudServices", "Valencia", "Presencial", "$2,500 - $4,000"],
    ],
  },
  POSTULACIONES_POR_OFERTA: {
    headers: ["Candidato", "Email", "Carrera", "Estado", "Fecha"],
    rows: [
      ["Juan Pérez", "juan.p@email.com", "Ing. Sistemas", "ENTREVISTA", "15/04/2024"],
      ["Laura Rodríguez", "laura.r@email.com", "Ing. Industrial", "POSTULADO", "14/04/2024"],
      ["Pedro Sánchez", "pedro.s@email.com", "Contabilidad", "CONTRATADO", "10/04/2024"],
    ],
  },
  REPORTE_EMPLEABILIDAD: {
    headers: ["Carrera", "Total Egresados", "Empleados", "Tasa"],
    rows: [
      ["Ing. Sistemas", "150", "120", "80%"],
      ["Ing. Industrial", "100", "75", "75%"],
      ["Administración", "200", "130", "65%"],
    ],
  },
  REPORTE_DEMANDA_LABORAL: {
    headers: ["Habilidad", "Tipo", "Ofertas", "Obligatoria"],
    rows: [
      ["JavaScript", "Técnica", "45", "30"],
      ["Python", "Técnica", "40", "25"],
      ["SQL", "Técnica", "38", "20"],
      ["React", "Framework", "35", "22"],
      ["AWS", "Cloud", "32", "18"],
    ],
  },
  REPORTE_COMPARATIVO_COHORTE: {
    headers: ["Año", "Carrera", "Egresados", "Contratados", "Tasa"],
    rows: [
      ["2020", "Ing. Sistemas", "80", "64", "80%"],
      ["2021", "Ing. Sistemas", "95", "76", "80%"],
      ["2022", "Ing. Sistemas", "110", "88", "80%"],
      ["2020", "Ing. Industrial", "60", "45", "75%"],
      ["2021", "Ing. Industrial", "70", "52", "74%"],
    ],
  },
};

function getPreviewTitle(tipo: TipoReporte): string {
  switch (tipo) {
    case "LISTADO_EGRESADOS":
      return "Vista Previa - Listado de Egresados";
    case "LISTADO_OFERTAS":
      return "Vista Previa - Listado de Ofertas";
    case "POSTULACIONES_POR_OFERTA":
      return "Vista Previa - Postulaciones por Oferta";
    case "REPORTE_EMPLEABILIDAD":
      return "Vista Previa - Reporte de Empleabilidad";
    case "REPORTE_DEMANDA_LABORAL":
      return "Vista Previa - Reporte de Demanda Laboral";
    case "REPORTE_COMPARATIVO_COHORTE":
      return "Vista Previa - Reporte Comparativo por Cohorte";
    default:
      return "Vista Previa del Reporte";
  }
}

export function ReportPreview({ previewData, isLoading }: ReportPreviewProps) {
  if (!previewData?.tipo) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">
            Seleccione un tipo de reporte y configure los filtros para ver la vista previa
          </p>
        </CardContent>
      </Card>
    );
  }

  const mockData = MOCK_PREVIEW_DATA[previewData.tipo];
  const estimatedRecords = Math.floor(Math.random() * 100) + 50;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{getPreviewTitle(previewData.tipo)}</CardTitle>
        <CardDescription>
          Vista previa con datos estimados. El reporte final puede variar.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Badge variant="outline">
            ~{estimatedRecords} registros estimados
          </Badge>
          {previewData.filters && Object.keys(previewData.filters).length > 0 && (
            <Badge variant="secondary">
              {Object.keys(previewData.filters).filter(k => previewData.filters[k] !== undefined && previewData.filters[k] !== "" && previewData.filters[k] !== null).length} filtros aplicados
            </Badge>
          )}
        </div>

        <div className="rounded-md border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted">
                  {mockData.headers.map((header, i) => (
                    <th key={i} className="px-4 py-3 text-left font-medium">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {mockData.rows.map((row, rowIndex) => (
                  <tr key={rowIndex} className="border-t">
                    {row.map((cell, cellIndex) => (
                      <td key={cellIndex} className="px-4 py-3">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          * Esta es una vista previa con datos de ejemplo. El reporte real se generará con datos actualizados.
        </p>
      </CardContent>
    </Card>
  );
}