"use client";

import { useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { enviarArquivoRestauracao } from "./acoes";

export function FormularioRestaurar() {
  const [pendente, iniciarTransicao] = useTransition();
  const [resultado, setResultado] = useState<string>();
  const [erro, setErro] = useState<string>();
  const formRef = useRef<HTMLFormElement>(null);

  function enviar(formData: FormData) {
    setErro(undefined);
    setResultado(undefined);
    iniciarTransicao(async () => {
      const r = await enviarArquivoRestauracao(formData);
      if (r.erro) {
        setErro(r.erro);
        return;
      }
      setResultado(r.caminhoArquivo);
      formRef.current?.reset();
    });
  }

  return (
    <form ref={formRef} action={enviar} className="space-y-3">
      <Input type="file" name="arquivo" accept=".db" required disabled={pendente} />
      <Button type="submit" variant="outline" disabled={pendente}>
        {pendente ? "Enviando..." : "Enviar arquivo de backup"}
      </Button>
      {erro && <p className="text-sm text-destructive">{erro}</p>}
      {resultado && (
        <Card className="bg-muted/50">
          <CardContent className="pt-4 text-sm space-y-2">
            <p className="font-medium">Arquivo recebido com sucesso.</p>
            <p>Para concluir a restauração:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Desligue o sistema (feche o terminal ou pressione Ctrl+C).</li>
              <li>
                Na pasta do projeto, apague <code className="bg-background px-1 rounded">prisma/dev.db</code> e
                renomeie <code className="bg-background px-1 rounded">{resultado}</code> para{" "}
                <code className="bg-background px-1 rounded">dev.db</code>.
              </li>
              <li>Ligue o sistema novamente.</li>
            </ol>
          </CardContent>
        </Card>
      )}
    </form>
  );
}
