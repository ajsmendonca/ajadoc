"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Setor = { id: string; nome: string };
type TipoAnexo = { id: string; nome: string };

export default function DespachoForm({
  protocoloId,
  proximoSequencial,
  ehExterno,
  setores,
  setorAtualId,
  tiposAnexo,
}: {
  protocoloId: string;
  proximoSequencial: number;
  ehExterno: boolean;
  setores: Setor[];
  setorAtualId: string;
  tiposAnexo: TipoAnexo[];
}) {
  const supabase = createClient();
  const router = useRouter();

  const [mensagem, setMensagem] = useState("");
  const [setorDestinoId, setSetorDestinoId] = useState("");
  const [devolverAoSolicitante, setDevolverAoSolicitante] = useState(false);
  const [visivelExternamente, setVisivelExternamente] = useState(true);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [tipoAnexoId, setTipoAnexoId] = useState("");
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
      payload.setor_destino_id = setorAtualId;
    } else {
      payload.usuario_remetente_id = user?.id;
      payload.visivel_externamente = visivelExternamente;
      payload.tipo_acao = "encaminhamento";
      payload.setor_destino_id = devolverAoSolicitante ? null : setorDestinoId || setorAtualId;
    }

    const { data: tramitacao, error: despachoError } = await supabase
      .from("tramitacoes")
      .insert(payload)
      .select("id")
      .single();

    if (despachoError || !tramitacao) {
      setCarregando(false);
      setErro(despachoError?.message ?? "Não foi possível enviar.");
      return;
    }

    // upload do anexo, se houver
    if (arquivo) {
      const caminho = `${protocoloId}/${tramitacao.id}/${arquivo.name}`;
      const { error: uploadError } = await supabase.storage
        .from("anexos-protocolos")
        .upload(caminho, arquivo);

      if (uploadError) {
        setCarregando(false);
        setErro(`Despacho enviado, mas o anexo falhou: ${uploadError.message}`);
        router.refresh();
        return;
      }

      await supabase.from("anexos").insert({
        protocolo_id: protocoloId,
        tramitacao_id: tramitacao.id,
        tipo_anexo_id: tipoAnexoId || null,
        nome_arquivo: arquivo.name,
        caminho_storage: caminho,
        tipo_mime: arquivo.type,
        tamanho_bytes: arquivo.size,
        enviado_por_usuario_id: ehExterno ? null : user?.id,
      });
    }

    if (!ehExterno && setorDestinoId && !devolverAoSolicitante) {
      await supabase
        .from("protocolos")
        .update({ setor_atual_id: setorDestinoId })
        .eq("id", protocoloId);
    }

    setCarregando(false);
    setMensagem("");
    setArquivo(null);
    setTipoAnexoId("");
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

      <div className="field">
        <label>Anexo (opcional)</label>
        <input
          type="file"
          onChange={(e) => setArquivo(e.target.files?.[0] ?? null)}
        />
        {arquivo && (
          <div style={{ marginTop: 8 }}>
            <select value={tipoAnexoId} onChange={(e) => setTipoAnexoId(e.target.value)}>
              <option value="">Tipo do anexo...</option>
              {tiposAnexo.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nome}
                </option>
              ))}
            </select>
          </div>
        )}
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
