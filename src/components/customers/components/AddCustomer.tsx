import { Form } from "antd";
import { ICustomer } from "../../../types/Customer";
import dayjs from "dayjs";
import { CustomerForm } from "../form/CustomerForm";

interface AddCustomerProps {
  onAddCustomer: (customer: ICustomer) => Promise<boolean>;
  isCreating: boolean;
}

export default function AddCustomer({
  onAddCustomer,
  isCreating,
}: AddCustomerProps) {
  const [form] = Form.useForm();

  const handleSubmit = async (values: any) => {
    const newCustomer: ICustomer = {
      ...values,
      date_joined: values.date_joined ? dayjs(values.date_joined).format("YYYY-MM-DD") : dayjs().format("YYYY-MM-DD"),
      isActive: true,
    };
    const created = await onAddCustomer(newCustomer);
    if (created) {
      form.resetFields();
    }
  };

  return (
    <Form form={form} onFinish={handleSubmit} layout="vertical">
      <CustomerForm loading={isCreating} />
    </Form>
  );
}
