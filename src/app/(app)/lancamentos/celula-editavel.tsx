"use client";

import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function CelulaEditavel({
  valorInicial,
  onSalvar,
  formatarExibicao,
  className,
  inputMode,
}: {
  valorInicial: string;
  onSalvar: (novoValor: string) => Promise<void> | void;
  formatarExibicao: (valor: string) => string;
  className?: string;
  inputMode?: "text" | "decimal";
}) {
  const [editando, setEditando] = useState(false);
  const [valor, setValor] = useState(valorInicial);
  const [pendente, iniciarTransicao] = useTransition();

  function salvar() {
    setEditando(false);
    if (valor.trim() === "" || valor === valorInicial) {
      setValor(valorInicial);
      return;
    }
    iniciarTransicao(() => {
      onSalvar(valor);
    });
  }

  if (editando) {
    return (
      <Input
        autoFocus
        inputMode={inputMode}
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        onBlur={salvar}
        onKeyDown={(e) => {
          if (e.key === "Enter") salvar();
          if (e.key === "Escape") {
            setValor(valorInicial);
            setEditando(false);
          }
        }}
        className="h-8"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditando(true)}
      className={cn(
        "text-left w-full rounded px-1 py-0.5 hover:bg-muted/70",
        pendente && "opacity-50",
        className
      )}
      title="Toque para editar"
    >
      {formatarExibicao(valor)}
    </button>
  );
}
