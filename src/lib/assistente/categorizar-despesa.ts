/**
 * Sugere, por palavras-chave, a categoria de uma despesa a partir do texto
 * (já normalizado) digitado pela usuária. Sempre devolve o nome de uma
 * categoria existente no seed padrão — o chamador resolve o id real
 * consultando a lista de categorias cadastradas.
 */
const REGRAS_CATEGORIA: { padrao: RegExp; categoria: string }[] = [
  { padrao: /\b(contado|contabil)/, categoria: "Contador" },
  { padrao: /\b(imposto|das|simples nacional|inss|fgts)\b/, categoria: "Impostos" },
  { padrao: /\b(advogad|juridic)/, categoria: "Advogado" },
  { padrao: /\b(designer|design|arte|criativo)\b/, categoria: "Designer" },
  { padrao: /\b(uber|taxi|locomocao|combustivel|gasolina|estacionamento|pedagio)\b/, categoria: "Locomoção etapas/Uber" },
  { padrao: /\b(aviao|passagem|onibus|voo|etapa)\b/, categoria: "Avião/ônibus etapas" },
  { padrao: /\b(hospedagem|hotel|pousada|airbnb)\b/, categoria: "Hospedagem" },
  { padrao: /\b(alimentacao|almoco|jantar|refeicao|restaurante)\b/, categoria: "Alimentação" },
  { padrao: /\b(equipamento|camera|lente|drone|microfone|tripe)\b/, categoria: "Equipamentos" },
  { padrao: /\b(uniforme|camisa|bone)\b/, categoria: "Uniforme" },
  { padrao: /\b(foto|estudio|book)\b/, categoria: "Fotos/Estúdio" },
  { padrao: /\b(freela|freelancer)\b/, categoria: "Pagamento Freelas" },
  { padrao: /\b(reembolso)\b/, categoria: "Reembolso sócias" },
  { padrao: /\b(poupanca)\b/, categoria: "Poupança - meses sem corrida" },
  { padrao: /\b(banco|tarifa|taxa bancaria|manutencao de conta)\b/, categoria: "Taxas bancárias" },
  { padrao: /\b(pro-?labore|prolabore|salario)\b/, categoria: "Pró-labore" },
];

export function sugerirNomeCategoriaDespesa(textoNormalizado: string): string {
  for (const regra of REGRAS_CATEGORIA) {
    if (regra.padrao.test(textoNormalizado)) return regra.categoria;
  }
  return "Outras despesas";
}
