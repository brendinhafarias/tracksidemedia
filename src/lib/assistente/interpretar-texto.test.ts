import { describe, expect, it } from "vitest";
import { interpretarTexto } from "./interpretar-texto";

const HOJE = new Date(2026, 8, 15); // 15/09/2026

describe("interpretarTexto — frases de ponta a ponta", () => {
  it('"quem falta me pagar esse mês?" -> consulta de inadimplência', () => {
    const r = interpretarTexto("quem falta me pagar esse mês?", HOJE);
    expect(r.acao).toBe("CONSULTA_INADIMPLENCIA");
  });

  it('"cliente X me pagou 2000 reais hoje referente ao mês passado" -> registrar pagamento', () => {
    const r = interpretarTexto(
      "cliente X me pagou 2000 reais hoje referente ao mês passado",
      HOJE
    );
    expect(r.acao).toBe("REGISTRAR_PAGAMENTO");
    if (r.acao !== "REGISTRAR_PAGAMENTO") throw new Error("tipo inesperado");
    expect(r.nomeCliente).toBe("cliente x");
    expect(r.valorCentavos).toBe(200000);
    expect(r.data.getDate()).toBe(15);
    expect(r.competenciaMes).toBe(8);
    expect(r.competenciaAno).toBe(2026);
  });

  it('"paguei 340 de contador ontem" -> registrar despesa', () => {
    const r = interpretarTexto("paguei 340 de contador ontem", HOJE);
    expect(r.acao).toBe("REGISTRAR_DESPESA");
    if (r.acao !== "REGISTRAR_DESPESA") throw new Error("tipo inesperado");
    expect(r.valorCentavos).toBe(34000);
    expect(r.data.getDate()).toBe(14);
    expect(r.textoNormalizado).toContain("contador");
  });

  it('"quanto lucrei em março?" -> resumo financeiro do mês', () => {
    const r = interpretarTexto("quanto lucrei em março?", HOJE);
    expect(r.acao).toBe("CONSULTA_RESUMO_MES");
    if (r.acao !== "CONSULTA_RESUMO_MES") throw new Error("tipo inesperado");
    expect(r.mes).toBe(3);
    expect(r.ano).toBe(2026);
  });

  it('"a Maria tá em dia?" -> situação de cliente', () => {
    const r = interpretarTexto("a Maria tá em dia?", HOJE);
    expect(r.acao).toBe("CONSULTA_SITUACAO_CLIENTE");
    if (r.acao !== "CONSULTA_SITUACAO_CLIENTE") throw new Error("tipo inesperado");
    expect(r.nomeCliente).toContain("maria");
  });

  it('"recebi 1.500 do João, metade de agosto" -> pagamento parcial vinculável', () => {
    const r = interpretarTexto("recebi 1.500 do João, metade de agosto", HOJE);
    expect(r.acao).toBe("REGISTRAR_PAGAMENTO");
    if (r.acao !== "REGISTRAR_PAGAMENTO") throw new Error("tipo inesperado");
    expect(r.nomeCliente).toBe("joao");
    expect(r.valorCentavos).toBe(150000);
    expect(r.competenciaMes).toBe(8);
  });

  it('"quanto cada sócia tem pra retirar?" -> divisão de lucro', () => {
    const r = interpretarTexto("quanto cada sócia tem pra retirar?", HOJE);
    expect(r.acao).toBe("CONSULTA_DIVISAO_LUCRO");
  });

  it('"Maria pagou?" (com interrogação) é consulta, não lançamento', () => {
    const r = interpretarTexto("Maria pagou?", HOJE);
    expect(r.acao).toBe("CONSULTA_SITUACAO_CLIENTE");
  });

  it('"retirei 500 hoje" -> retirada de sócio sem nome (ambíguo, resolvido depois)', () => {
    const r = interpretarTexto("retirei 500 hoje", HOJE);
    expect(r.acao).toBe("REGISTRAR_RETIRADA_SOCIO");
    if (r.acao !== "REGISTRAR_RETIRADA_SOCIO") throw new Error("tipo inesperado");
    expect(r.nomeSocio).toBeNull();
    expect(r.valorCentavos).toBe(50000);
  });

  it('"Beatriz tirou 300 de pró-labore" -> retirada de sócio com nome', () => {
    const r = interpretarTexto("Beatriz tirou 300 de pró-labore", HOJE);
    expect(r.acao).toBe("REGISTRAR_RETIRADA_SOCIO");
    if (r.acao !== "REGISTRAR_RETIRADA_SOCIO") throw new Error("tipo inesperado");
    expect(r.nomeSocio).toBe("beatriz");
  });

  it("frase sem padrão reconhecido cai em NAO_RECONHECIDO", () => {
    const r = interpretarTexto("blablabla isso nao quer dizer nada", HOJE);
    expect(r.acao).toBe("NAO_RECONHECIDO");
  });

  it("despesa sem valor extraído mantém valorCentavos nulo (fallback na camada de app)", () => {
    const r = interpretarTexto("paguei o contador", HOJE);
    expect(r.acao).toBe("REGISTRAR_DESPESA");
    if (r.acao !== "REGISTRAR_DESPESA") throw new Error("tipo inesperado");
    expect(r.valorCentavos).toBeNull();
  });
});
