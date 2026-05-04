"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Briefcase, DollarSign, Calendar, Eye } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function OfertasPage() {
  const [filters, setFilters] = useState({
    ciudad: "",
    modalidad: undefined as any,
  });

  const { data, isLoading } = trpc.ofertas.list.useQuery({
    ciudad: filters.ciudad || undefined,
    modalidad: filters.modalidad,
  });

  const postularMutation = trpc.ofertas.postulacion.useMutation({
    onSuccess: () => {
      alert("¡Postulación enviada con éxito!");
    },
    onError: (err) => {
      alert(err.message);
    }
  });

  const handlePostular = (ofertaId: string) => {
    const carta = prompt("Escribe una breve carta de presentación (opcional):");
    if (carta !== null) {
      postularMutation.mutate({ ofertaId, cartaPresentacion: carta });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Ofertas Laborales</h1>
          <p className="text-muted-foreground">Encuentra tu próxima oportunidad profesional</p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Filtrar por ciudad..."
                className="pl-9"
                value={filters.ciudad}
                onChange={(e) => setFilters({ ...filters, ciudad: e.target.value })}
              />
            </div>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={filters.modalidad || ""}
              onChange={(e) => setFilters({ ...filters, modalidad: e.target.value || undefined })}
            >
              <option value="">Todas las modalidades</option>
              <option value="PRESENCIAL">Presencial</option>
              <option value="REMOTO">Remoto</option>
              <option value="HIBRIDO">Híbrido</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {isLoading ? (
          [...Array(3)].map((_, i) => <Skeleton key={i} className="h-32 w-full" />)
        ) : data?.data && data.data.length > 0 ? (
          data.data.map((oferta) => (
            <Card key={oferta.id} className="transition-all hover:border-primary">
              <CardContent className="p-6">
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold">{oferta.titulo}</h3>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {oferta.ciudad || "Remoto"}
                      </div>
                      <div className="flex items-center gap-1">
                        <Briefcase className="h-4 w-4" />
                        {oferta.modalidad}
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        {oferta.salario_max ? `$${oferta.salario_min} - $${oferta.salario_max}` : "No especificado"}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Cierra el {new Date(oferta.fecha_cierre!).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => window.location.href = `/dashboard/ofertas/${oferta.id}`}>
                      <Eye className="mr-2 h-4 w-4" />
                      Ver Detalle
                    </Button>
                    <Button 
                      onClick={() => handlePostular(oferta.id)}
                      disabled={postularMutation.isPending}
                    >
                      {postularMutation.isPending ? "Postulando..." : "Postularse"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            No se encontraron ofertas con los filtros seleccionados.
          </div>
        )}
      </div>
    </div>
  );
}
