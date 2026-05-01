"use client";

import { useState, useCallback } from "react";
import { Calendar, Filter, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface FiltersProps {
  onFiltersChange: (filters: DashboardFilters) => void;
  carreras?: { id: string; nombre: string }[];
  isLoading?: boolean;
}

export interface DashboardFilters {
  fechaInicio?: string;
  fechaFin?: string;
  carreraId?: string;
}

export function Filters({ onFiltersChange, carreras = [], isLoading }: FiltersProps) {
  const [filters, setFilters] = useState<DashboardFilters>({
    fechaInicio: "",
    fechaFin: "",
    carreraId: "",
  });

  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());

  const handleFilterChange = useCallback(
    (key: keyof DashboardFilters, value: string) => {
      const newFilters = { ...filters, [key]: value };
      setFilters(newFilters);

      const newActiveFilters = new Set(activeFilters);
      if (value) {
        newActiveFilters.add(key);
      } else {
        newActiveFilters.delete(key);
      }
      setActiveFilters(newActiveFilters);

      onFiltersChange(newFilters);
    },
    [filters, activeFilters, onFiltersChange]
  );

  const clearFilters = useCallback(() => {
    setFilters({ fechaInicio: "", fechaFin: "", carreraId: "" });
    setActiveFilters(new Set());
    onFiltersChange({});
  }, [onFiltersChange]);

  const removeFilter = useCallback(
    (key: string) => {
      handleFilterChange(key as keyof DashboardFilters, "");
    },
    [handleFilterChange]
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
          {activeFilters.size > 0 && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 px-2">
              <X className="mr-1 h-4 w-4" />
              Limpiar
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-muted-foreground">Fecha Desde</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="date"
                value={filters.fechaInicio}
                onChange={(e) => handleFilterChange("fechaInicio", e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-muted-foreground">Fecha Hasta</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="date"
                value={filters.fechaFin}
                onChange={(e) => handleFilterChange("fechaFin", e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-muted-foreground">Carrera</label>
            <Select
              value={filters.carreraId}
              onChange={(e) => handleFilterChange("carreraId", e.target.value)}
              className="w-[200px]"
            >
              <option value="">Todas las carreras</option>
              {carreras.map((carrera) => (
                <option key={carrera.id} value={carrera.id}>
                  {carrera.nombre}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {activeFilters.size > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {Array.from(activeFilters).map((key) => {
              const label = {
                fechaInicio: `Desde: ${filters.fechaInicio}`,
                fechaFin: `Hasta: ${filters.fechaFin}`,
                carreraId: `Carrera: ${carreras.find((c) => c.id === filters.carreraId)?.nombre ?? filters.carreraId}`,
              }[key];
              return (
                <Badge key={key} variant="secondary" className="gap-1">
                  {label}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => removeFilter(key)} />
                </Badge>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
