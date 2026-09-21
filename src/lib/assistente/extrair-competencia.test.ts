import { describe, expect, it } from "vitest";
import { extrairCompetencia } from "./extrair-competencia";
import { normalizarTexto } from "./normalizar";

const DATA_CAIXA = new Date(2026, 8, 15); // 15/09/2026

function competencia(texto: string) {
  return extrairCompetencia(normalizarTexto(texto).normalizado, DATA_CAIXA);
}

describe("extrairCompetencia", () => {
  it("usa o mês da data de caixa quando nada é dito", () => {
    expect(competencia("recebi 200 de maria")).toEqual({ mes: 9, ano: 2026 });
  });

  it('reconhece "mes passado"', () => {
    expect(competencia("referente ao mes passado")).toEqual({ mes: 8, ano: 2026 });
  });

  it('reconhece "mes retrasado"', () => {
    expect(competencia("referente ao mes retrasado")).toEqual({ mes: 7, ano: 2026 });
  });

  it('reconhece "referente a marco" (mês já passado neste ano)', () => {
    expect(competencia("referente a marco")).toEqual({ mes: 3, ano: 2026 });
  });

  it('reconhece "de agosto"', () => {
    expect(competencia("metade de agosto")).toEqual({ mes: 8, ano: 2026 });
  });

  it("assume o ano anterior quando o mês citado ainda não ocorreu neste ano", () => {
    // data de caixa em setembro/2026; "dezembro" ainda não aconteceu em 2026
    // sob a perspectiva de "já ocorreu", mas dezembro é DEPOIS de setembro
    // então cai no ano anterior segundo a regra (mês futuro = ano passado)
    expect(competencia("referente a dezembro")).toEqual({ mes: 12, ano: 2025 });
  });

  it("mês retrasado atravessa a virada de ano corretamente", () => {
    const dataJaneiro = new Date(2026, 0, 10); // 10/01/2026
    const resultado = extrairCompetencia(
      normalizarTexto("mes retrasado").normalizado,
      dataJaneiro
    );
    expect(resultado).toEqual({ mes: 11, ano: 2025 });
  });
});
