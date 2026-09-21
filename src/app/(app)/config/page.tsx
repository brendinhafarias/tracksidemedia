import Link from "next/link";
import { Tag, Repeat, Users, Upload, DatabaseBackup } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { obterUsuarioAtual } from "@/lib/auth/sessao";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormularioEmpresa } from "./formulario-empresa";

export default async function PaginaConfig() {
  const [config, usuarioAtual] = await Promise.all([
    prisma.configEmpresa.findFirst(),
    obterUsuarioAtual(),
  ]);

  const itens = [
    { href: "/config/categorias", label: "Categorias", icone: Tag },
    { href: "/config/despesas-recorrentes", label: "Despesas recorrentes", icone: Repeat },
    ...(usuarioAtual?.papel === "ADMIN"
      ? [{ href: "/config/usuarios", label: "Usuários", icone: Users }]
      : []),
    { href: "/config/importar", label: "Importar planilha", icone: Upload },
    { href: "/config/backup", label: "Backup e restauração", icone: DatabaseBackup },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Configurações</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dados da empresa</CardTitle>
        </CardHeader>
        <CardContent>
          <FormularioEmpresa
            config={{
              nomeEmpresa: config?.nomeEmpresa ?? "Minha Empresa",
              percentualReserva: config ? Number(config.percentualReserva) : 10,
              regimePadrao: config?.regimePadrao ?? "CAIXA",
              diaFechamento: config?.diaFechamento ?? 1,
            }}
          />
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2">
        {itens.map((item) => {
          const Icone = item.icone;
          return (
            <Link key={item.href} href={item.href}>
              <Card className="hover:bg-muted/50 transition-colors">
                <CardContent className="flex items-center gap-3 py-4">
                  <Icone className="size-5 text-muted-foreground" />
                  <span className="font-medium">{item.label}</span>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
