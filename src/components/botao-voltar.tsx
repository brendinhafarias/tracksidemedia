import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export function BotaoVoltar({ href }: { href: string }) {
  return (
    <Button variant="ghost" size="icon" render={<Link href={href} />}>
      <ArrowLeft className="size-4" />
    </Button>
  );
}
