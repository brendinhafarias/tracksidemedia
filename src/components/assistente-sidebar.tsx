"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Chat } from "@/app/(app)/assistente/chat";

type Categoria = { id: string; nome: string; tipo: "ENTRADA" | "SAIDA" };
type Cliente = { id: string; nome: string };
type Socio = { id: string; nome: string };

export function AssistenteSidebar({
  categorias,
  clientes,
  socios,
  trigger,
}: {
  categorias: Categoria[];
  clientes: Cliente[];
  socios: Socio[];
  trigger: React.ReactNode;
}) {
  const [aberto, setAberto] = useState(false);

  return (
    <Sheet open={aberto} onOpenChange={setAberto}>
      <span className="contents" onClick={() => setAberto(true)}>
        {trigger}
      </span>
      <SheetContent
        side="right"
        className="flex h-full w-full flex-col gap-0 p-0 sm:max-w-md"
      >
        <SheetHeader className="shrink-0 border-b px-4 py-3">
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            Assistente
          </SheetTitle>
        </SheetHeader>
        <div className="min-h-0 flex-1">
          <Chat categorias={categorias} clientes={clientes} socios={socios} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
