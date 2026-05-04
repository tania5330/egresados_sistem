"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell } from "lucide-react";

export default function NotificacionesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Notificaciones</h1>
        <p className="text-muted-foreground">Mantente al tanto de las novedades y cambios de estado</p>
      </div>

      <div className="flex flex-col gap-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-full bg-primary/10 p-2 text-primary">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium">Bienvenido al sistema</p>
              <p className="text-sm text-muted-foreground">Has iniciado sesión correctamente.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
