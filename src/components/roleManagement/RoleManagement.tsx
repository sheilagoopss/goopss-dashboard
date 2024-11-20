/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from "react";
import { Table, Button, Modal, Form, Input, Select, message } from "antd";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { IAdmin } from "types/Customer";
import {
  useAdminDelete,
  useAdminFetchAll,
  useAdminUpdate,
} from "hooks/useAdmin";

const { Option } = Select;

export default function RoleManagement() {
  const { fetchAllAdmins, isLoading } = useAdminFetchAll();
  const { updateAdmin, isLoading: isUpdating } = useAdminUpdate();
  const { deleteAdmin, isLoading: isDeleting } = useAdminDelete();
  const [staff, setStaff] = useState<IAdmin[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      sorter: (a: IAdmin, b: IAdmin) =>
        (a.name || "").localeCompare(b.name || ""),
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      sorter: (a: IAdmin, b: IAdmin) =>
        (a.email || "").localeCompare(b.email || ""),
    },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
      sorter: (a: IAdmin, b: IAdmin) =>
        (a.role || "").localeCompare(b.role || ""),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: IAdmin) => (
        <span>
          <Button
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            aria-label={`Edit ${record.name}`}
            loading={editingStaffId === record.id && isUpdating}
          />
          <Button
            icon={<DeleteOutlined />}
            onClick={() => {
              Modal.confirm({
                title: `Are you sure you want to delete ${record.name}?`,
                onOk: () => handleDelete(record.id),
              });
            }}
            style={{ marginLeft: 8 }}
            aria-label={`Delete ${record.name}`}
            loading={selectedStaffId === record.id && isDeleting}
          />
        </span>
      ),
    },
  ];

  const refetch = async () => {
    const admins = await fetchAllAdmins();
    setStaff(admins.sort((a, b) => (a.name ?? "").localeCompare(b.name ?? "")));
  };

  const handleEdit = (record: IAdmin) => {
    setEditingStaffId(record.id);
    form.setFieldsValue(record);
    setIsModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    setSelectedStaffId(id);
    await deleteAdmin(id);
    message.success("Staff member deleted successfully");
    setSelectedStaffId(null);
    refetch();
  };

  const handleModalOk = async () => {
    form.validateFields().then(async (values) => {
      if (editingStaffId) {
        await updateAdmin(editingStaffId, values);
        message.success("Staff member updated successfully");
        refetch();
      }
      setIsModalVisible(false);
    });
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
  };

  useEffect(() => {
    refetch();
  }, []);

  return (
    <div style={{ padding: "24px" }}>
      <h1>Role Management</h1>
      <Table
        columns={columns}
        dataSource={staff}
        rowKey="id"
        loading={isLoading}
        pagination={{
          pageSize: 10,
        }}
      />
      <Modal
        title={editingStaffId ? "Edit Role" : "Add Role"}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        confirmLoading={isUpdating}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: "Please input the name!" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: "Please input the email!" },
              { type: "email", message: "Please enter a valid email!" },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="role"
            label="Role"
            rules={[{ required: true, message: "Please select the role!" }]}
          >
            <Select>
              <Option value="Admin">Admin</Option>
              <Option value="SuperAdmin">SuperAdmin</Option>
              <Option value="Designer">Designer</Option>
              <Option value="TeamMember">TeamMember</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
