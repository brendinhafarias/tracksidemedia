"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useMemo, useTransition } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { RUS_FORMA_PAGAMENTO, RUS_STATUS_LANCAMENTO, FORMAS_PAGAMENTO, STATUS_LANCAMENTO } from "@/lib/validacao/lancamento";

type Categoria = { id: string; nome: string };
type Cliente = { id: string; nome: string };

export function FiltrosLancamentos({
  categorias,
  clientes,
  meses,
}: {
  categorias: Categoria[];
  clientes: Cliente[];
  meses: { valor: string; rotulo: string }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, iniciarTransicao] = useTransition();

  function atualizar(chave: string, valor: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (!valor || valor === "__todos") {
      params.delete(chave);
    } else {
      params.set(chave, valor);
    }
    iniciarTransicao(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  const temFiltros = searchParams.toString().length > 0;

  const itensMeses = useMemo(() => {
    const base: Record<string, string> = { __todos: "Todo o período" };
    for (const m of meses) base[m.valor] = m.rotulo;
    return base;
  }, [meses]);

  const itensTipo = { __todos: "Tipo: todos", ENTRADA: "Entrada", SAIDA: "Saída" };

  const itensCategorias = useMemo(() => {
    const base: Record<string, string> = { __todos: "Categoria: todas" };
    for (const c of categorias) base[c.id] = c.nome;
    return base;
  }, [categorias]);

  const itensClientes = useMemo(() => {
    const base: Record<string, string> = { __todos: "Cliente: todos" };
    for (const c of clientes) base[c.id] = c.nome;
    return base;
  }, [clientes]);

  const itensStatus = useMemo(() => {
    const base: Record<string, string> = { __todos: "Status: todos" };
    for (const s of STATUS_LANCAMENTO) base[s] = RUS_STATUS_LANCAMENTO[s];
    return base;
  }, []);

  const itensForma = useMemo(() => {
    const base: Record<string, string> = { __todos: "Forma: todas" };
    for (const f of FORMAS_PAGAMENTO) base[f] = RUS_FORMA_PAGAMENTO[f];
    return base;
  }, []);

  return (
    <div className="space-y-2">
      <Input
        placeholder="Buscar na descrição..."
        defaultValue={searchParams.get("busca") ?? ""}
        onChange={(e) => atualizar("busca", e.target.value)}
      />
      <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <Select
          items={itensMeses}
          value={searchParams.get("mes") ?? "__todos"}
          onValueChange={(v) => atualizar("mes", v)}
        >
          <SelectTrigger className="w-36 shrink-0"><SelectValue placeholder="Período" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__todos">Todo o período</SelectItem>
            {meses.map((m) => (
              <SelectItem key={m.valor} value={m.valor}>{m.rotulo}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          items={itensTipo}
          value={searchParams.get("tipo") ?? "__todos"}
          onValueChange={(v) => atualizar("tipo", v)}
        >
          <SelectTrigger className="w-32 shrink-0"><SelectValue placeholder="Tipo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__todos">Tipo: todos</SelectItem>
            <SelectItem value="ENTRADA">Entrada</SelectItem>
            <SelectItem value="SAIDA">Saída</SelectItem>
          </SelectContent>
        </Select>

        <Select
          items={itensCategorias}
          value={searchParams.get("categoriaId") ?? "__todos"}
          onValueChange={(v) => atualizar("categoriaId", v)}
        >
          <SelectTrigger className="w-40 shrink-0"><SelectValue placeholder="Categoria" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__todos">Categoria: todas</SelectItem>
            {categorias.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          items={itensClientes}
          value={searchParams.get("clienteId") ?? "__todos"}
          onValueChange={(v) => atualizar("clienteId", v)}
        >
          <SelectTrigger className="w-40 shrink-0"><SelectValue placeholder="Cliente" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__todos">Cliente: todos</SelectItem>
            {clientes.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          items={itensStatus}
          value={searchParams.get("status") ?? "__todos"}
          onValueChange={(v) => atualizar("status", v)}
        >
          <SelectTrigger className="w-32 shrink-0"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__todos">Status: todos</SelectItem>
            {STATUS_LANCAMENTO.map((s) => (
              <SelectItem key={s} value={s}>{RUS_STATUS_LANCAMENTO[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          items={itensForma}
          value={searchParams.get("formaPagamento") ?? "__todos"}
          onValueChange={(v) => atualizar("formaPagamento", v)}
        >
          <SelectTrigger className="w-40 shrink-0"><SelectValue placeholder="Forma" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__todos">Forma: todas</SelectItem>
            {FORMAS_PAGAMENTO.map((f) => (
              <SelectItem key={f} value={f}>{RUS_FORMA_PAGAMENTO[f]}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {temFiltros && (
          <Button variant="ghost" size="sm" className="shrink-0" onClick={() => router.push(pathname)}>
            <X className="size-4" />
            Limpar
          </Button>
        )}
      </div>
    </div>
  );
}
