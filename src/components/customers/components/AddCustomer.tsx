import { Form } from "antd";
import { Customer } from "../../../types/Customer";
import dayjs from "dayjs";
import { CustomerForm } from "../form/CustomerForm";

interface AddCustomerProps {
  onAddCustomer: (customer: Customer) => void;
  isCreating: boolean;
}

export default function AddCustomer({
  onAddCustomer,
  isCreating,
}: AddCustomerProps) {
  const [form] = Form.useForm();

  const handleSubmit = (values: any) => {
    const newCustomer: Customer = {
      ...values,
      date_joined: dayjs().format("YYYY-MM-DD"),
    };
    onAddCustomer(newCustomer);
    form.resetFields();
  };

  return (
    <Form form={form} onFinish={handleSubmit} layout="vertical">
      <CustomerForm loading={isCreating} />
    </Form>
  );
}
