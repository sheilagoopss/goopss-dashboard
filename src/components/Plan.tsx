import React, { useState, useEffect, SetStateAction, Dispatch } from 'react';
import { useAuth } from '../contexts/AuthContext';
import CustomersDropdown from './CustomersDropdown';
import { Customer } from '../types/Customer';
import { db } from '../firebase/config';
import { collection, query, where, getDocs, doc, updateDoc, addDoc } from 'firebase/firestore';

interface PlanPageProps {
  customers: Customer[];
  selectedCustomer: Customer | null;
  setSelectedCustomer: Dispatch<SetStateAction<Customer | null>>;
}

interface PlanTask {
  id: string;
  task: string;
  is_done: boolean;
}

function Plan({ customers, selectedCustomer, setSelectedCustomer }: PlanPageProps) {
  const { isAdmin } = useAuth();
  const [planTasks, setPlanTasks] = useState<PlanTask[]>([]);
  const [newTask, setNewTask] = useState('');

  useEffect(() => {
    const fetchPlanTasks = async () => {
      if (selectedCustomer) {
        const planRef = collection(db, 'monthlyPlan');
        const q = query(planRef, where('customer_id', '==', selectedCustomer.id));
        
        try {
          const querySnapshot = await getDocs(q);
          const tasks: PlanTask[] = [];
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            tasks.push({
              id: doc.id,
              task: data.task,
              is_done: data.is_done
            });
          });
          setPlanTasks(tasks);
        } catch (error) {
          console.error("Error fetching plan tasks: ", error);
        }
      }
    };

    fetchPlanTasks();
  }, [selectedCustomer]);

  const handleCheckboxChange = async (taskId: string, newIsDone: boolean) => {
    if (!isAdmin) return; // Prevent non-admin users from changing task status
    try {
      const taskRef = doc(db, 'monthlyPlan', taskId);
      await updateDoc(taskRef, {
        is_done: newIsDone
      });

      // Update local state
      setPlanTasks(prevTasks =>
        prevTasks.map(task =>
          task.id === taskId ? { ...task, is_done: newIsDone } : task
        )
      );
    } catch (error) {
      console.error("Error updating task status: ", error);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !selectedCustomer || !newTask.trim()) return;

    try {
      const planRef = collection(db, 'monthlyPlan');
      const newTaskDoc = await addDoc(planRef, {
        customer_id: selectedCustomer.id,
        task: newTask.trim(),
        is_done: false
      });

      // Update local state
      setPlanTasks(prevTasks => [
        ...prevTasks,
        { id: newTaskDoc.id, task: newTask.trim(), is_done: false }
      ]);

      // Clear input
      setNewTask('');
    } catch (error) {
      console.error("Error adding new task: ", error);
    }
  };

  const taskStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px',
    borderBottom: '1px solid #eee',
  };

  const statusStyle = (isDone: boolean) => ({
    padding: '5px 10px',
    borderRadius: '15px',
    fontWeight: 'bold',
    color: 'white',
    backgroundColor: isDone ? '#4CAF50' : '#FFC107',
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Monthly Plan</h2>
        {isAdmin && (
          <select 
            value={selectedCustomer?.id || ''}
            onChange={(e) => {
              const customer = customers.find(c => c.id === e.target.value) || null;
              setSelectedCustomer(customer);
            }}
            style={{ padding: '10px', fontSize: '16px', minWidth: '200px' }}
          >
            <option value="">Select a customer</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.store_name} - {customer.store_owner_name}
              </option>
            ))}
          </select>
        )}
      </div>
      
      {selectedCustomer && (
        <div>
          <h3>Plan Tasks for {selectedCustomer.store_owner_name}</h3>
          {isAdmin && (
            <form onSubmit={handleAddTask}>
              <input
                type="text"
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                placeholder="Enter new task"
                required
              />
              <button type="submit">Add Task</button>
            </form>
          )}
          {planTasks.length > 0 ? (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {planTasks.map((task) => (
                <li key={task.id} style={taskStyle}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    {isAdmin && (
                      <input 
                        type="checkbox" 
                        checked={task.is_done} 
                        onChange={(e) => handleCheckboxChange(task.id, e.target.checked)}
                        style={{ marginRight: '10px' }}
                      />
                    )}
                    {task.task}
                  </div>
                  <span style={statusStyle(task.is_done)}>
                    {task.is_done ? 'Done' : 'To do'}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p>No tasks found for this customer.</p>
          )}
        </div>
      )}
    </div>
  );
}

export default Plan;