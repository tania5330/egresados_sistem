export interface User {
  id: string;
  email: string;
  nombre: string;
  rol: "admin" | "egresado" | "empresa";
  createdAt: Date;
}

export interface Egresado {
  id: string;
  userId: string;
  nombre: string;
  email: string;
  telefono?: string;
  fechaGraduacion?: Date;
  titulo?: string;
  area?: string;
  experiencias?: Experiencia[];
  educacion?: Educacion[];
}

export interface Empresa {
  id: string;
  userId: string;
  nombre: string;
  rif: string;
  sector?: string;
  ubicacion?: string;
  descripcion?: string;
  ofertas?: Oferta[];
}

export interface Oferta {
  id: string;
  empresaId: string;
  titulo: string;
  descripcion: string;
  requisitos?: string[];
  salario?: number;
  ubicacion?: string;
  tipo: "tiempo-completo" | "medio-tiempo" | "contrato" | "remoto";
  estado: "activa" | "cerrada" | "borrador";
  createdAt: Date;
}

export interface Experiencia {
  id: string;
  egresadoId: string;
  empresa: string;
  cargo: string;
  fechaInicio: Date;
  fechaFin?: Date;
  actual?: boolean;
}

export interface Educacion {
  id: string;
  egresadoId: string;
  institucion: string;
  titulo: string;
  fechaGraduacion?: Date;
}

export interface Postulacion {
  id: string;
  ofertaId: string;
  egresadoId: string;
  estado: "pendiente" | "revisada" | "entrevista" | "aceptada" | "rechazada";
  fechaPostulacion: Date;
}

export type AppRouter = import("../../../server/src/trpc/trpc.router").TAppRouter;
