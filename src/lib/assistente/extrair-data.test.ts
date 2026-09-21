import { describe, expect, it } from "vitest";
import { extrairData } from "./extrair-data";
import { normalizarTexto } from "./normalizar";

const HOJE = new Date(2026, 8, 15); // 15/09/2026 (mês 0-indexado)

function data(texto: string): Date | null {
  return extrairData(normalizarTexto(texto).normalizado, HOJE);
}

function iso(d: Date | null): string | null {
  if (!d) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

describe("extrairData", () => {
  it('reconhece "hoje"', () => {
    expect(iso(data("paguei hoje"))).toBe("2026-09-15");
  });

  it('reconhece "ontem"', () => {
    expect(iso(data("paguei ontem"))).toBe("2026-09-14");
  });

  it('reconhece "anteontem"', () => {
    expect(iso(data("paguei anteontem"))).toBe("2026-09-13");
  });

  it('reconhece "semana passada"', () => {
    expect(iso(data("recebi semana passada"))).toBe("2026-09-08");
  });

  it('reconhece "dia N"', () => {
    expect(iso(data("paguei dia 5"))).toBe("2026-09-05");
  });

  it('reconhece "dia N" com mês por extenso', () => {
    expect(iso(data("paguei dia 5 de marco"))).toBe("2026-03-05");
  });

  it("reconhece dd/mm", () => {
    expect(iso(data("paguei em 5/3"))).toBe("2026-03-05");
  });

  it("reconhece dd/mm/aaaa", () => {
    expect(iso(data("paguei em 05/03/2025"))).toBe("2025-03-05");
  });

  it("retorna null quando não há data", () => {
    expect(data("paguei o contador")).toBeNull();
  });
});
