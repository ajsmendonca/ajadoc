"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Usuario = {
  id: string;
  nome: string;
  email: string;
  papel: string | null;
  status: string;
  setor_id: string | null;
};
type Setor = { id: string; nome: string };

const statusBadge: Record<string, { bg: string; cor: string }> = {
  ativo: { bg: "var(--ok-soft)", cor: "var(--ok)" },
  pendente: { bg: "var(--warn-soft)", cor: "var(--warn)" },
  recusado: { bg: "var(--bg)", cor: "var(--ink-faint)" },
  inativo: { bg: "var(--bg)", cor: "var(--ink-faint)" },
};

export default function UsuariosManager({
  usuarios,
  setores,
}: {
  usuarios: Usuario[];
  setores: Setor[];
}) {
  const supabase = createClient();
  const router = useRouter();
  const [carregandoId, setCarregandoId] = useState<string | null>(null);

  async function atualizar(id: string, campo: "papel" | "setor_id" | "status", valor: string) {
    setCarregandoId(id);
    await supabase.from("usuarios").update({ [campo]: valor }).eq("id", id);
    setCarregandoId(null);
    router.refresh();
  }

  return (
    <div className="panel" style={{ padding: 24 }}>
      <h3 style={{ fontSize: 14, margin: "0 0 16px" }}>Usuários internos ({usuarios.length})</h3>

      {usuarios.length === 0 && (
        <p style={{ fontSize: 13, color: "var(--ink-muted)" }}>Nenhum usuário interno ainda.</p>
      )}

      {usuarios.map((u) => {
        const badge = statusBadge[u.status] ?? statusBadge.inativo;
        return (
          <div
            key={u.id}
            style={{
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
              alignItems: "center",
              padding: "12px 0",
              borderBottom: "1px solid var(--border)",
            }}
          >
            <div style={{ minWidth: 160, flex: 1 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600 }}>{u.nome}</div>
              <div style={{ fontSize: 12, color: "var(--ink-muted)" }}>{u.email}</div>
            </div>

            <span
              className="badge"
              style={{ background: badge.bg, color: badge.cor }}
            >
              {u.status}
            </span>

            <select
              value={u.setor_id ?? ""}
              disabled={carregandoId === u.id}
              onChange={(e) => atualizar(u.id, "setor_id", e.target.value)}
              style={{ minWidth: 140 }}
            >
              <option value="">Sem setor</option>
              {setores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nome}
                </option>
              ))}
            </select>

            <select
              value={u.papel ?? ""}
              disabled={carregandoId === u.id}
              onChange={(e) => atualizar(u.id, "papel", e.target.value)}
              style={{ minWidth: 130 }}
            >
              <option value="">Sem papel</option>
              <option value="admin">admin</option>
              <option value="gestor_setor">gestor_setor</option>
              <option value="operador">operador</option>
              <option value="consulta">consulta</option>
            </select>

            <select
              value={u.status}
              disabled={carregandoId === u.id}
              onChange={(e) => atualizar(u.id, "status", e.target.value)}
              style={{ minWidth: 110 }}
            >
              <option value="pendente">pendente</option>
              <option value="ativo">ativo</option>
              <option value="recusado">recusado</option>
              <option value="inativo">inativo</option>
            </select>
          </div>
        );
      })}
    </div>
  );
}
