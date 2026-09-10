"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Setor = { id: string; nome: string; sigla: string | null; setor_pai_id: string | null; ativo: boolean };

export default function SetoresManager({ setores }: { setores: Setor[] }) {
  const supabase = createClient();
  const router = useRouter();

  const [nome, setNome] = useState("");
  const [sigla, setSigla] = useState("");
  const [setorPaiId, setSetorPaiId] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setCarregando(true);

    const { error } = await supabase.from("setores").insert({
      nome,
      sigla: sigla || null,
      setor_pai_id: setorPaiId || null,
    });

    setCarregando(false);
    if (error) {
      setErro(error.message);
      return;
    }
    setNome("");
    setSigla("");
    setSetorPaiId("");
    router.refresh();
  }

  return (
    <div className="panel" style={{ padding: 24 }}>
      <h3 style={{ fontSize: 14, margin: "0 0 16px" }}>Setores</h3>

      <div style={{ marginBottom: 16 }}>
        {setores.length === 0 && (
          <p style={{ fontSize: 13, color: "var(--ink-muted)" }}>Nenhum setor cadastrado ainda.</p>
        )}
        {setores.map((s) => (
          <div
            key={s.id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "8px 0",
              borderBottom: "1px solid var(--border)",
              fontSize: 13.5,
            }}
          >
            <span>
              {s.nome} {s.sigla && <span style={{ color: "var(--ink-faint)" }}>({s.sigla})</span>}
            </span>
            {s.setor_pai_id && (
              <span style={{ color: "var(--ink-faint)", fontSize: 12 }}>
                subordinado a {setores.find((p) => p.id === s.setor_pai_id)?.nome ?? "—"}
              </span>
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end" }}>
        <div className="field" style={{ marginBottom: 0, flex: 2, minWidth: 160 }}>
          <label>Nome do setor</label>
          <input value={nome} onChange={(e) => setNome(e.target.value)} required />
        </div>
        <div className="field" style={{ marginBottom: 0, flex: 1, minWidth: 100 }}>
          <label>Sigla</label>
          <input value={sigla} onChange={(e) => setSigla(e.target.value)} />
        </div>
        <div className="field" style={{ marginBottom: 0, flex: 2, minWidth: 160 }}>
          <label>Setor pai (opcional)</label>
          <select value={setorPaiId} onChange={(e) => setSetorPaiId(e.target.value)}>
            <option value="">Nenhum</option>
            {setores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nome}
              </option>
            ))}
          </select>
        </div>
        <button className="btn-primary" disabled={carregando}>
          {carregando ? "Adicionando..." : "Adicionar setor"}
        </button>
      </form>
      {erro && <p className="error-text" style={{ marginTop: 8 }}>{erro}</p>}
    </div>
  );
}
