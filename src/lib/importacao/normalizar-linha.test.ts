import { describe, expect, it } from "vitest";
import { normalizarLinha } from "./normalizar-linha";
import type { MapeamentoColunas } from "./tipos";

const CABECALHOS = ["Data", "Descrição", "Valor", "Categoria"];
const MAPEAMENTO: MapeamentoColunas = {
  Data: "data",
  Descrição: "descricao",
  Valor: "valor",
  Categoria: "categoria",
};

describe("normalizarLinha", () => {
  it("reconhece vírgula decimal e R$ no meio do texto", () => {
    const r = normalizarLinha(1, { Data: "10/03/2025", Descrição: "Aluguel", Valor: "R$ 1.234,56", Categoria: "" }, MAPEAMENTO, CABECALHOS);
    expect(r.erros).toEqual([]);
    expect(r.valorCentavos).toBe(123456);
  });

  it("reconhece valor numérico puro vindo da planilha (célula formatada como número)", () => {
    const r = normalizarLinha(1, { Data: "10/03/2025", Descrição: "Aluguel", Valor: 340.5, Categoria: "" }, MAPEAMENTO, CABECALHOS);
    expect(r.valorCentavos).toBe(34050);
  });

  it("infere tipo pelo sinal do valor quando não há coluna de tipo mapeada", () => {
    const saida = normalizarLinha(1, { Data: "10/03/2025", Descrição: "Aluguel", Valor: -100, Categoria: "" }, MAPEAMENTO, CABECALHOS);
    expect(saida.tipo).toBe("SAIDA");
    const entrada = normalizarLinha(1, { Data: "10/03/2025", Descrição: "Venda", Valor: 100, Categoria: "" }, MAPEAMENTO, CABECALHOS);
    expect(entrada.tipo).toBe("ENTRADA");
  });

  it("converte data serializada do Excel (número de série)", () => {
    // 45000 = 05/03/2023 (conferido contra o Excel)
    const r = normalizarLinha(1, { Data: 45000, Descrição: "Aluguel", Valor: 100, Categoria: "" }, MAPEAMENTO, CABECALHOS);
    expect(r.dataCaixa?.getFullYear()).toBe(2023);
    expect(r.dataCaixa?.getMonth()).toBe(2); // março (0-indexado)
  });

  it("reconhece data no formato brasileiro dd/mm/aaaa", () => {
    const r = normalizarLinha(1, { Data: "05/03/2023", Descrição: "Aluguel", Valor: 100, Categoria: "" }, MAPEAMENTO, CABECALHOS);
    expect(r.dataCaixa).toEqual(new Date(2023, 2, 5));
  });

  it("ignora linha de total sem gerar erro", () => {
    const r = normalizarLinha(5, { Data: "", Descrição: "TOTAL GERAL", Valor: "15000,00", Categoria: "" }, MAPEAMENTO, CABECALHOS);
    expect(r.ignorada).toBe(true);
    expect(r.erros).toEqual([]);
  });

  it("ignora linha de cabeçalho repetida no meio dos dados", () => {
    const r = normalizarLinha(8, { Data: "Data", Descrição: "Descrição", Valor: "Valor", Categoria: "Categoria" }, MAPEAMENTO, CABECALHOS);
    expect(r.ignorada).toBe(true);
  });

  it("ignora linha totalmente vazia (célula mesclada deixando tudo em branco)", () => {
    const r = normalizarLinha(3, { Data: null, Descrição: null, Valor: null, Categoria: null }, MAPEAMENTO, CABECALHOS);
    expect(r.ignorada).toBe(true);
  });

  it("aponta erro quando o valor está ausente", () => {
    const r = normalizarLinha(2, { Data: "10/03/2025", Descrição: "Aluguel", Valor: "", Categoria: "" }, MAPEAMENTO, CABECALHOS);
    expect(r.ignorada).toBe(false);
    expect(r.erros).toContain("Valor ausente ou não numérico.");
  });

  it("aponta erro quando a data é inválida, mas não derruba a linha inteira", () => {
    const r = normalizarLinha(2, { Data: "não é uma data", Descrição: "Aluguel", Valor: "100", Categoria: "" }, MAPEAMENTO, CABECALHOS);
    expect(r.erros).toContain("Data inválida.");
    expect(r.valorCentavos).toBe(10000);
  });

  it("aponta erro quando falta descrição", () => {
    const r = normalizarLinha(2, { Data: "10/03/2025", Descrição: "", Valor: "100", Categoria: "" }, MAPEAMENTO, CABECALHOS);
    expect(r.erros).toContain("Descrição vazia.");
  });

  it("avisa (sem erro) quando não há coluna de data mapeada", () => {
    const mapeamentoSemData: MapeamentoColunas = { ...MAPEAMENTO, Data: "ignorar" };
    const r = normalizarLinha(2, { Data: "10/03/2025", Descrição: "Aluguel", Valor: "100", Categoria: "" }, mapeamentoSemData, CABECALHOS);
    expect(r.erros).toEqual([]);
    expect(r.avisos.length).toBeGreaterThan(0);
    expect(r.dataCaixa).toBeUndefined();
  });
});
