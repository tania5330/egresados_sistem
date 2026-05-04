"use client";

import { StatsCards } from "@/components/dashboard/empresa/StatsCards";
import { RendimientoOfertas } from "@/components/dashboard/empresa/RendimientoOfertas";
import { PostulacionesRecibidas } from "@/components/dashboard/empresa/PostulacionesRecibidas";
import { CandidatosDestacados } from "@/components/dashboard/empresa/CandidatosDestacados";
import { trpc } from "@/lib/trpc/react";

export default function EmpresaDashboard() {
  const { data: dashboard, isLoading } = trpc.dashboard.getEmpresaDashboard.useQuery({});

  const updateEstadoMutation = trpc.ofertas.actualizarEstado.useMutation({
    onSuccess: () => {
      alert("Estado actualizado correctamente");
    }
  });

  if (isLoading) {
    return <div>Cargando dashboard de empresa...</div>;
  }

  // Transformar datos para los componentes de la UI
  const stats = {
    ofertasPublicadas: dashboard?.ofertasPublicadas || 0,
    postulacionesRecibidas: dashboard?.postulacionesRecibidas || 0,
    candidatosContratados: dashboard?.candidatosContratados || 0,
    ofertasTrend: 0,
    postulacionesTrend: 0,
    contratadosTrend: 0,
  };

  const rendimiento = dashboard?.ofertasHistorico.map(o => ({
    id: o.id,
    titulo: o.titulo,
    postulaciones: Math.floor(Math.random() * 20), // Simulado por ahora
    vistas: Math.floor(Math.random() * 100),
    tasaConversion: 0,
    estado: "activa" as const,
    fechaPublicacion: new Date(o.fechaPublicacion).toLocaleDateString(),
  })) || [];

  const candidatos = dashboard?.postulacionesRecibidasList.map(p => ({
    id: p.id,
    nombre: p.egresadoEmail?.split("@")[0] || "Candidato", 
    correo: p.egresadoEmail || "",
    oferta: p.ofertaTitulo,
    fechaPostulacion: new Date(p.fechaPostulacion).toLocaleDateString(),
    estado: p.estado.toLowerCase() === "postulado" ? "nuevo" : 
            p.estado.toLowerCase() === "en_revision" ? "revisando" : 
            p.estado.toLowerCase() as any,
    habilidades: [],
    experiencia: "No especificada",
  })) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard de Empresa</h1>
          <p className="text-muted-foreground">Gestiona tus vacantes y candidatos</p>
        </div>
        <button 
          onClick={() => window.location.href = "/dashboard/mis-ofertas"}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90"
        >
          Gestionar Ofertas
        </button>
      </div>

      <StatsCards data={stats} isLoading={isLoading} />

      <div className="grid gap-6 lg:grid-cols-2">
        <RendimientoOfertas
          data={rendimiento}
          isLoading={isLoading}
          onVerDetalles={(id) => window.location.href = `/dashboard/ofertas/${id}`}
          onCrearOferta={() => window.location.href = "/dashboard/mis-ofertas"}
        />
        <PostulacionesRecibidas
          data={candidatos}
          isLoading={isLoading}
          onActualizarEstado={(id, estado) => {
            const dbEstado = estado === "nuevo" ? "POSTULADO" : 
                             estado === "revisando" ? "EN_REVISION" : 
                             estado.toUpperCase();
            updateEstadoMutation.mutate({ id, estado: dbEstado });
          }}
          onVerPerfil={(id) => {
            const postulación = dashboard?.postulacionesRecibidasList.find(p => p.id === id);
            if (postulación?.egresado_id) {
              window.location.href = `/dashboard/egresados/${postulación.egresado_id}`;
            }
          }}
        />
      </div>

      <CandidatosDestacados
        data={candidatos}
        isLoading={isLoading}
        onVerPerfil={(id) => alert(`Ver perfil del candidato ${id}`)}
        onContactar={(id) => alert(`Contactar al candidato ${id}`)}
      />
    </div>
  );
}