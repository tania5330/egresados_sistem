"use client";

import { use } from "react";
import { trpc } from "@/lib/trpc/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GraduationCap, Briefcase, Award, MapPin, Mail, Phone, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function EgresadoDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: egresado, isLoading } = trpc.egresados.byId.useQuery({ id });

  if (isLoading) return <div className="p-10 text-center">Cargando perfil del egresado...</div>;
  if (!egresado) return <div className="p-10 text-center">Egresado no encontrado</div>;

  return (
    <div className="space-y-6">
      <Link href="/dashboard/buscar-egresados" className="flex items-center text-sm text-muted-foreground hover:text-primary">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Volver a la búsqueda
      </Link>

      <Card className="overflow-hidden">
        <div className="h-32 bg-primary/10" />
        <CardContent className="relative pt-0">
          <div className="absolute -top-12 left-6">
            <div className="h-24 w-24 rounded-full border-4 border-background bg-primary/20 flex items-center justify-center text-primary font-bold text-3xl">
              {egresado.nombres[0]}{egresado.apellidos[0]}
            </div>
          </div>
          <div className="pt-16 flex flex-col md:flex-row justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold">{egresado.nombres} {egresado.apellidos}</h2>
              <p className="text-muted-foreground">{egresado.formacion_academica[0]?.titulo || "Profesional"}</p>
              <div className="flex flex-wrap gap-4 mt-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  {egresado.usuario?.email || ""}
                </div>
                {egresado.telefono && (
                  <div className="flex items-center gap-1">
                    <Phone className="h-4 w-4" />
                    {egresado.telefono}
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  Colombia
                </div>
              </div>
            </div>
            <div className="flex items-end gap-2">
              <Button>Contactar</Button>
              <Button variant="outline">Descargar CV</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Resumen Profesional</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {egresado.biografia || "El egresado aún no ha añadido un resumen profesional."}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Experiencia Laboral</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {egresado.experiencia_laboral.length > 0 ? (
                egresado.experiencia_laboral.map((exp) => (
                  <div key={exp.id} className="flex gap-4">
                    <div className="mt-1 rounded-full bg-primary/10 p-2 text-primary h-fit">
                      <Briefcase className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="font-bold">{exp.cargo}</h4>
                      <p className="text-sm font-medium">{exp.empresa}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(exp.fecha_inicio).toLocaleDateString()} - {exp.trabajo_actual ? "Actualidad" : (exp.fecha_fin ? new Date(exp.fecha_fin).toLocaleDateString() : "")}
                      </p>
                      {exp.descripcion && <p className="mt-2 text-sm text-muted-foreground">{exp.descripcion}</p>}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No hay experiencia registrada.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Formación Académica</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {egresado.formacion_academica.length > 0 ? (
                egresado.formacion_academica.map((form) => (
                  <div key={form.id} className="flex gap-4">
                    <div className="mt-1 rounded-full bg-primary/10 p-2 text-primary h-fit">
                      <GraduationCap className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="font-bold">{form.titulo}</h4>
                      <p className="text-sm font-medium">{form.institucion}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(form.fecha_inicio).getFullYear()} - {form.fecha_fin ? new Date(form.fecha_fin).getFullYear() : "Actualidad"}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No hay formación registrada.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Habilidades</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {(egresado.habilidades || []).map((h: any) => (
                  <Badge key={h.id} variant="secondary">
                    {h.habilidad.nombre}
                    <span className="ml-1 text-[10px] opacity-70">({h.nivel.toLowerCase()})</span>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
