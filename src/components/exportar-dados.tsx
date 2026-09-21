"use client";

import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export function ExportarDados({
  dados,
  nomeArquivo,
}: {
  dados: Record<string, string | number>[];
  nomeArquivo: string;
}) {
  function exportar(formato: "csv" | "xlsx") {
    const planilha = XLSX.utils.json_to_sheet(dados);
    const livro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(livro, planilha, "Dados");
    XLSX.writeFile(livro, `${nomeArquivo}.${formato}`, {
      bookType: formato,
    });
  }

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        disabled={dados.length === 0}
        onClick={() => exportar("csv")}
      >
        <Download className="size-3.5" />
        CSV
      </Button>
      <Button
        variant="outline"
        size="sm"
        disabled={dados.length === 0}
        onClick={() => exportar("xlsx")}
      >
        <Download className="size-3.5" />
        Excel
      </Button>
    </div>
  );
}
