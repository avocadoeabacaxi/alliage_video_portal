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
  };
}

vi.mock("./db", () => {
  return {
    listContents: vi.fn(async () => Array.from(store.values())),
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
      ) => {
        const row = store.get(id)!;
        row.status = status;
        if (status === "Gravado" && !row.gravadoPor) {
          row.gravadoPor = user.name ?? "Membro da equipe";
          row.gravadoPorOpenId = user.openId;
          row.dataGravacao = new Date();
        }
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
  it("lista conteúdos", async () => {
    const caller = appRouter.createCaller(ctxFor(authUser));
    const rows = await caller.contents.list({});
    expect(rows).toHaveLength(1);
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

describe("contents procedures (não autenticado)", () => {
  it("bloqueia acesso sem usuário", async () => {
    const caller = appRouter.createCaller(ctxFor(null));
    await expect(caller.contents.list({})).rejects.toBeTruthy();
    await expect(
      caller.contents.updateStatus({ id: 1, status: "Gravado" }),
    ).rejects.toBeTruthy();
  });
});
