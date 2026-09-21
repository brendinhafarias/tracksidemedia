import "server-only";
import { cookies } from "next/headers";

export type Regime = "CAIXA" | "COMPETENCIA";

const NOME_COOKIE = "regime_financeiro";

export async function obterRegime(): Promise<Regime> {
  const store = await cookies();
  const valor = store.get(NOME_COOKIE)?.value;
  return valor === "COMPETENCIA" ? "COMPETENCIA" : "CAIXA";
}
