'use client';
import React, { useState, useEffect } from 'react';
import dayjs, { Dayjs } from 'dayjs';
import { useRouter } from 'next/navigation';
import PostForm from '../post/_components/post-form';
import { Calendar } from 'lucide-react';
import { auth } from '@/auth';

const SchedulePage: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchRole = async () => {
      const userRole = await auth();
      if (!userRole) {
        router.push('/login');
      } else {
        setRole(userRole.user.role);
      }
    };
    fetchRole();
  }, [router]);

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
            {selectedDate && role && (
              <PostForm selectedDate={selectedDate} role={role} />
            )}
            <button onClick={handleCancel} style={{ marginTop: '10px' }}>Cancel</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SchedulePage;

/*

'use client';
import React, { useState, useEffect } from 'react';
import dayjs, { Dayjs } from 'dayjs';
import { useRouter } from 'next/navigation';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import PostForm from '../post/_components/post-form';
import { auth } from '@/auth';

const localizer = momentLocalizer(moment);

const SchedulePage: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchRole = async () => {
      const userRole = await auth();
      if (!userRole) {
        router.push('/login');
      } else {
        setRole(userRole.user.role);
      }
    };
    fetchRole();
  }, [router]);

  const handleSelectSlot = ({ start }: { start: Date }) => {
    setSelectedDate(dayjs(start));
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
            localizer={localizer}
            defaultDate={new Date()}
            defaultView="month"
            views={['month', 'week', 'day']}
            selectable
            onSelectSlot={handleSelectSlot}
            style={{ minWidth: '100%', maxWidth: '100%', cursor: 'pointer', height: '500px' }}
          />
        </div>
        {visible && (
          <div style={{ backgroundColor: '#fff', borderRadius: '10px', padding: '20px' }}>
            <h3>Scheduled Date</h3>
            {selectedDate && role && (
              <PostForm selectedDate={selectedDate} role={role} />
            )}
            <button onClick={handleCancel} style={{ marginTop: '10px' }}>Cancel</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SchedulePage;

 */