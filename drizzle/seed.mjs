import "dotenv/config";
import mysql from "mysql2/promise";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const data = JSON.parse(readFileSync(join(__dirname, "trilhas_data.json"), "utf-8"));

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL não definida");
  process.exit(1);
}

const conn = await mysql.createConnection(url);

const [rows] = await conn.execute("SELECT COUNT(*) AS c FROM contents");
if (rows[0].c > 0) {
  console.log(`Tabela já possui ${rows[0].c} registros. Abortando seed para evitar duplicação.`);
  await conn.end();
  process.exit(0);
}

const cols = [
  "trilha", "ordem", "etapa", "bloco", "titulo", "publico", "formatoProducao",
  "portaVoz", "prioridade", "trimestre", "gancho", "topico1", "topico2",
  "topico3", "palavrasChave", "dadoMercado", "cta", "status",
];

const placeholders = cols.map(() => "?").join(", ");
const sql = `INSERT INTO contents (${cols.map((c) => `\`${c}\``).join(", ")}) VALUES (${placeholders})`;

let inserted = 0;
for (const r of data) {
  const values = [
    r.Trilha, r.Ordem, r.Etapa, r.Bloco, r.Titulo, r.Publico ?? null,
    r.FormatoProducao ?? null, r.PortaVoz ?? null, r.Prioridade ?? null,
    r.Trimestre ?? null, r.Gancho ?? null, r.Topico1 ?? null, r.Topico2 ?? null,
    r.Topico3 ?? null, r.PalavrasChave ?? null, r.DadoMercado ?? null,
    r.CTA ?? null, "A gravar",
  ];
  await conn.execute(sql, values);
  inserted++;
}

console.log(`Seed concluído: ${inserted} conteúdos inseridos.`);
await conn.end();
