import { PiggyBank } from "lucide-react";
import { formatarBRL } from "@/lib/dinheiro";
import { formatarData } from "@/lib/data";
import { obterHistoricoPoupanca, obterSaldoInicialPoupanca, obterSaldoPoupanca } from "@/lib/poupanca";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FormularioMovimentoPoupanca } from "./formulario-movimento";
import { FormularioSaldoInicial } from "./formulario-saldo-inicial";

export default async function PaginaPoupanca() {
  const [saldo, historico, saldoInicial] = await Promise.all([
    obterSaldoPoupanca(),
    obterHistoricoPoupanca(),
    obterSaldoInicialPoupanca(),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h1 className="text-xl font-semibold">Poupança</h1>
        <div className="flex gap-2">
          <FormularioSaldoInicial saldoInicialAtual={saldoInicial} />
          <FormularioMovimentoPoupanca />
        </div>
      </div>

      <Card>
        <CardContent className="flex items-center gap-4 py-6">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <PiggyBank className="size-6" />
          </span>
          <div>
            <p className="text-sm text-muted-foreground">Saldo atual</p>
            <p className="text-2xl font-semibold">{formatarBRL(saldo)}</p>
            {saldoInicial > 0 && (
              <p className="text-xs text-muted-foreground">
                Inclui {formatarBRL(saldoInicial)} de saldo inicial.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sobre a poupança</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            Reserva para os meses sem corrida. Cada depósito aparece no fluxo de
            caixa como uma saída (categoria &quot;Poupança - meses sem
            corrida&quot;) e cada retirada aparece como uma entrada (categoria
            &quot;Retirada da poupança&quot;) — assim o saldo fica sempre
            batendo com os lançamentos normais, sem duplicar nada.
          </p>
          <p>
            Já tinha dinheiro guardado antes de usar o sistema? Use o botão
            &quot;Saldo inicial&quot; em vez de lançar um depósito — assim esse
            valor entra na poupança sem aparecer como saída em nenhum mês e sem
            mexer no lucro.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Histórico de movimentos</CardTitle>
        </CardHeader>
        <CardContent>
          {historico.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum movimento registrado ainda. Toque em &quot;Registrar
              movimento&quot; para fazer o primeiro depósito.
            </p>
          ) : (
            <div className="overflow-x-auto -mx-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historico.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell>{formatarData(l.dataCaixa)}</TableCell>
                      <TableCell>{l.descricao}</TableCell>
                      <TableCell
                        className={`text-right font-medium ${l.tipo === "ENTRADA" ? "text-red-600" : "text-emerald-600"}`}
                      >
                        {l.tipo === "ENTRADA" ? "Retirada de " : "Depósito de "}
                        {formatarBRL(l.valor)}
                      </TableCell>
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
