import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BotaoVoltar } from "@/components/botao-voltar";
import { FormularioRestaurar } from "./formulario-restaurar";

export default function PaginaBackup() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <BotaoVoltar href="/config" />
        <h1 className="text-xl font-semibold">Backup e restauração</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Baixar backup</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Baixa uma cópia completa do banco de dados (todos os clientes,
            lançamentos, cobranças etc.) em um único arquivo. Guarde-o em um
            lugar seguro (pendrive, nuvem) periodicamente.
          </p>
          <Button render={<a href="/api/backup" download />}>
            <Download className="size-4" />
            Baixar backup agora
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Restaurar backup</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Envie um arquivo de backup (.db) baixado anteriormente. Por
            segurança, a troca do banco em uso é feita em duas etapas — o
            sistema nunca sobrescreve os dados atuais sozinho.
          </p>
          <FormularioRestaurar />
        </CardContent>
      </Card>
    </div>
  );
}
