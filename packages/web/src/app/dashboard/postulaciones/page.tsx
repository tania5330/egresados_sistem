"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc/react";
import { Calendar, Building2, User, ChevronRight, FileText } from "lucide-react";

const estadoConfig: any = {
  POSTULADO: { label: "Postulado", variant: "secondary" },
  EN_REVISION: { label: "En revisión", variant: "secondary" },
  ENTREVISTA: { label: "Entrevista", variant: "default" },
  CONTRATADO: { label: "Contratado", variant: "default" },
  RECHAZADO: { label: "Rechazado", variant: "destructive" },
};

export default function PostulacionesPage() {
  const [role, setRole] = useState<string>("");
  
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    setRole(user.role);
  }, []);

  // Para ADMIN o EGRESADO, usamos misPostulaciones (que ahora devuelve todas si es ADMIN)
  const { data: misPostulaciones, isLoading: loadingMis, refetch: refetchMis } = trpc.ofertas.misPostulaciones.useQuery({}, {
    enabled: role === "EGRESADO" || role === "ADMIN"
  });

  // Para EMPRESA, usamos postulacionesRecibidas
  const { data: recibidas, isLoading: loadingRecibidas, refetch: refetchRecibidas } = trpc.ofertas.postulacionesRecibidas.useQuery(undefined, {
    enabled: role === "EMPRESA"
  });

  const updateEstadoMutation = trpc.ofertas.actualizarEstadoPostulacion.useMutation({
    onSuccess: () => {
      refetchMis();
      refetchRecibidas();
    }
  });

  const isLoading = role === "EMPRESA" ? loadingRecibidas : loadingMis;
  const listado = role === "EMPRESA" ? recibidas : misPostulaciones;

  if (isLoading) return <div className="p-8 text-center">Cargando postulaciones...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          {role === "EGRESADO" ? "Mis Postulaciones" : "Gestión de Postulaciones"}
        </h1>
        <p className="text-muted-foreground">
          {role === "EGRESADO" 
            ? "Seguimiento de tus aplicaciones laborales" 
            : role === "ADMIN" 
              ? "Panel de administración global de postulaciones"
              : "Administra los candidatos de tus ofertas"}
        </p>
      </div>

      <div className="grid gap-4">
        {listado && listado.length > 0 ? (
          listado.map((p: any) => (
            <Card key={p.id} className="hover:border-primary transition-colors">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row justify-between gap-4">
                  <div className="flex gap-4">
                    <div className="rounded-full bg-primary/10 p-2 text-primary h-fit">
                      {role === "EGRESADO" ? <Building2 className="h-5 w-5" /> : <User className="h-5 w-5" />}
                    </div>
                    <div>
                      <h4 className="font-bold text-lg">{p.ofertaTitulo}</h4>
                      <p className="text-sm text-muted-foreground">
                        {role === "EGRESADO" ? p.empresaNombre : (
                          <span className="flex flex-col">
                            <span>Empresa: {p.empresaNombre}</span>
                            <span>Candidato: {p.egresadoEmail}</span>
                          </span>
                        )}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(p.fechaPostulacion).toLocaleDateString()}
                        </div>
                        <Badge variant={estadoConfig[p.estado]?.variant || "outline"}>
                          {estadoConfig[p.estado]?.label || p.estado}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  {(role === "EMPRESA" || role === "ADMIN") && (
                    <div className="flex items-center gap-2">
                      <select 
                        className="text-sm border rounded-md px-2 py-1 bg-background"
                        value={p.estado}
                        onChange={(e) => {
                          updateEstadoMutation.mutate({
                            postulacionId: p.id,
                            estado: e.target.value
                          });
                        }}
                      >
                        <option value="POSTULADO">Postulado</option>
                        <option value="EN_REVISION">En Revisión</option>
                        <option value="ENTREVISTA">Entrevista</option>
                        <option value="CONTRATADO">Contratado</option>
                        <option value="RECHAZADO">Rechazado</option>
                      </select>
                      <Button variant="ghost" size="sm" onClick={() => alert(`Ver CV de ${p.egresadoEmail}`)}>
                        Ver Perfil
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed rounded-lg">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No hay postulaciones registradas.</p>
          </div>
        )}
      </div>
    </div>
  );
}
