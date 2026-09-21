"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AlternadorTema() {
  // Começa nulo em ambos os lados (servidor e cliente) para não gerar
  // divergência de hidratação — o valor real (definido pelo script inline
  // no <head>, antes da pintura) só é lido do DOM depois de montar.
  const [tema, setTema] = useState<"light" | "dark" | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- leitura de estado do DOM (definido por script inline fora do React) no primeiro mount; não há valor de props/estado anterior para comparar.
    setTema(document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light");
  }, []);

  function alternar() {
    const novo = tema === "dark" ? "light" : "dark";
    setTema(novo);
    document.documentElement.setAttribute("data-theme", novo);
    try {
      localStorage.setItem("tema", novo);
    } catch {
      // localStorage indisponível (modo privado etc.) — a preferência só não persiste entre sessões.
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={alternar}
      aria-label={tema === "dark" ? "Mudar para tema claro" : "Mudar para tema escuro"}
      className="text-muted-foreground hover:text-foreground"
    >
      {tema === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  );
}
