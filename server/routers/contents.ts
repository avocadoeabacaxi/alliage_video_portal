import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import {
  createContent,
  deleteContent,
  getBlocos,
  getContentById,
  getDashboardStats,
  getEtapas,
  getResponsaveis,
  listAgendaBetween,
  listContents,
  setDataAgendada,
  updateContentFields,
  updateContentStatus,
} from "../db";
import { STATUS_FLOW } from "@shared/const";

const statusEnum = z.enum(STATUS_FLOW);

export const contentsRouter = router({
  list: protectedProcedure
    .input(
      z
        .object({
          trilha: z.string().optional(),
          status: z.string().optional(),
          prioridade: z.string().optional(),
          trimestre: z.string().optional(),
          etapa: z.string().optional(),
          bloco: z.string().optional(),
          responsavel: z.string().optional(),
          categoriaHero: z.string().optional(),
          tipo: z.enum(["Convencional", "Hero"]).optional(),
          search: z.string().optional(),
          limit: z.number().int().min(1).max(100).optional(),
          offset: z.number().int().min(0).optional(),
        })
        .optional(),
    )
    .query(({ input }) => listContents(input ?? {})),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => getContentById(input.id)),

  stats: protectedProcedure.query(() => getDashboardStats()),

  responsaveis: protectedProcedure.query(() => getResponsaveis()),

  etapas: protectedProcedure.query(() => getEtapas()),

  blocos: protectedProcedure
    .input(z.object({ trilha: z.string().optional() }).optional())
    .query(({ input }) => getBlocos(input?.trilha)),

  create: protectedProcedure
    .input(
      z.object({
        trilha: z.string().min(1, "Selecione a trilha"),
        etapa: z.string().min(1, "Selecione a etapa"),
        bloco: z.string().min(1, "Informe o bloco"),
        tipo: z.enum(["Convencional", "Hero"]).optional(),
        titulo: z.string().min(1, "Informe o título"),
        publico: z.string().nullable().optional(),
        formatoProducao: z.string().nullable().optional(),
        portaVoz: z.string().nullable().optional(),
        prioridade: z.string().nullable().optional(),
        trimestre: z.string().nullable().optional(),
        gancho: z.string().nullable().optional(),
        topico1: z.string().nullable().optional(),
        topico2: z.string().nullable().optional(),
        topico3: z.string().nullable().optional(),
        palavrasChave: z.string().nullable().optional(),
        dadoMercado: z.string().nullable().optional(),
        cta: z.string().nullable().optional(),
      }),
    )
    .mutation(({ input }) => createContent(input)),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteContent(input.id)),

  // Agenda mensal: recebe ano e mês (1-12) e retorna conteúdos agendados no mês.
  agendaMes: protectedProcedure
    .input(z.object({ ano: z.number().int(), mes: z.number().int().min(1).max(12) }))
    .query(({ input }) => {
      const start = new Date(input.ano, input.mes - 1, 1);
      const end = new Date(input.ano, input.mes, 1);
      return listAgendaBetween(start, end);
    }),

  // Agenda ou remove a data agendada de um conteúdo.
  agendar: protectedProcedure
    .input(z.object({ id: z.number(), data: z.date().nullable() }))
    .mutation(({ input }) => setDataAgendada(input.id, input.data)),

  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        status: statusEnum,
        // Dados opcionais informados ao marcar como "Gravado".
        formatoApariciao: z
          .enum(["Pessoa real", "IA", "Off / Locução"])
          .nullable()
          .optional(),
        pessoaApareceu: z.string().max(200).nullable().optional(),
        localGravacao: z.string().max(200).nullable().optional(),
      }),
    )
    .mutation(({ input, ctx }) =>
      updateContentStatus(
        input.id,
        input.status,
        {
          openId: ctx.user.openId,
          name: ctx.user.name ?? null,
        },
        {
          formatoApariciao: input.formatoApariciao ?? undefined,
          pessoaApareceu: input.pessoaApareceu ?? undefined,
          localGravacao: input.localGravacao ?? undefined,
        },
      ),
    ),

  updateFields: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        categoriaHero: z
          .enum(["Odontologia Digital", "Excelência Clínica", "Negócios e Carreiras"])
          .nullable()
          .optional(),
        tipo: z.enum(["Convencional", "Hero"]).nullable().optional(),
        observacoes: z.string().max(2000).nullable().optional(),
        linkAprovacao: z
          .string()
          .url("Informe uma URL válida (https://...)")
          .nullable()
          .optional(),
        linkVideoFinal: z
          .string()
          .url("Informe uma URL válida (https://...)")
          .nullable()
          .optional(),
        dataGravacao: z.date().nullable().optional(),
        dataAgendada: z.date().nullable().optional(),
        gravadoPor: z.string().max(200).nullable().optional(),
        formatoApariciao: z
          .enum(["Pessoa real", "IA", "Off / Locução"])
          .nullable()
          .optional(),
        pessoaApareceu: z.string().max(200).nullable().optional(),
        localGravacao: z.string().max(200).nullable().optional(),
      }),
    )
    .mutation(({ input, ctx }) => {
      const { id, ...fields } = input;
      return updateContentFields(id, fields, {
        openId: ctx.user.openId,
        name: ctx.user.name ?? null,
      });
    }),
});

// re-export so type inference works even if unused
export type ContentsRouter = typeof contentsRouter;
void publicProcedure;
