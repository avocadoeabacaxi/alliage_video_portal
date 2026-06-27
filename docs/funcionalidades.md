# Portal de Captação — Alliage Experience
## Documento de Funcionalidades

---

## O que é o sistema

O **Portal de Captação Alliage Experience** é uma plataforma web interna desenvolvida para a equipe de produção de conteúdo da Alliage. Seu objetivo é organizar e acompanhar todo o processo de gravação dos vídeos das **5 trilhas Alliage Experience** — Dabi Atlante, Saevo, PreXion, Alliage Gestão e Alliage Técnico — desde o planejamento até a publicação final.

O sistema centraliza 653 conteúdos mapeados em planilha, permite que a equipe registre o andamento de cada gravação em tempo real, visualize o progresso geral e individual por trilha, e organize o cronograma de gravações em um calendário mensal.

O acesso é protegido por autenticação OAuth (conta Manus), garantindo que apenas membros autorizados da equipe possam visualizar e editar os dados.

---

## Módulos e Funcionalidades

### 1. Dashboard — Visão Geral da Captação

A tela inicial do portal apresenta um painel executivo com os principais indicadores de progresso da captação:

- **Cards de resumo** com os totais de conteúdos por status: total cadastrado, gravados, em produção (edição + aprovação) e publicados.
- **Barras de progresso geral** mostrando o percentual de conteúdos já gravados e publicados em relação ao total.
- **Gráfico "Gravados x Pendentes por trilha"** — comparativo horizontal de quantos conteúdos de cada trilha já foram gravados versus os que ainda estão pendentes.
- **Gráfico "Distribuição por status"** — gráfico de rosca com a proporção de conteúdos em cada etapa do fluxo (A gravar, Gravado, Em edição, Aprovação, Publicado).
- **Ranking de responsáveis** — lista dos membros da equipe que mais gravaram conteúdos, com contagem individual.

---

### 2. Lista de Conteúdos

Página com todos os 653 conteúdos cadastrados, com recursos avançados de navegação e filtragem:

- **Busca por título** — campo de texto para localizar conteúdos pelo nome.
- **Filtros combinados** — é possível filtrar simultaneamente por:
  - Trilha (Dabi Atlante, Saevo, PreXion, Alliage Gestão, Alliage Técnico)
  - Status (A gravar, Gravado, Em edição, Aprovação, Publicado)
  - Prioridade (Alta, Média, Baixa)
  - Trimestre (Q1, Q2, Q3, Q4)
  - Responsável (quem gravou)
  - Categoria Hero (Odontologia Digital, Excelência Clínica, Negócios e Carreiras)
- **Paginação** — exibe 20 conteúdos por vez com botão "Carregar mais 20", preservando os filtros ativos.
- **Destaque visual** — cards de conteúdos marcados como Categoria Hero recebem borda e fundo dourado para fácil identificação.
- **Acesso à ficha** — clicar em qualquer card abre a ficha detalhada do conteúdo.

---

### 3. Ficha Detalhada do Conteúdo

Tela central de trabalho da equipe. Ao acessar um conteúdo, são exibidas duas colunas:

**Coluna esquerda — Pauta do conteúdo (dados da planilha, somente leitura):**
- Gancho de 15 segundos (destaque visual)
- Tópicos numerados do roteiro
- Dado de mercado
- CTA (chamada para ação)
- Palavras-chave
- Público-alvo, formato de produção e porta-voz

**Coluna direita — Gestão da produção (editável pela equipe):**

#### Fluxo de Status
Representa as etapas do ciclo de vida de cada conteúdo: **A gravar → Gravado → Em edição → Aprovação → Publicado**. A equipe avança o status clicando na etapa desejada. Ao marcar como "Gravado", um modal é exibido para coletar dados da gravação.

#### Modal de Gravação
Ao marcar um conteúdo como "Gravado", o sistema abre automaticamente um formulário para registrar:
- Quem apareceu na filmagem: **Pessoa real**, **IA** ou **Off / Locução**
- Nome da pessoa filmada (obrigatório quando "Pessoa real")
- Local onde foi gravado

O nome do membro da equipe que realizou o registro é salvo automaticamente como responsável.

#### Card "Quem gravou"
Exibe o nome do responsável pela gravação, a data em que foi registrada, o formato de aparição, a pessoa filmada e o local. Quando ainda não há registro, informa que será preenchido automaticamente ao marcar como "Gravado".

- **Renomear responsável** — botão "renomear" ao lado do nome permite corrigir ou atualizar o nome registrado via edição inline, sem precisar refazer o fluxo de status.

#### Campos editáveis — Registros da equipe
- **Categoria Hero** — seletor visual com três opções (Odontologia Digital, Excelência Clínica, Negócios e Carreiras), identificadas por ícones. Quando selecionada, exibe uma badge dourada no cabeçalho da ficha.
- **Data agendada** — data prevista para a gravação, que aparece no calendário da Agenda. Inclui botão **"Zerar"** para remover o agendamento.
- **Data de gravação realizada** — data em que a gravação de fato ocorreu. Inclui botão **"Zerar"** para limpar o campo quando a data não for mais válida.
- **Quem apareceu na filmagem** — seletor de formato (Pessoa real / IA / Off / Locução).
- **Nome da pessoa que apareceu** — campo de texto (exibido apenas quando "Pessoa real").
- **Onde foi gravado** — local da gravação (estúdio, sede, externa etc.).
- **Observações** — campo livre para notas da equipe (roteiro entregue, apresentação em PDF, instruções especiais etc.).
- **Link de aprovação** — URL para o vídeo enviado para aprovação, com validação de formato e botão de acesso direto.
- **Link do vídeo final** — URL do vídeo publicado ou finalizado, com validação de formato e botão de acesso direto.

---

### 4. Agenda — Cronograma Mensal

Calendário visual que permite à equipe planejar e acompanhar as gravações mês a mês:

- **Navegação por mês** — botões para avançar e retroceder entre os meses.
- **Células do calendário** — cada dia exibe um contador com o número de gravações agendadas. Dias com conteúdos marcados como Categoria Hero recebem borda dourada.
- **Painel lateral** — ao clicar em um dia, o painel direito exibe a lista de conteúdos agendados para aquela data, com título, trilha, status e, quando aplicável, a badge dourada de Categoria Hero.
- **Agendamento pela ficha** — a data agendada é definida diretamente na ficha do conteúdo e refletida automaticamente no calendário.

---

### 5. Categorias Hero

Sistema de marcação especial para conteúdos estratégicos de alto impacto. Cada conteúdo pode ser classificado em uma de três categorias:

| Categoria | Ícone | Descrição |
|---|---|---|
| Odontologia Digital | Estetoscópio | Conteúdos voltados à tecnologia e inovação clínica |
| Excelência Clínica | Estrela | Conteúdos de alto padrão técnico e científico |
| Negócios e Carreiras | Pasta | Conteúdos de gestão, carreira e desenvolvimento profissional |

Conteúdos Hero recebem **destaque dourado** em todos os módulos do sistema: badge na ficha, borda nos cards da lista e marcação no calendário da agenda.

---

### 6. Autenticação e Controle de Acesso

- Login via **OAuth Manus** — o usuário é redirecionado para a tela de login ao acessar o portal sem sessão ativa.
- Todas as rotas e procedimentos de escrita são protegidos; apenas usuários autenticados podem visualizar e editar dados.
- O nome do usuário logado é registrado automaticamente como responsável ao marcar conteúdos como "Gravado".

---

## Resumo das Telas

| Tela | Acesso | Função principal |
|---|---|---|
| Login | Público | Autenticação via conta Manus |
| Dashboard | Autenticado | Visão geral do progresso da captação |
| Lista de Conteúdos | Autenticado | Navegação, busca e filtragem dos 653 conteúdos |
| Ficha do Conteúdo | Autenticado | Edição de status, datas, responsável e dados de produção |
| Agenda | Autenticado | Calendário mensal de gravações agendadas |

---

*Documento gerado em junho de 2026 — Portal de Captação Alliage Experience.*
