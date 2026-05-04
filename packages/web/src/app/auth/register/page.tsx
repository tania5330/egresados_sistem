"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/react";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    nombres: "",
    apellidos: "",
  });
  const [error, setError] = useState("");

  const registerMutation = trpc.auth.registerEgresado.useMutation({
    onSuccess: () => {
      router.push("/auth/login");
    },
    onError: (err) => {
      setError(err.message || "Error al registrarse");
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (formData.password !== formData.confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }
    registerMutation.mutate({
      email: formData.email,
      password: formData.password,
      nombres: formData.nombres,
      apellidos: formData.apellidos,
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-6 rounded-lg border bg-card p-6 shadow-sm">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold">Crear Cuenta</h1>
          <p className="text-sm text-muted-foreground">
            Regístrate en el sistema de egresados
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="nombres" className="text-sm font-medium">
                Nombres
              </label>
              <input
                id="nombres"
                type="text"
                value={formData.nombres}
                onChange={(e) => setFormData({ ...formData, nombres: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="apellidos" className="text-sm font-medium">
                Apellidos
              </label>
              <input
                id="apellidos"
                type="text"
                value={formData.apellidos}
                onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Correo electrónico
            </label>
            <input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              required
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              required
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="text-sm font-medium">
              Confirmar contraseña
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Crear Cuenta
          </button>
        </form>
        <div className="text-center text-sm">
          ¿Ya tienes cuenta?{" "}
          <a href="/auth/login" className="text-primary hover:underline">
            Inicia sesión
          </a>
        </div>
      </div>
    </div>
  );
}
