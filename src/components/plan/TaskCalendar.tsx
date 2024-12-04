import React, { useState } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import dayjs from 'dayjs';
import { Avatar, Space, Tooltip, Modal, Button, Input, Select, DatePicker } from 'antd';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { PlanTask } from '../../types/Plan';
import { IAdmin } from '../../types/Customer';

const { Option } = Select;

const localizer = momentLocalizer(moment);

// Updated color scheme
const taskColors = {
  'To Do': '#f0f0f0',  // gray
  'Doing': '#ADD8E6',  // light blue
  'Done': '#90EE90',   // light green
  'Overdue': '#ff4d4f' // red for overdue tasks
};

interface TaskCalendarProps {
  tasks: PlanTask[];
  adminList: IAdmin[];
  onEdit?: (taskId: string, field: keyof PlanTask, value: any, customerId: string) => Promise<boolean>;
}

interface CalendarEvent {
  title: React.ReactNode;
  start: Date;
  end: Date;
  allDay: boolean;
  resource?: {
    color: string;
    progress: string;
    taskId: string;
  };
}

const TaskCalendar: React.FC<TaskCalendarProps> = ({ tasks, adminList, onEdit }) => {
  const [selectedTask, setSelectedTask] = useState<PlanTask | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [tempValues, setTempValues] = useState<Partial<PlanTask>>({});

  const isOverdue = (task: PlanTask) => {
    // Don't mark completed tasks as overdue
    if (task.progress === 'Done') return false;
    if (!task.dueDate) return false;
    return dayjs(task.dueDate).isBefore(dayjs(), 'day');
  };

  const getEventTitle = (task: PlanTask) => {
    const assignedAdmins = task.assignedTeamMembers?.map(email => 
      adminList.find(admin => admin.email === email)
    ).filter(admin => admin) || [];

    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'flex-start',
        gap: '4px',
        width: '100%'
      }}>
        <div style={{ 
          fontSize: '12px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          wordWrap: 'break-word',
          flex: 1,
          minWidth: 0  // This is important for text wrapping
        }}>
          {task.task}
        </div>
        <Avatar.Group 
          maxCount={3} 
          size={16}
          style={{ flexShrink: 0 }}  // Prevents avatar group from shrinking
        >
          {assignedAdmins.map((admin) => (
            admin && (
              <Tooltip key={admin.email} title={admin.name || admin.email}>
                <Avatar 
                  size={16}
                  src={admin.avatarUrl}
                  style={{ backgroundColor: '#1890ff' }}
                >
                  {!admin.avatarUrl && (admin.name || admin.email)[0].toUpperCase()}
                </Avatar>
              </Tooltip>
            )
          ))}
        </Avatar.Group>
      </div>
    );
  };

  const handleSelectEvent = (event: any) => {
    // Find the original task from the event
    const task = tasks.find(t => t.id === event.resource?.taskId);
    if (task) {
      setSelectedTask(task);
      setIsModalVisible(true);
    }
  };

  const events: CalendarEvent[] = tasks
    .filter((task) => task.dueDate)
    .map(task => ({
      title: getEventTitle(task),
      start: new Date(task.dueDate || ''),
      end: new Date(task.dueDate || ''),
      allDay: true,
      resource: {
        // First check if it's done, then check if it's overdue
        color: task.progress === 'Done' 
          ? taskColors.Done 
          : isOverdue(task) 
            ? taskColors.Overdue 
            : taskColors[task.progress],
        progress: task.progress,
        taskId: task.id // Add this to identify the task later
      },
    }));

  const eventStyleGetter = (event: CalendarEvent) => {
    const backgroundColor = event.resource?.color || taskColors['To Do'];
    return {
      style: {
        backgroundColor,
        borderRadius: '5px',
        opacity: 0.8,
        color: backgroundColor === taskColors.Overdue ? 'white' : 'black', // white text for red background
        border: '0px',
        display: 'block',
      },
    };
  };

  // const handleEditClick = () => {
  //   setIsEditing(true);
  //   setTempValues({
  //     progress: selectedTask?.progress,
  //     dueDate: selectedTask?.dueDate,
  //     completedDate: selectedTask?.completedDate,
  //     notes: selectedTask?.notes,
  //     assignedTeamMembers: selectedTask?.assignedTeamMembers,
  //   });
  // };

  const handleSave = async () => {
    if (selectedTask && onEdit) {
      const success = await onEdit(selectedTask.id, 'task', tempValues, selectedTask.id);
      if (success) {
        setIsEditing(false);
        setTempValues({});
        setIsModalVisible(false);
        setSelectedTask(null);
      }
    }
  };

  // const handleCancel = () => {
  //   setIsEditing(false);
  //   setTempValues({});
  // };

  return (
    <div style={{ height: 700 }}>
      <style>
        {`
          .rbc-time-view {
            flex: 1 0 0;
          }
          .rbc-time-content {
            display: none !important;
          }
          .rbc-allday-cell {
            height: 100% !important;
          }
          .rbc-time-view .rbc-header {
            border-bottom: none;
          }
          .rbc-time-view .rbc-allday-cell {
            border-bottom: none;
          }
          .rbc-time-header {
            border-bottom: none;
          }
          .rbc-time-header-content {
            border-left: none;
            min-height: calc(700px - 70px) !important;
          }
          /* Add these styles to fix scrolling */
          .rbc-event {
            padding: 2px 5px !important;
            font-size: 12px !important;
          }
          .rbc-events-container {
            height: auto !important;
            max-height: none !important;
            overflow: visible !important;
          }
          .rbc-row-content {
            overflow: visible !important;
          }
          .rbc-row {
            overflow: visible !important;
          }
        `}
      </style>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        views={['month', 'week']}
        formats={{
          timeGutterLabel: () => '',
          dayFormat: 'ddd DD',
        }}
        style={{ height: 700 }}
        eventPropGetter={eventStyleGetter}
        popup
        allDayAccessor={() => true}
        showAllEvents
        onSelectEvent={handleSelectEvent}
      />

      {/* Task Detail/Edit Modal */}
      <Modal
        title="Task Details"
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          setSelectedTask(null);
          setIsEditing(false);
          setTempValues({});
        }}
        footer={[
          <Button 
            key="edit" 
            type="primary"
            onClick={() => setIsEditing(true)}
            style={{ display: !isEditing ? 'inline-block' : 'none' }}
          >
            Edit
          </Button>,
          isEditing ? (
            <>
              <Button 
                key="cancel" 
                onClick={() => {
                  setIsEditing(false);
                  setTempValues({});
                }}
              >
                Cancel
              </Button>
              <Button 
                key="save" 
                type="primary" 
                onClick={handleSave}
              >
                Save
              </Button>
            </>
          ) : (
            <Button 
              key="close" 
              onClick={() => {
                setIsModalVisible(false);
                setSelectedTask(null);
              }}
            >
              Close
            </Button>
          )
        ]}
      >
        {selectedTask && (
          <div>
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <div>
                <strong>Task: </strong>
                {isEditing && selectedTask.section === 'Other Tasks' ? (
                  <Input
                    value={tempValues.task || selectedTask.task}
                    onChange={e => setTempValues({ ...tempValues, task: e.target.value })}
                  />
                ) : (
                  <span style={{ marginLeft: '8px' }}>{selectedTask.task}</span>
                )}
              </div>

              <div>
                <strong>Status: </strong>
                {isEditing ? (
                  <Select
                    value={tempValues.progress || selectedTask.progress}
                    onChange={value => setTempValues({ ...tempValues, progress: value })}
                    style={{ width: 200, marginLeft: 8 }}
                  >
                    <Option value="To Do">To Do</Option>
                    <Option value="Doing">Doing</Option>
                    <Option value="Done">Done</Option>
                  </Select>
                ) : (
                  <span style={{ marginLeft: '8px' }}>{selectedTask.progress}</span>
                )}
              </div>

              <div>
                <strong>Due Date: </strong>
                {isEditing ? (
                  <DatePicker
                    value={tempValues.dueDate ? dayjs(tempValues.dueDate) : (selectedTask.dueDate ? dayjs(selectedTask.dueDate) : null)}
                    onChange={(date) => setTempValues({ ...tempValues, dueDate: date ? date.format('YYYY-MM-DD') : null })}
                    style={{ marginLeft: 8 }}
                  />
                ) : (
                  <span style={{ marginLeft: '8px' }}>{dayjs(selectedTask.dueDate).format('MMMM DD, YYYY')}</span>
                )}
              </div>

              {(selectedTask.completedDate || isEditing) && (
                <div>
                  <strong>Completed Date: </strong>
                  {isEditing ? (
                    <DatePicker
                      value={tempValues.completedDate ? dayjs(tempValues.completedDate) : (selectedTask.completedDate ? dayjs(selectedTask.completedDate) : null)}
                      onChange={(date) => setTempValues({ ...tempValues, completedDate: date ? date.format('YYYY-MM-DD') : null })}
                      style={{ marginLeft: 8 }}
                    />
                  ) : (
                    <span style={{ marginLeft: '8px' }}>{selectedTask.completedDate && dayjs(selectedTask.completedDate).format('MMMM DD, YYYY')}</span>
                  )}
                </div>
              )}

              <div>
                <strong>Assigned To: </strong>
                {isEditing ? (
                  <Select
                    mode="multiple"
                    style={{ width: '100%', marginTop: 8 }}
                    value={tempValues.assignedTeamMembers || selectedTask.assignedTeamMembers}
                    onChange={value => setTempValues({ ...tempValues, assignedTeamMembers: value })}
                  >
                    {adminList
                      .filter(admin => admin.canBeAssignedToTasks)
                      .map(admin => (
                        <Option key={admin.email} value={admin.email}>
                          {admin.name || admin.email}
                        </Option>
                      ))}
                  </Select>
                ) : (
                  <Avatar.Group maxCount={3} size="small" style={{ marginLeft: 8 }}>
                    {selectedTask.assignedTeamMembers?.map(email => {
                      const admin = adminList.find(a => a.email === email);
                      return (
                        <Tooltip key={email} title={admin?.name || email}>
                          <Avatar
                            size="small"
                            src={admin?.avatarUrl}
                            style={{ backgroundColor: '#1890ff' }}
                          >
                            {!admin?.avatarUrl && (admin?.name || email)[0].toUpperCase()}
                          </Avatar>
                        </Tooltip>
                      );
                    })}
                  </Avatar.Group>
                )}
              </div>

              <div>
                <strong>Notes: </strong>
                {isEditing ? (
                  <Input.TextArea
                    value={tempValues.notes || selectedTask.notes}
                    onChange={e => setTempValues({ ...tempValues, notes: e.target.value })}
                    rows={4}
                    style={{ marginTop: 8 }}
                  />
                ) : (
                  <span style={{ marginLeft: '8px' }}>{selectedTask.notes}</span>
                )}
              </div>

              {selectedTask.frequency && ['Monthly', 'As Needed'].includes(selectedTask.frequency) && (
                <div>
                  <strong>Progress: </strong>
                  {isEditing ? (
                    <Space>
                      <Input
                        type="number"
                        value={tempValues.current !== undefined ? tempValues.current : selectedTask.current}
                        onChange={(e) => setTempValues({ ...tempValues, current: parseInt(e.target.value) })}
                        style={{ width: 80 }}
                      />
                      <span>/</span>
                      <Input
                        type="number"
                        value={tempValues.goal !== undefined ? tempValues.goal : selectedTask.goal}
                        onChange={(e) => setTempValues({ ...tempValues, goal: parseInt(e.target.value) })}
                        style={{ width: 80 }}
                      />
                    </Space>
                  ) : (
                    <span style={{ marginLeft: '8px' }}>
                      {selectedTask.current || 0}/{selectedTask.goal || 0}
                    </span>
                  )}
                </div>
              )}
            </Space>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default TaskCalendar; 