"use client";

import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function SeletorAno({ ano, anos }: { ano: number; anos: number[] }) {
  const router = useRouter();

  return (
    <Select
      items={Object.fromEntries(anos.map((a) => [String(a), String(a)]))}
      value={String(ano)}
      onValueChange={(v) => v && router.push(`/mensalidades?ano=${v}`)}
    >
      <SelectTrigger className="w-24">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {anos.map((a) => (
          <SelectItem key={a} value={String(a)}>{a}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
