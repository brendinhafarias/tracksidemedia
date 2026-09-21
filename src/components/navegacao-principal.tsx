"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Receipt,
  CalendarCheck,
  MessageCircle,
  Menu,
  Users,
  HandCoins,
  BarChart3,
  Settings,
  PiggyBank,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { AssistenteSidebar } from "@/components/assistente-sidebar";

type Categoria = { id: string; nome: string; tipo: "ENTRADA" | "SAIDA" };
type Cliente = { id: string; nome: string };
type Socio = { id: string; nome: string };

const ITENS_PRINCIPAIS = [
  { href: "/", label: "Início", icone: LayoutDashboard },
  { href: "/lancamentos", label: "Lançar", icone: Receipt },
  { href: "/mensalidades", label: "Mensal.", icone: CalendarCheck },
];

const ITENS_SECUNDARIOS = [
  { href: "/clientes", label: "Clientes", icone: Users },
  { href: "/socios", label: "Divisão de lucro", icone: HandCoins },
  { href: "/poupanca", label: "Poupança", icone: PiggyBank },
  { href: "/relatorios", label: "Relatórios", icone: BarChart3 },
  { href: "/config", label: "Configurações", icone: Settings },
];

const CLASSE_ITEM_DESKTOP =
  "flex shrink-0 items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-sm transition-colors text-muted-foreground hover:bg-muted hover:text-foreground";
const CLASSE_ITEM_MOBILE =
  "flex flex-col items-center gap-0.5 rounded-xl py-2 text-[11px] transition-colors text-muted-foreground hover:bg-muted hover:text-foreground";

export function NavegacaoPrincipal({
  categorias,
  clientes,
  socios,
}: {
  categorias: Categoria[];
  clientes: Cliente[];
  socios: Socio[];
}) {
  const pathname = usePathname();
  const [abertoMais, setAbertoMais] = useState(false);

  const ativo = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <>
      {/* Desktop: todos os destinos numa única barra horizontal, sem menu escondido.
          Rola de lado em vez de quebrar linha quando não cabe tudo. */}
      <nav className="hidden border-b border-border/70 bg-background sm:block">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-1 overflow-x-auto px-6 py-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {ITENS_PRINCIPAIS.map((item) => {
            const Icone = item.icone;
            const estaAtivo = ativo(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(CLASSE_ITEM_DESKTOP, estaAtivo && "bg-accent text-accent-foreground font-medium")}
              >
                <Icone className={cn("size-4", estaAtivo && "text-primary")} />
                {item.label}
              </Link>
            );
          })}

          {ITENS_SECUNDARIOS.map((item) => {
            const Icone = item.icone;
            const estaAtivo = ativo(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(CLASSE_ITEM_DESKTOP, estaAtivo && "bg-accent text-accent-foreground font-medium")}
              >
                <Icone className={cn("size-4", estaAtivo && "text-primary")} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Mobile: barra inferior fixa com os destinos mais usados + "Mais" */}
      <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-border/70 bg-background/90 backdrop-blur-md shadow-[0_-2px_12px_-4px_rgba(30,20,80,0.08)] sm:hidden">
        <div className="grid grid-cols-5 px-1 py-1.5">
          {ITENS_PRINCIPAIS.map((item) => {
            const Icone = item.icone;
            const estaAtivo = ativo(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(CLASSE_ITEM_MOBILE, estaAtivo && "bg-accent text-accent-foreground font-medium")}
              >
                <Icone className={cn("size-5", estaAtivo && "text-primary")} />
                {item.label}
              </Link>
            );
          })}

          <AssistenteSidebar
            categorias={categorias}
            clientes={clientes}
            socios={socios}
            trigger={
              <button type="button" className={CLASSE_ITEM_MOBILE}>
                <MessageCircle className="size-5" />
                Assistente
              </button>
            }
          />

          <Sheet open={abertoMais} onOpenChange={setAbertoMais}>
            <SheetTrigger className={CLASSE_ITEM_MOBILE}>
              <Menu className="size-5" />
              Mais
            </SheetTrigger>
            <SheetContent side="bottom" className="sm:max-w-md sm:mx-auto sm:rounded-t-2xl">
              <SheetHeader>
                <SheetTitle>Mais opções</SheetTitle>
              </SheetHeader>
              <div className="grid grid-cols-2 gap-3 p-4 pt-0">
                {ITENS_SECUNDARIOS.map((item) => {
                  const Icone = item.icone;
                  const estaAtivo = ativo(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setAbertoMais(false)}
                      className={cn(
                        "flex flex-col items-center gap-2 rounded-xl border p-4 text-sm transition-colors",
                        estaAtivo
                          ? "border-primary/40 bg-accent font-medium text-accent-foreground"
                          : "hover:bg-muted"
                      )}
                    >
                      <Icone className={cn("size-5", estaAtivo && "text-primary")} />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </>
  );
}
