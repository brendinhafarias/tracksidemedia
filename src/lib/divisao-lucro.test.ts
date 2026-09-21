import { describe, expect, it } from "vitest";
import { calcularDivisaoLucro } from "./divisao-lucro";

describe("calcularDivisaoLucro", () => {
  it("calcula reserva e cotas proporcionais ao percentual de cada sócio", () => {
    // lucro de R$ 10.000,00, reserva de 10%, sócias 60/40
    const r = calcularDivisaoLucro(1000000, 10, [
      { id: "a", percentualLucro: 60 },
      { id: "b", percentualLucro: 40 },
    ]);

    expect(r.valorReserva).toBe(100000); // R$ 1.000,00
    expect(r.valorDistribuivel).toBe(900000); // R$ 9.000,00
    expect(r.cotas).toEqual([
      { socioId: "a", valor: 540000 }, // 60% de 9.000
      { socioId: "b", valor: 360000 }, // 40% de 9.000
    ]);
  });

  it("não distribui nada quando o lucro é zero ou negativo", () => {
    const zerado = calcularDivisaoLucro(0, 10, [{ id: "a", percentualLucro: 100 }]);
    expect(zerado.valorDistribuivel).toBe(0);
    expect(zerado.cotas).toEqual([{ socioId: "a", valor: 0 }]);

    const negativo = calcularDivisaoLucro(-50000, 10, [{ id: "a", percentualLucro: 100 }]);
    expect(negativo.valorReserva).toBe(0);
    expect(negativo.valorDistribuivel).toBe(0);
  });

  it("funciona sem reserva configurada (0%)", () => {
    const r = calcularDivisaoLucro(100000, 0, [{ id: "a", percentualLucro: 100 }]);
    expect(r.valorReserva).toBe(0);
    expect(r.valorDistribuivel).toBe(100000);
    expect(r.cotas).toEqual([{ socioId: "a", valor: 100000 }]);
  });

  it("lista vazia de sócios não quebra e não gera cotas", () => {
    const r = calcularDivisaoLucro(100000, 10, []);
    expect(r.cotas).toEqual([]);
    expect(r.valorDistribuivel).toBe(90000);
  });
});
