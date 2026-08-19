import { Navigate, Route, Routes } from "react-router-dom";
import { AdminLayout } from "./admin/AdminLayout";
import { ApiKeyGate } from "./admin/ApiKeyGate";
import { ApiKeyProvider } from "./admin/ApiKeyContext";
import { EmbedSnippetPage } from "./admin/EmbedSnippetPage";
import { TutorFormPage } from "./admin/TutorFormPage";
import { TutorListPage } from "./admin/TutorListPage";
import { WidgetPage } from "./widget/WidgetPage";
import { NotFoundPage } from "./NotFoundPage";

export function AppRouter() {
  return (
    <Routes>
      <Route path="/widget" element={<WidgetPage />} />

      <Route
        path="/admin"
        element={
          <ApiKeyProvider>
            <ApiKeyGate>
              <AdminLayout />
            </ApiKeyGate>
          </ApiKeyProvider>
        }
      >
        <Route index element={<Navigate to="tutors" replace />} />
        <Route path="tutors" element={<TutorListPage />} />
        <Route path="tutors/new" element={<TutorFormPage />} />
        <Route path="tutors/:tutorId" element={<TutorFormPage />} />
        <Route path="tutors/:tutorId/embed" element={<EmbedSnippetPage />} />
      </Route>

      <Route path="/admin/*" element={<Navigate to="/admin/tutors" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
