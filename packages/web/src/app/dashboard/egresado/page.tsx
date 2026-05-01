"use client";

import { StatsCards } from "@/components/dashboard/egresado/StatsCards";
import { OfertasRecomendadas } from "@/components/dashboard/egresado/OfertasRecomendadas";
import { MisPostulaciones } from "@/components/dashboard/egresado/MisPostulaciones";
import { ProgressTimeline } from "@/components/dashboard/egresado/ProgressTimeline";

const mockEgresadoData = {
  stats: {
    misPostulaciones: 12,
    ofertasVistas: 48,
    tasaRespuesta: 35,
    postulacionesTrend: 15,
    vistasTrend: 8,
    respuestaTrend: -5,
  },
  ofertasRecomendadas: [
    {
      id: "1",
      titulo: "Desarrollador Frontend React",
      empresa: "TechCorp",
      ubicacion: "Remoto",
      salario: "$1,500 - $2,000 USD",
      fechaPublicacion: "2 días",
      habilidades: ["React", "TypeScript", "Tailwind", "Node.js", "Git"],
      coincidencia: 92,
    },
    {
      id: "2",
      titulo: "Ingeniero de Software Full Stack",
      empresa: "DataSystems",
      ubicacion: "Ciudad de México",
      salario: "$25,000 - $35,000 MXN",
      fechaPublicacion: "1 semana",
      habilidades: ["Python", "Django", "React", "PostgreSQL"],
      coincidencia: 78,
    },
    {
      id: "3",
      titulo: "Backend Developer",
      empresa: "CloudTech",
      ubicacion: "Remoto",
      salario: "$2,000 - $2,500 USD",
      fechaPublicacion: "3 días",
      habilidades: ["Node.js", "AWS", "Docker", "MongoDB"],
      coincidencia: 65,
    },
  ],
  postulaciones: [
    {
      id: "1",
      ofertaTitulo: "Desarrollador Frontend React",
      empresa: "TechCorp",
      fechaPostulacion: "15/04/2026",
      estado: "revisando" as const,
      fechaActualizacion: "20/04/2026",
    },
    {
      id: "2",
      ofertaTitulo: "Ingeniero de Software Full Stack",
      empresa: "DataSystems",
      fechaPostulacion: "10/04/2026",
      estado: "entrevista" as const,
      fechaActualizacion: "22/04/2026",
    },
    {
      id: "3",
      ofertaTitulo: "Backend Developer",
      empresa: "CloudTech",
      fechaPostulacion: "05/04/2026",
      estado: "pendiente" as const,
      fechaActualizacion: "05/04/2026",
    },
    {
      id: "4",
      ofertaTitulo: "DevOps Engineer",
      empresa: "SecureNet",
      fechaPostulacion: "01/04/2026",
      estado: "rechazado" as const,
      fechaActualizacion: "18/04/2026",
    },
  ],
  timeline: [
    {
      id: "2",
      ofertaTitulo: "Ingeniero de Software Full Stack",
      empresa: "DataSystems",
      estado: "entrevista" as const,
      historial: [
        { estado: "Enviado", fecha: "10/04/2026", descripcion: "Postulación enviada correctamente" },
        { estado: "Revisando", fecha: "12/04/2026", descripcion: "La empresa revisó tu perfil" },
        { estado: "Entrevista", fecha: "20/04/2026", descripcion: "entrevista programada para el 25/04" },
      ],
    },
  ],
};

export default function EgresadoDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mi Dashboard</h1>
        <p className="text-muted-foreground">Bienvenido de vuelta, aquí está tu resumen de actividad</p>
      </div>

      <StatsCards data={mockEgresadoData.stats} isLoading={false} />

      <div className="grid gap-6 lg:grid-cols-2">
        <OfertasRecomendadas
          data={mockEgresadoData.ofertasRecomendadas}
          isLoading={false}
        />
        <ProgressTimeline
          data={mockEgresadoData.timeline}
          isLoading={false}
          selectedId="2"
        />
      </div>

      <MisPostulaciones data={mockEgresadoData.postulaciones} isLoading={false} />
    </div>
  );
}