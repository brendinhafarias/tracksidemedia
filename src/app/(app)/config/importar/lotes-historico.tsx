"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatarDataHora } from "@/lib/data";
import { reverterLoteImportacao, type LoteImportado } from "./acoes";

export function LotesHistorico({ lotes }: { lotes: LoteImportado[] }) {
  const [pendente, iniciarTransicao] = useTransition();
  const router = useRouter();

  if (lotes.length === 0) return null;

  function reverter(loteId: string) {
    iniciarTransicao(async () => {
      const r = await reverterLoteImportacao(loteId);
      toast.success(`${r.quantidade} lançamento(s) revertido(s).`);
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Lotes importados</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {lotes.map((lote) => (
          <div key={lote.loteId} className="flex items-center justify-between gap-2 rounded-md border p-3 text-sm">
            <div>
              <p>{lote.quantidade} lançamento(s)</p>
              <p className="text-xs text-muted-foreground">{formatarDataHora(lote.criadoEm)}</p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger render={<Button variant="ghost" size="sm" className="text-destructive" disabled={pendente} />}>
                Reverter lote
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reverter este lote de importação?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Todos os {lote.quantidade} lançamentos importados juntos
                    serão cancelados (não excluídos — o histórico é mantido).
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Voltar</AlertDialogCancel>
                  <AlertDialogAction onClick={() => reverter(lote.loteId)}>Reverter</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
