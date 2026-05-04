"use client";

import { cn } from "@/lib/utils";

interface ReportType {
  id: string;
  name: string;
  description: string;
  icon?: React.ReactNode;
}

interface ReportTypeSelectorProps {
  reportTypes: ReportType[];
  selectedType: string | null;
  onSelect: (typeId: string) => void;
  isLoading?: boolean;
}

export function ReportTypeSelector({
  reportTypes,
  selectedType,
  onSelect,
  isLoading,
}: ReportTypeSelectorProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-lg border bg-card p-6 shadow-sm animate-pulse"
          >
            <div className="h-4 bg-muted rounded w-2/3 mb-2"></div>
            <div className="h-3 bg-muted rounded w-full"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Seleccionar Tipo de Reporte</h3>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {reportTypes?.map((type) => (
          <button
            key={type.id}
            onClick={() => onSelect(type.id)}
            className={cn(
              "rounded-lg border p-6 text-left transition-all hover:border-primary hover:shadow-md",
              selectedType === type.id
                ? "border-primary bg-primary/5 ring-2 ring-primary"
                : "bg-card"
            )}
          >
            {type.icon && (
              <div className="mb-3 text-primary">
                {type.icon}
              </div>
            )}
            <h4 className="font-medium mb-1">{type.name}</h4>
            <p className="text-sm text-muted-foreground">{type.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}