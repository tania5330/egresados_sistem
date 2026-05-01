"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, Circle, Clock, XCircle, ArrowRight } from "lucide-react";

interface TimelinePostulacion {
  id: string;
  ofertaTitulo: string;
  empresa: string;
  estado: "pendiente" | "revisando" | "entrevista" | "rechazado" | "aceptado";
  historial: {
    estado: string;
    fecha: string;
    descripcion: string;
  }[];
}

interface ProgressTimelineProps {
  data?: TimelinePostulacion[];
  isLoading?: boolean;
  selectedId?: string;
  onSelect?: (id: string) => void;
}

const estadoIcons: Record<string, React.ReactNode> = {
  pendiente: <Clock className="h-4 w-4" />,
  enviado: <Circle className="h-4 w-4" />,
  revisando: <Clock className="h-4 w-4" />,
  entrevista: <CheckCircle2 className="h-4 w-4" />,
  rechazado: <XCircle className="h-4 w-4" />,
  aceptado: <CheckCircle2 className="h-4 w-4" />,
};

const estadoColors: Record<string, string> = {
  pendiente: "bg-yellow-500",
  enviado: "bg-blue-500",
  revisando: "bg-blue-500",
  entrevista: "bg-purple-500",
  rechazado: "bg-red-500",
  aceptado: "bg-green-500",
};

function TimelineItem({ historial, isLast }: {
  historial: TimelinePostulacion["historial"][0];
  isLast: boolean;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className={`flex h-8 w-8 items-center justify-center rounded-full ${estadoColors[historial.estado.toLowerCase()] || "bg-gray-500"} text-white`}>
          {estadoIcons[historial.estado.toLowerCase()] || <Circle className="h-4 w-4" />}
        </div>
        {!isLast && <div className="h-full w-0.5 bg-border" />}
      </div>
      <div className="flex-1 pb-6">
        <div className="flex items-center justify-between">
          <span className="font-medium capitalize">{historial.estado}</span>
          <span className="text-sm text-muted-foreground">{historial.fecha}</span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{historial.descripcion}</p>
      </div>
    </div>
  );
}

export function ProgressTimeline({
  data,
  isLoading,
  selectedId,
  onSelect,
}: ProgressTimelineProps) {
  const selectedPostulacion = data?.find((p) => p.id === selectedId);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowRight className="h-5 w-5" />
          Progreso de Postulación
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : data && data.length > 0 ? (
          <div className="space-y-4">
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={selectedId || ""}
              onChange={(e) => onSelect?.(e.target.value)}
            >
              <option value="">Selecciona una postulación</option>
              {data.map((postulacion) => (
                <option key={postulacion.id} value={postulacion.id}>
                  {postulacion.ofertaTitulo} - {postulacion.empresa}
                </option>
              ))}
            </select>

            {selectedPostulacion ? (
              <div className="rounded-lg border bg-card p-4">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">{selectedPostulacion.ofertaTitulo}</h4>
                    <p className="text-sm text-muted-foreground">{selectedPostulacion.empresa}</p>
                  </div>
                  <Badge
                    variant={
                      selectedPostulacion.estado === "aceptado" ? "success" :
                      selectedPostulacion.estado === "rechazado" ? "destructive" :
                      selectedPostulacion.estado === "entrevista" ? "info" :
                      "warning"
                    }
                  >
                    {selectedPostulacion.estado}
                  </Badge>
                </div>
                <div className="mt-4">
                  {selectedPostulacion.historial.map((item, index) => (
                    <TimelineItem
                      key={index}
                      historial={item}
                      isLast={index === selectedPostulacion.historial.length - 1}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">
                  Selecciona una postulación para ver su progreso
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Clock className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">
              No hay postulaciones para mostrar
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}