"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Select } from "@/components/ui/select";
import { MultiSelect } from "@/components/ui/multi-select";
import { DatePicker } from "@/components/ui/date-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TipoReporte } from "./ReportTypeSelector";

const filtrosListadoEgresadosSchema = z.object({
  carreraIds: z.array(z.string()).optional(),
  anioEgresoDesde: z.string().optional(),
  anioEgresoHasta: z.string().optional(),
  habilidadIds: z.array(z.string()).optional(),
  soloBuscandoEmpleo: z.boolean().optional(),
});

const filtrosListadoOfertasSchema = z.object({
  activa: z.string().optional(),
  ciudad: z.string().optional(),
  pais: z.string().optional(),
  modalidad: z.string().optional(),
  tipoContrato: z.string().optional(),
  salarioMin: z.string().optional(),
  salarioMax: z.string().optional(),
  fechaPublicacionDesde: z.string().optional(),
  fechaPublicacionHasta: z.string().optional(),
  habilidadIds: z.array(z.string()).optional(),
});

const filtrosPostulacionesPorOfertaSchema = z.object({
  ofertaId: z.string().min(1, "Seleccione una oferta"),
  estado: z.string().optional(),
});

const filtrosReporteEmpleabilidadSchema = z.object({
  carreraIds: z.array(z.string()).optional(),
  anioEgresoDesde: z.string().optional(),
  anioEgresoHasta: z.string().optional(),
});

const filtrosReporteDemandaLaboralSchema = z.object({
  topHabilidades: z.string().optional(),
  fechaDesde: z.string().optional(),
  fechaHasta: z.string().optional(),
});

const filtrosReporteComparativoCohorteSchema = z.object({
  anioDesde: z.string().min(1, "Año de inicio es requerido"),
  anioHasta: z.string().min(1, "Año de fin es requerido"),
  carreraIds: z.array(z.string()).optional(),
});

const MOCK_CARRERAS = [
  { value: "c1", label: "Ingeniería de Sistemas" },
  { value: "c2", label: "Ingeniería Industrial" },
  { value: "c3", label: "Administración de Empresas" },
  { value: "c4", label: "Contabilidad" },
  { value: "c5", label: "Marketing" },
];

const MOCK_HABILIDADES = [
  { value: "h1", label: "JavaScript" },
  { value: "h2", label: "Python" },
  { value: "h3", label: "SQL" },
  { value: "h4", label: "React" },
  { value: "h5", label: "Node.js" },
  { value: "h6", label: "Azure" },
  { value: "h7", label: "AWS" },
  { value: "h8", label: "Docker" },
];

const MOCK_OFERTAS = [
  { value: "o1", label: "Desarrollador Full Stack - TechCorp" },
  { value: "o2", label: "Analista de Datos - DataSoft" },
  { value: "o3", label: "Ingeniero DevOps - CloudServices" },
];

const MODALIDADES = [
  { value: "PRESENCIAL", label: "Presencial" },
  { value: "REMOTO", label: "Remoto" },
  { value: "HIBRIDO", label: "Híbrido" },
];

const TIPOS_CONTRATO = [
  { value: "TIEMPO_COMPLETO", label: "Tiempo Completo" },
  { value: "PARCIAL", label: "Parcial" },
  { value: "POR_HORA", label: "Por Hora" },
  { value: "PROYECTO", label: "Por Proyecto" },
];

const ESTADOS_POSTULACION = [
  { value: "", label: "Todos" },
  { value: "POSTULADO", label: "Postulado" },
  { value: "EN_REVISION", label: "En Revisión" },
  { value: "ENTREVISTA", label: "Entrevista" },
  { value: "CONTRATADO", label: "Contratado" },
  { value: "RECHAZADO", label: "Rechazado" },
];

type FilterFormData =
  | z.infer<typeof filtrosListadoEgresadosSchema>
  | z.infer<typeof filtrosListadoOfertasSchema>
  | z.infer<typeof filtrosPostulacionesPorOfertaSchema>
  | z.infer<typeof filtrosReporteEmpleabilidadSchema>
  | z.infer<typeof filtrosReporteDemandaLaboralSchema>
  | z.infer<typeof filtrosReporteComparativoCohorteSchema>;

interface ReportFiltersProps {
  tipoReporte: TipoReporte;
  onFiltersChange: (filters: Record<string, unknown>) => void;
  disabled?: boolean;
}

function getSchemaForType(tipo: TipoReporte) {
  switch (tipo) {
    case "LISTADO_EGRESADOS":
      return filtrosListadoEgresadosSchema;
    case "LISTADO_OFERTAS":
      return filtrosListadoOfertasSchema;
    case "POSTULACIONES_POR_OFERTA":
      return filtrosPostulacionesPorOfertaSchema;
    case "REPORTE_EMPLEABILIDAD":
      return filtrosReporteEmpleabilidadSchema;
    case "REPORTE_DEMANDA_LABORAL":
      return filtrosReporteDemandaLaboralSchema;
    case "REPORTE_COMPARATIVO_COHORTE":
      return filtrosReporteComparativoCohorteSchema;
    default:
      return z.object({});
  }
}

export function ReportFilters({ tipoReporte, onFiltersChange, disabled }: ReportFiltersProps) {
  const schema = getSchemaForType(tipoReporte);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FilterFormData>({
    resolver: zodResolver(schema),
    defaultValues: {},
  });

  const watchedValues = watch();

  React.useEffect(() => {
    const subscription = watch((value) => {
      onFiltersChange(value as Record<string, unknown>);
    });
    return () => subscription.unsubscribe();
  }, [watch, onFiltersChange]);

  const handleMultiSelectChange = (field: string, values: string[]) => {
    setValue(field as keyof FilterFormData, values as any);
  };

  const renderEgresadosFilters = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <MultiSelect
        label="Carreras"
        options={MOCK_CARRERAS}
        value={(watchedValues as any).carreraIds || []}
        onChange={(vals) => handleMultiSelectChange("carreraIds", vals)}
        placeholder="Seleccionar carreras..."
        disabled={disabled}
      />
      <MultiSelect
        label="Habilidades"
        options={MOCK_HABILIDADES}
        value={(watchedValues as any).habilidadIds || []}
        onChange={(vals) => handleMultiSelectChange("habilidadIds", vals)}
        placeholder="Seleccionar habilidades..."
        disabled={disabled}
      />
      <DatePicker
        label="Año de Egreso Desde"
        value={(watchedValues as any).anioEgresoDesde}
        onChange={(val) => setValue("anioEgresoDesde" as any, val)}
        disabled={disabled}
      />
      <DatePicker
        label="Año de Egreso Hasta"
        value={(watchedValues as any).anioEgresoHasta}
        onChange={(val) => setValue("anioEgresoHasta" as any, val)}
        disabled={disabled}
      />
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="soloBuscandoEmpleo"
          {...register("soloBuscandoEmpleo")}
          className="h-4 w-4"
        />
        <label htmlFor="soloBuscandoEmpleo" className="text-sm">Solo buscando empleo</label>
      </div>
    </div>
  );

  const renderOfertasFilters = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Input
        label="Ciudad"
        placeholder="Ej: Caracas"
        {...register("ciudad")}
        error={errors.ciudad?.message}
        disabled={disabled}
      />
      <Input
        label="País"
        placeholder="Ej: Venezuela"
        {...register("pais")}
        error={errors.pais?.message}
        disabled={disabled}
      />
      <Select
        label="Modalidad"
        options={MODALIDADES}
        value={(watchedValues as any).modalidad || ""}
        onChange={(e) => setValue("modalidad" as any, e.target.value)}
        placeholder="Todas"
        disabled={disabled}
      />
      <Select
        label="Tipo de Contrato"
        options={TIPOS_CONTRATO}
        value={(watchedValues as any).tipoContrato || ""}
        onChange={(e) => setValue("tipoContrato" as any, e.target.value)}
        placeholder="Todos"
        disabled={disabled}
      />
      <Input
        label="Salario Mínimo"
        type="number"
        placeholder="0"
        {...register("salarioMin")}
        error={errors.salarioMin?.message}
        disabled={disabled}
      />
      <Input
        label="Salario Máximo"
        type="number"
        placeholder="0"
        {...register("salarioMax")}
        error={errors.salarioMax?.message}
        disabled={disabled}
      />
      <DatePicker
        label="Fecha Publicación Desde"
        value={(watchedValues as any).fechaPublicacionDesde}
        onChange={(val) => setValue("fechaPublicacionDesde" as any, val)}
        disabled={disabled}
      />
      <DatePicker
        label="Fecha Publicación Hasta"
        value={(watchedValues as any).fechaPublicacionHasta}
        onChange={(val) => setValue("fechaPublicacionHasta" as any, val)}
        disabled={disabled}
      />
      <MultiSelect
        label="Habilidades Requeridas"
        options={MOCK_HABILIDADES}
        value={(watchedValues as any).habilidadIds || []}
        onChange={(vals) => handleMultiSelectChange("habilidadIds", vals)}
        placeholder="Seleccionar habilidades..."
        disabled={disabled}
      />
    </div>
  );

  const renderPostulacionesFilters = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Select
        label="Oferta"
        options={MOCK_OFERTAS}
        value={(watchedValues as any).ofertaId || ""}
        onChange={(e) => setValue("ofertaId" as any, e.target.value)}
        placeholder="Seleccione una oferta..."
        disabled={disabled}
        error={errors.ofertaId?.message as string}
      />
      <Select
        label="Estado de Postulación"
        options={ESTADOS_POSTULACION}
        value={(watchedValues as any).estado || ""}
        onChange={(e) => setValue("estado" as any, e.target.value)}
        placeholder="Todos"
        disabled={disabled}
      />
    </div>
  );

  const renderEmpleabilidadFilters = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <MultiSelect
        label="Carreras"
        options={MOCK_CARRERAS}
        value={(watchedValues as any).carreraIds || []}
        onChange={(vals) => handleMultiSelectChange("carreraIds", vals)}
        placeholder="Seleccionar carreras..."
        disabled={disabled}
      />
      <DatePicker
        label="Año de Egreso Desde"
        value={(watchedValues as any).anioEgresoDesde}
        onChange={(val) => setValue("anioEgresoDesde" as any, val)}
        disabled={disabled}
      />
      <DatePicker
        label="Año de Egreso Hasta"
        value={(watchedValues as any).anioEgresoHasta}
        onChange={(val) => setValue("anioEgresoHasta" as any, val)}
        disabled={disabled}
      />
    </div>
  );

  const renderDemandaLaboralFilters = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Input
        label="Top Habilidades"
        type="number"
        placeholder="20"
        {...register("topHabilidades")}
        error={errors.topHabilidades?.message}
        disabled={disabled}
      />
      <DatePicker
        label="Fecha Desde"
        value={(watchedValues as any).fechaDesde}
        onChange={(val) => setValue("fechaDesde" as any, val)}
        disabled={disabled}
      />
      <DatePicker
        label="Fecha Hasta"
        value={(watchedValues as any).fechaHasta}
        onChange={(val) => setValue("fechaHasta" as any, val)}
        disabled={disabled}
      />
    </div>
  );

  const renderComparativoCohorteFilters = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Input
        label="Año Desde"
        type="number"
        placeholder="2020"
        {...register("anioDesde")}
        error={errors.anioDesde?.message}
        disabled={disabled}
      />
      <Input
        label="Año Hasta"
        type="number"
        placeholder="2024"
        {...register("anioHasta")}
        error={errors.anioHasta?.message}
        disabled={disabled}
      />
      <MultiSelect
        label="Carreras"
        options={MOCK_CARRERAS}
        value={(watchedValues as any).carreraIds || []}
        onChange={(vals) => handleMultiSelectChange("carreraIds", vals)}
        placeholder="Seleccionar carreras (todas si está vacío)..."
        disabled={disabled}
      />
    </div>
  );

  const renderFiltersByType = () => {
    switch (tipoReporte) {
      case "LISTADO_EGRESADOS":
        return renderEgresadosFilters();
      case "LISTADO_OFERTAS":
        return renderOfertasFilters();
      case "POSTULACIONES_POR_OFERTA":
        return renderPostulacionesFilters();
      case "REPORTE_EMPLEABILIDAD":
        return renderEmpleabilidadFilters();
      case "REPORTE_DEMANDA_LABORAL":
        return renderDemandaLaboralFilters();
      case "REPORTE_COMPARATIVO_COHORTE":
        return renderComparativoCohorteFilters();
      default:
        return null;
    }
  };

  if (!tipoReporte) {
    return null;
  }

  return (
    <form onSubmit={handleSubmit(() => {})} className="space-y-4">
      {renderFiltersByType()}
    </form>
  );
}