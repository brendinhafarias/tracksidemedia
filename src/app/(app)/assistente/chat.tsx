"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { CartaoConfirmacao } from "./cartao-confirmacao";
import type { CamposConfirmacao, RespostaAssistente, TurnoConversa } from "./tipos";
import {
  processarMensagem,
  confirmarAcaoAssistente,
  desfazerAcaoAssistente,
  montarConfirmacaoPagamentoComCliente,
  resolverEscolhaSocio,
  responderSituacaoClientePorId,
  criarClienteRapido,
} from "./acoes";

type Categoria = { id: string; nome: string; tipo: "ENTRADA" | "SAIDA" };
type Cliente = { id: string; nome: string };
type Socio = { id: string; nome: string };

const JANELA_DESFAZER_MS = 5 * 60 * 1000;

export function Chat({
  categorias,
  clientes,
  socios,
}: {
  categorias: Categoria[];
  clientes: Cliente[];
  socios: Socio[];
}) {
  const [turnos, setTurnos] = useState<TurnoConversa[]>([]);
  const [texto, setTexto] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [, iniciarTransicao] = useTransition();
  const fimRef = useRef<HTMLDivElement>(null);

  function atualizarTurno(id: string, atualizacao: Partial<TurnoConversa>) {
    setTurnos((atual) => atual.map((t) => (t.id === id ? { ...t, ...atualizacao } : t)));
    requestAnimationFrame(() => fimRef.current?.scrollIntoView({ behavior: "smooth" }));
  }

  async function enviar() {
    const prompt = texto.trim();
    if (!prompt || carregando) return;
    setTexto("");
    const id = crypto.randomUUID();
    setTurnos((atual) => [...atual, { id, prompt, resposta: { tipo: "resposta", texto: "" } }]);
    setCarregando(true);
    try {
      const resposta = await processarMensagem(prompt);
      atualizarTurno(id, { resposta });
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3">
        {turnos.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-4 text-center text-sm text-muted-foreground">
            <Sparkles className="size-8 text-muted-foreground/30" />
            <p>
              Digite algo como &ldquo;paguei 50 de internet hoje&rdquo; ou &ldquo;quem falta
              me pagar esse mês?&rdquo;
            </p>
            <p className="text-xs">
              Nada é gravado sem você confirmar antes.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {turnos.map((turno) => (
              <Turno
                key={turno.id}
                turno={turno}
                categorias={categorias}
                clientes={clientes}
                socios={socios}
                aoAtualizar={(r) => atualizarTurno(turno.id, { resposta: r })}
                aoResolver={(res) => atualizarTurno(turno.id, { resolvido: res })}
              />
            ))}
            <div ref={fimRef} />
          </div>
        )}
      </div>

      <div className="flex shrink-0 gap-2 border-t bg-background p-3">
        <Input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              iniciarTransicao(enviar);
            }
          }}
          placeholder="Fale com o assistente..."
          disabled={carregando}
        />
        <Button size="icon" disabled={carregando || !texto.trim()} onClick={() => iniciarTransicao(enviar)}>
          <Send className="size-4" />
        </Button>
      </div>
    </div>
  );
}

function Turno({
  turno,
  categorias,
  clientes,
  socios,
  aoAtualizar,
  aoResolver,
}: {
  turno: TurnoConversa;
  categorias: Categoria[];
  clientes: Cliente[];
  socios: Socio[];
  aoAtualizar: (r: RespostaAssistente) => void;
  aoResolver: (res: { lancamentoId: string; resumo: string }) => void;
}) {
  const [pendente, setPendente] = useState(false);
  const [erro, setErro] = useState<string>();
  const [nomeNovoCliente, setNomeNovoCliente] = useState("");

  async function confirmar(campos: CamposConfirmacao) {
    setPendente(true);
    setErro(undefined);
    const resultado = await confirmarAcaoAssistente(campos, turno.prompt);
    setPendente(false);
    if (resultado.erro || !resultado.lancamentoId) {
      setErro(resultado.erro ?? "Não foi possível salvar.");
      return;
    }
    aoResolver({ lancamentoId: resultado.lancamentoId, resumo: resultado.resumo ?? "Lançamento registrado." });
  }

  async function escolherCliente(clienteId: string) {
    if (turno.resposta.tipo !== "escolha") return;
    setPendente(true);
    const nova = await montarConfirmacaoPagamentoComCliente(turno.resposta.campos, clienteId);
    setPendente(false);
    aoAtualizar(nova);
  }

  async function escolherSocio(socioId: string) {
    if (turno.resposta.tipo !== "escolha") return;
    setPendente(true);
    const nova = await resolverEscolhaSocio(turno.resposta.campos, socioId);
    setPendente(false);
    aoAtualizar(nova);
  }

  async function escolherClienteConsulta(clienteId: string) {
    setPendente(true);
    const nova = await responderSituacaoClientePorId(clienteId);
    setPendente(false);
    aoAtualizar(nova);
  }

  async function cadastrarClienteRapido() {
    if (turno.resposta.tipo !== "sem_correspondencia") return;
    setPendente(true);
    const resultado = await criarClienteRapido(nomeNovoCliente || turno.resposta.nomeDigitado);
    if ("erro" in resultado) {
      setPendente(false);
      setErro(resultado.erro);
      return;
    }
    const nova = await montarConfirmacaoPagamentoComCliente(turno.resposta.campos, resultado.id);
    setPendente(false);
    aoAtualizar(nova);
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-end">
        <div className="bg-primary text-primary-foreground rounded-2xl rounded-br-sm px-3 py-2 max-w-[85%] text-sm whitespace-pre-wrap">
          {turno.prompt}
        </div>
      </div>

      <div className="flex justify-start">
        <div className="max-w-[95%] w-full sm:max-w-md">
          {turno.resolvido ? (
            <ResumoResolvido resolvido={turno.resolvido} />
          ) : (
            <RespostaBubble
              resposta={turno.resposta}
              categorias={categorias}
              clientes={clientes}
              socios={socios}
              pendente={pendente}
              erro={erro}
              onConfirmar={confirmar}
              onEscolherCliente={escolherCliente}
              onEscolherSocio={escolherSocio}
              onEscolherClienteConsulta={escolherClienteConsulta}
              onCadastrarClienteRapido={cadastrarClienteRapido}
              setNomeNovoCliente={setNomeNovoCliente}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function RespostaBubble({
  resposta,
  categorias,
  clientes,
  socios,
  pendente,
  erro,
  onConfirmar,
  onEscolherCliente,
  onEscolherSocio,
  onEscolherClienteConsulta,
  onCadastrarClienteRapido,
  setNomeNovoCliente,
}: {
  resposta: RespostaAssistente;
  categorias: Categoria[];
  clientes: Cliente[];
  socios: Socio[];
  pendente: boolean;
  erro?: string;
  onConfirmar: (campos: CamposConfirmacao) => void;
  onEscolherCliente: (id: string) => void;
  onEscolherSocio: (id: string) => void;
  onEscolherClienteConsulta: (id: string) => void;
  onCadastrarClienteRapido: () => void;
  setNomeNovoCliente: (v: string) => void;
}) {
  if (resposta.tipo === "resposta") {
    if (!resposta.texto) {
      return (
        <div className="rounded-2xl rounded-bl-sm bg-muted px-3 py-2 text-sm text-muted-foreground">
          Pensando...
        </div>
      );
    }
    return (
      <div className="rounded-2xl rounded-bl-sm bg-muted px-3 py-2 text-sm whitespace-pre-wrap">
        {resposta.texto}
      </div>
    );
  }

  if (resposta.tipo === "confirmacao" || resposta.tipo === "fallback") {
    return (
      <div className="space-y-2 w-full">
        {resposta.tipo === "fallback" && (
          <p className="text-sm bg-muted rounded-2xl rounded-bl-sm px-3 py-2">{resposta.motivo}</p>
        )}
        <CartaoConfirmacao
          campos={resposta.campos}
          categorias={categorias}
          clientes={clientes}
          socios={socios}
          aoConfirmar={onConfirmar}
          pendente={pendente}
          erro={erro}
        />
      </div>
    );
  }

  if (resposta.tipo === "escolha") {
    return (
      <div className="space-y-2 w-full">
        <p className="text-sm bg-muted rounded-2xl rounded-bl-sm px-3 py-2">
          Encontrei mais de um {resposta.entidade === "cliente" ? "cliente" : "sócio"} parecido. Qual deles?
        </p>
        <div className="flex flex-wrap gap-2">
          {resposta.candidatos.map((c) => (
            <Button
              key={c.id}
              size="sm"
              variant="outline"
              disabled={pendente}
              onClick={() =>
                resposta.entidade === "cliente" ? onEscolherCliente(c.id) : onEscolherSocio(c.id)
              }
            >
              {c.nome}
            </Button>
          ))}
        </div>
      </div>
    );
  }

  if (resposta.tipo === "escolha_consulta") {
    return (
      <div className="space-y-2 w-full">
        <p className="text-sm bg-muted rounded-2xl rounded-bl-sm px-3 py-2">
          Encontrei mais de um cliente parecido. Qual deles?
        </p>
        <div className="flex flex-wrap gap-2">
          {resposta.candidatos.map((c) => (
            <Button
              key={c.id}
              size="sm"
              variant="outline"
              disabled={pendente}
              onClick={() => onEscolherClienteConsulta(c.id)}
            >
              {c.nome}
            </Button>
          ))}
        </div>
      </div>
    );
  }

  if (resposta.tipo === "sem_correspondencia") {
    return (
      <div className="space-y-2 w-full rounded-md border p-3">
        <p className="text-sm">
          Não encontrei nenhum cliente parecido com &ldquo;{resposta.nomeDigitado}&rdquo;.
        </p>
        <div className="flex gap-2">
          <Input
            placeholder="Nome do novo cliente"
            defaultValue={resposta.nomeDigitado}
            onChange={(e) => setNomeNovoCliente(e.target.value)}
          />
          <Button size="sm" disabled={pendente} onClick={onCadastrarClienteRapido}>
            Cadastrar
          </Button>
        </div>
        {erro && <p className="text-sm text-destructive">{erro}</p>}
      </div>
    );
  }

  return null;
}

function ResumoResolvido({
  resolvido,
}: {
  resolvido: { lancamentoId: string; resumo: string; desfeito?: boolean };
}) {
  const [inicio] = useState(() => Date.now());
  const [desfeito, setDesfeito] = useState(resolvido.desfeito ?? false);
  const [pendente, setPendente] = useState(false);
  const [expirado, setExpirado] = useState(false);
  const dentroDaJanela = !expirado;

  useEffect(() => {
    const restante = Math.max(JANELA_DESFAZER_MS - (Date.now() - inicio), 0);
    const timer = setTimeout(() => setExpirado(true), restante);
    return () => clearTimeout(timer);
  }, [inicio]);

  async function desfazer() {
    setPendente(true);
    const resultado = await desfazerAcaoAssistente(resolvido.lancamentoId);
    setPendente(false);
    if (resultado.erro) {
      toast.error(resultado.erro);
      return;
    }
    setDesfeito(true);
    toast.success("Lançamento desfeito.");
  }

  return (
    <div className="rounded-md border p-3 space-y-2">
      <p className="text-sm">{resolvido.resumo}</p>
      {desfeito ? (
        <p className="text-xs text-muted-foreground">Desfeito.</p>
      ) : (
        dentroDaJanela && (
          <Button size="sm" variant="outline" disabled={pendente} onClick={desfazer}>
            Desfazer
          </Button>
        )
      )}
    </div>
  );
}
