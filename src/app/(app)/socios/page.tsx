import { prisma } from "@/lib/prisma";
import { obterRegime } from "@/lib/regime";
import { agora, formatarData, nomeMes, ultimosMeses } from "@/lib/data";
import { formatarBRL } from "@/lib/dinheiro";
import { totaisPeriodo } from "@/lib/consultas/financeiro";
import { calcularDivisaoLucro } from "@/lib/divisao-lucro";
import { SeletorMes } from "@/components/seletor-mes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FormularioSocio } from "./formulario-socio";
import { BotaoAtivoSocio } from "./botao-ativo";
import { BotaoRegistrarRetirada } from "./botao-registrar-retirada";

const RUS_TIPO_DISTRIBUICAO: Record<string, string> = {
  PRO_LABORE: "Pró-labore",
  LUCRO: "Distribuição de lucro",
  ADIANTAMENTO: "Adiantamento",
};

export default async function PaginaSocios({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const regime = await obterRegime();
  const hoje = agora();

  let mes = hoje.getMonth() + 1;
  let ano = hoje.getFullYear();
  if (params.mes) {
    const [anoStr, mesStr] = params.mes.split("-");
    if (anoStr && mesStr) {
      ano = Number(anoStr);
      mes = Number(mesStr);
    }
  }

  const [config, socios, totais] = await Promise.all([
    prisma.configEmpresa.findFirst(),
    prisma.socio.findMany({ orderBy: [{ ativo: "desc" }, { nome: "asc" }] }),
    totaisPeriodo(mes, ano, regime),
  ]);

  const percentualReserva = config ? Number(config.percentualReserva) : 10;
  const sociosAtivos = socios.filter((s) => s.ativo);
  const somaPercentuais = sociosAtivos.reduce((soma, s) => soma + Number(s.percentualLucro), 0);
  const percentuaisOk = Math.abs(somaPercentuais - 100) < 0.01;

  const lucro = totais.lucro;
  const divisao = calcularDivisaoLucro(
    lucro,
    percentualReserva,
    sociosAtivos.map((s) => ({ id: s.id, percentualLucro: Number(s.percentualLucro) }))
  );
  const valorReserva = divisao.valorReserva;
  const valorDistribuivel = divisao.valorDistribuivel;
  const cotaPorSocio = new Map(divisao.cotas.map((c) => [c.socioId, c.valor]));

  const distribuicoesDoMes = await prisma.distribuicao.findMany({
    where: { competenciaMes: mes, competenciaAno: ano, tipo: "LUCRO" },
  });
  const jaRetirouPorSocio = new Set(distribuicoesDoMes.map((d) => d.socioId));

  const distribuicoesDoAno = await prisma.distribuicao.findMany({
    where: { competenciaAno: ano },
    include: { socio: true },
    orderBy: { dataPagamento: "desc" },
  });

  const acumuladoPorSocio = new Map<string, number>();
  for (const d of distribuicoesDoAno) {
    acumuladoPorSocio.set(d.socioId, (acumuladoPorSocio.get(d.socioId) ?? 0) + d.valor);
  }

  const opcoesMeses = ultimosMeses(24, { mes: hoje.getMonth() + 1, ano: hoje.getFullYear() }).reverse();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h1 className="text-xl font-semibold">Divisão de lucro</h1>
        <div className="flex items-center gap-2">
          <SeletorMes mes={mes} ano={ano} opcoes={opcoesMeses} />
        </div>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Sócios</CardTitle>
          <FormularioSocio />
        </CardHeader>
        <CardContent className="space-y-3">
          {!percentuaisOk && sociosAtivos.length > 0 && (
            <p className="text-sm text-amber-600 bg-amber-50 dark:bg-amber-950/30 rounded-md p-2">
              A soma dos percentuais dos sócios ativos é {somaPercentuais.toFixed(1)}%, mas
              deveria ser 100%. Ajuste os percentuais para que a divisão de lucro fique correta.
            </p>
          )}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead className="text-right">% Lucro</TableHead>
                  <TableHead className="text-right">Pró-labore mensal</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {socios.map((s) => (
                  <TableRow key={s.id} className={!s.ativo ? "opacity-50" : undefined}>
                    <TableCell className="font-medium">
                      {s.nome}
                      {!s.ativo && <Badge variant="outline" className="ml-2">Inativo</Badge>}
                    </TableCell>
                    <TableCell className="text-right">{Number(s.percentualLucro)}%</TableCell>
                    <TableCell className="text-right">
                      {s.proLaboreMensal != null ? formatarBRL(s.proLaboreMensal) : "-"}
                    </TableCell>
                    <TableCell className="text-right space-x-1 whitespace-nowrap">
                      <FormularioSocio
                        socio={{
                          id: s.id,
                          nome: s.nome,
                          percentualLucro: Number(s.percentualLucro),
                          proLaboreMensal: s.proLaboreMensal,
                        }}
                        trigger={<Button variant="outline" size="sm">Editar</Button>}
                      />
                      <BotaoAtivoSocio id={s.id} ativo={s.ativo} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Memória de cálculo · {nomeMes(mes)}/{ano}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1 text-sm">
            <LinhaCalculo rotulo="Receita (entradas)" valor={totais.entradas} />
            <LinhaCalculo rotulo="Despesas (saídas)" valor={-totais.saidas} />
            <LinhaCalculo rotulo="Lucro do mês" valor={lucro} destaque />
            {lucro > 0 && (
              <>
                <LinhaCalculo rotulo={`Reserva da empresa (${percentualReserva}%)`} valor={-valorReserva} />
                <LinhaCalculo rotulo="Valor a distribuir entre os sócios" valor={valorDistribuivel} destaque />
              </>
            )}
          </div>

          {lucro <= 0 ? (
            <p className="text-sm text-muted-foreground bg-muted rounded-md p-3">
              Não há lucro a distribuir em {nomeMes(mes)}/{ano}: as saídas
              ({formatarBRL(totais.saidas)}) foram iguais ou maiores que as
              entradas ({formatarBRL(totais.entradas)}) no regime{" "}
              {regime === "CAIXA" ? "de caixa" : "de competência"}.
            </p>
          ) : (
            <div className="space-y-3">
              {sociosAtivos.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Cadastre ao menos um sócio ativo para calcular a divisão.
                </p>
              )}
              {sociosAtivos.map((s) => {
                const cota = cotaPorSocio.get(s.id) ?? 0;
                const retirado = jaRetirouPorSocio.has(s.id);
                return (
                  <div
                    key={s.id}
                    className="flex items-center justify-between gap-3 rounded-md border p-3 flex-wrap"
                  >
                    <div>
                      <p className="font-medium">{s.nome}</p>
                      <p className="text-xs text-muted-foreground">
                        {Number(s.percentualLucro)}% de {formatarBRL(valorDistribuivel)}
                      </p>
                    </div>
                    {retirado ? (
                      <Badge variant="secondary">Já retirado este mês</Badge>
                    ) : (
                      <BotaoRegistrarRetirada socioId={s.id} mes={mes} ano={ano} valor={cota} />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Retiradas de {ano}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {sociosAtivos.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {socios.map((s) => (
                <div key={s.id} className="text-sm rounded-md border px-3 py-2">
                  <p className="text-muted-foreground">{s.nome} · acumulado no ano</p>
                  <p className="font-semibold">{formatarBRL(acumuladoPorSocio.get(s.id) ?? 0)}</p>
                </div>
              ))}
            </div>
          )}

          {distribuicoesDoAno.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma retirada registrada em {ano} ainda.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Sócio</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Competência</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {distribuicoesDoAno.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell>{formatarData(d.dataPagamento)}</TableCell>
                      <TableCell>{d.socio.nome}</TableCell>
                      <TableCell>{RUS_TIPO_DISTRIBUICAO[d.tipo] ?? d.tipo}</TableCell>
                      <TableCell>{nomeMes(d.competenciaMes)}/{d.competenciaAno}</TableCell>
                      <TableCell className="text-right font-medium">{formatarBRL(d.valor)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function LinhaCalculo({
  rotulo,
  valor,
  destaque,
}: {
  rotulo: string;
  valor: number;
  destaque?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between ${destaque ? "font-semibold border-t pt-1" : ""}`}>
      <span className={destaque ? "" : "text-muted-foreground"}>{rotulo}</span>
      <span className={valor < 0 ? "text-red-600" : undefined}>
        {valor < 0 ? "-" : ""}{formatarBRL(Math.abs(valor))}
      </span>
    </div>
  );
}
