"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Tipo = { id: string; nome: string; prazo_padrao_dias: number | null; ativo: boolean };

export default function TiposDocumentoManager({ tipos }: { tipos: Tipo[] }) {
  const supabase = createClient();
  const router = useRouter();

  const [nome, setNome] = useState("");
  const [prazo, setPrazo] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setCarregando(true);

    const { error } = await supabase.from("tipos_documento").insert({
      nome,
      prazo_padrao_dias: prazo ? Number(prazo) : null,
    });

    setCarregando(false);
    if (error) {
      setErro(error.message);
      return;
    }
    setNome("");
    setPrazo("");
    router.refresh();
  }

  return (
    <div className="panel" style={{ padding: 24 }}>
      <h3 style={{ fontSize: 14, margin: "0 0 16px" }}>Tipos de documento</h3>

      <div style={{ marginBottom: 16 }}>
        {tipos.length === 0 && (
          <p style={{ fontSize: 13, color: "var(--ink-muted)" }}>Nenhum tipo cadastrado ainda.</p>
        )}
        {tipos.map((t) => (
          <div
            key={t.id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "8px 0",
              borderBottom: "1px solid var(--border)",
              fontSize: 13.5,
            }}
          >
            <span>{t.nome}</span>
            {t.prazo_padrao_dias && (
              <span style={{ color: "var(--ink-faint)", fontSize: 12 }}>
                prazo padrão: {t.prazo_padrao_dias} dias
              </span>
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end" }}>
        <div className="field" style={{ marginBottom: 0, flex: 2, minWidth: 160 }}>
          <label>Nome do tipo</label>
          <input value={nome} onChange={(e) => setNome(e.target.value)} required />
        </div>
        <div className="field" style={{ marginBottom: 0, flex: 1, minWidth: 140 }}>
          <label>Prazo padrão (dias, opcional)</label>
          <input type="number" value={prazo} onChange={(e) => setPrazo(e.target.value)} />
        </div>
        <button className="btn-primary" disabled={carregando}>
          {carregando ? "Adicionando..." : "Adicionar tipo"}
        </button>
      </form>
      {erro && <p className="error-text" style={{ marginTop: 8 }}>{erro}</p>}
    </div>
  );
}
