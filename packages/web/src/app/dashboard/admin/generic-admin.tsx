"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Edit, Trash2, Eye } from "lucide-react";
import { trpc } from "@/lib/trpc/react";

interface AdminPageProps {
  title: string;
  type: "egresados" | "empresas" | "ofertas" | "postulaciones";
}

export default function AdminUsersPage({ title, type }: AdminPageProps) {
  const [search, setSearch] = useState("");
  
  // Dynamic query selection based on type
  const egresadosQuery = trpc.egresados.list.useQuery({ search }, { enabled: type === "egresados" });
  const ofertasQuery = trpc.ofertas.list.useQuery({}, { enabled: type === "ofertas" });
  const empresasQuery = trpc.empresas.list.useQuery({ search }, { enabled: type === "empresas" });
  const postulacionesQuery = trpc.ofertas.misPostulaciones.useQuery({}, { enabled: type === "postulaciones" });
  
  const isLoading = type === "egresados" ? egresadosQuery.isLoading : 
                    type === "ofertas" ? ofertasQuery.isLoading : 
                    type === "empresas" ? empresasQuery.isLoading :
                    type === "postulaciones" ? postulacionesQuery.isLoading : false;

  const data = type === "egresados" ? egresadosQuery.data?.data : 
               type === "ofertas" ? ofertasQuery.data?.data : 
               type === "empresas" ? empresasQuery.data?.data :
               type === "postulaciones" ? postulacionesQuery.data : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-muted-foreground">Panel de administración global</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo {title.slice(0, -1)}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder={`Buscar ${title.toLowerCase()}...`} 
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center py-10">Cargando...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    {type === "egresados" ? "Nombre" : 
                     type === "empresas" ? "Empresa" : 
                     type === "ofertas" ? "Título" : 
                     "Oferta / Empresa"}
                  </TableHead>
                  <TableHead>
                    {type === "egresados" ? "Estado" : 
                     type === "empresas" ? "Sector" : 
                     type === "ofertas" ? "Modalidad" : 
                     "Candidato"}
                  </TableHead>
                  <TableHead>
                    {type === "egresados" ? "Fecha Reg." : 
                     type === "empresas" ? "Ciudad" : 
                     type === "ofertas" ? "Salario" : 
                     "Estado"}
                  </TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data && data.length > 0 ? (
                  data.map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        {type === "egresados" ? `${item.nombres} ${item.apellidos}` : 
                         type === "empresas" ? item.nombre : 
                         type === "ofertas" ? item.titulo : 
                         (
                           <div className="flex flex-col">
                             <span>{item.ofertaTitulo}</span>
                             <span className="text-xs text-muted-foreground">{item.empresaNombre}</span>
                           </div>
                         )}
                      </TableCell>
                      <TableCell>
                        {type === "egresados" ? (
                          <Badge variant={item.usuario?.estado ? "default" : "secondary"}>
                            {item.usuario?.estado ? "Activo" : "Inactivo"}
                          </Badge>
                        ) : type === "empresas" ? (
                          item.sector
                        ) : type === "ofertas" ? (
                          item.modalidad
                        ) : (
                          item.egresadoEmail
                        )}
                      </TableCell>
                      <TableCell>
                        {type === "egresados" ? (
                          new Date(item.creado_at).toLocaleDateString()
                        ) : type === "empresas" ? (
                          item.ciudad
                        ) : type === "ofertas" ? (
                          `$${Number(item.salario_min).toLocaleString()} - $${Number(item.salario_max).toLocaleString()}`
                        ) : (
                          <Badge variant="outline">{item.estado}</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => {
                              if (type === "egresados") window.location.href = `/dashboard/egresados/${item.id}`;
                              if (type === "ofertas") window.location.href = `/dashboard/ofertas/${item.id}`;
                              if (type === "empresas") alert(`Detalle de empresa: ${item.nombre}`);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">
                      No se encontraron resultados.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
