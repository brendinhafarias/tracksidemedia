"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { entrar, type EstadoLogin } from "@/lib/auth/acoes";

export function FormularioLogin() {
  const [estado, formAction, pendente] = useActionState<EstadoLogin, FormData>(
    entrar,
    null
  );

  return (
    <Card className="border-none">
      <CardContent className="pt-2 pb-2">
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="voce@empresa.com.br"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="senha">Senha</Label>
            <Input
              id="senha"
              name="senha"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>
          {estado?.erro && (
            <p className="text-sm text-destructive">{estado.erro}</p>
          )}
          <Button type="submit" className="w-full" disabled={pendente}>
            {pendente ? "Entrando..." : "Entrar"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
