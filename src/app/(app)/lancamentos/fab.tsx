"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { FormularioLancamento } from "./formulario-lancamento";

type Categoria = { id: string; nome: string; tipo: "ENTRADA" | "SAIDA" };
type Cliente = { id: string; nome: string };

export function FabNovoLancamento({
  categorias,
  clientes,
}: {
  categorias: Categoria[];
  clientes: Cliente[];
}) {
  return (
    <div className="fixed bottom-20 right-4 z-40 sm:hidden">
      <FormularioLancamento
        categorias={categorias}
        clientes={clientes}
        trigger={
          <Button size="icon" className="size-14 rounded-full shadow-lg">
            <Plus className="size-6" />
          </Button>
        }
      />
    </div>
  );
}
