"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type TipoAnexo = { id: string; nome: string; ativo: boolean };

export default function TiposAnexoManager({ tipos }: { tipos: TipoAnexo[] }) {
  const supabase = createClient();
  const router = useRouter();

  const [nome, setNome] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setCarregando(true);

    const { error } = await supabase.from("tipos_anexo").insert({ nome });

    setCarregando(false);
    if (error) {
      setErro(error.message);
      return;
    }
    setNome("");
    router.refresh();
  }

  return (
    <div className="panel" style={{ padding: 24 }}>
      <h3 style={{ fontSize: 14, margin: "0 0 16px" }}>Tipos de anexo</h3>
      <p style={{ fontSize: 12.5, color: "var(--ink-muted)", marginTop: -10, marginBottom: 16 }}>
        Categorias que aparecem no seletor ao anexar um arquivo (ex: Planta baixa, Alvará Sanitário, ART/RRT).
      </p>

      <div style={{ marginBottom: 16, display: "flex", flexWrap: "wrap", gap: 6 }}>
        {tipos.length === 0 && (
          <p style={{ fontSize: 13, color: "var(--ink-muted)" }}>Nenhum tipo cadastrado ainda.</p>
        )}
        {tipos.map((t) => (
          <span
            key={t.id}
            style={{
              fontSize: 12,
              background: "var(--bg)",
              border: "1px solid var(--border)",
              borderRadius: 6,
              padding: "4px 10px",
            }}
          >
            {t.nome}
          </span>
        ))}
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
        <div className="field" style={{ marginBottom: 0, flex: 1 }}>
          <label>Nome do tipo</label>
          <input value={nome} onChange={(e) => setNome(e.target.value)} required />
        </div>
        <button className="btn-primary" disabled={carregando}>
          {carregando ? "Adicionando..." : "Adicionar"}
        </button>
      </form>
      {erro && <p className="error-text" style={{ marginTop: 8 }}>{erro}</p>}
    </div>
  );
}
