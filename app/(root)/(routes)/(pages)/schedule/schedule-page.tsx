'use client';

import React, { useState } from 'react';
import dayjs, { Dayjs } from 'dayjs';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import * as Dialog from '@radix-ui/react-dialog';
import PostForm from '../post/_components/post-form';

const localizer = momentLocalizer(moment);

interface ScheduleClientProps {
  role: any;
}

const ScheduleClient: React.FC<ScheduleClientProps> = ({ role }) => {
  const [visible, setVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);

  const handleSelectSlot = ({ start }: { start: Date }) => {
    const now = new Date();
    console.log('Date selected:', start);
    if (start < now) {
      console.log('Selected date is in the past.');
      return;
    }
    setSelectedDate(dayjs(start));
    setVisible(true);
    console.log('Visible set to true');
  };

  const handleCancel = () => {
    setVisible(false);
    console.log('Visible set to false');
  };

  const isSelectable = (date: Date) => {
    const now = new Date();
    return date >= now;
  };

  return (
    <div className="min-h-screen bg-gray-100 p-5">
      <div className="shadow-md rounded-lg p-0">
        <div className="overflow-x-auto">
          <Calendar
            localizer={localizer}
            defaultDate={new Date()}
            defaultView="month"
            views={['month', 'week', 'day']}
            selectable={true}
            onSelectSlot={handleSelectSlot}
            style={{ height: '500px' }}

          />
        </div>
        <Dialog.Root open={visible} onOpenChange={setVisible}>
          <Dialog.Trigger asChild>
            <button className="hidden"></button>
          </Dialog.Trigger>
          <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-50 z-40" />
          <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-background rounded-lg shadow-lg p-5 z-50 w-auto max-w-6xl">
            <Dialog.Title className="text-lg font-semibold">Schedule Post</Dialog.Title>
            {selectedDate && role && <PostForm selectedDate={selectedDate} role={role} />}
            <div className=" text-right">
              <Dialog.Close asChild>
                <button className="px-4 py-2">
                  Cancel
                </button>
              </Dialog.Close>
            </div>
          </Dialog.Content>
        </Dialog.Root>
      </div>
    </div>
  );
};

export default ScheduleClient;
