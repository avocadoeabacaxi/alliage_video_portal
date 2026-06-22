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
- [ ] db.ts: listContentsByMonth(ano, mes) e setDataAgendada(id, data)
- [ ] routers.ts: contents.agendaMes e contents.agendar
- [ ] Página Agenda: calendário mensal com contagem de gravações por dia
- [ ] Clicar no dia abre lista do que será gravado naquele dia
- [ ] Item de menu "Agenda" na sidebar + rota
- [ ] Agendar/editar data na ficha do conteúdo
- [ ] Testes vitest da agenda + verificação visual
- [ ] Checkpoint e entrega

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
