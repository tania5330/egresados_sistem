"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc/react";
import { GraduationCap, Briefcase, User as UserIcon, Award, Plus, Trash2 } from "lucide-react";

export default function PerfilPage() {
  const [activeTab, setActiveTab] = useState<"personal" | "formacion" | "experiencia" | "habilidades">("personal");
  
  const { data: profile, isLoading, refetch } = trpc.egresados.me.useQuery();
  const [personalData, setPersonalData] = useState({
    telefono: "",
    biografia: "",
    genero: "",
  });

  useEffect(() => {
    if (profile) {
      setPersonalData({
        telefono: profile.telefono || "",
        biografia: profile.biografia || "",
        genero: profile.genero || "",
      });
    }
  }, [profile]);
  
  const updateMutation = trpc.egresados.update.useMutation({
    onSuccess: () => {
      refetch();
      alert("Perfil actualizado correctamente");
    }
  });

  const [isAddingFormation, setIsAddingFormation] = useState(false);
  const [formationData, setFormationData] = useState({
    institucion: "",
    titulo: "",
    fecha_inicio: "",
    fecha_fin: "",
  });

  const addFormationMutation = trpc.egresados.addFormacion.useMutation({
    onSuccess: () => {
      refetch();
      setIsAddingFormation(false);
    }
  });

  const removeFormationMutation = trpc.egresados.removeFormacion.useMutation({
    onSuccess: () => refetch()
  });

  const handleAddFormation = () => {
      if (profile) {
       addFormationMutation.mutate({
         ...formationData,
         fecha_inicio: new Date(formationData.fecha_inicio),
         fecha_fin: formationData.fecha_fin ? new Date(formationData.fecha_fin) : undefined,
       } as any);
      }
    };

    const handleUpdatePersonal = () => {
      if (profile) {
        updateMutation.mutate({
          id: profile.id,
          telefono: personalData.telefono,
          biografia: personalData.biografia,
          genero: personalData.genero as any,
        });
      }
    };

  if (isLoading) return <div>Cargando perfil...</div>;
  if (!profile) return <div>No se encontró el perfil.</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Mi Perfil / CV</h1>
          <p className="text-muted-foreground">Gestiona tu información profesional</p>
        </div>
      </div>

      <div className="flex gap-4 border-b pb-px">
        <button
          onClick={() => setActiveTab("personal")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "personal" ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <UserIcon className="h-4 w-4" />
          Datos Personales
        </button>
        <button
          onClick={() => setActiveTab("formacion")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "formacion" ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <GraduationCap className="h-4 w-4" />
          Formación
        </button>
        <button
          onClick={() => setActiveTab("experiencia")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "experiencia" ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Briefcase className="h-4 w-4" />
          Experiencia
        </button>
        <button
          onClick={() => setActiveTab("habilidades")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "habilidades" ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Award className="h-4 w-4" />
          Habilidades
        </button>
      </div>

      <div className="mt-6">
        {activeTab === "personal" && (
          <Card>
            <CardHeader>
              <CardTitle>Información Básica</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nombres</label>
                  <Input defaultValue={profile.nombres} disabled />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Apellidos</label>
                  <Input defaultValue={profile.apellidos} disabled />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <Input defaultValue={profile.usuario?.email || ""} disabled />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Teléfono</label>
                  <Input 
                    value={personalData.telefono} 
                    onChange={(e) => setPersonalData({...personalData, telefono: e.target.value})}
                    placeholder="Ej: +57 300..." 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Biografía / Resumen</label>
                <textarea
                  className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={personalData.biografia}
                  onChange={(e) => setPersonalData({...personalData, biografia: e.target.value})}
                  placeholder="Cuéntanos un poco sobre ti..."
                />
              </div>
              <Button onClick={handleUpdatePersonal} disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </CardContent>
          </Card>
        )}

        {activeTab === "formacion" && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button size="sm" onClick={() => setIsAddingFormation(!isAddingFormation)}>
                <Plus className="mr-2 h-4 w-4" />
                {isAddingFormation ? "Cancelar" : "Agregar Formación"}
              </Button>
            </div>

            {isAddingFormation && (
              <Card className="border-primary">
                <CardHeader>
                  <CardTitle className="text-sm">Nueva Formación Académica</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Institución</label>
                      <Input 
                        value={formationData.institucion}
                        onChange={(e) => setFormationData({...formationData, institucion: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Título</label>
                      <Input 
                        value={formationData.titulo}
                        onChange={(e) => setFormationData({...formationData, titulo: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Fecha Inicio</label>
                      <Input 
                        type="date"
                        value={formationData.fecha_inicio}
                        onChange={(e) => setFormationData({...formationData, fecha_inicio: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Fecha Fin (Opcional)</label>
                      <Input 
                        type="date"
                        value={formationData.fecha_fin}
                        onChange={(e) => setFormationData({...formationData, fecha_fin: e.target.value})}
                      />
                    </div>
                  </div>
                  <Button onClick={handleAddFormation} disabled={addFormationMutation.isPending}>
                    {addFormationMutation.isPending ? "Guardando..." : "Guardar Formación"}
                  </Button>
                </CardContent>
              </Card>
            )}
            {profile.formacion_academica.length > 0 ? (
              profile.formacion_academica.map((f) => (
                <Card key={f.id}>
                  <CardContent className="flex items-start justify-between p-6">
                    <div className="flex gap-4">
                      <div className="rounded-full bg-primary/10 p-2 text-primary">
                        <GraduationCap className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-bold">{f.titulo}</h4>
                        <p className="text-sm text-muted-foreground">{f.institucion}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(f.fecha_inicio).getFullYear()} - {f.fecha_fin ? new Date(f.fecha_fin).getFullYear() : "Actualidad"}
                        </p>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-destructive"
                      onClick={() => {
                        if (confirm("¿Eliminar esta formación?")) {
                          removeFormationMutation.mutate({ id: f.id });
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-10">No has agregado formación académica aún.</p>
            )}
          </div>
        )}

        {activeTab === "experiencia" && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Agregar Experiencia
              </Button>
            </div>
            {profile.experiencia_laboral.length > 0 ? (
              profile.experiencia_laboral.map((e) => (
                <Card key={e.id}>
                  <CardContent className="flex items-start justify-between p-6">
                    <div className="flex gap-4">
                      <div className="rounded-full bg-primary/10 p-2 text-primary">
                        <Briefcase className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-bold">{e.cargo}</h4>
                        <p className="text-sm text-muted-foreground">{e.empresa}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(e.fecha_inicio).toLocaleDateString()} - {e.trabajo_actual ? "Actualidad" : (e.fecha_fin ? new Date(e.fecha_fin).toLocaleDateString() : "")}
                        </p>
                        {e.descripcion && <p className="text-sm mt-2">{e.descripcion}</p>}
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-10">No has agregado experiencia laboral aún.</p>
            )}
          </div>
        )}

        {activeTab === "habilidades" && (
          <Card>
            <CardHeader>
              <CardTitle>Mis Habilidades</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {(profile.habilidades || []).map((h: any) => (
                  <Badge key={h.id} variant="secondary" className="px-3 py-1 flex gap-2 items-center">
                    {h.habilidad.nombre}
                    <span className="text-[10px] bg-primary/20 text-primary px-1 rounded uppercase font-bold">
                      {h.nivel.toLowerCase()}
                    </span>
                    <button className="ml-1 hover:text-destructive transition-colors">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                <Button variant="outline" size="sm" className="rounded-full">
                  <Plus className="h-4 w-4 mr-1" />
                  Añadir
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
