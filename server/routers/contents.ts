import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import {
  getContentById,
  getDashboardStats,
  getResponsaveis,
  listContents,
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
          responsavel: z.string().optional(),
          search: z.string().optional(),
        })
        .optional(),
    )
    .query(({ input }) => listContents(input ?? {})),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => getContentById(input.id)),

  stats: protectedProcedure.query(() => getDashboardStats()),

  responsaveis: protectedProcedure.query(() => getResponsaveis()),

  updateStatus: protectedProcedure
    .input(z.object({ id: z.number(), status: statusEnum }))
    .mutation(({ input, ctx }) =>
      updateContentStatus(input.id, input.status, {
        openId: ctx.user.openId,
        name: ctx.user.name ?? null,
      }),
    ),

  updateFields: protectedProcedure
    .input(
      z.object({
        id: z.number(),
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
