"use client";

import { Bell, User } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  title: string;
  userName?: string;
}

export function Header({ title, userName = "Usuario" }: HeaderProps) {
  return (
    <header className="flex h-14 items-center justify-between border-b bg-card px-4">
      <h1 className="text-lg font-semibold">{title}</h1>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-destructive" />
        </Button>
        <div className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm">
          <User className="h-4 w-4" />
          <span className="font-medium">{userName}</span>
        </div>
      </div>
    </header>
  );
}
