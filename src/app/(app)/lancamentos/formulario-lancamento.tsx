"use client";

import { useActionState, useMemo, useState } from "react";
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
import { nomeMes } from "@/lib/data";
import { RUS_FORMA_PAGAMENTO, FORMAS_PAGAMENTO, paraInputData } from "@/lib/validacao/lancamento";
import { criarLancamento, atualizarLancamento, type EstadoFormulario } from "./acoes";

type Categoria = { id: string; nome: string; tipo: "ENTRADA" | "SAIDA" };
type Cliente = { id: string; nome: string };

type LancamentoExistente = {
  id: string;
  tipo: "ENTRADA" | "SAIDA";
  valor: number;
  descricao: string;
  dataCaixa: Date | null;
  competenciaMes: number;
  competenciaAno: number;
  categoriaId: string;
  clienteId: string | null;
  formaPagamento: (typeof FORMAS_PAGAMENTO)[number];
};

export function FormularioLancamento({
  categorias,
  clientes,
  lancamento,
  trigger,
  tipoInicial,
}: {
  categorias: Categoria[];
  clientes: Cliente[];
  lancamento?: LancamentoExistente;
  trigger?: React.ReactNode;
  tipoInicial?: "ENTRADA" | "SAIDA";
}) {
  const [aberto, setAberto] = useState(false);
  const acao = lancamento ? atualizarLancamento.bind(null, lancamento.id) : criarLancamento;
  const [estado, formAction, pendente] = useActionState<EstadoFormulario, FormData>(
    acao,
    null
  );

  const hoje = new Date();
  const [tipo, setTipo] = useState<"ENTRADA" | "SAIDA">(
    lancamento?.tipo ?? tipoInicial ?? "SAIDA"
  );
  const [dataCaixa, setDataCaixa] = useState(paraInputData(lancamento?.dataCaixa ?? hoje));
  const [competenciaMes, setCompetenciaMes] = useState(
    lancamento?.competenciaMes ?? hoje.getMonth() + 1
  );
  const [competenciaAno, setCompetenciaAno] = useState(
    lancamento?.competenciaAno ?? hoje.getFullYear()
  );
  const categoriasDoTipoInicial = useMemo(
    () => categorias.filter((c) => c.tipo === (lancamento?.tipo ?? tipoInicial ?? "SAIDA")),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );
  const [categoriaId, setCategoriaId] = useState(
    lancamento?.categoriaId ?? categoriasDoTipoInicial[0]?.id ?? ""
  );

  const categoriasDoTipo = useMemo(
    () => categorias.filter((c) => c.tipo === tipo),
    [categorias, tipo]
  );

  // Fecha o diálogo quando a gravação é concluída com sucesso.
  const [estadoProcessado, setEstadoProcessado] = useState(estado);
  if (estado !== estadoProcessado) {
    setEstadoProcessado(estado);
    if (estado?.sucesso) setAberto(false);
  }

  // Ao trocar o tipo (Entrada/Saída), garante que a categoria selecionada
  // continue compatível — troca de tipo é um evento do usuário, não uma
  // sincronização externa, então ajustamos o estado durante a própria
  // renderização (sem useEffect) comparando com o tipo do render anterior.
  const [tipoProcessado, setTipoProcessado] = useState(tipo);
  if (tipo !== tipoProcessado) {
    setTipoProcessado(tipo);
    if (!categoriasDoTipo.some((c) => c.id === categoriaId)) {
      setCategoriaId(categoriasDoTipo[0]?.id ?? "");
    }
  }

  function aoMudarDataCaixa(valor: string) {
    setDataCaixa(valor);
    if (valor) {
      const [ano, mes] = valor.split("-").map(Number);
      if (ano && mes) {
        setCompetenciaMes(mes);
        setCompetenciaAno(ano);
      }
    }
  }

  const anos = [hoje.getFullYear() - 1, hoje.getFullYear(), hoje.getFullYear() + 1];

  const itensCategoria = useMemo(
    () => Object.fromEntries(categoriasDoTipo.map((c) => [c.id, c.nome])),
    [categoriasDoTipo]
  );
  const itensCliente = useMemo(() => {
    const base: Record<string, string> = { __nenhum: "Nenhum" };
    for (const c of clientes) base[c.id] = c.nome;
    return base;
  }, [clientes]);
  const itensForma = useMemo(
    () => Object.fromEntries(FORMAS_PAGAMENTO.map((f) => [f, RUS_FORMA_PAGAMENTO[f]])),
    []
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

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <span className="contents" onClick={() => setAberto(true)}>
        {trigger ?? (
          <Button size="sm">
            <Plus className="size-4" />
            Novo lançamento
          </Button>
        )}
      </span>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{lancamento ? "Editar lançamento" : "Novo lançamento"}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="tipo" value={tipo} />
          <input type="hidden" name="competenciaMes" value={competenciaMes} />
          <input type="hidden" name="competenciaAno" value={competenciaAno} />

          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant={tipo === "ENTRADA" ? "default" : "outline"}
              onClick={() => setTipo("ENTRADA")}
            >
              Entrada
            </Button>
            <Button
              type="button"
              variant={tipo === "SAIDA" ? "default" : "outline"}
              onClick={() => setTipo("SAIDA")}
            >
              Saída
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="valorTexto">Valor (R$)</Label>
            <Input
              id="valorTexto"
              name="valorTexto"
              inputMode="decimal"
              placeholder="0,00"
              defaultValue={
                lancamento ? (lancamento.valor / 100).toFixed(2).replace(".", ",") : ""
              }
              required
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Input
              id="descricao"
              name="descricao"
              defaultValue={lancamento?.descricao}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="categoriaId">Categoria</Label>
            <Select items={itensCategoria} name="categoriaId" value={categoriaId} onValueChange={(v) => setCategoriaId(v ?? "")}>
              <SelectTrigger id="categoriaId" className="w-full">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {categoriasDoTipo.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="clienteId">
              Cliente <span className="text-muted-foreground">(opcional)</span>
            </Label>
            <Select items={itensCliente} name="clienteId" defaultValue={lancamento?.clienteId ?? "__nenhum"}>
              <SelectTrigger id="clienteId" className="w-full">
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

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="dataCaixa">
                Data de caixa <span className="text-muted-foreground">(vazio = previsto)</span>
              </Label>
              <Input
                id="dataCaixa"
                name="dataCaixa"
                type="date"
                value={dataCaixa}
                onChange={(e) => aoMudarDataCaixa(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="formaPagamento">Forma de pagamento</Label>
              <Select items={itensForma} name="formaPagamento" defaultValue={lancamento?.formaPagamento ?? "PIX"}>
                <SelectTrigger id="formaPagamento" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FORMAS_PAGAMENTO.map((f) => (
                    <SelectItem key={f} value={f}>{RUS_FORMA_PAGAMENTO[f]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Competência (mês a que o valor se refere)</Label>
            <div className="grid grid-cols-2 gap-3">
              <Select
                items={itensMeses}
                value={String(competenciaMes)}
                onValueChange={(v) => setCompetenciaMes(Number(v))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <SelectItem key={m} value={String(m)}>{nomeMes(m)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                items={itensAnos}
                value={String(competenciaAno)}
                onValueChange={(v) => setCompetenciaAno(Number(v))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {anos.map((a) => (
                    <SelectItem key={a} value={String(a)}>{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
