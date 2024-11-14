/* eslint-disable react-hooks/exhaustive-deps */
import { SearchOutlined } from "@ant-design/icons";
import { Card, Col, Input, Row, Table, Typography } from "antd";
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
import { caseInsensitiveSearch } from "utils/caseInsensitveMatch";

const ActivityLog = () => {
  const { fetchCustomerUserActivityAll } = useCustomerUserActivityFetchAll();
  const { fetchAllCustomers, isLoading } = useCustomerFetchAll();
  const [customers, setCustomers] = useState<
    (ICustomer & {
      last_login_date: Date | undefined;
      userActivities: IUserActivity[];
    })[]
  >([]);
  const [filteredCustomers, setFilteredCustomers] = useState<
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
    setFilteredCustomers(customersWithActivities);
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

  const handleSearch = (searchTerm?: string) => {
    const filterColumns: (keyof ICustomer)[] = [
      "package_type",
      "email",
      "phone",
      "date_joined",
      "store_name",
      "store_owner_name",
    ];
    const filtered = customers?.filter((val) =>
      filterColumns.some((v) =>
        caseInsensitiveSearch(val[v] || "", searchTerm),
      ),
    );
    setFilteredCustomers(filtered);
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
        <div style={{ display: "flex", flexDirection: "column" }}>
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
      <Card>
        <Input
          placeholder="Search store owners"
          prefix={<SearchOutlined />}
          onChange={(e) => handleSearch(e.target.value)}
          style={{ width: "40ch" }}
          allowClear
        />
      </Card>
      <Content>
        <Table
          columns={columns}
          dataSource={filteredCustomers.sort((a, b) => {
            const dateA = a.last_login_date
              ? dayjs(a.last_login_date)
              : dayjs(0);
            const dateB = b.last_login_date
              ? dayjs(b.last_login_date)
              : dayjs(0);
            return dateA.isAfter(dateB) ? -1 : 1;
          })}
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
