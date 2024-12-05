import AdminLayout from "@/layouts/admin/AdminLayout";
import CustomersPage from "./customers/page";

export default function AdminPage() {
  return (
    <AdminLayout>
      <CustomersPage />
    </AdminLayout>
  );
}
