"use client";

import { useMemo, useState } from "react";
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
import { Card, CardContent } from "@/components/ui/card";
import { nomeMes } from "@/lib/data";
import type { CamposConfirmacao } from "./tipos";

type Categoria = { id: string; nome: string; tipo: "ENTRADA" | "SAIDA" };
type Cliente = { id: string; nome: string };
type Socio = { id: string; nome: string };

export function CartaoConfirmacao({
  campos,
  categorias,
  clientes,
  socios,
  aoConfirmar,
  pendente,
  erro,
}: {
  campos: CamposConfirmacao;
  categorias: Categoria[];
  clientes: Cliente[];
  socios: Socio[];
  aoConfirmar: (campos: CamposConfirmacao) => void;
  pendente: boolean;
  erro?: string;
}) {
  const [valores, setValores] = useState(campos);
  const hoje = new Date();
  const anos = [hoje.getFullYear() - 1, hoje.getFullYear(), hoje.getFullYear() + 1];

  const categoriasDoTipo = useMemo(
    () => categorias.filter((c) => c.tipo === valores.tipo),
    [categorias, valores.tipo]
  );
  const itensCategoria = useMemo(
    () => Object.fromEntries(categoriasDoTipo.map((c) => [c.id, c.nome])),
    [categoriasDoTipo]
  );
  const itensCliente = useMemo(() => {
    const base: Record<string, string> = { __nenhum: "Nenhum" };
    for (const c of clientes) base[c.id] = c.nome;
    return base;
  }, [clientes]);
  const itensSocio = useMemo(
    () => Object.fromEntries(socios.map((s) => [s.id, s.nome])),
    [socios]
  );
  const itensMeses = useMemo(
    () => Object.fromEntries(Array.from({ length: 12 }, (_, i) => i + 1).map((m) => [String(m), nomeMes(m)])),
    []
  );
  const itensAnos = useMemo(
    () => Object.fromEntries(anos.map((a) => [String(a), String(a)])),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  function set<K extends keyof CamposConfirmacao>(campo: K, valor: CamposConfirmacao[K]) {
    setValores((v) => ({ ...v, [campo]: valor }));
  }

  return (
    <Card className="border-primary/30">
      <CardContent className="pt-4 space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            size="sm"
            variant={valores.tipo === "ENTRADA" ? "default" : "outline"}
            onClick={() => set("tipo", "ENTRADA")}
          >
            Entrada
          </Button>
          <Button
            type="button"
            size="sm"
            variant={valores.tipo === "SAIDA" ? "default" : "outline"}
            onClick={() => set("tipo", "SAIDA")}
          >
            Saída
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Valor (R$)</Label>
            <Input
              inputMode="decimal"
              value={
                valores.valorCentavos > 0
                  ? (valores.valorCentavos / 100).toFixed(2).replace(".", ",")
                  : ""
              }
              placeholder="0,00"
              onChange={(e) => {
                const texto = e.target.value;
                const numero = Number(texto.replace(/\./g, "").replace(",", "."));
                set("valorCentavos", Number.isFinite(numero) ? Math.round(numero * 100) : 0);
              }}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Data de caixa</Label>
            <Input
              type="date"
              value={valores.dataCaixa}
              onChange={(e) => set("dataCaixa", e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Descrição</Label>
          <Input value={valores.descricao} onChange={(e) => set("descricao", e.target.value)} />
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Categoria</Label>
          <Select
            items={itensCategoria}
            value={valores.categoriaId || undefined}
            onValueChange={(v) => {
              const cat = categorias.find((c) => c.id === v);
              set("categoriaId", v ?? "");
              if (cat) set("categoriaNome", cat.nome);
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {categoriasDoTipo.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {valores.acaoOrigem === "PAGAMENTO" && (
          <div className="space-y-1">
            <Label className="text-xs">Cliente</Label>
            <Select
              items={itensCliente}
              value={valores.clienteId ?? "__nenhum"}
              onValueChange={(v) => {
                const cli = clientes.find((c) => c.id === v);
                set("clienteId", v && v !== "__nenhum" ? v : null);
                set("clienteNome", cli?.nome ?? null);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Nenhum" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__nenhum">Nenhum</SelectItem>
                {clientes.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {valores.acaoOrigem === "RETIRADA_SOCIO" && (
          <div className="space-y-1">
            <Label className="text-xs">Sócio</Label>
            <Select
              items={itensSocio}
              value={valores.socioId ?? undefined}
              onValueChange={(v) => {
                const s = socios.find((x) => x.id === v);
                set("socioId", v ?? null);
                set("socioNome", s?.nome ?? null);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione o sócio" />
              </SelectTrigger>
              <SelectContent>
                {socios.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-1">
          <Label className="text-xs">Competência (mês a que se refere)</Label>
          <div className="grid grid-cols-2 gap-3">
            <Select
              items={itensMeses}
              value={String(valores.competenciaMes)}
              onValueChange={(v) => v && set("competenciaMes", Number(v))}
            >
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <SelectItem key={m} value={String(m)}>{nomeMes(m)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              items={itensAnos}
              value={String(valores.competenciaAno)}
              onValueChange={(v) => v && set("competenciaAno", Number(v))}
            >
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {anos.map((a) => (
                  <SelectItem key={a} value={String(a)}>{a}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {valores.cobrancaInfo && (
          <p className="text-xs text-muted-foreground bg-muted rounded-md p-2">{valores.cobrancaInfo}</p>
        )}

        {erro && <p className="text-sm text-destructive">{erro}</p>}

        <Button
          className="w-full"
          disabled={pendente || valores.valorCentavos <= 0 || !valores.categoriaId}
          onClick={() => aoConfirmar(valores)}
        >
          {pendente ? "Salvando..." : "Confirmar"}
        </Button>
      </CardContent>
    </Card>
  );
}
