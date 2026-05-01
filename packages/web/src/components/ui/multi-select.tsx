"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

export interface MultiSelectOption {
  value: string;
  label: string;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
}

const MultiSelect = React.forwardRef<HTMLDivElement, MultiSelectProps>(
  ({ options, value = [], onChange, placeholder = "Seleccionar...", label, error, disabled }, ref) => {
    const [isOpen, setIsOpen] = React.useState(false);

    const selectedOptions = options.filter((opt) => value.includes(opt.value));

    const handleSelect = (optionValue: string) => {
      if (value.includes(optionValue)) {
        onChange(value.filter((v) => v !== optionValue));
      } else {
        onChange([...value, optionValue]);
      }
    };

    const handleRemove = (optionValue: string, e: React.MouseEvent) => {
      e.stopPropagation();
      onChange(value.filter((v) => v !== optionValue));
    };

    return (
      <div className="space-y-1" ref={ref}>
        {label && (
          <label className="text-sm font-medium leading-none">{label}</label>
        )}
        <div className="relative">
          <button
            type="button"
            type="button"
            onClick={() => !disabled && setIsOpen(!isOpen)}
            className={cn(
              "flex h-10 w-full items-center justify-start rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
              error && "border-destructive",
              isOpen && "ring-2 ring-ring ring-offset-2"
            )}
            disabled={disabled}
          >
            {selectedOptions.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {selectedOptions.map((opt) => (
                  <span
                    key={opt.value}
                    className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-xs"
                  >
                    {opt.label}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={(e) => handleRemove(opt.value, e)}
                    />
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </button>
          {isOpen && (
            <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-md max-h-60 overflow-auto">
              {options.map((option) => (
                <div
                  key={option.value}
                  onClick={() => handleSelect(option.value)}
                  className={cn(
                    "px-3 py-2 cursor-pointer hover:bg-accent",
                    value.includes(option.value) && "bg-accent"
                  )}
                >
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={value.includes(option.value)}
                      onChange={() => {}}
                      className="mr-2"
                    />
                    {option.label}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    );
  }
);
MultiSelect.displayName = "MultiSelect";

export { MultiSelect };