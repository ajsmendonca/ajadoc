import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

function statusBadge(status: string) {
  const map: Record<string, { classe: string; label: string }> = {
    aberto: { classe: "wait", label: "aberto" },
    em_andamento: { classe: "progress", label: "em andamento" },
    aguardando: { classe: "wait", label: "aguardando" },
    concluido: { classe: "done", label: "concluído" },
    arquivado: { classe: "done", label: "arquivado" },
    cancelado: { classe: "wait", label: "cancelado" },
  };
  const info = map[status] ?? { classe: "wait", label: status };
  return <span className={`badge ${info.classe}`}>{info.label}</span>;
}

export default async function InboxPage() {
  const supabase = createClient();

  const { data: protocolos } = await supabase
    .from("protocolos")
    .select("id, numero, assunto, status, created_at, setores:setor_atual_id(nome)")
    .order("created_at", { ascending: false });

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, margin: "0 0 4px" }}>Meu inbox</h1>
        <p style={{ fontSize: 14, color: "var(--ink-muted)", margin: 0 }}>
          Acompanhe suas solicitações.
        </p>
      </div>

      <div className="panel">
        {(!protocolos || protocolos.length === 0) && (
          <p style={{ padding: 24, color: "var(--ink-muted)", fontSize: 14 }}>
            Nenhum protocolo ainda.
          </p>
        )}
        {protocolos?.map((p: any) => (
          <Link
            key={p.id}
            href={`/dashboard/protocolo/${p.numero}`}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 16,
              padding: "16px 24px",
              borderBottom: "1px solid var(--border)",
              textDecoration: "none",
              color: "inherit",
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600 }}>Protocolo {p.numero}</div>
              <div style={{ fontSize: 12.5, color: "var(--ink-muted)" }}>{p.assunto}</div>
              <div style={{ fontSize: 11.5, color: "var(--ink-faint)", marginTop: 2 }}>
                {p.setores?.nome}
              </div>
            </div>
            {statusBadge(p.status)}
          </Link>
        ))}
      </div>
    </div>
  );
}
