"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc/react";
import { Search, MapPin, GraduationCap, Briefcase, Eye } from "lucide-react";

export default function BuscarEgresadosPage() {
  const [search, setSearch] = useState("");
  const { data: egresados, isLoading } = trpc.egresados.list.useQuery({ search });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Buscar Egresados</h1>
        <p className="text-muted-foreground">Encuentra talento para tu empresa</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input 
          className="pl-10" 
          placeholder="Buscar por nombre, habilidades o carrera..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid gap-6">
        {isLoading ? (
          <p className="text-center py-10">Buscando egresados...</p>
        ) : egresados?.data && egresados.data.length > 0 ? (
          egresados.data.map((egresado) => (
            <Card key={egresado.id} className="hover:border-primary transition-colors">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row justify-between gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
                        {egresado.nombres[0]}{egresado.apellidos[0]}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">{egresado.nombres} {egresado.apellidos}</h3>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <GraduationCap className="h-4 w-4" />
                          {egresado.formacion_academica[0]?.titulo || "Profesional"}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {(egresado.habilidades || []).slice(0, 5).map((h: any) => (
                        <Badge key={h.id} variant="secondary">
                          {h.habilidad.nombre}
                        </Badge>
                      ))}
                      {(egresado.habilidades || []).length > 5 && (
                        <Badge variant="outline">+{(egresado.habilidades || []).length - 5} más</Badge>
                      )}
                    </div>

                    <div className="flex gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {egresado.telefono ? "Disponible" : "Sin ubicación"}
                      </div>
                      <div className="flex items-center gap-1">
                        <Briefcase className="h-4 w-4" />
                        {egresado.experiencia_laboral.length} experiencias
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col justify-center gap-2">
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => window.location.href = `/dashboard/egresados/${egresado.id}`}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Ver Perfil Completo
                    </Button>
                    <Button className="w-full">
                      Contactar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              No se encontraron egresados con los criterios de búsqueda.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
