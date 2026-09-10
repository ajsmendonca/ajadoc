"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Modo = "login" | "cadastro-externo" | "cadastro-interno";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [modo, setModo] = useState<Modo>("login");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [nome, setNome] = useState("");
  const [documento, setDocumento] = useState(""); // CPF/CNPJ (externo)

  async function handleLoginReal(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setCarregando(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    });

    setCarregando(false);
    if (error) {
      setErro("E-mail ou senha inválidos.");
      return;
    }
    router.push("/dashboard/inbox");
    router.refresh();
  }

  async function handleCadastroExterno(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setCarregando(true);

    const { data, error } = await supabase.auth.signUp({ email, password: senha });
    if (error || !data.user) {
      setCarregando(false);
      setErro(error?.message ?? "Não foi possível criar a conta.");
      return;
    }

    const { error: insertError } = await supabase.from("solicitantes").insert({
      auth_user_id: data.user.id,
      tipo_pessoa: documento.replace(/\D/g, "").length > 11 ? "juridica" : "fisica",
      nome,
      documento,
      email,
    });

    setCarregando(false);
    if (insertError) {
      setErro(insertError.message);
      return;
    }
    router.push("/dashboard/inbox");
    router.refresh();
  }

  async function handleCadastroInterno(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setCarregando(true);

    const { data, error } = await supabase.auth.signUp({ email, password: senha });
    if (error || !data.user) {
      setCarregando(false);
      setErro(error?.message ?? "Não foi possível criar a conta.");
      return;
    }

    const { error: insertError } = await supabase.from("usuarios").insert({
      id: data.user.id,
      nome,
      email,
      status: "pendente",
    });

    setCarregando(false);
    if (insertError) {
      setErro(insertError.message);
      return;
    }
    setMensagem(
      "Cadastro enviado! Sua conta interna fica pendente até a administração aprovar e definir seu setor."
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div className="panel" style={{ width: 380, padding: 32 }}>
        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>
          Protocolo<span style={{ color: "var(--accent)" }}>.</span>
        </div>
        <p style={{ fontSize: 13, color: "var(--ink-muted)", marginBottom: 24 }}>
          {modo === "login" && "Entre com seu e-mail e senha."}
          {modo === "cadastro-externo" && "Cadastro para solicitantes externos."}
          {modo === "cadastro-interno" && "Cadastro para funcionários (fica pendente de aprovação)."}
        </p>

        {mensagem ? (
          <p style={{ fontSize: 13, color: "var(--ok)" }}>{mensagem}</p>
        ) : (
          <form
            onSubmit={
              modo === "login"
                ? handleLoginReal
                : modo === "cadastro-externo"
                ? handleCadastroExterno
                : handleCadastroInterno
            }
          >
            {modo !== "login" && (
              <div className="field">
                <label>Nome {modo === "cadastro-externo" ? "/ Razão social" : "completo"}</label>
                <input value={nome} onChange={(e) => setNome(e.target.value)} required />
              </div>
            )}

            {modo === "cadastro-externo" && (
              <div className="field">
                <label>CPF ou CNPJ</label>
                <input value={documento} onChange={(e) => setDocumento(e.target.value)} required />
              </div>
            )}

            <div className="field">
              <label>E-mail</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>

            <div className="field">
              <label>Senha</label>
              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                minLength={8}
                required
              />
            </div>

            {erro && <p className="error-text" style={{ marginBottom: 12 }}>{erro}</p>}

            <button className="btn-primary" style={{ width: "100%" }} disabled={carregando}>
              {carregando
                ? "Enviando..."
                : modo === "login"
                ? "Entrar"
                : "Criar conta"}
            </button>
          </form>
        )}

        <div style={{ marginTop: 20, fontSize: 12.5, color: "var(--ink-muted)", display: "flex", flexDirection: "column", gap: 6 }}>
          {modo !== "login" && (
            <button onClick={() => { setModo("login"); setMensagem(null); setErro(null); }} style={{ background: "none", border: "none", color: "var(--accent)", cursor: "pointer", padding: 0, textAlign: "left" }}>
              Já tenho conta — entrar
            </button>
          )}
          {modo !== "cadastro-externo" && (
            <button onClick={() => { setModo("cadastro-externo"); setMensagem(null); setErro(null); }} style={{ background: "none", border: "none", color: "var(--accent)", cursor: "pointer", padding: 0, textAlign: "left" }}>
              Criar conta — sou solicitante externo
            </button>
          )}
          {modo !== "cadastro-interno" && (
            <button onClick={() => { setModo("cadastro-interno"); setMensagem(null); setErro(null); }} style={{ background: "none", border: "none", color: "var(--accent)", cursor: "pointer", padding: 0, textAlign: "left" }}>
              Criar conta — sou funcionário interno
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
