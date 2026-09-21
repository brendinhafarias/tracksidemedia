"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { criarDespesaRecorrente, atualizarDespesaRecorrente, type EstadoFormulario } from "./acoes";

type Categoria = { id: string; nome: string };
type DespesaExistente = {
  id: string;
  descricao: string;
  valor: number;
  categoriaId: string;
  diaVencimento: number;
};

export function FormularioDespesa({
  despesa,
  categorias,
  trigger,
}: {
  despesa?: DespesaExistente;
  categorias: Categoria[];
  trigger?: React.ReactNode;
}) {
  const [aberto, setAberto] = useState(false);
  const acao = despesa ? atualizarDespesaRecorrente.bind(null, despesa.id) : criarDespesaRecorrente;
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
            Nova despesa recorrente
          </Button>
        )}
      </span>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{despesa ? "Editar despesa recorrente" : "Nova despesa recorrente"}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Input id="descricao" name="descricao" defaultValue={despesa?.descricao} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="valorTexto">Valor (R$)</Label>
              <Input
                id="valorTexto"
                name="valorTexto"
                placeholder="0,00"
                defaultValue={despesa ? (despesa.valor / 100).toFixed(2).replace(".", ",") : ""}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="diaVencimentoTexto">Dia de vencimento</Label>
              <Input
                id="diaVencimentoTexto"
                name="diaVencimentoTexto"
                type="number"
                min={1}
                max={28}
                defaultValue={despesa?.diaVencimento}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="categoriaId">Categoria</Label>
            <Select
              items={Object.fromEntries(categorias.map((c) => [c.id, c.nome]))}
              name="categoriaId"
              defaultValue={despesa?.categoriaId}
            >
              <SelectTrigger id="categoriaId" className="w-full">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {categorias.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
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
