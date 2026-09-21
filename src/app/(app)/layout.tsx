import { redirect } from "next/navigation";
import { obterUsuarioAtual } from "@/lib/auth/sessao";
import { prisma } from "@/lib/prisma";
import { NavegacaoPrincipal } from "@/components/navegacao-principal";
import { BarraSuperior } from "@/components/barra-superior";
import { AssistenteColuna } from "@/components/assistente-coluna";

export default async function LayoutApp({ children }: LayoutProps<"/">) {
  const usuario = await obterUsuarioAtual();
  if (!usuario) redirect("/login");

  const [categorias, clientes, socios] = await Promise.all([
    prisma.categoria.findMany({ where: { arquivada: false }, orderBy: { nome: "asc" } }),
    prisma.cliente.findMany({ where: { arquivado: false }, orderBy: { nome: "asc" } }),
    prisma.socio.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } }),
  ]);

  const clientesSimples = clientes.map((c) => ({ id: c.id, nome: c.nome }));
  const sociosSimples = socios.map((s) => ({ id: s.id, nome: s.nome }));

  return (
    <div className="flex min-h-screen w-full flex-col sm:h-screen sm:overflow-hidden">
      <div className="shrink-0">
        <BarraSuperior usuario={usuario} />
        <NavegacaoPrincipal
          categorias={categorias}
          clientes={clientesSimples}
          socios={sociosSimples}
        />
      </div>
      <div className="flex flex-1 sm:min-h-0">
        <main className="w-full min-w-0 flex-1 px-3 pb-24 pt-4 sm:overflow-y-auto sm:px-6 sm:pb-8">
          {children}
        </main>
        <AssistenteColuna
          categorias={categorias}
          clientes={clientesSimples}
          socios={sociosSimples}
        />
      </div>
    </div>
  );
}
