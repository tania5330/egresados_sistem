"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Briefcase, MapPin, Building2, Clock } from "lucide-react";

interface Oferta {
  id: string;
  titulo: string;
  empresa: string;
  ubicacion: string;
  salario: string;
  fechaPublicacion: string;
  habilidades: string[];
  coincidencia: number;
}

interface OfertasRecomendadasProps {
  data?: Oferta[];
  isLoading?: boolean;
  onVerDetalles?: (id: string) => void;
  onPostularse?: (id: string) => void;
}

function OfertaCard({ oferta, onVerDetalles, onPostularse }: {
  oferta: Oferta;
  onVerDetalles?: (id: string) => void;
  onPostularse?: (id: string) => void;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-lg border p-4 transition-colors hover:bg-muted/50">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-semibold">{oferta.titulo}</h3>
          <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
            <Building2 className="h-3 w-3" />
            <span>{oferta.empresa}</span>
          </div>
          <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-3 w-3" />
            <span>{oferta.ubicacion}</span>
          </div>
        </div>
        <Badge variant={oferta.coincidencia >= 80 ? "success" : oferta.coincidencia >= 50 ? "warning" : "secondary"}>
          {oferta.coincidencia}% coincidencia
        </Badge>
      </div>

      <div className="flex flex-wrap gap-1">
        {oferta.habilidades.slice(0, 4).map((habilidad) => (
          <Badge key={habilidad} variant="outline" className="text-xs">
            {habilidad}
          </Badge>
        ))}
        {oferta.habilidades.length > 4 && (
          <Badge variant="outline" className="text-xs">
            +{oferta.habilidades.length - 4}
          </Badge>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>Publicado {oferta.fechaPublicacion}</span>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => onVerDetalles?.(oferta.id)}>
            Ver detalles
          </Button>
          <Button size="sm" onClick={() => onPostularse?.(oferta.id)}>
            Postularse
          </Button>
        </div>
      </div>
    </div>
  );
}

export function OfertasRecomendadas({
  data,
  isLoading,
  onVerDetalles,
  onPostularse,
}: OfertasRecomendadasProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Ofertas Recomendadas
          </CardTitle>
          <Button variant="ghost" size="sm">
            Ver todas
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-8 w-full" />
              </div>
            ))}
          </div>
        ) : data && data.length > 0 ? (
          <div className="space-y-4">
            {data.map((oferta) => (
              <OfertaCard
                key={oferta.id}
                oferta={oferta}
                onVerDetalles={onVerDetalles}
                onPostularse={onPostularse}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">
              No hay ofertas recomendadas en este momento
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Actualiza tu perfil para obtener mejores recomendaciones
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}