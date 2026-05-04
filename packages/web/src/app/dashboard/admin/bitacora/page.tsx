"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc/react";
import { History, User, Activity, Clock } from "lucide-react";

export default function BitacoraAdmin() {
  const { data: logs, isLoading } = trpc.dashboard.getAuditLogs.useQuery({ limit: 50 });

  if (isLoading) return <div>Cargando bitácora...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Bitácora de Auditoría</h1>
        <p className="text-muted-foreground">Registro histórico de acciones realizadas en el sistema</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Registro de Acciones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Usuario</TableHead>
                <TableHead>Acción</TableHead>
                <TableHead>Entidad</TableHead>
                <TableHead>Detalles</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs?.data && logs.data.length > 0 ? (
                logs.data.map((log: any) => (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap">
                      <div className="flex items-center gap-1 text-xs">
                        <Clock className="h-3 w-3" />
                        {new Date(log.created_at).toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{log.user?.email || "Sistema"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono">
                        {log.accion}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm capitalize">{log.entidad}</span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-xs text-muted-foreground">
                      {JSON.stringify(log.datos_nuevos || log.datos_anteriores)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                    No hay registros de auditoría aún.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
