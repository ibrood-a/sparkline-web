'use client';

import React, { useState } from 'react';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import CustomCalendar from '@/components/ui/calendar'

interface ScheduleClientProps {
  role: any;
}

const ScheduleClient: React.FC<ScheduleClientProps> = ({ role }) => {
  const [visible, setVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const now = new Date();

  const handleSelectSlot = ({ start }: { start: Date }) => {
    const now = new Date();
    console.log('Date selected:', start);
    if (start < now) {
      console.log('Selected date is in the past.');
      return;
    }
    setSelectedDate(new Date(start));
    setVisible(true);
    console.log('Visible set to true');
  };

  const isSelectable = (date: Date) => {
    const now = new Date();
    return date >= now;
  };

  return (
    <div className="p-5 max-w-6xl w-full bg-background">
      <div className="shadow-md rounded-lg bg-secondary p-5">
        <CustomCalendar role={role} />
      </div>
    </div>
  );
};

export default ScheduleClient;
