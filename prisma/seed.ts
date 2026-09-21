import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function mesAnterior(mes: number, ano: number) {
  return mes === 1 ? { mes: 12, ano: ano - 1 } : { mes: mes - 1, ano };
}

async function main() {
  console.log("Limpando dados existentes...");
  await prisma.logAssistente.deleteMany();
  await prisma.distribuicao.deleteMany();
  await prisma.lancamento.deleteMany();
  await prisma.cobranca.deleteMany();
  await prisma.despesaRecorrente.deleteMany();
  await prisma.cliente.deleteMany();
  await prisma.categoria.deleteMany();
  await prisma.socio.deleteMany();
  await prisma.sessao.deleteMany();
  await prisma.usuario.deleteMany();
  await prisma.configEmpresa.deleteMany();

  console.log("Criando configuração da empresa...");
  await prisma.configEmpresa.create({
    data: {
      nomeEmpresa: "Trackside Media",
      percentualReserva: 10,
      regimePadrao: "CAIXA",
      diaFechamento: 1,
    },
  });

  console.log("Criando usuários...");
  const senhaAdmin = await bcrypt.hash("admin123", 10);
  const senhaOperadora = await bcrypt.hash("operadora123", 10);
  await prisma.usuario.create({
    data: {
      nome: "Victoria",
      email: "victoria@empresa.com.br",
      senhaHash: senhaAdmin,
      papel: "ADMIN",
    },
  });
  await prisma.usuario.create({
    data: {
      nome: "Marina",
      email: "marina@empresa.com.br",
      senhaHash: senhaOperadora,
      papel: "OPERADOR",
    },
  });

  console.log("Criando sócias...");
  const socia1 = await prisma.socio.create({
    data: { nome: "Victoria", percentualLucro: 50, proLaboreMensal: 300000 },
  });
  const socia2 = await prisma.socio.create({
    data: { nome: "Marina", percentualLucro: 50, proLaboreMensal: 300000 },
  });

  console.log("Criando categorias...");
  const categoriasBase: { nome: string; tipo: "ENTRADA" | "SAIDA"; cor: string }[] = [
    { nome: "Gestão de Mídias", tipo: "ENTRADA", cor: "#16a34a" },
    { nome: "Cobertura Real Time", tipo: "ENTRADA", cor: "#22c55e" },
    { nome: "Freelas", tipo: "ENTRADA", cor: "#4ade80" },
    { nome: "Retirada da poupança", tipo: "ENTRADA", cor: "#0ea5e9" },
    { nome: "Pró-labore", tipo: "SAIDA", cor: "#2563eb" },
    { nome: "Locomoção etapas/Uber", tipo: "SAIDA", cor: "#f59e0b" },
    { nome: "Designer", tipo: "SAIDA", cor: "#a855f7" },
    { nome: "Poupança - meses sem corrida", tipo: "SAIDA", cor: "#0ea5e9" },
    { nome: "Impostos", tipo: "SAIDA", cor: "#dc2626" },
    { nome: "Pagamento Freelas", tipo: "SAIDA", cor: "#fb923c" },
    { nome: "Reembolso sócias", tipo: "SAIDA", cor: "#eab308" },
    { nome: "Contador", tipo: "SAIDA", cor: "#9333ea" },
    { nome: "Uniforme", tipo: "SAIDA", cor: "#64748b" },
    { nome: "Fotos/Estúdio", tipo: "SAIDA", cor: "#ec4899" },
    { nome: "Hospedagem", tipo: "SAIDA", cor: "#8b5cf6" },
    { nome: "Avião/ônibus etapas", tipo: "SAIDA", cor: "#f97316" },
    { nome: "Alimentação", tipo: "SAIDA", cor: "#fbbf24" },
    { nome: "Equipamentos", tipo: "SAIDA", cor: "#06b6d4" },
    { nome: "Advogado", tipo: "SAIDA", cor: "#71717a" },
    { nome: "Taxas bancárias", tipo: "SAIDA", cor: "#64748b" },
    { nome: "Outras despesas", tipo: "SAIDA", cor: "#94a3b8" },
  ];
  const categorias: Record<string, Awaited<ReturnType<typeof prisma.categoria.create>>> = {};
  for (const c of categoriasBase) {
    categorias[c.nome] = await prisma.categoria.create({ data: c });
  }

  console.log("Criando clientes...");
  // Gestão de Mídias: contrato mensal recorrente (mapeia para MENSALISTA).
  const clientesMensalistas = [
    { nome: "Equipe Velocity Racing", valorMensal: 250000, diaVencimento: 5 },
    { nome: "Kart Prime Motorsport", valorMensal: 150000, diaVencimento: 10 },
    { nome: "Escuderia Trovão", valorMensal: 350000, diaVencimento: 15 },
    { nome: "Turbo Sports Team", valorMensal: 220000, diaVencimento: 20 },
  ];
  // Cobertura Real Time / freelas: cobrado por etapa/evento (mapeia para AVULSO).
  const clientesAvulsos = [
    { nome: "Piloto Rafael Munhoz" },
    { nome: "Equipe Rally Norte" },
    { nome: "Bia Ferraz (Freela)" },
    { nome: "Categoria SAE Kart" },
    { nome: "Grid Motorsport" },
  ];

  const clientes = [];
  for (const c of clientesMensalistas) {
    clientes.push(
      await prisma.cliente.create({
        data: {
          nome: c.nome,
          tipo: "MENSALISTA",
          valorMensal: c.valorMensal,
          diaVencimento: c.diaVencimento,
          observacoes: "Gestão de Mídias",
          email: `${c.nome.toLowerCase().replace(/[^a-z]+/g, ".")}@cliente.com.br`,
          telefone: "(11) 9" + Math.floor(1000_0000 + Math.random() * 8999_9999),
          dataInicio: new Date(2025, 0, 1),
        },
      })
    );
  }
  for (const c of clientesAvulsos) {
    clientes.push(
      await prisma.cliente.create({
        data: {
          nome: c.nome,
          tipo: "AVULSO",
          observacoes: "Cobertura Real Time",
          email: `${c.nome.toLowerCase().replace(/[^a-z]+/g, ".")}@cliente.com.br`,
          dataInicio: new Date(2025, 0, 1),
        },
      })
    );
  }

  const mensalistas = clientes.filter((c) => c.tipo === "MENSALISTA");
  const avulsos = clientes.filter((c) => c.tipo === "AVULSO");

  // 8 meses de histórico terminando no mês atual
  const hoje = new Date();
  let ref = { mes: hoje.getMonth() + 1, ano: hoje.getFullYear() };
  const meses: { mes: number; ano: number }[] = [];
  for (let i = 0; i < 8; i++) {
    meses.unshift(ref);
    ref = mesAnterior(ref.mes, ref.ano);
  }

  console.log("Gerando cobranças e lançamentos para 8 meses...");
  let contadorPagamento = 0;
  let indiceMes = 0;
  for (const { mes, ano } of meses) {
    const ehMesAtual = mes === hoje.getMonth() + 1 && ano === hoje.getFullYear();
    indiceMes++;

    for (const cliente of mensalistas) {
      const dataVencimento = new Date(ano, mes - 1, cliente.diaVencimento ?? 10);
      const cobranca = await prisma.cobranca.create({
        data: {
          clienteId: cliente.id,
          competenciaMes: mes,
          competenciaAno: ano,
          valorDevido: cliente.valorMensal ?? 0,
          dataVencimento,
          status: "ABERTA",
        },
      });

      contadorPagamento++;
      // Padrão: maioria paga, alguns atrasados/parciais/em aberto para dar realismo
      const padrao = contadorPagamento % 7;

      if (ehMesAtual && padrao !== 0) {
        // mês atual: deixa boa parte em aberto/atrasado, só alguns já pagos
        if (padrao === 1) {
          await criarPagamento(cliente.id, cobranca.id, cobranca.valorDevido, mes, ano, dataVencimento, -1);
          await prisma.cobranca.update({ where: { id: cobranca.id }, data: { status: "PAGA" } });
        }
        continue;
      }

      if (padrao === 0) {
        // sem pagamento (em aberto ou atrasado, conforme a data de vencimento)
        continue;
      } else if (padrao === 1) {
        // pagamento parcial
        const parcial = Math.round((cobranca.valorDevido / 2) * 100) / 100;
        await criarPagamento(cliente.id, cobranca.id, Math.round(parcial), mes, ano, dataVencimento, 3);
        await prisma.cobranca.update({ where: { id: cobranca.id }, data: { status: "PARCIAL" } });
      } else if (padrao === 2) {
        // pago com atraso
        await criarPagamento(cliente.id, cobranca.id, cobranca.valorDevido, mes, ano, dataVencimento, 6);
        await prisma.cobranca.update({ where: { id: cobranca.id }, data: { status: "PAGA" } });
      } else {
        // pago em dia
        await criarPagamento(cliente.id, cobranca.id, cobranca.valorDevido, mes, ano, dataVencimento, -2);
        await prisma.cobranca.update({ where: { id: cobranca.id }, data: { status: "PAGA" } });
      }
    }

    // Cobertura Real Time / freelas: receita por etapa, esporádica
    for (const cliente of avulsos) {
      if (Math.random() > 0.5) continue;
      const valor = 100000 + Math.floor(Math.random() * 5) * 30000;
      const dia = 5 + Math.floor(Math.random() * 20);
      const data = new Date(ano, mes - 1, dia);
      await prisma.lancamento.create({
        data: {
          tipo: "ENTRADA",
          valor,
          descricao: `Cobertura de etapa - ${cliente.nome}`,
          dataCaixa: data,
          competenciaMes: mes,
          competenciaAno: ano,
          categoriaId: categorias["Cobertura Real Time"].id,
          clienteId: cliente.id,
          formaPagamento: "PIX",
          status: "EFETIVADO",
          origem: "MANUAL",
        },
      });
    }

    // Despesas do mês
    const despesasDoMes: { descricao: string; valor: number; categoria: string; dia: number }[] = [
      { descricao: "DAS - Simples Nacional", valor: 15000, categoria: "Impostos", dia: 20 },
      { descricao: "Honorários contábeis", valor: 35000, categoria: "Contador", dia: 10 },
      { descricao: "Uber para etapas", valor: 15000, categoria: "Locomoção etapas/Uber", dia: 8 },
      { descricao: "Passagens aéreas para etapa", valor: 80000, categoria: "Avião/ônibus etapas", dia: 12 },
      { descricao: "Hospedagem na etapa", valor: 45000, categoria: "Hospedagem", dia: 12 },
      { descricao: "Freelancer de cobertura", valor: 60000, categoria: "Pagamento Freelas", dia: 15 },
      { descricao: "Arte para redes sociais", valor: 20000, categoria: "Designer", dia: 5 },
    ];
    for (const d of despesasDoMes) {
      const data = new Date(ano, mes - 1, d.dia);
      await prisma.lancamento.create({
        data: {
          tipo: "SAIDA",
          valor: d.valor,
          descricao: d.descricao,
          dataCaixa: ehMesAtual && d.dia > hoje.getDate() ? null : data,
          competenciaMes: mes,
          competenciaAno: ano,
          categoriaId: categorias[d.categoria].id,
          formaPagamento: "PIX",
          status: ehMesAtual && d.dia > hoje.getDate() ? "PREVISTO" : "EFETIVADO",
          origem: "MANUAL",
        },
      });
    }

    // Poupança para os meses sem corrida: depósito de R$3.600 em 3 dos 8 meses
    if (!ehMesAtual && indiceMes % 3 === 0) {
      await prisma.lancamento.create({
        data: {
          tipo: "SAIDA",
          valor: 360000,
          descricao: "Depósito na poupança (reserva para meses sem corrida)",
          dataCaixa: new Date(ano, mes - 1, 28),
          competenciaMes: mes,
          competenciaAno: ano,
          categoriaId: categorias["Poupança - meses sem corrida"].id,
          formaPagamento: "TRANSFERENCIA",
          status: "EFETIVADO",
          origem: "MANUAL",
        },
      });
    }

    // Pró-labore das sócias
    for (const socia of [socia1, socia2]) {
      const dia = 30;
      const dataPagamento = new Date(ano, mes - 1, Math.min(dia, 28));
      const efetivado = !ehMesAtual || dataPagamento <= hoje;
      const lancamento = await prisma.lancamento.create({
        data: {
          tipo: "SAIDA",
          valor: socia.proLaboreMensal ?? 0,
          descricao: `Pró-labore - ${socia.nome}`,
          dataCaixa: efetivado ? dataPagamento : null,
          competenciaMes: mes,
          competenciaAno: ano,
          categoriaId: categorias["Pró-labore"].id,
          socioId: socia.id,
          formaPagamento: "TRANSFERENCIA",
          status: efetivado ? "EFETIVADO" : "PREVISTO",
          origem: "MANUAL",
        },
      });
      await prisma.distribuicao.create({
        data: {
          socioId: socia.id,
          competenciaMes: mes,
          competenciaAno: ano,
          tipo: "PRO_LABORE",
          valor: socia.proLaboreMensal ?? 0,
          dataPagamento,
          lancamentoId: lancamento.id,
        },
      });
    }
  }

  // Exemplo deliberado de pagamento atrasado (caixa != competência), para que
  // o alternador Caixa/Competência tenha um efeito visível de verdade ao
  // explorar o sistema — sem isso, todo lançamento do seed cai no mesmo mês
  // nos dois regimes e a diferença nunca aparece na prática.
  console.log("Criando exemplo de pagamento atrasado (caixa != competência)...");
  const mesRef = mesAnterior(hoje.getMonth() + 1, hoje.getFullYear());
  const cobrancaAtrasada = await prisma.cobranca.findFirst({
    where: {
      competenciaMes: mesRef.mes,
      competenciaAno: mesRef.ano,
      status: { in: ["ABERTA", "PARCIAL"] },
      cliente: { tipo: "MENSALISTA" },
    },
  });
  if (cobrancaAtrasada) {
    await prisma.lancamento.create({
      data: {
        tipo: "ENTRADA",
        valor: cobrancaAtrasada.valorDevido,
        descricao: "Contrato recebido (com atraso, referente ao mês anterior)",
        dataCaixa: hoje,
        competenciaMes: cobrancaAtrasada.competenciaMes,
        competenciaAno: cobrancaAtrasada.competenciaAno,
        categoriaId: categorias["Gestão de Mídias"].id,
        clienteId: cobrancaAtrasada.clienteId,
        cobrancaId: cobrancaAtrasada.id,
        formaPagamento: "PIX",
        status: "EFETIVADO",
        origem: "MANUAL",
      },
    });
    await prisma.cobranca.update({ where: { id: cobrancaAtrasada.id }, data: { status: "PAGA" } });
  }

  console.log("Criando despesas recorrentes...");
  await prisma.despesaRecorrente.createMany({
    data: [
      { descricao: "Honorários contábeis", valor: 35000, categoriaId: categorias["Contador"].id, diaVencimento: 10 },
      { descricao: "Aluguel de equipamento de filmagem", valor: 18000, categoriaId: categorias["Equipamentos"].id, diaVencimento: 5 },
    ],
  });

  async function criarPagamento(
    clienteId: string,
    cobrancaId: string,
    valor: number,
    competenciaMes: number,
    competenciaAno: number,
    dataVencimento: Date,
    deltaDias: number
  ) {
    const data = new Date(dataVencimento);
    data.setDate(data.getDate() + deltaDias);
    await prisma.lancamento.create({
      data: {
        tipo: "ENTRADA",
        valor,
        descricao: "Contrato de gestão de mídias recebido",
        dataCaixa: data,
        competenciaMes,
        competenciaAno,
        categoriaId: categorias["Gestão de Mídias"].id,
        clienteId,
        cobrancaId,
        formaPagamento: "PIX",
        status: "EFETIVADO",
        origem: "MANUAL",
      },
    });
  }

  console.log("Seed concluído com sucesso.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
