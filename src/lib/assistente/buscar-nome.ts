import Fuse from "fuse.js";

export type ItemBusca = { id: string; nome: string; apelidos?: string | null };

export type ResultadoBusca<T extends ItemBusca> =
  | { situacao: "encontrado"; item: T }
  | { situacao: "ambiguo"; candidatos: T[] }
  | { situacao: "nao_encontrado" };

/**
 * Correspondência aproximada de um nome digitado contra uma lista de
 * clientes/sócios cadastrados (nome + apelidos), tolerando erro de
 * digitação e capitalização.
 */
export function buscarPorNome<T extends ItemBusca>(
  nomeDigitado: string,
  itens: T[]
): ResultadoBusca<T> {
  const termo = nomeDigitado.trim();
  if (!termo || itens.length === 0) return { situacao: "nao_encontrado" };

  // Um único campo de busca sintético (nome + apelidos): quando "apelidos"
  // é usado como chave separada e vem nulo em todos os itens, o Fuse
  // "penaliza" o score combinado e passa a ignorar o `threshold` — por
  // isso concatenamos tudo em uma string só antes de indexar.
  const itensComBusca = itens.map((item) => ({
    item,
    _busca: [item.nome, item.apelidos ?? ""].filter(Boolean).join(" "),
  }));

  const fuse = new Fuse(itensComBusca, {
    keys: ["_busca"],
    threshold: 0.4,
    includeScore: true,
    ignoreLocation: true,
  });

  const resultados = fuse.search(termo).map((r) => ({ ...r, item: r.item.item }));
  if (resultados.length === 0) return { situacao: "nao_encontrado" };

  const [primeiro, segundo] = resultados;
  const distinguivel = !segundo || (segundo.score ?? 1) - (primeiro.score ?? 0) > 0.2;

  if (distinguivel) return { situacao: "encontrado", item: primeiro.item };

  return { situacao: "ambiguo", candidatos: resultados.slice(0, 4).map((r) => r.item) };
}
