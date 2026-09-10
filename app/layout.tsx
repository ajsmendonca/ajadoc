import "./globals.css";

export const metadata = {
  title: "Protocolo",
  description: "Sistema de protocolo online",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
