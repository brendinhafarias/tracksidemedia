"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { nomeMes } from "@/lib/data";

export function SeletorMes({
  mes,
  ano,
  opcoes,
}: {
  mes: number;
  ano: number;
  opcoes: { mes: number; ano: number }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const valorAtual = `${ano}-${String(mes).padStart(2, "0")}`;

  function aoMudar(valor: string | null) {
    if (!valor) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("mes", valor);
    router.push(`${pathname}?${params.toString()}`);
  }

  const itens = useMemo(
    () =>
      Object.fromEntries(
        opcoes.map(({ mes: m, ano: a }) => [`${a}-${String(m).padStart(2, "0")}`, `${nomeMes(m)}/${a}`])
      ),
    [opcoes]
  );

  return (
    <Select items={itens} value={valorAtual} onValueChange={aoMudar}>
      <SelectTrigger className="w-40">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {opcoes.map(({ mes: m, ano: a }) => (
          <SelectItem key={`${a}-${m}`} value={`${a}-${String(m).padStart(2, "0")}`}>
            {nomeMes(m)}/{a}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
