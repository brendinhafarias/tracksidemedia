import { describe, expect, it } from "vitest";
import { converterNumerosPorExtenso } from "./numeros-por-extenso";

describe("converterNumerosPorExtenso", () => {
  it("converte números simples", () => {
    expect(converterNumerosPorExtenso("dois mil")).toBe("2000");
    expect(converterNumerosPorExtenso("mil e quinhentos")).toBe("1500");
    expect(converterNumerosPorExtenso("mil")).toBe("1000");
  });

  it("converte dezenas e centenas", () => {
    expect(converterNumerosPorExtenso("cento e vinte")).toBe("120");
    expect(converterNumerosPorExtenso("novecentos e noventa e nove")).toBe("999");
    expect(converterNumerosPorExtenso("trezentos")).toBe("300");
  });

  it("converte números de 10 a 19", () => {
    expect(converterNumerosPorExtenso("quinze")).toBe("15");
    expect(converterNumerosPorExtenso("dezenove")).toBe("19");
  });

  it("preserva o restante da frase intacto", () => {
    expect(converterNumerosPorExtenso("recebi dois mil do joao")).toBe("recebi 2000 do joao");
    expect(converterNumerosPorExtenso("paguei mil e quinhentos de aluguel")).toBe(
      "paguei 1500 de aluguel"
    );
  });

  it('não converte "N mil" quando N já é dígito (fica para o extrairValor)', () => {
    expect(converterNumerosPorExtenso("2 mil")).toBe("2 mil");
    expect(converterNumerosPorExtenso("2,5 mil")).toBe("2,5 mil");
  });

  it('não trata "um"/"uma" como número (são artigos na maioria das frases)', () => {
    expect(converterNumerosPorExtenso("um cliente pagou")).toBe("um cliente pagou");
    expect(converterNumerosPorExtenso("uma cobranca")).toBe("uma cobranca");
  });

  it("não altera texto sem números por extenso", () => {
    expect(converterNumerosPorExtenso("quem falta me pagar esse mes")).toBe(
      "quem falta me pagar esse mes"
    );
  });
});
