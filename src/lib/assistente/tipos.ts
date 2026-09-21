export type IntencaoBruta =
  | { acao: "CONSULTA_INADIMPLENCIA" }
  | { acao: "CONSULTA_SITUACAO_CLIENTE"; nomeCliente: string }
  | { acao: "CONSULTA_RESUMO_MES"; mes: number; ano: number }
  | { acao: "CONSULTA_DIVISAO_LUCRO" }
  | {
      acao: "REGISTRAR_PAGAMENTO";
      nomeCliente: string | null;
      valorCentavos: number | null;
      data: Date;
      competenciaMes: number;
      competenciaAno: number;
      textoOriginal: string;
    }
  | {
      acao: "REGISTRAR_DESPESA";
      valorCentavos: number | null;
      data: Date;
      competenciaMes: number;
      competenciaAno: number;
      textoOriginal: string;
      textoNormalizado: string;
    }
  | {
      acao: "REGISTRAR_RETIRADA_SOCIO";
      subtipo: "PRO_LABORE" | "ADIANTAMENTO";
      nomeSocio: string | null;
      valorCentavos: number | null;
      data: Date;
      competenciaMes: number;
      competenciaAno: number;
      textoOriginal: string;
    }
  | { acao: "NAO_RECONHECIDO"; textoOriginal: string };
