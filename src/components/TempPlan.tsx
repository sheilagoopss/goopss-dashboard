import React, { useState, useEffect } from 'react';
import { Layout, Typography, Select, Space, Card, Table, Modal, DatePicker, Button } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import { ICustomer } from '../types/Customer';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Plan, PlanTask, PlanSection } from '../types/Plan';
import dayjs from 'dayjs';

const { Content } = Layout;
const { Title } = Typography;
const { Option } = Select;

interface TempPlanProps {
  customers: ICustomer[];
  selectedCustomer: ICustomer | null;
  setSelectedCustomer: (customer: ICustomer | null) => void;
}

// Add interface for task record
interface TaskRecord extends PlanTask {
  customerName: string;
  section: string;
  customerId: string;
}

// Add Modal interface
interface EditModalProps {
  visible: boolean;
  task: TaskRecord | null;
  onClose: () => void;
  onSave: (taskId: string, updates: Partial<PlanTask>) => Promise<void>;
}

// Edit Modal Component
const EditModal: React.FC<EditModalProps> = ({ visible, task, onClose, onSave }) => {
  const [progress, setProgress] = useState(task?.progress || 'To Do');
  const [dueDate, setDueDate] = useState(task?.dueDate ? dayjs(task.dueDate) : null);
  const [completedDate, setCompletedDate] = useState(task?.completedDate ? dayjs(task.completedDate) : null);

  const handleSave = async () => {
    if (!task) return;
    
    await onSave(task.id, {
      progress,
      dueDate: dueDate?.format('YYYY-MM-DD'),
      completedDate: completedDate?.format('YYYY-MM-DD')
    });
    onClose();
  };

  return (
    <Modal
      title="Edit Task"
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>Cancel</Button>,
        <Button key="save" type="primary" onClick={handleSave}>Save</Button>
      ]}
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        <div>
          <Typography.Text>Progress</Typography.Text>
          <Select
            style={{ width: '100%' }}
            value={progress}
            onChange={setProgress}
          >
            <Select.Option value="To Do">To Do</Select.Option>
            <Select.Option value="Doing">Doing</Select.Option>
            <Select.Option value="Done">Done</Select.Option>
          </Select>
        </div>
        <div>
          <Typography.Text>Due Date</Typography.Text>
          <DatePicker 
            style={{ width: '100%' }}
            value={dueDate}
            onChange={setDueDate}
          />
        </div>
        <div>
          <Typography.Text>Completed Date</Typography.Text>
          <DatePicker 
            style={{ width: '100%' }}
            value={completedDate}
            onChange={setCompletedDate}
          />
        </div>
      </Space>
    </Modal>
  );
};

const TempPlan: React.FC<TempPlanProps> = ({ customers, selectedCustomer, setSelectedCustomer }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [sections, setSections] = useState<PlanSection[]>([]);
  const [plans, setPlans] = useState<{
    type: 'single' | 'all';
    selectedCustomer: ICustomer | null;
    data: { [customerId: string]: Plan };
  }>({
    type: 'all',
    selectedCustomer: null,
    data: {}
  });
  const [editingTask, setEditingTask] = useState<TaskRecord | null>(null);

  // Add console log for renders
  console.log('TempPlan rendering with:', {
    selectedCustomer: selectedCustomer?.store_name,
    plansType: plans.type,
    plansCount: Object.keys(plans.data).length,
    isLoading
  });

  // Function to get all tasks
  const getAllTasks = () => {
    if (plans.type === 'all') {
      return Object.entries(plans.data).flatMap(([customerId, plan]) => {
        const customer = customers.find(c => c.id === customerId);
        return plan.sections.flatMap(section => 
          section.tasks.map(task => ({
            ...task,
            customerName: customer?.store_name || '',
            section: section.title,
            customerId: customer?.id || ''
          }))
        );
      });
    } else {
      return sections.flatMap(section => 
        section.tasks.map(task => ({
          ...task,
          customerName: selectedCustomer?.store_name || '',
          section: section.title,
          customerId: selectedCustomer?.id || ''
        }))
      );
    }
  };

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      try {
        const newPlans: { [customerId: string]: Plan } = {};
        const paidCustomers = customers.filter(c => c.customer_type === 'Paid');
        
        await Promise.all(
          paidCustomers.map(async (customer) => {
            const planRef = doc(db, 'plans', customer.id);
            const planDoc = await getDoc(planRef);
            
            if (planDoc.exists()) {
              newPlans[customer.id] = planDoc.data() as Plan;
            }
          })
        );

        setPlans({
          type: 'all',
          selectedCustomer: null,
          data: newPlans
        });
      } catch (error) {
        console.error('Error loading initial data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, [customers]);

  // Add save function
  const handleSaveTask = async (taskId: string, updates: Partial<PlanTask>) => {
    try {
      console.log('Saving task:', {
        taskId,
        updates,
        customerId: editingTask?.customerId
      });

      if (!editingTask || !editingTask.customerId) {
        console.error('No customer ID found');
        return;
      }

      // Clean up updates object to remove any undefined values
      const cleanUpdates: Partial<PlanTask> = {};
      
      if (updates.progress !== undefined) {
        cleanUpdates.progress = updates.progress;
      }
      
      if (updates.dueDate !== undefined) {
        cleanUpdates.dueDate = updates.dueDate || undefined;  // Use undefined instead of null
      }
      
      if (updates.completedDate !== undefined) {
        cleanUpdates.completedDate = updates.completedDate || undefined;  // Use undefined instead of null
      }

      const planRef = doc(db, 'plans', editingTask.customerId);
      console.log('Fetching plan for update:', editingTask.customerId);
      
      const planDoc = await getDoc(planRef);
      
      if (planDoc.exists()) {
        console.log('Plan found, updating...');
        const planData = planDoc.data() as Plan;
        const updatedSections = planData.sections.map(section => ({
          ...section,
          tasks: section.tasks.map(task => 
            task.id === taskId ? { ...task, ...cleanUpdates } : task
          )
        }));

        await updateDoc(planRef, { sections: updatedSections });
        console.log('Plan updated successfully');

        // Update local state
        if (plans.type === 'all') {
          setPlans(prev => ({
            ...prev,
            data: {
              ...prev.data,
              [editingTask.customerId]: { 
                ...prev.data[editingTask.customerId], 
                sections: updatedSections 
              }
            }
          }));
          console.log('Local state updated');
        }
      }
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  // Add log for customer selection
  const handleCustomerChange = async (value: string) => {
    try {
      console.log('Customer selection changed:', value);
      setIsLoading(true);
      
      if (value === 'all-paid') {
        console.log('Loading all paid customers plans...');
        const newPlans: { [customerId: string]: Plan } = {};
        const paidCustomers = customers.filter(c => c.customer_type === 'Paid');
        
        await Promise.all(
          paidCustomers.map(async (customer) => {
            console.log('Fetching plan for:', customer.store_name);
            const planRef = doc(db, 'plans', customer.id);
            const planDoc = await getDoc(planRef);
            
            if (planDoc.exists()) {
              newPlans[customer.id] = planDoc.data() as Plan;
            }
          })
        );

        console.log('All plans loaded:', Object.keys(newPlans).length);
        setPlans({
          type: 'all',
          selectedCustomer: null,
          data: newPlans
        });
        setSelectedCustomer(null);
      } else {
        const customer = customers
          .filter(c => c.customer_type === 'Paid')
          .find((c) => c.id === value);
        
        if (customer) {
          const planRef = doc(db, 'plans', customer.id);
          const planDoc = await getDoc(planRef);
          
          if (planDoc.exists()) {
            setPlans({
              type: 'single',
              selectedCustomer: customer,
              data: { [customer.id]: planDoc.data() as Plan }
            });
          }
        }
        setSelectedCustomer(customer || null);
      }
    } catch (error) {
      console.error('Error switching views:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Table columns
  const columns = [
    {
      title: 'Customer',
      dataIndex: 'customerName',
      key: 'customerName',
    },
    {
      title: 'Section',
      dataIndex: 'section',
      key: 'section',
    },
    {
      title: 'Task',
      dataIndex: 'task',
      key: 'task',
    },
    {
      title: 'Progress',
      dataIndex: 'progress',
      key: 'progress',
    },
    {
      title: 'Due Date',
      dataIndex: 'dueDate',
      key: 'dueDate',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: TaskRecord) => (
        <Button 
          icon={<EditOutlined />} 
          onClick={() => setEditingTask(record)}
        />
      ),
    }
  ];

  return (
    <Layout>
      <Content style={{ padding: '24px' }}>
        <Title level={2}>Temp Plan</Title>
        
        {/* Customer Dropdown */}
        <Card style={{ marginBottom: 16 }}>
          <Select
            style={{ width: '100%' }}
            placeholder="Select a customer"
            value={selectedCustomer ? selectedCustomer.id : 'all-paid'}
            onChange={handleCustomerChange}
            size="large"
            listHeight={400}
            showSearch
            optionFilterProp="children"
            filterOption={(input, option) =>
              (option?.label?.toString() || '').toLowerCase().includes(input.toLowerCase())
            }
          >
            <Option key="all-paid" value="all-paid">
              All Paid Customers
            </Option>
            <Option key="divider" disabled>
              ──────────────
            </Option>
            {customers
              .filter(customer => customer.customer_type === 'Paid')
              .map((customer) => (
                <Option 
                  key={customer.id} 
                  value={customer.id}
                  label={`${customer.store_name} - ${customer.store_owner_name}`}
                >
                  <Space>
                    {customer.logo && (
                      <img 
                        src={customer.logo} 
                        alt={customer.store_name} 
                        style={{ width: 20, height: 20, borderRadius: '50%' }} 
                      />
                    )}
                    {customer.store_name} - {customer.store_owner_name}
                  </Space>
                </Option>
              ))}
          </Select>
        </Card>

        {/* Tasks Table */}
        <Table 
          dataSource={getAllTasks() as TaskRecord[]}
          columns={columns}
          loading={isLoading}
          rowKey={(record) => `${record.customerName}-${record.task}`}
        />

        {/* Add Edit Modal */}
        <EditModal
          visible={!!editingTask}
          task={editingTask}
          onClose={() => setEditingTask(null)}
          onSave={handleSaveTask}
        />
      </Content>
    </Layout>
  );
};

export default TempPlan;