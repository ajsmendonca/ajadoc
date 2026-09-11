import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SetoresManager from "./setores-manager";
import TiposDocumentoManager from "./tipos-documento-manager";
import UsuariosManager from "./usuarios-manager";

export default async function AdminPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: usuario } = await supabase
    .from("usuarios")
    .select("papel")
    .eq("id", user?.id ?? "")
    .maybeSingle();

  if (usuario?.papel !== "admin") {
    redirect("/dashboard/inbox");
  }

  const { data: setores } = await supabase
    .from("setores")
    .select("id, nome, sigla, setor_pai_id, ativo")
    .order("nome");

  const { data: tiposDocumento } = await supabase
    .from("tipos_documento")
    .select("id, nome, prazo_padrao_dias, ativo")
    .order("nome");

  const { data: usuarios } = await supabase
    .from("usuarios")
    .select("id, nome, email, papel, status, setor_id")
    .order("created_at");

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, margin: "0 0 4px" }}>Administração</h1>
        <p style={{ fontSize: 14, color: "var(--ink-muted)", margin: 0 }}>
          Setores, tipos de documento e aprovação de cadastros internos.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <UsuariosManager usuarios={usuarios ?? []} setores={setores ?? []} />
        <SetoresManager setores={setores ?? []} />
        <TiposDocumentoManager tipos={tiposDocumento ?? []} />
      </div>
    </div>
  );
}
