/* eslint-disable react-hooks/exhaustive-deps */
import { Col, Row, Table, Typography } from "antd";
import { Layout } from "antd";
import { Content, Header } from "antd/es/layout/layout";
import { ColumnType } from "antd/es/table";
import dayjs from "dayjs";
import {
  useCustomerFetchAll,
  useCustomerUserActivityFetchAll,
} from "hooks/useCustomer";
import { useEffect, useState } from "react";
import { ICustomer } from "types/Customer";
import { IUserActivity } from "types/UserActivityLog";

const ActivityLog = () => {
  const { fetchCustomerUserActivityAll } = useCustomerUserActivityFetchAll();
  const { fetchAllCustomers, isLoading } = useCustomerFetchAll();
  const [customers, setCustomers] = useState<
    (ICustomer & {
      last_login_date: Date | undefined;
      userActivities: IUserActivity[];
    })[]
  >([]);

  const handleFetchData = async () => {
    const customersData = await fetchAllCustomers();
    const userActivities = await fetchCustomerUserActivityAll();
    const customersWithActivities =
      customersData?.map((customer) => ({
        ...customer,
        userActivities: userActivities.filter(
          (activity) => activity.customer_id === customer.id,
        ),
        last_login_date:
          userActivities
            .filter((activity) => activity.customer_id === customer.id)
            .reduce((latest: Date | undefined, activity) => {
              const activityDate = activity.timestamp?.toDate();
              if (latest === undefined && activityDate) {
                return activityDate;
              }
              return activityDate && dayjs(activityDate).isAfter(latest)
                ? activityDate
                : latest;
            }, undefined) || undefined,
      })) || [];
    setCustomers(customersWithActivities);
  };

  useEffect(() => {
    handleFetchData();
  }, []);

  const expandedRowRender = (
    record: ICustomer & { userActivities: IUserActivity[] },
  ) => {
    return (
      <Row>
        <Col span={24}>
          <Typography.Title level={5}>Login dates</Typography.Title>
          <ul>
            {record.userActivities
              ?.sort((a, b) =>
                dayjs(b.timestamp?.toDate()).diff(dayjs(a.timestamp?.toDate())),
              )
              .slice(0, 10)
              .map((userActivity, index) => (
                <li key={index}>
                  {dayjs(userActivity.timestamp?.toDate()).format(
                    "MMM DD, YYYY HH:mm",
                  )}
                </li>
              ))}
          </ul>
        </Col>
      </Row>
    );
  };

  const columns: ColumnType<
    ICustomer & {
      userActivities: IUserActivity[];
      last_login_date: Date | undefined;
    }
  >[] = [
    {
      title: "Customer",
      dataIndex: "store_owner_name",
      render: (_, record) => (
        <div className="flex flex-col">
          <Typography.Text strong>{record.store_owner_name}</Typography.Text>
          <Typography.Text type="secondary">
            {record.customer_id}
          </Typography.Text>
        </div>
      ),
      sorter: (a, b) => a.store_owner_name.localeCompare(b.store_owner_name),
    },
    {
      title: "Store Name",
      dataIndex: "store_name",
      sorter: (a, b) => a.store_name.localeCompare(b.store_name),
    },
    {
      title: "Last Login",
      dataIndex: "last_login_date",
      render: (_, record) => {
        if (!record.last_login_date) return "-";
        return dayjs(record.last_login_date).format("MMM DD, YYYY HH:mm");
      },
      sorter: (a, b) => {
        const dateA = a.last_login_date ? dayjs(a.last_login_date) : dayjs(0);
        const dateB = b.last_login_date ? dayjs(b.last_login_date) : dayjs(0);
        return dateA.isAfter(dateB) ? 1 : -1;
      },
    },
  ];

  return (
    <Layout style={{ padding: "2ch" }}>
      <Header style={{ background: "#fff", padding: 0 }}>
        <h1>Activity Log</h1>
      </Header>
      <Content>
        <Table
          columns={columns}
          dataSource={customers}
          loading={isLoading}
          rowKey="id"
          expandable={{
            expandedRowRender,
          }}
        />
      </Content>
    </Layout>
  );
};

export default ActivityLog;
