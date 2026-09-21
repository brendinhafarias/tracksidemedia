import { describe, expect, it } from "vitest";
import { statusExibicaoCobranca } from "./cobranca-status";

const HOJE = new Date(2026, 8, 15); // 15/09/2026

describe("statusExibicaoCobranca", () => {
  it("sem cobrança retorna SEM_COBRANCA", () => {
    expect(statusExibicaoCobranca(null, HOJE)).toBe("SEM_COBRANCA");
    expect(statusExibicaoCobranca(undefined, HOJE)).toBe("SEM_COBRANCA");
  });

  it("cobrança paga permanece PAGA mesmo se o vencimento já passou", () => {
    const cobranca = { status: "PAGA", dataVencimento: new Date(2026, 8, 1) };
    expect(statusExibicaoCobranca(cobranca, HOJE)).toBe("PAGA");
  });

  it("cobrança cancelada permanece CANCELADA", () => {
    const cobranca = { status: "CANCELADA", dataVencimento: new Date(2026, 8, 1) };
    expect(statusExibicaoCobranca(cobranca, HOJE)).toBe("CANCELADA");
  });

  it("ABERTA com vencimento no futuro fica ABERTA", () => {
    const cobranca = { status: "ABERTA", dataVencimento: new Date(2026, 8, 20) };
    expect(statusExibicaoCobranca(cobranca, HOJE)).toBe("ABERTA");
  });

  it("ABERTA com vencimento no passado vira ATRASADA (não persistido, só exibição)", () => {
    const cobranca = { status: "ABERTA", dataVencimento: new Date(2026, 8, 1) };
    expect(statusExibicaoCobranca(cobranca, HOJE)).toBe("ATRASADA");
  });

  it("PARCIAL com vencimento no passado vira ATRASADA", () => {
    const cobranca = { status: "PARCIAL", dataVencimento: new Date(2026, 7, 20) };
    expect(statusExibicaoCobranca(cobranca, HOJE)).toBe("ATRASADA");
  });

  it("PARCIAL ainda dentro do prazo continua PARCIAL", () => {
    const cobranca = { status: "PARCIAL", dataVencimento: new Date(2026, 8, 30) };
    expect(statusExibicaoCobranca(cobranca, HOJE)).toBe("PARCIAL");
  });

  it("vencimento é exatamente hoje ainda não conta como atrasado", () => {
    const cobranca = { status: "ABERTA", dataVencimento: new Date(2026, 8, 15) };
    expect(statusExibicaoCobranca(cobranca, HOJE)).toBe("ABERTA");
  });
});
