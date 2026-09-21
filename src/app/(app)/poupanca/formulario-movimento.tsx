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
import { PiggyBank } from "lucide-react";
import { paraInputData } from "@/lib/validacao/lancamento";
import { agora } from "@/lib/data";
import { registrarMovimentoPoupanca, type EstadoMovimentoPoupanca } from "./acoes";

export function FormularioMovimentoPoupanca({ tipoInicial }: { tipoInicial?: "DEPOSITO" | "RETIRADA" }) {
  const [aberto, setAberto] = useState(false);
  const [estado, formAction, pendente] = useActionState<EstadoMovimentoPoupanca, FormData>(
    registrarMovimentoPoupanca,
    null
  );
  const [tipo, setTipo] = useState<"DEPOSITO" | "RETIRADA">(tipoInicial ?? "DEPOSITO");

  const [estadoProcessado, setEstadoProcessado] = useState(estado);
  if (estado !== estadoProcessado) {
    setEstadoProcessado(estado);
    if (estado?.sucesso) setAberto(false);
  }

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <span className="contents" onClick={() => setAberto(true)}>
        <Button size="sm">
          <PiggyBank className="size-4" />
          Registrar movimento
        </Button>
      </span>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Movimento na poupança</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="tipoMovimento" value={tipo} />

          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant={tipo === "DEPOSITO" ? "default" : "outline"}
              onClick={() => setTipo("DEPOSITO")}
            >
              Depósito
            </Button>
            <Button
              type="button"
              variant={tipo === "RETIRADA" ? "default" : "outline"}
              onClick={() => setTipo("RETIRADA")}
            >
              Retirada
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="valorTexto">Valor (R$)</Label>
            <Input id="valorTexto" name="valorTexto" placeholder="0,00" required autoFocus />
          </div>

          <div className="space-y-2">
            <Label htmlFor="data">Data</Label>
            <Input id="data" name="data" type="date" defaultValue={paraInputData(agora())} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">
              Descrição <span className="text-muted-foreground">(opcional)</span>
            </Label>
            <Input
              id="descricao"
              name="descricao"
              placeholder={tipo === "DEPOSITO" ? "Ex.: reserva para meses sem corrida" : "Ex.: cobrir despesas de setembro"}
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
