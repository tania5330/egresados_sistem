"use client";

import { StatsCards } from "@/components/dashboard/egresado/StatsCards";
import { OfertasRecomendadas } from "@/components/dashboard/egresado/OfertasRecomendadas";
import { MisPostulaciones } from "@/components/dashboard/egresado/MisPostulaciones";
import { ProgressTimeline } from "@/components/dashboard/egresado/ProgressTimeline";
import { trpc } from "@/lib/trpc/react";
import { useState } from "react";

export default function EgresadoDashboard() {
  const { data: dashboard, isLoading } = trpc.dashboard.getEgresadoDashboard.useQuery({});
  const [selectedPostulacionId, setSelectedPostulacionId] = useState<string | null>(null);

  if (isLoading) {
    return <div>Cargando dashboard...</div>;
  }

  // Transformar datos del backend al formato del componente
  const stats = {
    misPostulaciones: dashboard?.postulacionesTotales || 0,
    ofertasVistas: dashboard?.ofertasVistas || 0,
    tasaRespuesta: dashboard?.tasaRespuesta || 0,
    postulacionesTrend: 0,
    vistasTrend: 0,
    respuestaTrend: 0,
  };

  const ofertasRecomendadas = dashboard?.ofertasRecomendadas.map(o => ({
    id: o.id,
    titulo: o.titulo,
    empresa: "Empresa", // El backend debería proveer esto
    ubicacion: o.ciudad || "Remoto",
    salario: o.salarioMax ? `$${o.salarioMin} - $${o.salarioMax}` : "No especificado",
    fechaPublicacion: new Date(o.fechaPublicacion).toLocaleDateString(),
    habilidades: [],
    coincidencia: 0,
  })) || [];

  const postulaciones = dashboard?.postulacionesRecientes.map(p => ({
    id: p.id,
    ofertaId: p.ofertaId,
    ofertaTitulo: p.ofertaTitulo,
    empresa: p.empresaNombre || "Empresa",
    fechaPostulacion: new Date(p.fechaPostulacion).toLocaleDateString(),
    estado: p.estado.toLowerCase() as any,
    fechaActualizacion: new Date(p.fechaPostulacion).toLocaleDateString(),
  })) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mi Dashboard</h1>
        <p className="text-muted-foreground">Bienvenido de vuelta, aquí está tu resumen de actividad</p>
      </div>

      <StatsCards data={stats} isLoading={isLoading} />

      <div className="grid gap-6 lg:grid-cols-2">
        <OfertasRecomendadas
          data={ofertasRecomendadas}
          isLoading={isLoading}
          onVerDetalles={(id) => window.location.href = `/dashboard/ofertas/${id}`}
          onPostularse={(id) => alert(`Postulándose a la oferta ${id}`)}
        />
        <ProgressTimeline
          data={[]} // El backend podría proveer el historial detallado si es necesario
          isLoading={isLoading}
          selectedId={selectedPostulacionId || undefined}
        />
      </div>

      <MisPostulaciones 
        data={postulaciones} 
        isLoading={isLoading}
        onVerOferta={(id) => {
          const post = postulaciones.find(p => p.id === id);
          if (post) window.location.href = `/dashboard/ofertas/${post.ofertaId}`;
        }}
        onVerEmpresa={(id) => {
          alert("Ver perfil de la empresa (Próximamente)");
        }}
      />
    </div>
  );
}