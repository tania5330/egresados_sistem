"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc/react";
import { Plus, Edit, Trash2, Eye, Users, MapPin, Calendar } from "lucide-react";

export default function MisOfertasPage() {
  const { data: ofertas, isLoading, refetch } = trpc.ofertas.misOfertas.useQuery();
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    titulo: "",
    descripcion: "",
    ciudad: "",
    salario_min: 0,
    salario_max: 0,
    modalidad: "PRESENCIAL",
    tipo_contrato: "TIEMPO_COMPLETO",
  });
  
  const createMutation = trpc.ofertas.create.useMutation({
    onSuccess: () => {
      refetch();
      setIsCreating(false);
      setFormData({
        titulo: "",
        descripcion: "",
        ciudad: "",
        salario_min: 0,
        salario_max: 0,
        modalidad: "PRESENCIAL",
        tipo_contrato: "TIEMPO_COMPLETO",
      });
    }
  });

  const deleteMutation = trpc.ofertas.delete.useMutation({
    onSuccess: () => refetch()
  });

  if (isLoading) return <div>Cargando ofertas...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Mis Ofertas</h1>
          <p className="text-muted-foreground">Administra las vacantes publicadas por tu empresa</p>
        </div>
        <Button onClick={() => setIsCreating(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Crear Oferta
        </Button>
      </div>

      {isCreating && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle>Nueva Oferta Laboral</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Título de la vacante</label>
                <Input 
                  value={formData.titulo} 
                  onChange={(e) => setFormData({...formData, titulo: e.target.value})}
                  placeholder="Ej: Desarrollador React" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Ciudad</label>
                <Input 
                  value={formData.ciudad} 
                  onChange={(e) => setFormData({...formData, ciudad: e.target.value})}
                  placeholder="Ej: Bogotá" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Modalidad</label>
                <select 
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.modalidad}
                  onChange={(e) => setFormData({...formData, modalidad: e.target.value})}
                >
                  <option value="PRESENCIAL">Presencial</option>
                  <option value="REMOTO">Remoto</option>
                  <option value="HIBRIDO">Híbrido</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Tipo Contrato</label>
                <select 
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.tipo_contrato}
                  onChange={(e) => setFormData({...formData, tipo_contrato: e.target.value})}
                >
                  <option value="TIEMPO_COMPLETO">Tiempo Completo</option>
                  <option value="PARCIAL">Parcial</option>
                  <option value="PROYECTO">Proyecto</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Salario Mínimo</label>
                <Input 
                  type="number" 
                  value={formData.salario_min} 
                  onChange={(e) => setFormData({...formData, salario_min: Number(e.target.value)})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Salario Máximo</label>
                <Input 
                  type="number" 
                  value={formData.salario_max} 
                  onChange={(e) => setFormData({...formData, salario_max: Number(e.target.value)})}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Descripción de la oferta</label>
              <textarea 
                className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.descripcion}
                onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                placeholder="Describe las responsabilidades y requisitos..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreating(false)}>Cancelar</Button>
              <Button onClick={() => createMutation.mutate(formData as any)} disabled={createMutation.isPending}>
                {createMutation.isPending ? "Publicando..." : "Publicar Oferta"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {ofertas && ofertas.length > 0 ? (
          ofertas.map((oferta) => (
            <Card key={oferta.id}>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-bold">{oferta.titulo}</h3>
                      <Badge variant={oferta.activa ? "default" : "secondary"}>
                        {oferta.activa ? "Activa" : "Cerrada"}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {oferta.ciudad}, {oferta.pais}
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {oferta._count.postulaciones} postulaciones
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Creada el {new Date(oferta.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => window.location.href = `/dashboard/ofertas/${oferta.id}`}>
                      <Eye className="h-4 w-4 mr-1" />
                      Ver
                    </Button>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => {
                        if (confirm("¿Estás seguro de eliminar esta oferta?")) {
                          deleteMutation.mutate({ id: oferta.id });
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Eliminar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <p className="text-center text-muted-foreground py-10">No has publicado ninguna oferta laboral aún.</p>
        )}
      </div>
    </div>
  );
}
