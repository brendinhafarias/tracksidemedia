import { BotaoVoltar } from "@/components/botao-voltar";
import { Card, CardContent } from "@/components/ui/card";
import { Importador } from "./importador";
import { LotesHistorico } from "./lotes-historico";
import { listarLotesImportados } from "./acoes";

export default async function PaginaImportar() {
  const lotes = await listarLotesImportados();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <BotaoVoltar href="/config" />
        <h1 className="text-xl font-semibold">Importar planilha</h1>
      </div>

      <Card>
        <CardContent className="pt-6 text-sm text-muted-foreground space-y-1">
          <p>
            Envie a planilha (Sebrae ou outra), associe as colunas aos campos
            do sistema, confira a pré-visualização e importe. Todo lote
            importado pode ser revertido de uma vez depois, se precisar.
          </p>
        </CardContent>
      </Card>

      <Importador />
      <LotesHistorico lotes={lotes} />
    </div>
  );
}
