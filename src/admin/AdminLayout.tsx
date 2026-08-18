import { Link, Outlet } from "react-router-dom";
import { useApiKey } from "./ApiKeyContext";

export function AdminLayout() {
  const { clearApiKey } = useApiKey();

  return (
    <div className="admin-layout">
      <header className="admin-header">
        <Link to="/admin/tutors" className="admin-brand">
          Tutores — Admin
        </Link>
        <button type="button" onClick={clearApiKey}>
          Sair
        </button>
      </header>
      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  );
}
