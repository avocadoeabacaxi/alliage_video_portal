import { describe, expect, it, vi, beforeEach } from "vitest";
import type { TrpcContext } from "./_core/context";

// ---- Mock da camada de DB para testar procedures sem banco real ----
type Row = {
  id: number;
  status: string;
  gravadoPor: string | null;
  gravadoPorOpenId: string | null;
  dataGravacao: Date | null;
  observacoes: string | null;
  linkAprovacao: string | null;
  linkVideoFinal: string | null;
  dataAgendada: Date | null;
  formatoApariciao: string | null;
  localGravacao: string | null;
};

const store = new Map<number, Row>();

function freshRow(id: number): Row {
  return {
    id,
    status: "A gravar",
    gravadoPor: null,
    gravadoPorOpenId: null,
    dataGravacao: null,
    observacoes: null,
    linkAprovacao: null,
    linkVideoFinal: null,
    dataAgendada: null,
    formatoApariciao: null,
    localGravacao: null,
  };
}

vi.mock("./db", () => {
  return {
    listContents: vi.fn(
      async (filters: { limit?: number; offset?: number } = {}) => {
        const all = Array.from(store.values());
        const offset = filters.offset ?? 0;
        const limit = filters.limit ?? all.length;
        return { items: all.slice(offset, offset + limit), total: all.length };
      },
    ),
    getContentById: vi.fn(async (id: number) => store.get(id) ?? undefined),
    getDashboardStats: vi.fn(async () => ({
      total: store.size,
      byStatus: [],
      byTrilhaStatus: [],
      byPrioridade: [],
      byTrimestreStatus: [],
      byEtapa: [],
      ranking: [],
    })),
    getResponsaveis: vi.fn(async () =>
      Array.from(store.values())
        .map((r) => r.gravadoPor)
        .filter(Boolean),
    ),
    updateContentStatus: vi.fn(
      async (
        id: number,
        status: string,
        user: { openId: string; name: string | null },
        extras?: { formatoApariciao?: string; localGravacao?: string },
      ) => {
        const row = store.get(id)!;
        row.status = status;
        if (status === "Gravado" && !row.gravadoPor) {
          row.gravadoPor = user.name ?? "Membro da equipe";
          row.gravadoPorOpenId = user.openId;
          row.dataGravacao = new Date();
        }
        if (extras?.formatoApariciao) row.formatoApariciao = extras.formatoApariciao;
        if (extras?.localGravacao) row.localGravacao = extras.localGravacao;
        return row;
      },
    ),
    updateContentFields: vi.fn(
      async (id: number, fields: Partial<Row>) => {
        const row = store.get(id)!;
        Object.assign(row, fields);
        return row;
      },
    ),
    listAgendaBetween: vi.fn(async (start: Date, end: Date) =>
      Array.from(store.values()).filter(
        (r) =>
          r.dataAgendada !== null &&
          r.dataAgendada >= start &&
          r.dataAgendada < end,
      ),
    ),
    setDataAgendada: vi.fn(async (id: number, data: Date | null) => {
      const row = store.get(id)!;
      row.dataAgendada = data;
      return row;
    }),
  };
});

import { appRouter } from "./routers";

function ctxFor(user: any): TrpcContext {
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as unknown as TrpcContext["res"],
  };
}

const authUser = {
  id: 1,
  openId: "open-maria",
  email: "maria@avocado.com",
  name: "Maria Silva",
  loginMethod: "manus",
  role: "user" as const,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

beforeEach(() => {
  store.clear();
  store.set(1, freshRow(1));
});

describe("contents procedures (autenticado)", () => {
  it("lista conteúdos com total e itens", async () => {
    const caller = appRouter.createCaller(ctxFor(authUser));
    const res = await caller.contents.list({});
    expect(res.total).toBe(1);
    expect(res.items).toHaveLength(1);
  });

  it("respeita a paginação (limit/offset)", async () => {
    for (let i = 2; i <= 25; i++) store.set(i, freshRow(i));
    const caller = appRouter.createCaller(ctxFor(authUser));
    const page1 = await caller.contents.list({ limit: 20, offset: 0 });
    expect(page1.total).toBe(25);
    expect(page1.items).toHaveLength(20);
    const page2 = await caller.contents.list({ limit: 20, offset: 20 });
    expect(page2.items).toHaveLength(5);
  });

  it("registra automaticamente quem gravou ao marcar como Gravado", async () => {
    const caller = appRouter.createCaller(ctxFor(authUser));
    const updated = await caller.contents.updateStatus({
      id: 1,
      status: "Gravado",
    });
    expect(updated?.status).toBe("Gravado");
    expect(updated?.gravadoPor).toBe("Maria Silva");
    expect(updated?.gravadoPorOpenId).toBe("open-maria");
    expect(updated?.dataGravacao).toBeInstanceOf(Date);
  });

  it("registra quem apareceu e o local ao marcar como Gravado", async () => {
    const caller = appRouter.createCaller(ctxFor(authUser));
    const updated = await caller.contents.updateStatus({
      id: 1,
      status: "Gravado",
      formatoApariciao: "IA",
      localGravacao: "Estúdio Avocado",
    });
    expect(updated?.formatoApariciao).toBe("IA");
    expect(updated?.localGravacao).toBe("Estúdio Avocado");
  });

  it("rejeita formato de aparição inválido", async () => {
    const caller = appRouter.createCaller(ctxFor(authUser));
    await expect(
      caller.contents.updateStatus({
        id: 1,
        status: "Gravado",
        // @ts-expect-error valor inválido proposital
        formatoApariciao: "Robô",
      }),
    ).rejects.toBeTruthy();
  });

  it("não sobrescreve responsável já registrado", async () => {
    store.get(1)!.gravadoPor = "João";
    const caller = appRouter.createCaller(ctxFor(authUser));
    const updated = await caller.contents.updateStatus({
      id: 1,
      status: "Gravado",
    });
    expect(updated?.gravadoPor).toBe("João");
  });

  it("aceita status válidos e rejeita inválidos", async () => {
    const caller = appRouter.createCaller(ctxFor(authUser));
    await expect(
      caller.contents.updateStatus({ id: 1, status: "Publicado" }),
    ).resolves.toBeTruthy();
    await expect(
      // @ts-expect-error status inválido proposital
      caller.contents.updateStatus({ id: 1, status: "Inexistente" }),
    ).rejects.toBeTruthy();
  });

  it("salva campos de produção válidos", async () => {
    const caller = appRouter.createCaller(ctxFor(authUser));
    const updated = await caller.contents.updateFields({
      id: 1,
      observacoes: "Roteiro impresso entregue",
      linkAprovacao: "https://drive.google.com/aprovacao",
      linkVideoFinal: "https://youtube.com/watch?v=abc",
    });
    expect(updated?.observacoes).toBe("Roteiro impresso entregue");
    expect(updated?.linkVideoFinal).toContain("youtube");
  });

  it("rejeita link que não é URL válida", async () => {
    const caller = appRouter.createCaller(ctxFor(authUser));
    await expect(
      caller.contents.updateFields({ id: 1, linkAprovacao: "não-é-url" }),
    ).rejects.toBeTruthy();
  });
});

describe("agenda (cronograma mensal)", () => {
  it("agenda uma data e a lista no mês correspondente", async () => {
    const caller = appRouter.createCaller(ctxFor(authUser));
    const updated = await caller.contents.agendar({
      id: 1,
      data: new Date(2026, 5, 24), // 24/06/2026
    });
    expect(updated?.dataAgendada).toBeInstanceOf(Date);

    const doMes = await caller.contents.agendaMes({ ano: 2026, mes: 6 });
    expect(doMes).toHaveLength(1);
    expect(doMes[0]?.id).toBe(1);
  });

  it("não retorna o conteúdo em um mês diferente do agendado", async () => {
    const caller = appRouter.createCaller(ctxFor(authUser));
    await caller.contents.agendar({ id: 1, data: new Date(2026, 5, 24) });
    const outroMes = await caller.contents.agendaMes({ ano: 2026, mes: 7 });
    expect(outroMes).toHaveLength(0);
  });

  it("remove o agendamento quando data é null", async () => {
    const caller = appRouter.createCaller(ctxFor(authUser));
    await caller.contents.agendar({ id: 1, data: new Date(2026, 5, 24) });
    await caller.contents.agendar({ id: 1, data: null });
    const doMes = await caller.contents.agendaMes({ ano: 2026, mes: 6 });
    expect(doMes).toHaveLength(0);
  });
});

describe("contents procedures (não autenticado)", () => {
  it("bloqueia acesso sem usuário", async () => {
    const caller = appRouter.createCaller(ctxFor(null));
    await expect(caller.contents.list({})).rejects.toBeTruthy();
    await expect(
      caller.contents.updateStatus({ id: 1, status: "Gravado" }),
    ).rejects.toBeTruthy();
  });
});
