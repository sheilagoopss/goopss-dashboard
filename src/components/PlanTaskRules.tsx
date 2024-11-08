import React, { useState, useEffect } from 'react';
import { Layout, Typography, Card, Table, Button, Space, Modal, Form, Input, Select, InputNumber } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { PlanTaskRule, PlanTaskSection } from '../types/PlanTasks';
import { usePlanTaskRules } from '../hooks/usePlanTaskRules';

const { Header, Content } = Layout;
const { Title } = Typography;
const { Option } = Select;

const PlanTaskRules: React.FC = () => {
  const [rules, setRules] = useState<PlanTaskRule[]>([]);
  const [sections, setSections] = useState<PlanTaskSection[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingRule, setEditingRule] = useState<PlanTaskRule | null>(null);
  const [form] = Form.useForm();
  const { fetchTaskRules, fetchSections } = usePlanTaskRules();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const fetchedRules = await fetchTaskRules();
    const fetchedSections = await fetchSections();
    setRules(fetchedRules);
    setSections(fetchedSections);
  };

  const columns = [
    {
      title: 'Task',
      dataIndex: 'task',
      key: 'task',
    },
    {
      title: 'Section',
      dataIndex: 'section',
      key: 'section',
    },
    {
      title: 'Days After Join',
      dataIndex: 'daysAfterJoin',
      key: 'daysAfterJoin',
    },
    {
      title: 'Frequency',
      dataIndex: 'frequency',
      key: 'frequency',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: PlanTaskRule) => (
        <Space>
          <Button 
            icon={<EditOutlined />} 
            onClick={() => handleEdit(record)}
          />
          <Button 
            icon={<DeleteOutlined />} 
            danger 
            onClick={() => handleDelete(record)}
          />
        </Space>
      ),
    },
  ];

  const handleEdit = (rule: PlanTaskRule) => {
    setEditingRule(rule);
    form.setFieldsValue(rule);
    setIsModalVisible(true);
  };

  const handleDelete = (rule: PlanTaskRule) => {
    // Add delete functionality
  };

  return (
    <Layout>
      <Header style={{ background: '#fff', padding: '0 16px' }}>
        <Title level={2}>Plan Task Rules</Title>
      </Header>
      <Content style={{ padding: '16px' }}>
        <Card>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingRule(null);
              form.resetFields();
              setIsModalVisible(true);
            }}
            style={{ marginBottom: 16 }}
          >
            Add New Rule
          </Button>
          <Table 
            columns={columns} 
            dataSource={rules}
            rowKey="id"
          />
        </Card>

        <Modal
          title={editingRule ? 'Edit Task Rule' : 'Add Task Rule'}
          open={isModalVisible}
          onOk={form.submit}
          onCancel={() => setIsModalVisible(false)}
        >
          <Form
            form={form}
            layout="vertical"
          >
            {/* Form fields will go here */}
          </Form>
        </Modal>
      </Content>
    </Layout>
  );
};

export default PlanTaskRules; 