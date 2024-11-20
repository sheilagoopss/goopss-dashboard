import React from 'react';
import { Calendar, momentLocalizer, Event } from 'react-big-calendar';
import moment from 'moment';
import dayjs from 'dayjs';
import { Avatar, Space, Tooltip } from 'antd';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { PlanTask } from '../../types/Plan';
import { IAdmin } from '../../types/Customer';

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
}

interface CalendarEvent {
  title: React.ReactNode;
  start: Date;
  end: Date;
  allDay: boolean;
  resource?: {
    color: string;
    progress: string;
  };
}

const TaskCalendar: React.FC<TaskCalendarProps> = ({ tasks, adminList }) => {
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
        progress: task.progress
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
      />
    </div>
  );
};

export default TaskCalendar; 