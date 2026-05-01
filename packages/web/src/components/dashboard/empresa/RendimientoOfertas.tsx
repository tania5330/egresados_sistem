"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3, Eye, Users, TrendingDown, Search, ArrowUpDown } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface OfertaRendimiento {
  id: string;
  titulo: string;
  postulaciones: number;
  vistas: number;
  tasaConversion: number;
  estado: "activa" | "cerrada" | "pausada";
  fechaPublicacion: string;
}

interface RendimientoOfertasProps {
  data?: OfertaRendimiento[];
  isLoading?: boolean;
  onVerDetalles?: (id: string) => void;
  onVerPostulaciones?: (id: string) => void;
}

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444"];

export function RendimientoOfertas({
  data,
  isLoading,
  onVerDetalles,
  onVerPostulaciones,
}: RendimientoOfertasProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<"postulaciones" | "vistas" | "tasaConversion">("postulaciones");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [viewMode, setViewMode] = useState<"table" | "chart">("table");

  const filteredData = data?.filter((oferta) =>
    oferta.titulo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedData = [...(filteredData || [])].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    return sortOrder === "desc" ? bValue - aValue : aValue - bValue;
  });

  const chartData = sortedData.slice(0, 5).map((oferta) => ({
    name: oferta.titulo.length > 15 ? oferta.titulo.substring(0, 15) + "..." : oferta.titulo,
    postulaciones: oferta.postulaciones,
    vistas: oferta.vistas,
  }));

  const estadoColor: Record<string, string> = {
    activa: "bg-green-500",
    cerrada: "bg-gray-500",
    pausada: "bg-yellow-500",
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Rendimiento de Ofertas
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar ofertas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-full md:w-64"
              />
            </div>
            <div className="flex gap-1">
              <Button
                variant={viewMode === "table" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("table")}
              >
                <ArrowUpDown className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "chart" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("chart")}
              >
                <BarChart3 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-64 w-full" />
          </div>
        ) : sortedData && sortedData.length > 0 ? (
          <div className="space-y-4">
            {viewMode === "chart" ? (
              <div className="space-y-4">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="postulaciones" fill="#10b981" name="Postulaciones" />
                      <Bar dataKey="vistas" fill="#3b82f6" name="Vistas" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-green-500" />
                    <span className="text-sm text-muted-foreground">Postulaciones</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-blue-500" />
                    <span className="text-sm text-muted-foreground">Vistas</span>
                  </div>
                </div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Oferta</TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        className="gap-1 p-0"
                        onClick={() => {
                          setSortField("vistas");
                          setSortOrder(sortOrder === "desc" ? "asc" : "desc");
                        }}
                      >
                        Vistas
                        <ArrowUpDown className="h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        className="gap-1 p-0"
                        onClick={() => {
                          setSortField("postulaciones");
                          setSortOrder(sortOrder === "desc" ? "asc" : "desc");
                        }}
                      >
                        Postulaciones
                        <ArrowUpDown className="h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        className="gap-1 p-0"
                        onClick={() => {
                          setSortField("tasaConversion");
                          setSortOrder(sortOrder === "desc" ? "asc" : "desc");
                        }}
                      >
                        Tasa Conversión
                        <ArrowUpDown className="h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedData.map((oferta) => (
                    <TableRow key={oferta.id}>
                      <TableCell className="font-medium">{oferta.titulo}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Eye className="h-4 w-4 text-muted-foreground" />
                          {oferta.vistas}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          {oferta.postulaciones}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={oferta.tasaConversion >= 10 ? "success" : oferta.tasaConversion >= 5 ? "warning" : "secondary"}>
                          {oferta.tasaConversion}%
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={`h-2 w-2 rounded-full ${estadoColor[oferta.estado]}`} />
                          <span className="text-sm capitalize">{oferta.estado}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onVerPostulaciones?.(oferta.id)}
                        >
                          Ver postulaciones
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">
              No hay ofertas publicadas aún
            </p>
            <Button className="mt-4" variant="outline">
              Crear nueva oferta
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}