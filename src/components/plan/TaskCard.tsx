import { Card, Progress, Image, Space, Typography, Tag } from "antd";
import { ICustomer } from "@/types/Customer";
import { PlanTask } from "@/types/Plan";
import { CalendarOutlined, CheckCircleOutlined } from "@ant-design/icons";

const pastelColors = {
  "To Do": "#FFCCCB",
  Doing: "#ADD8E6",
  Done: "#90EE90",
  Monthly: "#DDA0DD",
  "One Time": "#FFE4B5",
};

interface TaskCardProps {
  task: PlanTask;
  editMode: boolean;
  onEdit: (
    key: string,
    field: keyof PlanTask,
    value: string | boolean | number | null,
  ) => void;
  customer: ICustomer | null | undefined;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, customer }) => {
  return (
    <Card
      style={{
        marginBottom: "16px",
        background: "#f8f9fa",
        borderRadius: "8px",
        border: "1px solid #e8e8e8",
      }}
    >
      <Space
        size="middle"
        style={{
          width: "100%",
          justifyContent: "space-between",
          alignItems: "center",
          minHeight: "68px",
          padding: "8px 0",
        }}
      >
        <Space direction="vertical" size={0} style={{ flex: 1 }}>
          <Typography.Text strong style={{ fontSize: "16px" }}>
            {task.task}
          </Typography.Text>
          {customer && (
            <Space>
              <Image
                src={customer.logo || "/placeholder.svg"}
                alt={`${customer.store_name} logo`}
                width={16}
                height={16}
                style={{ borderRadius: "50%" }}
                preview={false}
              />
              <Typography.Text type="secondary">
                {customer.store_owner_name} - {customer.store_name}
              </Typography.Text>
            </Space>
          )}
        </Space>
        <Space align="center" size="large">
          {task.frequency === "Monthly" && (
            <Space direction="vertical" size={0} align="center">
              <Progress
                type="circle"
                percent={Math.round(
                  ((task.current || 0) / (task.goal || 1)) * 100,
                )}
                size={50}
                strokeColor={{
                  "0%": "#108ee9",
                  "100%": "#87d068",
                }}
                format={() => (
                  <Typography.Text style={{ fontSize: "12px" }}>
                    {task.current || 0}/{task.goal || 0}
                  </Typography.Text>
                )}
              />
              <Typography.Text
                type="secondary"
                style={{ fontSize: "12px", marginTop: "4px" }}
              >
                This Month
              </Typography.Text>
            </Space>
          )}
          <Space direction="vertical" size={2}>
            {task.dueDate ? (
              <Space>
                <CalendarOutlined />
                <Typography.Text type="secondary">
                  Due: {task.dueDate}
                </Typography.Text>
              </Space>
            ) : (
              <Typography.Text type="secondary">No due date</Typography.Text>
            )}
            {task.completedDate && (
              <Space>
                <CheckCircleOutlined style={{ color: "#52c41a" }} />
                <Typography.Text type="secondary">
                  Completed: {task.completedDate}
                </Typography.Text>
              </Space>
            )}
          </Space>
          <Tag
            color={pastelColors[task.progress]}
            style={{
              padding: "4px 12px",
              borderRadius: "4px",
            }}
          >
            {task.progress}
          </Tag>
        </Space>
      </Space>
    </Card>
  );
};

export default TaskCard;
