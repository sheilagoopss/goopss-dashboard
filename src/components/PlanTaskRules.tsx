import React, { useState, useEffect } from 'react';
import { Layout, Typography, Card, Table, Button, Space, Modal, Form, Input, Select, InputNumber, Alert, DatePicker } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { PlanTaskRule, PlanTaskRules as PlanTaskRulesType } from '../types/PlanTasks';
import { PlanSection, PlanTask } from '../types/Plan';
import { usePlanTaskRules } from '../hooks/usePlanTaskRules';
import { doc, getDoc, updateDoc, collection, getDocs, query, where, writeBatch } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { message, Switch, notification } from 'antd';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import { ICustomer } from '../types/Customer';
import type { Plan } from '../types/Plan';

const { Header, Content } = Layout;
const { Title } = Typography;
const { Option } = Select;

const calculateDueDate = (customer: ICustomer, rule: PlanTaskRule) => {
  if (rule.frequency === 'Monthly' && rule.monthlyDueDate) {
    // Monthly tasks: Use monthlyDueDate
    return dayjs().date(rule.monthlyDueDate).format('YYYY-MM-DD');
  } else if (rule.frequency === 'As Needed' || rule.daysAfterJoin === 0) {
    // As Needed tasks or tasks with daysAfterJoin = 0: No due date
    return null;
  } else {
    // One Time tasks: Based on join date
    return dayjs(customer.date_joined)
      .add(rule.daysAfterJoin || 0, 'day')
      .format('YYYY-MM-DD');
  }
};

const PlanTaskRulesComponent: React.FC = () => {
  const [rules, setRules] = useState<PlanTaskRule[]>([]);
  const [sections, setSections] = useState<string[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingRule, setEditingRule] = useState<PlanTaskRule | null>(null);
  const [searchText, setSearchText] = useState('');
  const [form] = Form.useForm();
  const { fetchTaskRules, fetchSections } = usePlanTaskRules();
  const { user } = useAuth();
  const [confirmModal, setConfirmModal] = useState<{
    visible: boolean;
    changes: Array<{
      task: string;
      field: string;
      oldValue: any;
      newValue: any;
    }>;
  }>({ visible: false, changes: [] });
  const [selectedFrequency, setSelectedFrequency] = useState<string | null>(null);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  const getOrdinalSuffix = (day: number): string => {
    if (day > 3 && day < 21) return 'th';
    switch (day % 10) {
      case 1:  return 'st';
      case 2:  return 'nd';
      case 3:  return 'rd';
      default: return 'th';
    }
  };

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
            type="primary"
            onClick={() => handleApplyToAll(record)}
          >
            Apply Changes
          </Button>
          <Button 
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record)}
          />
        </Space>
      ),
    },
  ];

  const handleEdit = (rule: PlanTaskRule) => {
    setEditingRule(rule);
    
    // Convert monthlyDueDate to dayjs object if it exists
    const formValues = {
      ...rule,
      monthlyDueDate: rule.monthlyDueDate ? 
        dayjs().date(rule.monthlyDueDate) : // Convert number to dayjs object
        null
    };
    
    form.setFieldsValue(formValues);
    setIsModalVisible(true);
  };

  const handleDelete = async (rule: PlanTaskRule) => {
    try {
      const rulesRef = doc(db, 'planTaskRules', 'default');
      const rulesDoc = await getDoc(rulesRef);
      
      if (rulesDoc.exists()) {
        const currentRules = rulesDoc.data() as PlanTaskRulesType;
        
        // Filter out the rule to be deleted
        const updatedTasks = currentRules.tasks.filter(task => task.id !== rule.id);

        // Update the document with the filtered tasks
        await updateDoc(rulesRef, {
          tasks: updatedTasks,
          updatedAt: new Date().toISOString(),
          updatedBy: user?.email || ''
        });

        message.success(`Task rule "${rule.task}" deleted successfully`);
        loadData();  // Refresh the data
      }
    } catch (error) {
      console.error('Error deleting task rule:', error);
      message.error('Failed to delete task rule');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      const rulesRef = doc(db, 'planTaskRules', 'default');
      const rulesDoc = await getDoc(rulesRef);
      
      if (rulesDoc.exists()) {
        const currentRules = rulesDoc.data() as PlanTaskRulesType;
        let updatedTasks = [...currentRules.tasks];

        const newTask: PlanTaskRule = {
          id: editingRule?.id || `${Date.now()}`,
          task: values.task,
          section: values.section,
          daysAfterJoin: values.daysAfterJoin === 0 ? null : values.daysAfterJoin,  // Ensure 0 becomes null
          monthlyDueDate: values.frequency === 'Monthly' ? dayjs(values.monthlyDueDate).date() : null,
          frequency: values.frequency,
          isActive: true,
          requiresGoal: values.requiresGoal || false,
          defaultGoal: values.requiresGoal ? values.defaultGoal : null,
          defaultCurrent: values.requiresGoal ? (values.defaultCurrent || 0) : null,
          updatedAt: new Date().toISOString(),
          updatedBy: user?.email || ''
        };

        if (editingRule) {
          // Update existing rule
          updatedTasks = updatedTasks.map(task => 
            task.id === editingRule.id ? newTask : task
          );
        } else {
          // Add new rule
          updatedTasks.push(newTask);
        }

        await updateDoc(rulesRef, {
          tasks: updatedTasks,
          updatedAt: new Date().toISOString(),
          updatedBy: user?.email || ''
        });

        message.success(`Task rule ${editingRule ? 'updated' : 'added'} successfully`);
        setIsModalVisible(false);
        loadData();  // Refresh the data
      }
    } catch (error) {
      console.error('Error saving task rule:', error);
      message.error('Failed to save task rule');
    }
  };

  const handleApplyToAll = async (rule: PlanTaskRule) => {
    Modal.confirm({
      title: 'Apply Changes to All Customers',
      content: (
        <div>
          <p>The following changes will be applied to all customers for task:</p>
          <p><strong>{rule.task}</strong></p>
          <ul>
            {rule.frequency === 'Monthly' && rule.monthlyDueDate ? (
              <li>Due Date: Every {rule.monthlyDueDate}{getOrdinalSuffix(rule.monthlyDueDate)} of the month</li>
            ) : rule.daysAfterJoin ? (
              <li>Due Date: {rule.daysAfterJoin} days after join date</li>
            ) : null}
            {rule.frequency && <li>Frequency: {rule.frequency}</li>}
            {rule.isActive !== undefined && <li>Active Status: {rule.isActive ? 'Active' : 'Inactive'}</li>}
            {rule.defaultGoal && <li>Default Goal: {rule.defaultGoal}</li>}
          </ul>
          <p>This will update all customer plans while preserving their:</p>
          <ul>
            <li>Progress (To Do/Doing/Done)</li>
            <li>Notes</li>
            <li>Completed dates</li>
            <li>Current values</li>
          </ul>
        </div>
      ),
      async onOk() {
        try {
          console.log('Starting handleApplyToAll for rule:', rule);

          // Get all paid customers
          const customersRef = collection(db, 'customers');
          const customersSnapshot = await getDocs(customersRef);
          const paidCustomers = customersSnapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() } as ICustomer))
            .filter(customer => customer.customer_type === 'Paid');

          // Batch updates
          const batch = writeBatch(db);
          let batchCount = 0;
          const BATCH_LIMIT = 500;

          // Process all customers
          for (const customer of paidCustomers) {
            const planRef = doc(db, 'plans', customer.id);
            const planDoc = await getDoc(planRef);

            if (!planDoc.exists()) continue;

            const plan = planDoc.data() as Plan;
            let needsUpdate = false;

            // Find or create section
            let sectionIndex = plan.sections.findIndex(s => s.title === rule.section);
            if (sectionIndex === -1) {
              plan.sections.push({
                title: rule.section,
                tasks: []
              });
              sectionIndex = plan.sections.length - 1;
              needsUpdate = true;
            }

            // Get current tasks in this section
            const currentTasks = [...plan.sections[sectionIndex].tasks];

            // Check if task exists
            const existingTaskIndex = currentTasks.findIndex(t => t.id === rule.id);
            if (existingTaskIndex !== -1) {
              // Update existing task but preserve monthlyHistory
              const existingTask = currentTasks[existingTaskIndex];
              currentTasks[existingTaskIndex] = {
                ...existingTask,  // Keep existing data including monthlyHistory
                task: rule.task,
                isActive: rule.isActive,
                frequency: rule.frequency,
                dueDate: calculateDueDate(customer, rule),
                goal: rule.defaultGoal || existingTask.goal,
                updatedAt: new Date().toISOString(),
                updatedBy: user?.email || ''
              };
            } else {
              // Add new task without monthlyHistory
              currentTasks.push({
                id: rule.id,
                task: rule.task,
                progress: 'To Do' as const,
                isActive: rule.isActive,
                notes: '',
                frequency: rule.frequency,
                dueDate: calculateDueDate(customer, rule),
                completedDate: null,
                current: rule.defaultCurrent || 0,
                goal: rule.defaultGoal || 0,
                updatedAt: new Date().toISOString(),
                updatedBy: user?.email || ''
              });
            }

            // Update section tasks
            plan.sections[sectionIndex].tasks = currentTasks;
            needsUpdate = true;

            if (needsUpdate) {
              if (batchCount >= BATCH_LIMIT) {
                await batch.commit();
                batchCount = 0;
              }
              batch.update(planRef, { sections: plan.sections });
              batchCount++;
            }
          }

          // Commit any remaining updates
          if (batchCount > 0) {
            await batch.commit();
          }

          notification.success({
            message: 'Success',
            description: 'Task rule has been applied to all customers.',
          });

        } catch (error) {
          console.error('Error applying changes:', error);
          message.error('Failed to apply changes');
        }
      },
      onCancel() {
        setIsApplying(false);
      }
    });
  };

  const applyToAllCustomers = async () => {
    Modal.confirm({
      title: 'Apply Changes',
      content: (
        <div>
          <p>Are you sure you want to apply these changes to all customers?</p>
          <p>This will:</p>
          <ul>
            <li>Update all task rules</li>
            <li>Add new tasks</li>
            <li>Update existing tasks</li>
          </ul>
        </div>
      ),
      async onOk() {
        console.log('CLICKED OK - STARTING PROCESS');
        try {
          setIsApplying(true);

          // Get current task rules
          const rulesRef = doc(db, 'planTaskRules', 'default');
          const rulesDoc = await getDoc(rulesRef);
          const rules = rulesDoc.data() as PlanTaskRulesType;
          console.log('RULES LOADED:', rules);

          // Get all paid customers
          const customersRef = collection(db, 'customers');
          const customersSnapshot = await getDocs(customersRef);
          const paidCustomers = customersSnapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() } as ICustomer))
            .filter(customer => customer.customer_type === 'Paid');
          console.log('PAID CUSTOMERS:', paidCustomers.length);

          // Update each customer's plan
          for (const customer of paidCustomers) {
            const planRef = doc(db, 'plans', customer.id);
            const planDoc = await getDoc(planRef);

            if (!planDoc.exists()) continue;

            const plan = planDoc.data() as Plan;
            let needsUpdate = false;

            // Process each task rule
            rules.tasks.forEach((rule: PlanTaskRule) => {
              console.log('Processing rule:', {
                ruleId: rule.id,
                section: rule.section,
                task: rule.task
              });

              // Find the section for this task
              let sectionIndex = plan.sections.findIndex(s => s.title === rule.section);
              
              console.log('Section check:', {
                sectionTitle: rule.section,
                found: sectionIndex !== -1,
                sectionIndex
              });

              // If section doesn't exist, create it
              if (sectionIndex === -1) {
                console.log('Creating new section:', rule.section);
                plan.sections.push({
                  title: rule.section,
                  tasks: []
                });
                sectionIndex = plan.sections.length - 1;
                needsUpdate = true;
              }

              // Get current tasks in this section
              const currentTasks = [...plan.sections[sectionIndex].tasks];
              console.log('Current tasks in section:', {
                sectionTitle: rule.section,
                taskCount: currentTasks.length,
                tasks: currentTasks.map(t => ({ id: t.id, task: t.task }))
              });

              // Check if task exists
              const existingTaskIndex = currentTasks.findIndex(t => t.id === rule.id);
              console.log('Task check:', {
                ruleId: rule.id,
                exists: existingTaskIndex !== -1,
                existingTaskIndex
              });

              if (existingTaskIndex !== -1) {
                console.log('Updating existing task:', rule.id);
                currentTasks[existingTaskIndex] = {
                  ...currentTasks[existingTaskIndex],
                  task: rule.task,
                  isActive: rule.isActive,
                  frequency: rule.frequency,
                  dueDate: calculateDueDate(customer, rule),
                  goal: rule.defaultGoal || currentTasks[existingTaskIndex].goal,
                  updatedAt: new Date().toISOString(),
                  updatedBy: user?.email || ''
                };
                needsUpdate = true;
              } else {
                console.log('Adding new task:', {
                  id: rule.id,
                  section: rule.section,
                  task: rule.task
                });
                currentTasks.push({
                  id: rule.id,
                  task: rule.task,
                  progress: 'To Do' as const,
                  isActive: rule.isActive,
                  notes: '',
                  frequency: rule.frequency,
                  dueDate: calculateDueDate(customer, rule),
                  completedDate: null,
                  current: rule.defaultCurrent || 0,
                  goal: rule.defaultGoal || 0,
                  updatedAt: new Date().toISOString(),
                  updatedBy: user?.email || ''
                });
              }

              console.log('Updated tasks:', {
                sectionTitle: rule.section,
                taskCount: currentTasks.length,
                tasks: currentTasks.map(t => ({ id: t.id, task: t.task }))
              });

              // Update section tasks
              plan.sections[sectionIndex].tasks = currentTasks;
              needsUpdate = true;
            });

            if (needsUpdate) {
              console.log('Updating plan:', {
                customerId: customer.id,
                sections: plan.sections.map(s => ({
                  title: s.title,
                  taskCount: s.tasks.length,
                  tasks: s.tasks.map(t => ({ id: t.id, task: t.task }))
                }))
              });
              await updateDoc(planRef, { sections: plan.sections });
            }
          }

          Modal.success({
            title: 'Success',
            content: 'Changes have been applied to all customers.',
          });
        } catch (error) {
          console.error('Error applying changes:', error);
          Modal.error({
            title: 'Error',
            content: 'Failed to apply changes to all customers.',
          });
        } finally {
          setIsApplying(false);
        }
      }
    });
  };

  const filteredRules = rules.filter(rule => {
    const matchesSearch = rule.task.toLowerCase().includes(searchText.toLowerCase()) ||
      rule.section.toLowerCase().includes(searchText.toLowerCase());
    
    const matchesFrequency = !selectedFrequency || rule.frequency === selectedFrequency;
    const matchesSection = !selectedSection || rule.section === selectedSection;

    return matchesSearch && matchesFrequency && matchesSection;
  });

  // Add a function to update sections
  const updateSections = async () => {
    try {
      const rulesRef = doc(db, 'planTaskRules', 'default');
      const rulesDoc = await getDoc(rulesRef);
      
      if (rulesDoc.exists()) {
        const currentRules = rulesDoc.data() as PlanTaskRulesType;
        const updatedSections = [...new Set([...currentRules.sections, 'Email Marketing'])];  // Add new section

        await updateDoc(rulesRef, {
          sections: updatedSections,
          updatedAt: new Date().toISOString(),
          updatedBy: user?.email || ''
        });

        message.success('Sections updated successfully');
        loadData();  // Refresh the data
      }
    } catch (error) {
      console.error('Error updating sections:', error);
      message.error('Failed to update sections');
    }
  };

  const handleResetAllMonthlyTasks = async () => {
    try {
      // Get all customers
      const customersRef = collection(db, 'customers');
      const customersSnapshot = await getDocs(customersRef);
      const customers = customersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as ICustomer));

      // Show confirmation modal
      Modal.confirm({
        title: 'Reset All Monthly Tasks',
        content: (
          <div>
            <p>This will reset all monthly tasks for all customers:</p>
            <ul>
              <li>Progress will be reset to 0</li>
              <li>Status will be set to 'To Do'</li>
              <li>All other task data will be preserved</li>
            </ul>
            <p>Are you sure you want to continue?</p>
          </div>
        ),
        okText: 'Reset All',
        okButtonProps: { danger: true },
        cancelText: 'Cancel',
        onOk: async () => {
          // Reset monthly tasks for each customer
          for (const customer of customers) {
            const planRef = doc(db, 'plans', customer.id);
            const planDoc = await getDoc(planRef);
            
            if (planDoc.exists()) {
              const plan = planDoc.data() as Plan;
              const updatedSections = plan.sections.map(section => ({
                ...section,
                tasks: section.tasks.map(task => {
                  if (task.frequency === 'Monthly') {
                    return {
                      ...task,
                      current: 0,
                      progress: 'To Do',
                      updatedAt: new Date().toISOString(),
                      updatedBy: user?.email || ''
                    };
                  }
                  return task;
                })
              }));

              await updateDoc(planRef, {
                sections: updatedSections,
                updatedAt: new Date().toISOString()
              });
            }
          }

          message.success('All monthly tasks have been reset');
        }
      });
    } catch (error) {
      console.error('Error resetting monthly tasks:', error);
      message.error('Failed to reset monthly tasks');
    }
  };

  return (
    <Layout>
      <Header style={{ background: '#fff', padding: '0 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={2}>Plan Task Rules</Title>
        </div>
      </Header>
      <Content style={{ padding: '16px' }}>
        <Card>
          <Space direction="vertical" style={{ width: '100%', marginBottom: 16 }}>
            <Space wrap>
              <Input.Search
                placeholder="Search tasks..."
                allowClear
                onChange={(e) => setSearchText(e.target.value)}
                style={{ maxWidth: 400 }}
              />
              <Select
                placeholder="Filter by Frequency"
                allowClear
                style={{ width: 200 }}
                onChange={(value) => setSelectedFrequency(value)}
              >
                <Option value="One Time">One Time</Option>
                <Option value="Monthly">Monthly</Option>
                <Option value="As Needed">As Needed</Option>
              </Select>
              <Select
                placeholder="Filter by Section"
                allowClear
                style={{ width: 200 }}
                onChange={(value) => setSelectedSection(value)}
              >
                {sections.map(section => (
                  <Option key={section} value={section}>{section}</Option>
                ))}
              </Select>
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={() => {
                  setEditingRule(null);
                  form.resetFields();
                  setIsModalVisible(true);
                }}
              >
                Add New Rule
              </Button>
            </Space>
          </Space>
          <Table 
            columns={columns} 
            dataSource={filteredRules}
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
            onFinish={handleSubmit}
          >
            <Form.Item
              name="task"
              label="Task Name"
              rules={[{ required: true, message: 'Please enter task name' }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="section"
              label="Section"
              rules={[{ required: true, message: 'Please select section' }]}
            >
              <Select>
                {sections.map(section => (
                  <Option key={section} value={section}>{section}</Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="daysAfterJoin"
              label="Days After Join"
              rules={[{ 
                required: form.getFieldValue('frequency') !== 'Monthly',  // Fixed comparison
                message: 'Please enter days after join' 
              }]}
            >
              <InputNumber 
                min={0} 
                disabled={form.getFieldValue('frequency') === 'Monthly'}
                placeholder={form.getFieldValue('frequency') === 'Monthly' ? 'Not applicable for monthly tasks' : 'Enter days'}
              />
            </Form.Item>

            <Form.Item
              name="frequency"
              label="Frequency"
              rules={[{ required: true, message: 'Please select frequency' }]}
            >
              <Select>
                <Option value="One Time">One Time</Option>
                <Option value="Monthly">Monthly</Option>
                <Option value="As Needed">As Needed</Option>
              </Select>
            </Form.Item>

            <Form.Item
              noStyle
              shouldUpdate={(prevValues, currentValues) => 
                prevValues.frequency !== currentValues.frequency
              }
            >
              {({ getFieldValue }) => 
                getFieldValue('frequency') === 'Monthly' ? (
                  <Form.Item
                    name="monthlyDueDate"
                    label="Monthly Due Date"
                    rules={[{ required: true, message: 'Please select monthly due date' }]}
                  >
                    <DatePicker 
                      picker="date"
                      disabledDate={(current) => {
                        return current && (current.date() > 28);
                      }}
                      format="DD"
                      placeholder="Select day of month"
                      showToday={false}
                      value={form.getFieldValue('monthlyDueDate') ? dayjs(form.getFieldValue('monthlyDueDate')) : null}
                      onChange={(date: Dayjs | null) => {
                        if (date) {
                          form.setFieldsValue({ monthlyDueDate: date });
                        }
                      }}
                    />
                  </Form.Item>
                ) : null
              }
            </Form.Item>

            <Form.Item
              label="Requires Goal"
              name="requiresGoal"
              valuePropName="checked"
            >
              <Switch
                onChange={(checked) => {
                  setEditingRule(prev => {
                    if (!prev) return prev;
                    return {
                      ...prev,
                      requiresGoal: checked,
                      defaultGoal: checked ? prev.defaultGoal : null  // Keep goal if enabled, null if disabled
                    };
                  });
                }}
              />
            </Form.Item>

            <Form.Item
              noStyle
              shouldUpdate={(prevValues, currentValues) => 
                prevValues.requiresGoal !== currentValues.requiresGoal
              }
            >
              {({ getFieldValue }) => 
                getFieldValue('requiresGoal') ? (
                  <>
                    <Form.Item
                      label="Default Goal"
                      name="defaultGoal"
                      rules={[
                        {
                          required: getFieldValue('frequency') === 'Monthly',
                          message: 'Please input the default goal',
                        }
                      ]}
                    >
                      <Input
                        type="number"
                        min={0}
                        onChange={(e) => {
                          const value = e.target.value === '' ? null : parseInt(e.target.value);
                          form.setFieldsValue({ defaultGoal: value });
                        }}
                      />
                    </Form.Item>
                    <Form.Item
                      name="defaultCurrent"
                      label="Default Current"
                      initialValue={0}
                    >
                      <InputNumber min={0} />
                    </Form.Item>
                  </>
                ) : null
              }
            </Form.Item>
          </Form>
        </Modal>
      </Content>

      {/* Add Confirmation Modal */}
      <Modal
        title="Confirm Changes"
        open={confirmModal.visible}
        onOk={applyToAllCustomers}
        onCancel={() => setConfirmModal({ visible: false, changes: [] })}
        width={800}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Alert
            message="Warning"
            description="This will update all customer plans. Please review the changes below:"
            type="warning"
            showIcon
          />
          <Table
            dataSource={confirmModal.changes}
            columns={[
              {
                title: 'Task',
                dataIndex: 'task',
                key: 'task'
              },
              {
                title: 'Field',
                dataIndex: 'field',
                key: 'field'
              },
              {
                title: 'Old Value',
                dataIndex: 'oldValue',
                key: 'oldValue',
                render: (value) => String(value)
              },
              {
                title: 'New Value',
                dataIndex: 'newValue',
                key: 'newValue',
                render: (value) => String(value)
              }
            ]}
            pagination={false}
            scroll={{ y: 400 }}
          />
        </Space>
      </Modal>
    </Layout>
  );
};

export default PlanTaskRulesComponent; 