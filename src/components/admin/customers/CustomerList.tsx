"use client";

import React, { useState, type Key } from "react";
import { Table, Tag, Button, Modal, Form, Col, Row, message } from "antd";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { ChartColumn, Paintbrush, Search, Share2 } from "lucide-react";
import { IAdmin, ICustomer } from "@/types/Customer";
import {
  useCustomerUpdate,
  useCustomerDelete,
} from "../../../hooks/useCustomer";
import { CustomerForm } from "@/components/admin/customers/form/CustomerForm";
import { useListingDeleteAll } from "../../../hooks/useListing";
import dayjs from "dayjs";
import { useAuth } from "@/contexts/AuthContext";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "@/firebase/config";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/constants/routes";

interface CustomerListProps {
  customers: ICustomer[];
  loading: boolean;
  refresh: () => void;
}

export default function CustomerList({
  customers,
  loading,
  refresh,
}: CustomerListProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [editingKey, setEditingKey] = useState("");
  const [form] = Form.useForm();
  const { isLoading: isUpdating, updateCustomer } = useCustomerUpdate();
  const { isLoading: isDeleting, deleteCustomer } = useCustomerDelete();
  const [customerIdForListingDeletion, setCustomerIdForListingDeletion] =
    useState<string | null>(null);

  const { deleteAllListings, isLoading: isDeletingAllListings } =
    useListingDeleteAll();

  const columns = [
    {
      title: "Store Name",
      dataIndex: "store_name",
      key: "store_name",
      sorter: (a: ICustomer, b: ICustomer) =>
        a.store_name.localeCompare(b.store_name),
    },
    {
      title: "Owner Name",
      dataIndex: "store_owner_name",
      key: "store_owner_name",
      sorter: (a: ICustomer, b: ICustomer) =>
        a.store_owner_name.localeCompare(b.store_owner_name),
    },
    {
      title: "Package Type",
      dataIndex: "package_type",
      key: "package_type",
      render: (packageType: string) => (
        <Tag color={packageType === "Free" ? "green" : "blue"}>
          {packageType || "-"}
        </Tag>
      ),
      sorter: (a: ICustomer, b: ICustomer) =>
        (a.package_type || "").localeCompare(b.package_type || ""),
    },
    {
      title: "Current Sales",
      dataIndex: "current_sales",
      key: "current_sales",
      sorter: (a: ICustomer, b: ICustomer) =>
        (a.current_sales || 0) - (b.current_sales || 0),
    },
    {
      title: "Status",
      key: "status",
      width: 100,
      render: (_: any, record: ICustomer) => (
        <Tag color={record.isActive ? "green" : "red"}>
          {record.isActive ? "Active" : "Inactive"}
        </Tag>
      ),
      filters: [
        { text: "Active", value: true },
        { text: "Inactive", value: false },
      ],
      onFilter: (value: boolean | Key, record: ICustomer) =>
        record.isActive === value,
    },
    {
      title: "",
      key: "actions",
      render: (_: any, record: ICustomer) => (
        <Row gutter={[16, 2]}>
          <Col>
            <Button
              onClick={() => handleEdit(record)}
              icon={<EditOutlined />}
            />
          </Col>
          {(user as IAdmin).role === "SuperAdmin" && (
            <>
              <Col>
                <Button
                  onClick={() => handleDelete(record.id)}
                  icon={<DeleteOutlined />}
                  danger
                  loading={isDeleting}
                />
              </Col>
              <Col>
                <Button
                  onClick={() => handleStatusChange(record)}
                  type={record.isActive ? "default" : "primary"}
                  danger={record.isActive}
                >
                  {record.isActive ? "Deactivate" : "Reactivate"}
                </Button>
              </Col>
              <Col>
                <Button
                  onClick={() => handleDeleteAllListings(record.id)}
                  danger
                  loading={
                    isDeletingAllListings &&
                    customerIdForListingDeletion === record.id
                  }
                >
                  Delete All Listings
                </Button>
              </Col>
            </>
          )}
        </Row>
      ),
    },
  ];

  const handleEdit = (record: ICustomer) => {
    form.setFieldsValue({
      ...record,
      date_joined: record.date_joined ? dayjs(record.date_joined) : undefined,
    });
    setEditingKey(record.id);
  };

  const handleSave = async () => {
    try {
      const row = await form.validateFields();
      const updatedCustomer = {
        ...row,
        date_joined: row.date_joined
          ? dayjs(row.date_joined).format("YYYY-MM-DD")
          : undefined,
      };
      const update = await updateCustomer(editingKey, updatedCustomer);
      if (update) {
        message.success({ content: "Customer Updated!" });
        refresh();
      } else {
        message.error({ content: "Customer Not Updated!" });
      }
      setEditingKey("");
    } catch (errInfo) {
      message.error({ content: `Validate Failed: ${errInfo}` });
      console.log("Validate Failed:", errInfo);
    }
  };

  const handleDelete = async (customerId: string) => {
    try {
      await deleteCustomer(customerId);
      message.success({ content: "Customer Deleted!" });
      refresh();
    } catch (error) {
      message.error({ content: `Error deleting customer: ${error}` });
      console.error("Error deleting customer:", error);
    }
  };

  const handleDeleteAllListings = async (customerId: string) => {
    setCustomerIdForListingDeletion(customerId);
    Modal.confirm({
      title: "Are you sure you want to delete all listings for this customer?",
      content: "This action cannot be undone.",
      onOk: async () => {
        try {
          const success = await deleteAllListings(customerId);
          if (success) {
            message.success("All listings deleted successfully");
            refresh();
          } else {
            message.error("Failed to delete all listings");
          }
        } catch (error) {
          console.error("Error deleting listings:", error);
          message.error("Failed to delete all listings");
        } finally {
          setCustomerIdForListingDeletion(null);
        }
      },
    });
  };

  const handleStatusChange = async (customer: ICustomer) => {
    try {
      const customerRef = doc(db, "customers", customer.id);
      const newStatus = !customer.isActive;

      await updateDoc(customerRef, {
        isActive: newStatus,
        deactivatedAt: newStatus ? null : new Date().toISOString(),
        deactivatedBy: newStatus ? null : user?.email,
      });

      // If deactivating, also update all tasks to inactive
      if (!newStatus) {
        const planRef = doc(db, "plans", customer.id);
        const planDoc = await getDoc(planRef);

        if (planDoc.exists()) {
          const plan = planDoc.data();
          const updatedSections = plan.sections.map((section: any) => ({
            ...section,
            tasks: section.tasks.map((task: any) => ({
              ...task,
              isActive: false,
            })),
          }));

          await updateDoc(planRef, { sections: updatedSections });
        }
      }

      message.success(
        `Customer ${newStatus ? "reactivated" : "deactivated"} successfully`,
      );
      refresh();
    } catch (error) {
      console.error("Error updating customer status:", error);
      message.error("Failed to update customer status");
    }
  };

  const expandedRowRender = (record: ICustomer) => (
    <Row>
      <Col span={12}>
        <ul style={{ listStyleType: "none", padding: 0 }}>
          <li>
            <span style={{ fontWeight: "bold" }}>Phone: </span>
            {record.phone}
          </li>
          <li>
            <span style={{ fontWeight: "bold" }}>Email: </span>
            {record.email}
          </li>
          <li>
            <span style={{ fontWeight: "bold" }}>Products: </span>
            {record.products_count}
          </li>
          <li>
            <span style={{ fontWeight: "bold" }}>Notes: </span>
            {record.notes}
          </li>
          {record.package_type !== "Free" && (
            <>
              <li>
                <span style={{ fontWeight: "bold" }}>Sales When Joined: </span>$
                {record.sales_when_joined}
              </li>
              <li>
                <span style={{ fontWeight: "bold" }}>Date Joined: </span>
                {record.date_joined}
              </li>
              <li>
                <span style={{ fontWeight: "bold" }}>Weeks: </span>
                {record.weeks}
              </li>
              <li>
                <span style={{ fontWeight: "bold" }}>Lists: </span>
                {record.lists}
              </li>
            </>
          )}
        </ul>
      </Col>
      <Col span={12}>
        <Row gutter={[16, 20]}>
          <Col span={12}>
            <Button
              size="large"
              icon={<Search />}
              onClick={() => router.push(`${ROUTES.ADMIN.SEO}?${record.id}`)}
            >
              SEO
            </Button>
          </Col>
          <Col span={12}>
            <Button
              size="large"
              icon={<Paintbrush />}
              onClick={() => router.push(`${ROUTES.ADMIN.DESIGN_HUB}?${record.id}`)}
            >
              Design Hub
            </Button>
          </Col>
          <Col span={12}>
            <Button
              size="large"
              icon={<ChartColumn />}
              onClick={() =>
                router.push(`${ROUTES.ADMIN.STORE_ANALYSIS}?${record.id}`)
              }
            >
              Store Analytics
            </Button>
          </Col>
          <Col span={12}>
            <Button
              size="large"
              icon={<Share2 />}
              onClick={() => router.push(`${ROUTES.ADMIN.SOCIAL}?${record.id}`)}
            >
              Social
            </Button>
          </Col>
        </Row>
      </Col>
    </Row>
  );

  return (
    <>
      <Table
        dataSource={customers}
        columns={columns}
        rowKey="id"
        loading={loading}
        expandable={{ expandedRowRender }}
        pagination={{
          showSizeChanger: true,
        }}
      />
      <Modal
        title="Edit Store Owner"
        open={!!editingKey}
        style={{ top: "3ch" }}
        onCancel={() => setEditingKey("")}
        footer={false}
      >
        <Form form={form} onFinish={handleSave} layout="vertical">
          <CustomerForm isUpdate loading={isUpdating} />
        </Form>
      </Modal>
    </>
  );
}
