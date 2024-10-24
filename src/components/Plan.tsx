import React, { useState, useEffect, SetStateAction, Dispatch } from "react";
import { useAuth } from "../contexts/AuthContext";
import CustomersDropdown from "./CustomersDropdown";
import { Customer } from "../types/Customer";
import { db } from "../firebase/config";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  addDoc,
} from "firebase/firestore";
import FirebaseHelper from "../helpers/FirebaseHelper";
import { useTaskCreate } from "../hooks/useTask";
import dayjs from "dayjs";
import { Button, Input } from "antd";
import { EditOutlined } from "@ant-design/icons";

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

function Plan({
  customers,
  selectedCustomer,
  setSelectedCustomer,
}: PlanPageProps) {
  const { isAdmin, user } = useAuth();
  const [planTasks, setPlanTasks] = useState<PlanTask[]>([]);
  const [editing, setEditing] = useState<string | undefined>(undefined);
  const [editValue, setEditValue] = useState<string>("");
  const [newTask, setNewTask] = useState("");
  const { createTask } = useTaskCreate();
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const fetchPlanTasks = async () => {
      if (selectedCustomer) {
        const planRef = collection(db, "monthlyPlan");
        const q = query(
          planRef,
          where("customer_id", "==", selectedCustomer.id),
        );

        try {
          const querySnapshot = await getDocs(q);
          const tasks: PlanTask[] = [];
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            tasks.push({
              id: doc.id,
              task: data.task,
              is_done: data.is_done,
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
      const taskRef = doc(db, "monthlyPlan", taskId);
      await updateDoc(taskRef, {
        is_done: newIsDone,
      });
      const task = await FirebaseHelper.findOne<PlanTask>(
        "monthlyPlan",
        taskId,
      );
      await createTask({
        customerId: selectedCustomer?.id || "",
        taskName: task?.task || "",
        teamMemberName: user?.email || "",
        dateCompleted: dayjs().toISOString(),
        isDone: newIsDone,
      });
      // Update local state
      setPlanTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === taskId ? { ...task, is_done: newIsDone } : task,
        ),
      );
    } catch (error) {
      console.error("Error updating task status: ", error);
    }
  };
  const handleUpdate = async () => {
    if (!editing) {
      return;
    }
    setIsUpdating(true);
    try {
      const taskRef = doc(db, "monthlyPlan", editing);
      await updateDoc(taskRef, {
        task: editValue,
      });

      // Update local state
      setPlanTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === editing ? { ...task, task: editValue } : task,
        ),
      );
      setEditing(undefined);
      setEditValue("");
      setIsUpdating(false);
    } catch (error) {
      setIsUpdating(false);
      console.error("Error updating task: ", error);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !selectedCustomer || !newTask.trim()) return;

    try {
      const planRef = collection(db, "monthlyPlan");
      const newTaskDoc = await addDoc(planRef, {
        customer_id: selectedCustomer.id,
        task: newTask.trim(),
        is_done: false,
      });

      // Update local state
      setPlanTasks((prevTasks) => [
        ...prevTasks,
        { id: newTaskDoc.id, task: newTask.trim(), is_done: false },
      ]);

      // Clear input
      setNewTask("");
    } catch (error) {
      console.error("Error adding new task: ", error);
    }
  };

  const taskStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px",
    borderBottom: "1px solid #eee",
  };

  const statusStyle = (isDone: boolean) => ({
    padding: "5px 10px",
    borderRadius: "15px",
    fontWeight: "bold",
    color: "white",
    backgroundColor: isDone ? "#4CAF50" : "#FFC107",
  });

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <h2>Monthly Plan</h2>
        {isAdmin && (
          <CustomersDropdown
            customers={customers}
            selectedCustomer={selectedCustomer}
            setSelectedCustomer={setSelectedCustomer}
            isAdmin={isAdmin}
          />
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
            <ul style={{ listStyle: "none", padding: 0 }}>
              {planTasks.map((task) => (
                <li key={task.id} style={taskStyle}>
                  <div style={{ display: "flex", alignItems: "center" }}>
                    {isAdmin && (
                      <input
                        type="checkbox"
                        checked={task.is_done}
                        onChange={(e) =>
                          handleCheckboxChange(task.id, e.target.checked)
                        }
                        style={{ marginRight: "10px" }}
                      />
                    )}
                    {editing && editing === task.id ? (
                      <Input
                        value={editValue}
                        onChange={(e) => {
                          setEditValue(e.target.value);
                        }}
                      />
                    ) : (
                      task.task
                    )}
                  </div>
                  <div style={{ display: "flex", gap: "2ch" }}>
                    {isAdmin && (
                      <>
                        {editing && editing === task.id ? (
                          <>
                            <Button
                              type="primary"
                              onClick={handleUpdate}
                              loading={isUpdating}
                            >
                              Save
                            </Button>
                            <Button
                              onClick={() => {
                                setEditing(undefined);
                                setEditValue("");
                              }}
                              disabled={isUpdating}
                            >
                              Cancel
                            </Button>
                          </>
                        ) : (
                          <Button
                            onClick={() => {
                              setEditValue(task.task);
                              setEditing(task.id);
                            }}
                            icon={<EditOutlined />}
                          />
                        )}
                      </>
                    )}

                    <span style={statusStyle(task.is_done)}>
                      {task.is_done ? "Done" : "To do"}
                    </span>
                  </div>
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
