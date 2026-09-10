"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Setor = { id: string; nome: string };

export default function DespachoForm({
  protocoloId,
  proximoSequencial,
  ehExterno,
  setores,
  setorAtualId,
}: {
  protocoloId: string;
  proximoSequencial: number;
  ehExterno: boolean;
  setores: Setor[];
  setorAtualId: string;
}) {
  const supabase = createClient();
  const router = useRouter();

  const [mensagem, setMensagem] = useState("");
  const [setorDestinoId, setSetorDestinoId] = useState("");
  const [devolverAoSolicitante, setDevolverAoSolicitante] = useState(false);
  const [visivelExternamente, setVisivelExternamente] = useState(true);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setCarregando(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const payload: Record<string, any> = {
      protocolo_id: protocoloId,
      numero_sequencial: proximoSequencial,
      despacho: mensagem,
      setor_origem_id: setorAtualId,
    };

    if (ehExterno) {
      payload.tipo_acao = "resposta";
      payload.visivel_externamente = true;
      payload.setor_destino_id = setorAtualId; // não muda o setor responsável
    } else {
      payload.usuario_remetente_id = user?.id;
      payload.visivel_externamente = visivelExternamente;
      if (devolverAoSolicitante) {
        payload.tipo_acao = "encaminhamento";
        payload.setor_destino_id = null;
        // destino_solicitante_id seria preenchido buscando o solicitante do protocolo
      } else {
        payload.tipo_acao = "encaminhamento";
        payload.setor_destino_id = setorDestinoId || setorAtualId;
      }
    }

    const { error: despachoError } = await supabase.from("tramitacoes").insert(payload);

    if (!despachoError && !ehExterno && setorDestinoId && !devolverAoSolicitante) {
      await supabase
        .from("protocolos")
        .update({ setor_atual_id: setorDestinoId })
        .eq("id", protocoloId);
    }

    setCarregando(false);
    if (despachoError) {
      setErro(despachoError.message);
      return;
    }

    setMensagem("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="panel" style={{ padding: 24 }}>
      <h3 style={{ fontSize: 14, margin: "0 0 16px" }}>Interagir em protocolo</h3>

      {!ehExterno && (
        <div className="field">
          <label>Encaminhar para</label>
          <select
            value={devolverAoSolicitante ? "solicitante" : setorDestinoId}
            onChange={(e) => {
              if (e.target.value === "solicitante") {
                setDevolverAoSolicitante(true);
                setSetorDestinoId("");
              } else {
                setDevolverAoSolicitante(false);
                setSetorDestinoId(e.target.value);
              }
            }}
          >
            <option value="">Manter no setor atual</option>
            {setores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nome}
              </option>
            ))}
            <option value="solicitante">— Devolver para o solicitante (quem abriu) —</option>
          </select>
        </div>
      )}

      <div className="field">
        <label>Mensagem</label>
        <textarea
          rows={3}
          value={mensagem}
          onChange={(e) => setMensagem(e.target.value)}
          placeholder="Adicione informações..."
          required
        />
      </div>

      {!ehExterno && (
        <div className="field">
          <label>Visibilidade desta interação</label>
          <div style={{ display: "flex", gap: 14, fontSize: 12.5, color: "var(--ink-muted)" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 5, fontWeight: 400 }}>
              <input
                type="radio"
                name="visibilidade"
                checked={visivelExternamente}
                onChange={() => setVisivelExternamente(true)}
                style={{ width: "auto" }}
              />
              Visível ao solicitante
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 5, fontWeight: 400 }}>
              <input
                type="radio"
                name="visibilidade"
                checked={!visivelExternamente}
                onChange={() => setVisivelExternamente(false)}
                style={{ width: "auto" }}
              />
              Somente interno
            </label>
          </div>
        </div>
      )}

      {erro && <p className="error-text">{erro}</p>}

      <button className="btn-primary" style={{ width: "100%" }} disabled={carregando}>
        {carregando ? "Enviando..." : "Enviar"}
      </button>
    </form>
  );
}
