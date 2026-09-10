"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Setor = { id: string; nome: string };
type TipoDocumento = { id: string; nome: string };

export default function NovaSolicitacaoPage() {
  const supabase = createClient();
  const router = useRouter();

  const [setores, setSetores] = useState<Setor[]>([]);
  const [tipos, setTipos] = useState<TipoDocumento[]>([]);
  const [assunto, setAssunto] = useState("");
  const [descricao, setDescricao] = useState("");
  const [tipoDocumentoId, setTipoDocumentoId] = useState("");
  const [setorDestinoId, setSetorDestinoId] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("setores")
      .select("id, nome")
      .eq("ativo", true)
      .then(({ data }) => setSetores(data ?? []));
    supabase
      .from("tipos_documento")
      .select("id, nome")
      .eq("ativo", true)
      .then(({ data }) => setTipos(data ?? []));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setCarregando(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: protocolo, error } = await supabase
      .from("protocolos")
      .insert({
        assunto,
        descricao,
        tipo_documento_id: tipoDocumentoId || null,
        setor_atual_id: setorDestinoId,
        origem_tipo: "interno",
        usuario_criador_id: user?.id,
        status: "aberto",
      })
      .select("numero")
      .single();

    setCarregando(false);
    if (error || !protocolo) {
      setErro(error?.message ?? "Não foi possível abrir o protocolo.");
      return;
    }

    router.push(`/dashboard/protocolo/${protocolo.numero}`);
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, margin: "0 0 4px" }}>Nova solicitação</h1>
        <p style={{ fontSize: 14, color: "var(--ink-muted)", margin: 0 }}>
          Abra um novo protocolo e encaminhe para o setor responsável.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="panel" style={{ padding: 28, maxWidth: 640 }}>
        <div className="field">
          <label>Assunto</label>
          <input value={assunto} onChange={(e) => setAssunto(e.target.value)} required />
        </div>

        <div className="field">
          <label>Tipo de documento</label>
          <select value={tipoDocumentoId} onChange={(e) => setTipoDocumentoId(e.target.value)}>
            <option value="">Selecione...</option>
            {tipos.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nome}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>Setor de destino</label>
          <select
            value={setorDestinoId}
            onChange={(e) => setSetorDestinoId(e.target.value)}
            required
          >
            <option value="">Selecione...</option>
            {setores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nome}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>Descrição</label>
          <textarea rows={3} value={descricao} onChange={(e) => setDescricao(e.target.value)} />
        </div>

        {erro && <p className="error-text">{erro}</p>}

        <button className="btn-primary" disabled={carregando}>
          {carregando ? "Abrindo..." : "Abrir protocolo"}
        </button>
      </form>
    </div>
  );
}
