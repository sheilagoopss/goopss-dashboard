import CustomerLayout from "@/layouts/customer/CustomerLayout";
import CustomerHomePage from "./home/page";

export default function CustomerPage() {
  return (
    <CustomerLayout>
      <CustomerHomePage />
    </CustomerLayout>
  );
}
