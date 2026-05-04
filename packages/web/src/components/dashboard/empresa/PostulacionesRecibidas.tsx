"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Search, Eye, CheckCircle, XCircle, Mail, GraduationCap } from "lucide-react";

interface Candidato {
  id: string;
  nombre: string;
  correo: string;
  oferta: string;
  fechaPostulacion: string;
  estado: "nuevo" | "revisando" | "entrevista" | "rechazado" | "contratado";
  habilidades: string[];
  experiencia: string;
}

interface PostulacionesRecibidasProps {
  data?: Candidato[];
  isLoading?: boolean;
  onVerPerfil?: (id: string) => void;
  onContactar?: (id: string) => void;
  onActualizarEstado?: (id: string, estado: Candidato["estado"]) => void;
}

const estadoConfig: Record<Candidato["estado"], { label: string; variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info" }> = {
  nuevo: { label: "Nuevo", variant: "info" },
  revisando: { label: "En revisión", variant: "warning" },
  entrevista: { label: "Entrevista", variant: "success" },
  rechazado: { label: "Rechazado", variant: "destructive" },
  contratado: { label: "Contratado", variant: "success" },
};

export function PostulacionesRecibidas({
  data,
  isLoading,
  onVerPerfil,
  onContactar,
  onActualizarEstado,
}: PostulacionesRecibidasProps) {
  const [filter, setFilter] = useState("todos");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredData = data?.filter((candidato) => {
    const matchesFilter = filter === "todos" || candidato.estado === filter;
    const matchesSearch = candidato.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         candidato.oferta.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const uniqueOfertas = [...new Set(data?.map((c) => c.oferta) || [])];

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Postulaciones Recibidas
          </CardTitle>
          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar candidatos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-full md:w-64"
              />
            </div>
            <Select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full md:w-40"
            >
              <option value="todos">Todos los estados</option>
              <option value="nuevo">Nuevo</option>
              <option value="revisando">En revisión</option>
              <option value="entrevista">Entrevista</option>
              <option value="rechazado">Rechazado</option>
              <option value="contratado">Contratado</option>
            </Select>

          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : filteredData && filteredData.length > 0 ? (
          <div className="space-y-4">
            {filteredData.map((candidato) => {
              const config = estadoConfig[candidato.estado];
              return (
                <div
                  key={candidato.id}
                  className="flex flex-col gap-4 rounded-lg border p-4 transition-colors hover:bg-muted/50 md:flex-row md:items-center"
                >
                  <div className="flex flex-1 items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                      <GraduationCap className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{candidato.nombre}</h4>
                        <Badge variant={config.variant}>{config.label}</Badge>
                      </div>
                      <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        <span>{candidato.correo}</span>
                      </div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        <span className="font-medium">Oferta:</span> {candidato.oferta}
                      </div>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {candidato.habilidades.slice(0, 4).map((habilidad) => (
                          <Badge key={habilidad} variant="outline" className="text-xs">
                            {habilidad}
                          </Badge>
                        ))}
                        {candidato.habilidades.length > 4 && (
                          <Badge variant="outline" className="text-xs">
                            +{candidato.habilidades.length - 4}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-row gap-2 md:flex-col">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onVerPerfil?.(candidato.id)}
                    >
                      <Eye className="mr-1 h-4 w-4" />
                      Ver perfil
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onContactar?.(candidato.id)}
                    >
                      <Mail className="mr-1 h-4 w-4" />
                      Contactar
                    </Button>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onActualizarEstado?.(candidato.id, "entrevista")}
                        title="Marcar entrevista"
                      >
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onActualizarEstado?.(candidato.id, "rechazado")}
                        title="Rechazar"
                      >
                        <XCircle className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">
              {searchTerm || filter !== "todos"
                ? "No se encontraron candidatos con esos filtros"
                : "Aún no has recibido postulaciones"}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}