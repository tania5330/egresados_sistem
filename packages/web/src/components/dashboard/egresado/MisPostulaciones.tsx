"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Search, Eye, Building2, Calendar } from "lucide-react";

interface Postulacion {
  id: string;
  ofertaTitulo: string;
  empresa: string;
  fechaPostulacion: string;
  estado: "pendiente" | "revisando" | "entrevista" | "rechazado" | "aceptado";
  fechaActualizacion: string;
}

interface MisPostulacionesProps {
  data?: Postulacion[];
  isLoading?: boolean;
  onVerOferta?: (id: string) => void;
  onVerEmpresa?: (id: string) => void;
}

const estadoConfig: Record<Postulacion["estado"], { label: string; variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info" }> = {
  pendiente: { label: "Pendiente", variant: "warning" },
  revisando: { label: "En revisión", variant: "info" },
  entrevista: { label: "Entrevista", variant: "success" },
  rechazado: { label: "Rechazado", variant: "destructive" },
  aceptado: { label: "Aceptado", variant: "success" },
};

export function MisPostulaciones({
  data,
  isLoading,
  onVerOferta,
  onVerEmpresa,
}: MisPostulacionesProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [estadoFilter, setEstadoFilter] = useState<string>("all");

  const filteredData = data?.filter((postulacion) => {
    const matchesSearch = postulacion.ofertaTitulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      postulacion.empresa.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEstado = estadoFilter === "all" || postulacion.estado === estadoFilter;
    return matchesSearch && matchesEstado;
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Mis Postulaciones
          </CardTitle>
          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar ofertas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-full md:w-64"
              />
            </div>
            <Select
              value={estadoFilter}
              onChange={(e) => setEstadoFilter(e.target.value)}
              className="w-full md:w-40"
            >
              <option value="all">Todos los estados</option>
              <option value="pendiente">Pendiente</option>
              <option value="revisando">En revisión</option>
              <option value="entrevista">Entrevista</option>
              <option value="rechazado">Rechazado</option>
              <option value="aceptado">Aceptado</option>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : filteredData && filteredData.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Oferta</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((postulacion) => {
                const config = estadoConfig[postulacion.estado];
                return (
                  <TableRow key={postulacion.id}>
                    <TableCell className="font-medium">
                      {postulacion.ofertaTitulo}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        {postulacion.empresa}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {postulacion.fechaPostulacion}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={config.variant}>{config.label}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onVerOferta?.(postulacion.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onVerEmpresa?.(postulacion.id)}
                        >
                          <Building2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">
              {searchTerm || estadoFilter !== "all"
                ? "No se encontraron postulaciones con esos filtros"
                : "Aún no has postulado a ninguna oferta"}
            </p>
            {(!searchTerm && estadoFilter === "all") && (
              <Button className="mt-4" variant="outline">
                Explorar ofertas
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}