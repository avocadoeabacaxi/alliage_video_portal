# Alliage Experience - Portal de Captação | TODO

## Banco de dados e dados iniciais
- [x] Definir schema da tabela `contents` (todos os campos da planilha + campos de produção)
- [x] Gerar migração com drizzle-kit e aplicar via webdev_execute_sql
- [x] Gerar seed JSON dos 653 conteúdos a partir do trilhas_data.json
- [x] Script de importação (seed) que popula a tabela contents (653 inseridos, sem duplicação)
- [x] Tabela/colunas para status, gravadoPor, dataGravacao, observacoes, linkAprovacao, linkVideoFinal

## Backend (tRPC)
- [x] db.ts: helpers de query (list com filtros, getById, update status, update fields, stats do dashboard, ranking)
- [x] routers.ts: contents.list, contents.get, contents.updateStatus, contents.updateFields, contents.stats, contents.responsaveis
- [x] Registrar gravadoPor automaticamente com ctx.user no update de status para "Gravado"

## Frontend
- [x] Tema/identidade visual: azul-marinho (Alliage) + rosa (Avocado), logos
- [x] DashboardLayout com sidebar (Dashboard, Conteúdos) + tela de login com logos
- [x] Página Dashboard: cards de progresso, gráficos (geral, por trilha, prioridade, trimestre, etapa) e ranking
- [x] Página Lista de conteúdos: filtros (trilha, status, prioridade, trimestre, responsável) + busca por título
- [x] Página Ficha detalhada: todos os campos da planilha + edição de status e campos de produção
- [x] Fluxo de status: A gravar → Gravado → Em edição → Aprovação → Publicado
- [x] Login OAuth Manus (proteger rotas via protectedProcedure + DashboardLayout)

## Testes e entrega
- [x] Testes vitest dos procedures principais (6 testes passando)
- [x] Verificação visual via screenshot (dashboard, lista, ficha)
- [x] Validação do fluxo de status e ranking via dados
- [x] Ajuste das barras de progresso para percentuais baixos
- [x] Validação de URL dos links (frontend + Zod no backend)
- [x] Error states no Dashboard e na Lista
- [x] Testes reais dos procedures via createCaller (sucesso, status inválido, URL inválida, sem autenticação)
- [x] Checkpoint e entrega ao usuário

## Agenda / Cronograma (nova feature)
- [x] Adicionar coluna `dataAgendada` ao schema e aplicar migração
- [x] db.ts: listAgendaBetween(start,end) e setDataAgendada(id, data)
- [x] routers.ts: contents.agendaMes e contents.agendar
- [x] Página Agenda: calendário mensal com contagem de gravações por dia
- [x] Clicar no dia abre lista do que será gravado naquele dia
- [x] Item de menu "Agenda" na sidebar + rota
- [x] Agendar/editar data na ficha do conteúdo
- [x] Testes vitest da agenda + verificação visual
- [x] Checkpoint e entrega

## Melhorias (paginação + dados de gravação)
- [x] Adicionar colunas `formatoApariciao` (Pessoa real / IA / Off-locução) e `localGravacao` ao schema + migração
- [x] Paginação: listContents aceitar limit/offset e retornar total; padrão 20 por página
- [x] routers/db: aceitar formatoApariciao e localGravacao no updateStatus/updateFields
- [x] Modal ao marcar "Gravado": pedir quem apareceu (pessoa/IA/off) e local de gravação
- [x] Lista: botão "Carregar mais 20" preservando filtros e mostrando total
- [x] Ficha: exibir/editar formato de aparição e local; refletido no card de quem gravou
- [x] Testes vitest atualizados (14 testes passando) + verificação visual
- [x] Dados de teste revertidos ao estado inicial
- [x] Checkpoint e entrega

## Nome da pessoa filmada (Pessoa real)
- [x] Coluna `pessoaApareceu` no schema + migração aplicada
- [x] Backend (updateStatus/updateFields) aceita pessoaApareceu
- [x] Campo de nome no modal de Gravado (condicional a "Pessoa real", obrigatório)
- [x] Campo de nome editável na ficha (condicional a "Pessoa real")
- [x] Exibição "Pessoa filmada" no card Quem gravou
- [x] Teste vitest do nome da pessoa (15 testes passando)
- [x] Dados de teste revertidos
- [x] Checkpoint e entrega

## Filtros ampliados + criar/excluir conteúdo
- [ ] Backend: filtro por etapa (Engajar/Inspirar/Educar/Converter) e por bloco no listContents
- [ ] Backend: procedure createContent (admin) com todos os campos da pauta
- [ ] Backend: procedure deleteContent (admin) com confirmação
- [ ] Frontend: adicionar filtros Etapa e Bloco na lista
- [ ] Frontend: botão + formulário "Novo conteúdo"
- [ ] Frontend: excluir conteúdo com diálogo de confirmação
- [ ] Testes vitest atualizados + verificação visual
- [ ] Checkpoint e entrega

## Categorias Hero
- [x] Coluna `categoriaHero` no schema (enum nullable: Odontologia Digital, Excelência Clínica, Negócios e Carreiras) + migração aplicada
- [x] Backend: db.ts e routers/contents.ts com filtro e updateFields para categoriaHero
- [x] domain.ts: constantes CATEGORIAS_HERO e CATEGORIA_HERO_META (ícones Stethoscope/Sparkles/Briefcase)
- [x] Componente CategoriaHeroBadge (badge dourada) e CategoriaHeroSelector (seletor de 3 ícones)
- [x] Ficha (ConteudoDetalhe.tsx): CategoriaHeroSelector integrado, badge no cabeçalho, salvo em updateFields
- [x] Lista (Conteudos.tsx): destaque dourado nos cards Hero + filtro por Categoria Hero
- [x] Agenda (Agenda.tsx): destaque dourado nos itens do painel lateral + borda dourada nas células do calendário
- [x] Testes: categoriaHero adicionado ao Row/freshRow, 3 novos testes (salva, remove, rejeita inválido) — 22 testes passando
- [x] TypeScript: pnpm check sem erros
- [x] Checkpoint e entrega

## Edição de "quem gravou" e zerar datas
- [x] Backend: updateFields aceitar gravadoPor (string | null) e dataGravacao (Date | null)
- [x] Ficha: campo editável para renomear "quem gravou" (inline edit ou botão de editar)
- [x] Ficha: botão "Zerar" ao lado da data de gravação (dataGravacao) e da data agendada (dataAgendada)
- [x] Testes vitest atualizados + checkpoint
