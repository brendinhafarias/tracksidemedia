import { describe, expect, it } from "vitest";
import { buscarPorNome, type ItemBusca } from "./buscar-nome";

const CLIENTES: ItemBusca[] = [
  { id: "1", nome: "João Pereira", apelidos: null },
  { id: "2", nome: "Maria Fernandes", apelidos: null },
  { id: "3", nome: "Padaria Bom Pão", apelidos: null },
  { id: "4", nome: "Mercado Silva", apelidos: null },
  { id: "5", nome: "Mercado São José", apelidos: "zezinho" },
];

describe("buscarPorNome", () => {
  it("encontra um nome digitado corretamente", () => {
    const r = buscarPorNome("maria", CLIENTES);
    expect(r.situacao).toBe("encontrado");
    if (r.situacao === "encontrado") expect(r.item.nome).toBe("Maria Fernandes");
  });

  it("tolera erro de digitação e capitalização", () => {
    const r = buscarPorNome("joao", CLIENTES);
    expect(r.situacao).toBe("encontrado");
    if (r.situacao === "encontrado") expect(r.item.nome).toBe("João Pereira");
  });

  it("não confunde nomes parecidos quando o termo é distinto o bastante", () => {
    const r = buscarPorNome("padaria", CLIENTES);
    expect(r.situacao).toBe("encontrado");
    if (r.situacao === "encontrado") expect(r.item.nome).toBe("Padaria Bom Pão");
  });

  it("encontra por apelido", () => {
    const r = buscarPorNome("zezinho", CLIENTES);
    expect(r.situacao).toBe("encontrado");
    if (r.situacao === "encontrado") expect(r.item.nome).toBe("Mercado São José");
  });

  it("retorna não_encontrado para termos sem nenhuma correspondência", () => {
    const r = buscarPorNome("xyz123abc", CLIENTES);
    expect(r.situacao).toBe("nao_encontrado");
  });

  it("lista vazia sempre retorna não_encontrado", () => {
    expect(buscarPorNome("qualquer", []).situacao).toBe("nao_encontrado");
  });

  it("termo vazio retorna não_encontrado", () => {
    expect(buscarPorNome("   ", CLIENTES).situacao).toBe("nao_encontrado");
  });

  it("apelidos nulos em todos os itens não inflam o score além do threshold", () => {
    // regressão: um bug anterior fazia a chave "apelidos" nula em todos os
    // itens invalidar o filtro de threshold do Fuse, retornando qualquer
    // termo digitado como correspondência de baixa qualidade.
    const r = buscarPorNome("nenhuma correspondencia mesmo assim", CLIENTES);
    expect(r.situacao).toBe("nao_encontrado");
  });
});
