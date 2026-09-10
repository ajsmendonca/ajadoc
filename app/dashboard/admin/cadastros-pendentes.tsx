"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Pendente = { id: string; nome: string; email: string; created_at: string };
type Setor = { id: string; nome: string };

export default function CadastrosPendentes({
  pendentes,
  setores,
}: {
  pendentes: Pendente[];
  setores: Setor[];
}) {
  const supabase = createClient();
  const router = useRouter();

  const [escolhas, setEscolhas] = useState<Record<string, { setorId: string; papel: string }>>({});
  const [carregandoId, setCarregandoId] = useState<string | null>(null);

  function setEscolha(id: string, campo: "setorId" | "papel", valor: string) {
    setEscolhas((prev) => ({
      ...prev,
      [id]: { setorId: prev[id]?.setorId ?? "", papel: prev[id]?.papel ?? "operador", [campo]: valor },
    }));
  }

  async function aprovar(id: string) {
    const escolha = escolhas[id];
    if (!escolha?.setorId) return;

    setCarregandoId(id);
    await supabase
      .from("usuarios")
      .update({ setor_id: escolha.setorId, papel: escolha.papel || "operador", status: "ativo" })
      .eq("id", id);
    setCarregandoId(null);
    router.refresh();
  }

  async function recusar(id: string) {
    setCarregandoId(id);
    await supabase.from("usuarios").update({ status: "recusado" }).eq("id", id);
    setCarregandoId(null);
    router.refresh();
  }

  if (pendentes.length === 0) return null;

  return (
    <div className="panel" style={{ padding: 24 }}>
      <h3 style={{ fontSize: 14, margin: "0 0 16px" }}>
        Cadastros pendentes <span style={{ color: "var(--warn)" }}>({pendentes.length})</span>
      </h3>

      {pendentes.map((p) => {
        const escolha = escolhas[p.id] ?? { setorId: "", papel: "operador" };
        return (
          <div
            key={p.id}
            style={{
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
              alignItems: "flex-end",
              padding: "14px 0",
              borderBottom: "1px solid var(--border)",
            }}
          >
            <div style={{ minWidth: 160, flex: 1 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600 }}>{p.nome}</div>
              <div style={{ fontSize: 12, color: "var(--ink-muted)" }}>{p.email}</div>
            </div>
            <div className="field" style={{ marginBottom: 0, minWidth: 150 }}>
              <label>Setor</label>
              <select value={escolha.setorId} onChange={(e) => setEscolha(p.id, "setorId", e.target.value)}>
                <option value="">Selecione...</option>
                {setores.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nome}
                  </option>
                ))}
              </select>
            </div>
            <div className="field" style={{ marginBottom: 0, minWidth: 140 }}>
              <label>Papel</label>
              <select value={escolha.papel} onChange={(e) => setEscolha(p.id, "papel", e.target.value)}>
                <option value="admin">admin</option>
                <option value="gestor_setor">gestor_setor</option>
                <option value="operador">operador</option>
                <option value="consulta">consulta</option>
              </select>
            </div>
            <button
              className="btn-primary"
              disabled={carregandoId === p.id || !escolha.setorId}
              onClick={() => aprovar(p.id)}
            >
              Aprovar
            </button>
            <button className="btn-secondary" disabled={carregandoId === p.id} onClick={() => recusar(p.id)}>
              Recusar
            </button>
          </div>
        );
      })}
    </div>
  );
}
