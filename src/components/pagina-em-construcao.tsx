import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function PaginaEmConstrucao({
  titulo,
  etapa,
}: {
  titulo: string;
  etapa: string;
}) {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">{titulo}</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Em construção</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Esta tela será implementada na {etapa}.
        </CardContent>
      </Card>
    </div>
  );
}
