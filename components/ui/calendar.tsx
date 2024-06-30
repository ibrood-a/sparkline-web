'use client';
import {Button} from './button'
import React, { useState } from 'react';
import { Scheduler } from '@aldabil/react-scheduler';
import type { SchedulerHelpers, ProcessedEvent } from '@aldabil/react-scheduler/types';
import PostForm from '@/app/(root)/(routes)/(pages)/post/_components/post-form'

interface CustomCalendarProps {
  role: any;
}

const CustomCalendar: React.FC<CustomCalendarProps> = ({ role }) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const CustomEditor = ({ scheduler, selectedDate, role }: { scheduler: SchedulerHelpers; selectedDate: Date | null; role: any }) => {
    return (
      <div>
        <PostForm selectedDate={selectedDate} role={role} />
        <Button onClick={scheduler.close}>Cancel</Button>
      </div>
    );
  };

  const handleConfirm = async (event: ProcessedEvent, action: 'edit' | 'create'): Promise<ProcessedEvent> => {
    console.log(action, event);
    return new Promise((res) => {
      setTimeout(() => res({
        ...event,
        event_id: event.event_id || Math.random()
      }), 1000);
    });
  };

  return (
    <Scheduler
      view="month"
      events={[]}
      customEditor={(scheduler) => (
        <CustomEditor
          scheduler={scheduler}
          selectedDate={scheduler.state.start.value}
          role={role}
        />
      )}
      onConfirm={handleConfirm}
    />
  );
};

export default CustomCalendar;