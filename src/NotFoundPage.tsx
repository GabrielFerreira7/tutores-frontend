// Rota neutra para qualquer caminho não reconhecido. Antes disso, o catch-all
// redirecionava para /admin/tutors — o que significava que uma URL de iframe digitada
// errada abria a tela de login do admin dentro do site do integrador, em vez de um
// estado de erro dedicado.
export function NotFoundPage() {
  return (
    <div style={{ padding: "2rem", textAlign: "center", fontFamily: "system-ui, sans-serif" }}>
      <p>Página não encontrada.</p>
    </div>
  );
}
