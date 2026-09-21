import { describe, expect, it } from "vitest";
import { extrairValor } from "./extrair-valor";
import { normalizarTexto } from "./normalizar";

/** Normaliza (incluindo conversão de números por extenso) antes de extrair, como no pipeline real. */
function valor(texto: string): number | null {
  return extrairValor(normalizarTexto(texto).normalizado);
}

describe("extrairValor", () => {
  it("reconhece inteiro simples", () => {
    expect(valor("2000")).toBe(200000);
    expect(valor("paguei 340 de contador ontem")).toBe(34000);
  });

  it("reconhece separador de milhar com ponto", () => {
    expect(valor("2.000")).toBe(200000);
    expect(valor("1.234")).toBe(123400);
  });

  it("reconhece decimal com vírgula", () => {
    expect(valor("2000,50")).toBe(200050);
    expect(valor("340,00")).toBe(34000);
  });

  it("reconhece milhar com ponto e centavos", () => {
    expect(valor("2.000,00")).toBe(200000);
    expect(valor("1.234,56")).toBe(123456);
  });

  it("reconhece prefixo R$", () => {
    expect(valor("R$ 2.000,00")).toBe(200000);
    expect(valor("r$2000")).toBe(200000);
  });

  it('reconhece "N mil"', () => {
    expect(valor("2 mil")).toBe(200000);
    expect(valor("2,5 mil")).toBe(250000);
  });

  it('reconhece "Nk"', () => {
    expect(valor("2k")).toBe(200000);
  });

  it("reconhece números por extenso", () => {
    expect(valor("dois mil")).toBe(200000);
    expect(valor("mil e quinhentos")).toBe(150000);
    expect(valor("recebi mil e quinhentos do joao")).toBe(150000);
  });

  it("retorna null quando não há valor", () => {
    expect(valor("paguei o contador ontem")).toBeNull();
    expect(valor("")).toBeNull();
  });

  it("não confunde artigo 'um/uma' com valor", () => {
    expect(valor("um cliente pagou 200 reais")).toBe(20000);
  });
});
