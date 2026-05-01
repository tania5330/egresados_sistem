"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, Eye, Mail, Award, TrendingUp } from "lucide-react";

interface Candidato {
  id: string;
  nombre: string;
  correo: string;
  tituloProfesional: string;
  habilidades: string[];
  experiencia: string;
  coincidencia: number;
  ultimaActividad: string;
}

interface CandidatosDestacadosProps {
  data?: Candidato[];
  isLoading?: boolean;
  onVerPerfil?: (id: string) => void;
  onContactar?: (id: string) => void;
}

function CandidatoCard({ candidato, onVerPerfil, onContactar }: {
  candidato: Candidato;
  onVerPerfil?: (id: string) => void;
  onContactar?: (id: string) => void;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-lg border p-4 transition-colors hover:bg-muted/50">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <span className="text-lg font-semibold">{candidato.nombre.charAt(0)}</span>
          </div>
          <div>
            <h4 className="font-semibold">{candidato.nombre}</h4>
            <p className="text-sm text-muted-foreground">{candidato.tituloProfesional}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
          <span className="text-sm font-medium">{candidato.coincidencia}%</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-1">
        {candidato.habilidades.slice(0, 5).map((habilidad) => (
          <Badge key={habilidad} variant="outline" className="text-xs">
            {habilidad}
          </Badge>
        ))}
        {candidato.habilidades.length > 5 && (
          <Badge variant="outline" className="text-xs">
            +{candidato.habilidades.length - 5}
          </Badge>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <TrendingUp className="h-3 w-3" />
          <span>Última actividad: {candidato.ultimaActividad}</span>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => onVerPerfil?.(candidato.id)}>
            <Eye className="mr-1 h-4 w-4" />
            Perfil
          </Button>
          <Button size="sm" onClick={() => onContactar?.(candidato.id)}>
            <Mail className="mr-1 h-4 w-4" />
            Contactar
          </Button>
        </div>
      </div>
    </div>
  );
}

export function CandidatosDestacados({
  data,
  isLoading,
  onVerPerfil,
  onContactar,
}: CandidatosDestacadosProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Candidatos Destacados
          </CardTitle>
          <Badge variant="secondary">Mejor coincidencia</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-16 w-full" />
              </div>
            ))}
          </div>
        ) : data && data.length > 0 ? (
          <div className="space-y-4">
            {data.map((candidato) => (
              <CandidatoCard
                key={candidato.id}
                candidato={candidato}
                onVerPerfil={onVerPerfil}
                onContactar={onContactar}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Award className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">
              No hay candidatos destacados en este momento
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Publica ofertas para atraer candidatos destacados
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}