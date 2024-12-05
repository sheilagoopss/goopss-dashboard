import { AuthProvider } from "@/contexts/AuthContext";
import AdminLayout from "@/layouts/admin/AdminLayout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AdminLayout>{children}</AdminLayout>
    </AuthProvider>
  );
}
