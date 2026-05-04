"use client";

import { use } from "react";
import { trpc } from "@/lib/trpc/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Briefcase, DollarSign, Calendar, ArrowLeft, Building2 } from "lucide-react";
import Link from "next/link";

export default function OfertaDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: oferta, isLoading } = trpc.ofertas.byId.useQuery({ id });

  if (isLoading) return <div>Cargando detalle de la oferta...</div>;
  if (!oferta) return <div>Oferta no encontrada</div>;

  return (
    <div className="space-y-6">
      <Link href="/dashboard/ofertas" className="flex items-center text-sm text-muted-foreground hover:text-primary">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Volver a la lista
      </Link>

      <div className="flex flex-col gap-6 md:flex-row">
        <div className="flex-1 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-3xl">{oferta.titulo}</CardTitle>
                  <div className="mt-2 flex items-center gap-2 text-muted-foreground">
                    <Building2 className="h-4 w-4" />
                    <span className="font-medium">{oferta.empresa?.nombre}</span>
                  </div>
                </div>
                <Badge variant="success">Activa</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Ubicación</p>
                    <p className="text-sm font-medium">{oferta.ciudad || "Remoto"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Modalidad</p>
                    <p className="text-sm font-medium">{oferta.modalidad}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Salario</p>
                    <p className="text-sm font-medium">{oferta.salario_max ? `$${oferta.salario_min} - $${oferta.salario_max}` : "No especificado"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Fecha Cierre</p>
                    <p className="text-sm font-medium">{new Date(oferta.fecha_cierre!).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-bold">Descripción del Puesto</h3>
                <p className="text-muted-foreground whitespace-pre-wrap">{oferta.descripcion}</p>
              </div>

              {oferta.requisitos && (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold">Requisitos</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">{oferta.requisitos}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="w-full space-y-6 md:w-80">
          <Card>
            <CardContent className="p-6">
              <Button className="w-full" size="lg" onClick={() => alert("Postulación enviada correctamente")}>
                Postularse ahora
              </Button>
              <p className="mt-4 text-center text-xs text-muted-foreground">
                Al postularte, la empresa podrá ver tu perfil y hoja de vida.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Habilidades Requeridas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {oferta.oferta_habilidad?.map((h: any) => (
                  <Badge key={h.habilidad_id} variant={h.obligatoria ? "default" : "outline"}>
                    {h.habilidad.nombre}
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
