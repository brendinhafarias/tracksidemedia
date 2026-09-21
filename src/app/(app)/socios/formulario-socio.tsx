"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { criarSocio, atualizarSocio, type EstadoFormulario } from "./acoes";

type SocioExistente = {
  id: string;
  nome: string;
  percentualLucro: number;
  proLaboreMensal: number | null;
};

export function FormularioSocio({
  socio,
  trigger,
}: {
  socio?: SocioExistente;
  trigger?: React.ReactNode;
}) {
  const [aberto, setAberto] = useState(false);
  const acao = socio ? atualizarSocio.bind(null, socio.id) : criarSocio;
  const [estado, formAction, pendente] = useActionState<EstadoFormulario, FormData>(acao, null);

  const [estadoProcessado, setEstadoProcessado] = useState(estado);
  if (estado !== estadoProcessado) {
    setEstadoProcessado(estado);
    if (estado?.sucesso) setAberto(false);
  }

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <span className="contents" onClick={() => setAberto(true)}>
        {trigger ?? (
          <Button size="sm">
            <Plus className="size-4" />
            Novo sócio
          </Button>
        )}
      </span>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{socio ? "Editar sócio" : "Novo sócio"}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome</Label>
            <Input id="nome" name="nome" defaultValue={socio?.nome} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="percentualLucroTexto">Percentual de lucro (%)</Label>
            <Input
              id="percentualLucroTexto"
              name="percentualLucroTexto"
              placeholder="Ex.: 60"
              defaultValue={socio ? String(socio.percentualLucro) : undefined}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="proLaboreMensalTexto">
              Pró-labore mensal (R$) <span className="text-muted-foreground">(opcional)</span>
            </Label>
            <Input
              id="proLaboreMensalTexto"
              name="proLaboreMensalTexto"
              placeholder="0,00"
              defaultValue={
                socio?.proLaboreMensal != null
                  ? (socio.proLaboreMensal / 100).toFixed(2).replace(".", ",")
                  : ""
              }
            />
          </div>
          {estado?.erro && <p className="text-sm text-destructive">{estado.erro}</p>}
          <Button type="submit" className="w-full" disabled={pendente}>
            {pendente ? "Salvando..." : "Salvar"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
