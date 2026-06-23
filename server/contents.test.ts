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
  pessoaApareceu: string | null;
  localGravacao: string | null;
  categoriaHero: string | null;
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
    pessoaApareceu: null,
    localGravacao: null,
    categoriaHero: null,
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
        extras?: {
          formatoApariciao?: string;
          pessoaApareceu?: string;
          localGravacao?: string;
        },
      ) => {
        const row = store.get(id)!;
        row.status = status;
        if (status === "Gravado" && !row.gravadoPor) {
          row.gravadoPor = user.name ?? "Membro da equipe";
          row.gravadoPorOpenId = user.openId;
          row.dataGravacao = new Date();
        }
        if (extras?.formatoApariciao) row.formatoApariciao = extras.formatoApariciao;
        if (extras?.pessoaApareceu !== undefined)
          row.pessoaApareceu = extras.pessoaApareceu;
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
    getEtapas: vi.fn(async () => ["Engajar", "Inspirar", "Educar", "Converter"]),
    getBlocos: vi.fn(async () => ["Bloco 1", "Bloco 2"]),
    createContent: vi.fn(async (input: any) => {
      const id = Math.max(0, ...Array.from(store.keys())) + 1;
      const row = freshRow(id);
      store.set(id, row);
      return { ...row, ...input };
    }),
    deleteContent: vi.fn(async (id: number) => {
      store.delete(id);
      return { success: true };
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

  it("registra o nome da pessoa que apareceu quando é Pessoa real", async () => {
    const caller = appRouter.createCaller(ctxFor(authUser));
    const updated = await caller.contents.updateStatus({
      id: 1,
      status: "Gravado",
      formatoApariciao: "Pessoa real",
      pessoaApareceu: "Dra. Ana Souza",
      localGravacao: "Sede Alliage",
    });
    expect(updated?.formatoApariciao).toBe("Pessoa real");
    expect(updated?.pessoaApareceu).toBe("Dra. Ana Souza");
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

  it("salva categoriaHero válida e persiste no registro", async () => {
    const caller = appRouter.createCaller(ctxFor(authUser));
    const updated = await caller.contents.updateFields({
      id: 1,
      categoriaHero: "Odontologia Digital",
    });
    expect(updated?.categoriaHero).toBe("Odontologia Digital");
  });

  it("remove categoriaHero ao passar null", async () => {
    store.get(1)!.categoriaHero = "Excelência Clínica";
    const caller = appRouter.createCaller(ctxFor(authUser));
    const updated = await caller.contents.updateFields({
      id: 1,
      categoriaHero: null,
    });
    expect(updated?.categoriaHero).toBeNull();
  });

  it("rejeita categoriaHero com valor inválido", async () => {
    const caller = appRouter.createCaller(ctxFor(authUser));
    await expect(
      caller.contents.updateFields({
        id: 1,
        // @ts-expect-error valor inválido proposital
        categoriaHero: "Categoria Inexistente",
      }),
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

describe("criar e excluir conteúdos", () => {
  it("cria um novo conteúdo e ele aparece na listagem", async () => {
    const caller = appRouter.createCaller(ctxFor(authUser));
    const created = await caller.contents.create({
      trilha: "Saevo",
      etapa: "Educar",
      bloco: "Bloco novo",
      titulo: "Conteúdo de teste",
    });
    expect(created).toBeTruthy();
    const res = await caller.contents.list({});
    expect(res.total).toBe(2);
  });

  it("rejeita criar sem trilha/etapa/título", async () => {
    const caller = appRouter.createCaller(ctxFor(authUser));
    await expect(
      // @ts-expect-error faltando campos obrigatórios proposital
      caller.contents.create({ bloco: "x" }),
    ).rejects.toBeTruthy();
  });

  it("exclui um conteúdo existente", async () => {
    const caller = appRouter.createCaller(ctxFor(authUser));
    await caller.contents.delete({ id: 1 });
    const res = await caller.contents.list({});
    expect(res.total).toBe(0);
  });

  it("lista etapas e blocos para os filtros", async () => {
    const caller = appRouter.createCaller(ctxFor(authUser));
    const etapas = await caller.contents.etapas();
    expect(etapas).toContain("Engajar");
    const blocos = await caller.contents.blocos({ trilha: "Saevo" });
    expect(Array.isArray(blocos)).toBe(true);
  });
});

describe("contents procedures (não autenticado)", () => {
  it("bloqueia acesso sem usuário", async () => {
    const caller = appRouter.createCaller(ctxFor(null));
    await expect(caller.contents.list({})).rejects.toBeTruthy();
    await expect(
      caller.contents.updateStatus({ id: 1, status: "Gravado" }),
    ).rejects.toBeTruthy();
    await expect(
      caller.contents.create({
        trilha: "Saevo",
        etapa: "Educar",
        bloco: "b",
        titulo: "t",
      }),
    ).rejects.toBeTruthy();
    await expect(caller.contents.delete({ id: 1 })).rejects.toBeTruthy();
  });
});
