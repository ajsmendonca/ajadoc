import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DespachoForm from "./despacho-form";

export default async function ProtocoloDetalhePage({
  params,
}: {
  params: { numero: string };
}) {
  const supabase = createClient();

  const { data: protocolo } = await supabase
    .from("protocolos")
    .select("*, setores:setor_atual_id(nome)")
    .eq("numero", params.numero)
    .maybeSingle();

  if (!protocolo) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: usuarioInterno } = await supabase
    .from("usuarios")
    .select("id, nome, papel")
    .eq("id", user?.id ?? "")
    .maybeSingle();

  const ehExterno = !usuarioInterno;

  // RLS já filtra: externo só vê despachos com visivel_externamente = true
  const { data: despachos } = await supabase
    .from("tramitacoes")
    .select(
      "id, numero_sequencial, tipo_acao, despacho, caminho_setor, visivel_externamente, created_at, usuarios:usuario_remetente_id(nome)"
    )
    .eq("protocolo_id", protocolo.id)
    .order("numero_sequencial", { ascending: true });

  const { data: setores } = ehExterno
    ? { data: null }
    : await supabase.from("setores").select("id, nome").eq("ativo", true);

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, margin: "0 0 4px" }}>
          Protocolo {protocolo.numero}
        </h1>
        <p style={{ fontSize: 14, color: "var(--ink-muted)", margin: 0 }}>{protocolo.assunto}</p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div className="panel">
          {(!despachos || despachos.length === 0) && (
            <p style={{ padding: 20, color: "var(--ink-muted)", fontSize: 14 }}>
              Nenhuma tramitação ainda.
            </p>
          )}
          {despachos?.map((d: any, idx: number) => (
            <div
              key={d.id}
              style={{
                padding: "18px 24px",
                borderBottom: "1px solid var(--border)",
                display: "flex",
                gap: 14,
              }}
            >
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: "50%",
                  background: "var(--bg)",
                  border: "1px solid var(--border-strong)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11.5,
                  fontWeight: 600,
                  color: "var(--ink-muted)",
                  flexShrink: 0,
                }}
              >
                {d.numero_sequencial ?? idx + 1}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>
                      {d.usuarios?.nome ?? "Solicitante externo"}
                    </div>
                    {d.caminho_setor && (
                      <div style={{ fontSize: 11, color: "var(--ink-faint)" }}>{d.caminho_setor}</div>
                    )}
                  </div>
                  <div style={{ fontSize: 11.5, color: "var(--ink-faint)", whiteSpace: "nowrap" }}>
                    {new Date(d.created_at).toLocaleString("pt-BR")}
                  </div>
                </div>
                <div
                  style={{
                    fontSize: 10.5,
                    textTransform: "uppercase",
                    letterSpacing: "0.03em",
                    color: "var(--ink-faint)",
                    margin: "4px 0",
                  }}
                >
                  {d.tipo_acao}
                </div>
                <div style={{ fontSize: 13.5 }}>{d.despacho}</div>
              </div>
            </div>
          ))}
        </div>

        <DespachoForm
          protocoloId={protocolo.id}
          proximoSequencial={(despachos?.length ?? 0) + 1}
          ehExterno={ehExterno}
          setores={setores ?? []}
          setorAtualId={protocolo.setor_atual_id}
        />
      </div>
    </div>
  );
}
