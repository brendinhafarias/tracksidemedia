import { describe, expect, it } from "vitest";
import { formatarBRL, paraCentavos, somarCentavos, percentualDe } from "./dinheiro";

describe("paraCentavos", () => {
  it("converte inteiro simples", () => {
    expect(paraCentavos("2000")).toBe(200000);
  });

  it("converte decimal com vírgula", () => {
    expect(paraCentavos("340,50")).toBe(34050);
    expect(paraCentavos("340,00")).toBe(34000);
  });

  it("converte milhar com ponto e centavos com vírgula", () => {
    expect(paraCentavos("1.234,56")).toBe(123456);
  });

  it("converte milhar com ponto sem centavos", () => {
    expect(paraCentavos("2.000")).toBe(200000);
  });

  it("converte decimal com ponto (formato ambíguo, mas não é milhar)", () => {
    expect(paraCentavos("12.50")).toBe(1250);
  });

  it("ignora prefixo R$", () => {
    expect(paraCentavos("R$ 1.234,56")).toBe(123456);
  });

  it("string vazia ou inválida vira zero", () => {
    expect(paraCentavos("")).toBe(0);
    expect(paraCentavos("abc")).toBe(0);
  });
});

describe("formatarBRL", () => {
  it("formata centavos como moeda brasileira", () => {
    expect(formatarBRL(200000)).toBe("R$ 2.000,00");
    expect(formatarBRL(34050)).toBe("R$ 340,50");
  });
});

describe("somarCentavos", () => {
  it("soma uma lista de valores inteiros", () => {
    expect(somarCentavos([100, 200, 300])).toBe(600);
    expect(somarCentavos([])).toBe(0);
  });
});

describe("percentualDe", () => {
  it("calcula percentual arredondando para centavo", () => {
    expect(percentualDe(100000, 10)).toBe(10000);
    expect(percentualDe(90000, 60)).toBe(54000);
  });
});
