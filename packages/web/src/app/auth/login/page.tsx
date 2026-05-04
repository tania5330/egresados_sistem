"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: (data) => {
      // Guardar tokens en localStorage para simplicidad en local
      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken);
      localStorage.setItem("user", JSON.stringify(data.user));
      
      window.location.href = "/dashboard";
    },
    onError: (err) => {
      setError(err.message || "Error al iniciar sesión");
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    loginMutation.mutate({ email, password });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-6 rounded-lg border bg-card p-6 shadow-sm">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold">Iniciar Sesión</h1>
          <p className="text-sm text-muted-foreground">
            Ingresa tus credenciales para acceder al sistema
          </p>
        </div>
        
        {error && (
          <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Correo electrónico
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="correo@ejemplo.com"
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Iniciar Sesión
          </button>
        </form>
        <div className="text-center text-sm">
          ¿No tienes cuenta?{" "}
          <a href="/auth/register" className="text-primary hover:underline">
            Regístrate
          </a>
        </div>
      </div>
    </div>
  );
}
