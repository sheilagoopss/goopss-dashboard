import { AuthProvider } from "@/contexts/AuthContext";
import CustomerLayout from "@/layouts/customer/CustomerLayout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <CustomerLayout>{children}</CustomerLayout>
    </AuthProvider>
  );
}
