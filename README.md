# Gestão Financeira

Aplicação web para controle financeiro de prestadoras de serviço de pequeno
porte, pensada para uso rápido pelo celular — feita para substituir a
planilha do Sebrae. Este README é escrito para quem **não é desenvolvedor**:
segue o passo a passo para instalar, rodar e manter o sistema no dia a dia.

> Status do projeto: **completo** (Etapas 1 a 7). Todas as telas descritas no
> escopo original estão implementadas: lançamentos, clientes, mensalidades,
> dashboard, relatórios, divisão de lucro, assistente por regras (sem IA),
> importação de planilha e backup.

## O que você precisa ter instalado no computador

1. **Node.js** (versão 20 ou superior). Baixe em https://nodejs.org (escolha a
   versão "LTS"). Para verificar se já está instalado, abra o Prompt de
   Comando/PowerShell e digite:
   ```
   node -v
   ```

## Como instalar o projeto (só precisa fazer uma vez)

1. Abra o PowerShell na pasta do projeto.
2. Instale as dependências:
   ```
   npm install
   ```
3. Crie o arquivo de banco de dados (SQLite) com as tabelas do sistema:
   ```
   npm run db:push
   ```
4. Popule o banco com dados de exemplo (clientes, sócias, lançamentos fictícios,
   cobranças, despesas recorrentes) para você já poder explorar o sistema:
   ```
   npm run db:seed
   ```

## Como rodar o sistema no dia a dia

Sempre que quiser usar o sistema:

1. Abra o PowerShell na pasta do projeto.
2. Rode:
   ```
   npm run dev
   ```
3. Abra o navegador em **http://localhost:3000**.
4. Para acessar do celular na mesma rede Wi-Fi, use o endereço "Network" que
   aparece no terminal (algo como `http://192.168.x.x:3000`).
5. Para parar o sistema, volte ao PowerShell e pressione `Ctrl+C`.

### Login de teste (dados do seed)

| Perfil    | E-mail                  | Senha         |
|-----------|--------------------------|---------------|
| Admin     | victoria@empresa.com.br  | admin123      |
| Operadora | marina@empresa.com.br    | operadora123  |

Troque essas senhas em **Configurações → Usuários** assim que possível (só
o perfil Admin vê essa tela).

## Um tour rápido pelas telas

- **Dashboard** (`/`) — visão geral do mês: entradas, saídas, lucro, quanto
  falta receber e quem está atrasado, com gráfico dos últimos 12 meses.
- **Lançamentos** (`/lancamentos`) — toda entrada e saída de dinheiro. Toque
  em "Novo lançamento" (ou no botão flutuante no celular) para registrar algo
  em poucos toques.
- **Clientes** (`/clientes`) — cadastro de clientes avulsos e mensalistas.
- **Mensalidades** (`/mensalidades`) — a grade cliente × mês. Gere as
  cobranças do mês e marque pagamentos com um toque.
- **Divisão de lucro** (`/socios`) — quanto cada sócia pode retirar este mês,
  com a conta passo a passo.
- **Poupança** (`/poupanca`) — a reserva para os meses sem corrida. Mostra o
  saldo atual e permite registrar depósitos e retiradas. Cada movimento
  aparece também no fluxo de caixa normal (como saída ou entrada), então o
  saldo nunca fica desalinhado do resto do sistema.
- **Relatórios** (`/relatorios`) — comparativos, despesas por categoria,
  receita por cliente e inadimplência, com exportação em CSV/Excel.
- **Assistente** (`/assistente`) — converse em português: "paguei 50 de
  internet hoje", "quem falta me pagar esse mês?". Nada é gravado sem você
  confirmar antes.
- **Configurações** (`/config`) — dados da empresa, categorias, despesas
  recorrentes, usuários (só Admin), importação de planilha e backup.

Em todas as telas de lançamentos/relatórios existe um alternador **Caixa |
Competência** — Caixa mostra o dinheiro pelo dia em que entrou/saiu de fato;
Competência mostra pelo mês a que o valor se refere (útil quando um
pagamento chega atrasado, por exemplo).

## Importando sua planilha do Sebrae

Em **Configurações → Importar planilha**:

1. Envie o arquivo `.xlsx` ou `.csv`.
2. Associe cada coluna da sua planilha a um campo do sistema (o sistema já
   tenta adivinhar isso sozinho).
3. Confira a pré-visualização das primeiras linhas — problemas (data
   inválida, valor não numérico, cliente não encontrado) aparecem
   destacados.
4. Importe. Um resumo mostra quantos lançamentos entraram e quantos foram
   ignorados (e por quê).
5. Se algo sair errado, o lote inteiro pode ser revertido de uma vez, na
   mesma tela.

O sistema já lida com as pegadinhas comuns de planilha brasileira: vírgula
decimal, "R$" no meio do texto, datas gravadas como número pelo Excel,
linhas de total/cabeçalho repetidas no meio dos dados.

## Como fazer backup

**Pelo próprio sistema**: em **Configurações → Backup e restauração**, clique
em "Baixar backup agora" — baixa um arquivo `.db` com todos os dados.

**Manualmente**: o banco de dados inteiro é um único arquivo,
`prisma/dev.db`. Copiá-lo para um lugar seguro (pendrive, nuvem) já é um
backup completo.

**Para restaurar**: envie o arquivo de backup na mesma tela de
Configurações. Por segurança, o sistema não troca o banco em uso sozinho
enquanto está ligado (arriscaria corromper os dados) — a tela mostra o passo
a passo final: desligar o sistema, trocar o arquivo `prisma/dev.db` e ligar
de novo.

## Colocando no ar (hospedagem na Railway)

Este guia assume que você já tem uma conta na [Railway](https://railway.app).
O SQLite é mantido como está — o arquivo do banco vai morar num "Volume"
(disco persistente da Railway), que sobrevive a cada nova versão que você
publicar.

### 1. Suba o código para um repositório no GitHub

Se o projeto ainda não está num repositório Git remoto:

```
git init                              # se ainda não é um repositório git
git add .
git commit -m "Primeira versão"
```

Crie um repositório vazio no GitHub e siga as instruções que ele mostra para
enviar (`git remote add origin ...` e `git push`).

> Alternativa sem GitHub: instale a [Railway CLI](https://docs.railway.com/guides/cli)
> e rode `railway login` seguido de `railway up` na pasta do projeto — publica
> direto do seu computador, sem precisar de repositório. O restante do guia
> (volume, variáveis de ambiente, primeiro usuário) é igual.

### 2. Crie o projeto na Railway

1. No painel da Railway, **New Project → Deploy from GitHub repo** e escolha
   este repositório.
2. A Railway detecta sozinha que é um projeto Next.js e configura o build
   (`npm run build`) e o comando de start (`npm run start`).

### 3. Adicione um disco persistente (Volume) para o banco

Sem isso, o arquivo do SQLite seria apagado a cada nova versão publicada.

1. No serviço criado, vá em **Settings → Volumes → New Volume**.
2. Defina o "Mount path" como `/data`.

### 4. Configure as variáveis de ambiente

Em **Variables**, adicione:

| Nome            | Valor                                                        |
|------------------|---------------------------------------------------------------|
| `DATABASE_URL`   | `file:/data/producao.db` (caminho dentro do volume que você criou) |
| `SESSION_SECRET` | uma string longa e aleatória (ex.: gere uma em https://1password.com/password-generator) |

Salve — a Railway publica a primeira versão automaticamente.

### 5. Crie as tabelas e o primeiro usuário admin

Isso só precisa ser feito **uma vez**, logo após o primeiro deploy funcionar.
No painel da Railway, abra o **Shell** do serviço (ou use `railway run` pela
CLI a partir da pasta do projeto no seu computador) e rode, em sequência:

```
npm run db:push
npm run admin:criar
```

O segundo comando pergunta nome, e-mail e senha e cria seu usuário
administrador de verdade — **nunca rode `npm run db:seed` ou `db:reset` em
produção**, eles apagam tudo e recriam dados fictícios.

### 6. Gere o endereço público

Em **Settings → Networking → Generate Domain**. A Railway te dá um endereço
`algumacoisa.up.railway.app` pronto para usar (você pode apontar um domínio
próprio depois, na mesma tela).

### No dia a dia depois disso

- Cada `git push` para o repositório publica uma nova versão automaticamente.
- O arquivo do banco continua no volume entre uma versão e outra — nada se
  perde ao atualizar o sistema.
- Faça backups periódicos pelo próprio site: **Configurações → Backup e
  restauração → Baixar backup agora**.
- Se precisar gerenciar mais usuários depois, use a tela **Configurações →
  Usuários** (perfil Admin) — não precisa mais mexer no terminal.

## Comandos úteis

| Comando              | O que faz                                             |
|-----------------------|--------------------------------------------------------|
| `npm run dev`          | Liga o sistema para uso                                |
| `npm run build`        | Prepara uma versão otimizada (usado em produção)       |
| `npm run db:push`      | Cria/atualiza as tabelas do banco a partir do schema   |
| `npm run db:seed`      | Repovoa o banco com dados fictícios de exemplo         |
| `npm run db:reset`     | Apaga tudo e recria o banco do zero com dados de exemplo |
| `npm run db:studio`    | Abre uma tela visual para inspecionar o banco de dados |
| `npm run admin:criar`  | Cria o primeiro usuário administrador (uso em produção) |
| `npm test`             | Roda os testes automatizados do projeto (87+ testes)   |
| `npm run lint`         | Verifica a qualidade do código                         |

## Estrutura de pastas (para desenvolvedores)

- `prisma/schema.prisma` — modelo de dados.
- `prisma/seed.ts` — script que gera os dados fictícios.
- `src/app` — páginas (App Router do Next.js); cada pasta é uma rota.
- `src/components` — componentes de interface reutilizáveis (shadcn/ui em `ui/`).
- `src/lib` — helpers (dinheiro, datas, autenticação, banco de dados).
- `src/lib/assistente` — pipeline do assistente por regras (normalização,
  extração de valor/data/competência/nome, classificação de intenção).
- `src/lib/importacao` — normalização de planilhas importadas.

## Trocar SQLite por PostgreSQL no futuro

No arquivo `prisma/schema.prisma`, altere `provider = "sqlite"` para
`provider = "postgresql"` no bloco `datasource db`, e ajuste a variável
`DATABASE_URL` no arquivo `.env` para a string de conexão do PostgreSQL. Depois
rode `npm run db:push` novamente.

## Sobre o assistente (importante)

O assistente **não usa nenhuma inteligência artificial externa** — não há
chave de API, não há custo por uso, e ele funciona sem internet (além do
próprio site). Toda a interpretação das frases é feita por regras escritas em
código, testadas automaticamente. Ele nunca grava um lançamento sem você
clicar em "Confirmar" no cartão que aparece antes.
