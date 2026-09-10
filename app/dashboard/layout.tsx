import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import NavLink from "./nav-link";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Descobre se é usuário interno (com papel/setor) ou solicitante externo
  const { data: usuarioInterno } = await supabase
    .from("usuarios")
    .select("nome, papel, status")
    .eq("id", user.id)
    .maybeSingle();

  const ehExterno = !usuarioInterno;
  const ehAdmin = usuarioInterno?.papel === "admin";

  if (usuarioInterno?.status === "pendente") {
    return (
      <div style={{ padding: 40, maxWidth: 480 }}>
        <h1 style={{ fontSize: 18 }}>Cadastro em análise</h1>
        <p style={{ color: "var(--ink-muted)", fontSize: 14 }}>
          Seu cadastro interno foi enviado e está aguardando aprovação da administração,
          que vai definir seu setor e nível de acesso. Volte a acessar depois de aprovado.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <nav
        style={{
          width: 220,
          flexShrink: 0,
          background: "var(--surface)",
          borderRight: "1px solid var(--border)",
          padding: "24px 16px",
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}
      >
        <div style={{ fontSize: 15, fontWeight: 600, padding: "0 8px 20px" }}>
          Protocolo<span style={{ color: "var(--accent)" }}>.</span>
        </div>
        {!ehExterno && <NavLink href="/dashboard/nova">Nova solicitação</NavLink>}
        <NavLink href="/dashboard/inbox">Inbox</NavLink>
        {ehAdmin && <NavLink href="/dashboard/admin">Administração</NavLink>}
      </nav>
      <main style={{ flex: 1, padding: "32px 40px", maxWidth: 980 }}>{children}</main>
    </div>
  );
}
