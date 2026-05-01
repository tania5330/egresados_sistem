"use client";

import { StatsCards } from "@/components/dashboard/empresa/StatsCards";
import { RendimientoOfertas } from "@/components/dashboard/empresa/RendimientoOfertas";
import { PostulacionesRecibidas } from "@/components/dashboard/empresa/PostulacionesRecibidas";
import { CandidatosDestacados } from "@/components/dashboard/empresa/CandidatosDestacados";

const mockEmpresaData = {
  stats: {
    ofertasPublicadas: 5,
    postulacionesRecibidas: 127,
    candidatosContratados: 8,
    ofertasTrend: 25,
    postulacionesTrend: 12,
    contratadosTrend: 15,
  },
  rendimiento: [
    {
      id: "1",
      titulo: "Desarrollador Frontend React",
      postulaciones: 45,
      vistas: 312,
      tasaConversion: 14,
      estado: "activa" as const,
      fechaPublicacion: "10/04/2026",
    },
    {
      id: "2",
      titulo: "Ingeniero de Software Full Stack",
      postulaciones: 38,
      vistas: 287,
      tasaConversion: 13,
      estado: "activa" as const,
      fechaPublicacion: "08/04/2026",
    },
    {
      id: "3",
      titulo: "Backend Developer",
      postulaciones: 22,
      vistas: 198,
      tasaConversion: 11,
      estado: "pausada" as const,
      fechaPublicacion: "01/04/2026",
    },
    {
      id: "4",
      titulo: "DevOps Engineer",
      postulaciones: 15,
      vistas: 156,
      tasaConversion: 10,
      estado: "cerrada" as const,
      fechaPublicacion: "20/03/2026",
    },
    {
      id: "5",
      titulo: "UX/UI Designer",
      postulaciones: 7,
      vistas: 89,
      tasaConversion: 8,
      estado: "activa" as const,
      fechaPublicacion: "15/04/2026",
    },
  ],
  candidatos: [
    {
      id: "1",
      nombre: "María García",
      correo: "maria.garcia@email.com",
      oferta: "Desarrollador Frontend React",
      fechaPostulacion: "18/04/2026",
      estado: "entrevista" as const,
      habilidades: ["React", "TypeScript", "Tailwind", "Figma", "Git"],
      experiencia: "3 años",
    },
    {
      id: "2",
      nombre: "Carlos López",
      correo: "carlos.lopez@email.com",
      oferta: "Desarrollador Frontend React",
      fechaPostulacion: "17/04/2026",
      estado: "revisando" as const,
      habilidades: ["React", "JavaScript", "CSS", "HTML"],
      experiencia: "2 años",
    },
    {
      id: "3",
      nombre: "Ana Martínez",
      correo: "ana.martinez@email.com",
      oferta: "Ingeniero de Software Full Stack",
      fechaPostulacion: "16/04/2026",
      estado: "nuevo" as const,
      habilidades: ["Python", "Django", "React", "PostgreSQL", "Docker"],
      experiencia: "4 años",
    },
    {
      id: "4",
      nombre: "Roberto Sánchez",
      correo: "roberto.sanchez@email.com",
      oferta: "Backend Developer",
      fechaPostulacion: "15/04/2026",
      estado: "rechazado" as const,
      habilidades: ["Node.js", "Express", "MongoDB"],
      experiencia: "1 año",
    },
    {
      id: "5",
      nombre: "Laura Hernández",
      correo: "laura.hernandez@email.com",
      oferta: "UX/UI Designer",
      fechaPostulacion: "14/04/2026",
      estado: "nuevo" as const,
      habilidades: ["Figma", "Sketch", "Adobe XD", "UI Design"],
      experiencia: "2 años",
    },
  ],
  candidatosDestacados: [
    {
      id: "1",
      nombre: "María García",
      correo: "maria.garcia@email.com",
      tituloProfesional: "Ingeniera de Software",
      habilidades: ["React", "TypeScript", "Tailwind", "Node.js", "AWS"],
      experiencia: "3 años",
      coincidencia: 95,
      ultimaActividad: "Hace 2 horas",
    },
    {
      id: "3",
      nombre: "Ana Martínez",
      correo: "ana.martinez@email.com",
      tituloProfesional: "Desarrolladora Full Stack",
      habilidades: ["Python", "Django", "React", "PostgreSQL", "Docker", "AWS"],
      experiencia: "4 años",
      coincidencia: 88,
      ultimaActividad: "Hace 1 día",
    },
    {
      id: "6",
      nombre: "Pedro Ramírez",
      correo: "pedro.ramirez@email.com",
      tituloProfesional: "Ingeniero DevOps",
      habilidades: ["AWS", "Docker", "Kubernetes", "Terraform", "CI/CD"],
      experiencia: "5 años",
      coincidencia: 82,
      ultimaActividad: "Hace 3 días",
    },
  ],
};

export default function EmpresaDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard de Empresa</h1>
        <p className="text-muted-foreground">Gestiona tus ofertas y candidatos</p>
      </div>

      <StatsCards data={mockEmpresaData.stats} isLoading={false} />

      <RendimientoOfertas
        data={mockEmpresaData.rendimiento}
        isLoading={false}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <PostulacionesRecibidas
          data={mockEmpresaData.candidatos}
          isLoading={false}
        />
        <CandidatosDestacados
          data={mockEmpresaData.candidatosDestacados}
          isLoading={false}
        />
      </div>
    </div>
  );
}