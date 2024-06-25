'use client';
import React, { useState } from 'react';
import dayjs, { Dayjs } from 'dayjs';
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import PostForm from '../post/_components/post-form'
import { Calendar } from 'lucide-react'

interface SchedulePageProps {
  user: {
    accounts: Array<{ provider: string }>;
  }
}

const SchedulePage: React.FC<SchedulePageProps> = async () => {
  const [visible, setVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);

  const role = await auth();

  if (!role) {
    return redirect('/login');
  }

  const handleSelect = (date: Dayjs) => {
    setSelectedDate(date);
    setVisible(true);
  };

  const handleCancel = () => {
    setVisible(false);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f2f5', padding: '20px' }}>
      <div style={{ boxShadow: '0 4px 8px rgba(0,0,0,0.1)', borderRadius: '10px', padding: '0px' }}>
        <div style={{ overflowX: 'auto' }}>
          <Calendar
            onClick={() => handleSelect(dayjs())} // Replace with your actual date selection logic
            style={{ minWidth: '100%', maxWidth: '100%', cursor: 'pointer' }}
          />
        </div>
        {visible && (
          <div style={{ backgroundColor: '#fff', borderRadius: '10px', padding: '20px' }}>
            <h3>Scheduled Date</h3>
            {selectedDate && (
              <PostForm
                videoUrl={''}
                selectedDate={selectedDate}
                role={role}
              />
            )}
            <button onClick={handleCancel} style={{ marginTop: '10px' }}>Cancel</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SchedulePage;
