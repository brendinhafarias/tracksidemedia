"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatarBRL } from "@/lib/dinheiro";
import { formatarData } from "@/lib/data";
import { sugerirMapeamento } from "@/lib/importacao/sugerir-mapeamento";
import { CAMPOS_DESTINO, type MapeamentoColunas } from "@/lib/importacao/tipos";
import {
  lerPlanilha,
  preVisualizarImportacao,
  confirmarImportacao,
  type ResultadoPreVisualizacao,
  type ResultadoImportacao,
} from "./acoes";

const ROTULOS_CAMPO: Record<(typeof CAMPOS_DESTINO)[number], string> = {
  tipo: "Tipo (entrada/saída)",
  valor: "Valor",
  descricao: "Descrição",
  data: "Data",
  categoria: "Categoria",
  cliente: "Cliente",
  formaPagamento: "Forma de pagamento",
  ignorar: "Não importar esta coluna",
};

type Etapa = "upload" | "mapeamento" | "preview" | "concluido";

export function Importador() {
  const router = useRouter();
  const [etapa, setEtapa] = useState<Etapa>("upload");
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [abas, setAbas] = useState<string[]>([]);
  const [abaSelecionada, setAbaSelecionada] = useState("");
  const [cabecalhos, setCabecalhos] = useState<string[]>([]);
  const [linhas, setLinhas] = useState<Record<string, unknown>[]>([]);
  const [mapeamento, setMapeamento] = useState<MapeamentoColunas>({});
  const [preview, setPreview] = useState<ResultadoPreVisualizacao | null>(null);
  const [relatorioFinal, setRelatorioFinal] = useState<ResultadoImportacao | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string>();

  async function processarArquivo(arquivoEscolhido: File, aba?: string) {
    setCarregando(true);
    setErro(undefined);
    const fd = new FormData();
    fd.set("arquivo", arquivoEscolhido);
    if (aba) fd.set("aba", aba);
    const resultado = await lerPlanilha(fd);
    setCarregando(false);

    if ("erro" in resultado) {
      setErro(resultado.erro);
      return;
    }
    setAbas(resultado.abas);
    setAbaSelecionada(resultado.abaSelecionada);
    setCabecalhos(resultado.cabecalhos);
    setLinhas(resultado.linhas);
    setMapeamento(sugerirMapeamento(resultado.cabecalhos));
    setEtapa("mapeamento");
  }

  async function aoEnviarArquivo(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivoEscolhido = e.target.files?.[0];
    if (!arquivoEscolhido) return;
    setArquivo(arquivoEscolhido);
    await processarArquivo(arquivoEscolhido);
  }

  async function aoTrocarAba(aba: string) {
    if (!arquivo) return;
    setAbaSelecionada(aba);
    await processarArquivo(arquivo, aba);
  }

  async function aoPreVisualizar() {
    setCarregando(true);
    setErro(undefined);
    const resultado = await preVisualizarImportacao(linhas, cabecalhos, mapeamento);
    setCarregando(false);
    setPreview(resultado);
    setEtapa("preview");
  }

  async function aoImportar() {
    setCarregando(true);
    const resultado = await confirmarImportacao(linhas, cabecalhos, mapeamento);
    setCarregando(false);
    setRelatorioFinal(resultado);
    setEtapa("concluido");
    router.refresh();
  }

  function recomecar() {
    setEtapa("upload");
    setArquivo(null);
    setAbas([]);
    setCabecalhos([]);
    setLinhas([]);
    setMapeamento({});
    setPreview(null);
    setRelatorioFinal(null);
    setErro(undefined);
  }

  if (etapa === "upload") {
    return (
      <Card>
        <CardContent className="pt-6 space-y-3">
          <Label htmlFor="arquivo">Selecione a planilha (.xlsx ou .csv)</Label>
          <Input id="arquivo" type="file" accept=".xlsx,.xls,.csv" onChange={aoEnviarArquivo} disabled={carregando} />
          {carregando && <p className="text-sm text-muted-foreground">Lendo arquivo...</p>}
          {erro && <p className="text-sm text-destructive">{erro}</p>}
        </CardContent>
      </Card>
    );
  }

  if (etapa === "mapeamento") {
    return (
      <Card>
        <CardContent className="pt-6 space-y-4">
          {abas.length > 1 && (
            <div className="space-y-2">
              <Label>Aba da planilha</Label>
              <Select
                items={Object.fromEntries(abas.map((a) => [a, a]))}
                value={abaSelecionada}
                onValueChange={(v) => v && aoTrocarAba(v)}
              >
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {abas.map((a) => (
                    <SelectItem key={a} value={a}>{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <p className="text-sm font-medium mb-2">
              Associe cada coluna da planilha a um campo do sistema ({linhas.length} linha(s) encontrada(s))
            </p>
            <div className="space-y-2">
              {cabecalhos.map((cab) => (
                <div key={cab} className="grid grid-cols-2 gap-3 items-center">
                  <span className="text-sm truncate">{cab}</span>
                  <Select
                    items={ROTULOS_CAMPO}
                    value={mapeamento[cab] ?? "ignorar"}
                    onValueChange={(v) => v && setMapeamento((m) => ({ ...m, [cab]: v as never }))}
                  >
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CAMPOS_DESTINO.map((campo) => (
                        <SelectItem key={campo} value={campo}>{ROTULOS_CAMPO[campo]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </div>

          {erro && <p className="text-sm text-destructive">{erro}</p>}
          <div className="flex gap-2">
            <Button variant="outline" onClick={recomecar}>Cancelar</Button>
            <Button onClick={aoPreVisualizar} disabled={carregando}>
              {carregando ? "Processando..." : "Pré-visualizar"}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (etapa === "preview" && preview) {
    return (
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex flex-wrap gap-2 text-sm">
            <Badge variant="secondary">{preview.total} linha(s) no total</Badge>
            <Badge className="bg-emerald-100 text-emerald-700">{preview.validas} prontas</Badge>
            {preview.comAviso > 0 && <Badge className="bg-amber-100 text-amber-700">{preview.comAviso} com aviso</Badge>}
            {preview.invalidas > 0 && <Badge variant="destructive">{preview.invalidas} com erro (não serão importadas)</Badge>}
            {preview.ignoradas > 0 && <Badge variant="outline">{preview.ignoradas} ignorada(s) (total/cabeçalho)</Badge>}
          </div>

          <div className="overflow-x-auto">
            <p className="text-xs text-muted-foreground mb-1">Mostrando as primeiras {preview.amostra.length} linhas:</p>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Linha</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Situação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {preview.amostra.map((l) => (
                  <TableRow key={l.linha} className={l.ignorada ? "opacity-50" : undefined}>
                    <TableCell>{l.linha}</TableCell>
                    <TableCell>{l.dataCaixa ? formatarData(l.dataCaixa) : "-"}</TableCell>
                    <TableCell className="max-w-40 truncate">{l.descricao ?? "-"}</TableCell>
                    <TableCell>{l.tipo ?? "-"}</TableCell>
                    <TableCell className="text-right">
                      {l.valorCentavos != null ? formatarBRL(l.valorCentavos) : "-"}
                    </TableCell>
                    <TableCell className="text-xs">
                      {l.ignorada && <span className="text-muted-foreground">{l.motivoIgnorada}</span>}
                      {!l.ignorada && l.erros.length > 0 && (
                        <span className="text-destructive">{l.erros.join(" ")}</span>
                      )}
                      {!l.ignorada && l.erros.length === 0 && l.avisos.length > 0 && (
                        <span className="text-amber-600">{l.avisos.join(" ")}</span>
                      )}
                      {!l.ignorada && l.erros.length === 0 && l.avisos.length === 0 && (
                        <span className="text-emerald-600">OK</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setEtapa("mapeamento")}>Voltar ao mapeamento</Button>
            <Button onClick={aoImportar} disabled={carregando || preview.total === 0}>
              {carregando ? "Importando..." : `Importar ${preview.validas + preview.comAviso} lançamento(s)`}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (etapa === "concluido" && relatorioFinal) {
    return (
      <Card>
        <CardContent className="pt-6 space-y-4">
          <p className="text-sm">
            Importação concluída: <strong>{relatorioFinal.importados}</strong> lançamento(s) importado(s),{" "}
            <strong>{relatorioFinal.invalidos}</strong> ignorado(s) por erro,{" "}
            <strong>{relatorioFinal.ignorados}</strong> linha(s) de total/cabeçalho ignoradas.
          </p>
          {relatorioFinal.detalhesInvalidos.length > 0 && (
            <div className="text-sm space-y-1">
              <p className="font-medium">Linhas com erro:</p>
              <ul className="list-disc list-inside text-muted-foreground max-h-48 overflow-y-auto">
                {relatorioFinal.detalhesInvalidos.map((d) => (
                  <li key={d.linha}>Linha {d.linha}: {d.motivos.join(" ")}</li>
                ))}
              </ul>
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            Todo o lote pode ser revertido de uma vez na lista abaixo, caso algo tenha saído errado.
          </p>
          <Button onClick={recomecar}>Importar outra planilha</Button>
        </CardContent>
      </Card>
    );
  }

  return null;
}
