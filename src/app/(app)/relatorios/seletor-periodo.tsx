"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { nomeMes } from "@/lib/data";

export function SeletorPeriodo({
  mes,
  ano,
  anoInteiro,
  anosDisponiveis,
}: {
  mes: number;
  ano: number;
  anoInteiro: boolean;
  anosDisponiveis: number[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function atualizar(chave: string, valor: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set(chave, valor);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex items-center gap-2">
      <Select
        items={{
          todos: "Ano inteiro",
          ...Object.fromEntries(Array.from({ length: 12 }, (_, i) => i + 1).map((m) => [String(m), nomeMes(m)])),
        }}
        value={anoInteiro ? "todos" : String(mes)}
        onValueChange={(v) => v && atualizar("mes", v)}
      >
        <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Ano inteiro</SelectItem>
          {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
            <SelectItem key={m} value={String(m)}>{nomeMes(m)}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        items={Object.fromEntries(anosDisponiveis.map((a) => [String(a), String(a)]))}
        value={String(ano)}
        onValueChange={(v) => v && atualizar("ano", v)}
      >
        <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
        <SelectContent>
          {anosDisponiveis.map((a) => (
            <SelectItem key={a} value={String(a)}>{a}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
