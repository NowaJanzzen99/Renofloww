'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Task, Reminder, Project } from '@/types';

const WEEKDAYS = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'];
const MONTHS = ['Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni', 'Juli', 'Augustus', 'September', 'Oktober', 'November', 'December'];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  // Convert Sunday=0 to Monday=0
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1;
}

interface DayEvent {
  id: string;
  title: string;
  type: 'task' | 'reminder' | 'milestone';
  projectName?: string;
  time?: string;
  description?: string;
}

function AddReminderModal({ projects, onClose, onAdded }: {
  projects: Project[];
  onClose: () => void;
  onAdded: (r: Reminder) => void;
}) {
  const [title, setTitle] = useState('');
  const [projectId, setProjectId] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('09:00');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const remindAt = new Date(`${date}T${time}`).toISOString();
    const { data } = await supabase.from('reminders').insert({
      user_id: user.id,
      project_id: projectId || null,
      title,
      description: description || null,
      remind_at: remindAt,
      is_done: false,
      created_by: 'user',
    }).select().single();

    if (data) onAdded(data);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: '#E5E7EB' }}>
          <h2 className="text-base font-semibold" style={{ color: '#1A1A1A' }}>Herinnering toevoegen</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center" style={{ color: '#6B7280' }}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: '#1A1A1A' }}>Titel *</label>
            <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Bijv. Aannemer bellen" className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: '#E5E7EB', color: '#1A1A1A' }} onFocus={(e) => (e.target.style.borderColor = '#288760')} onBlur={(e) => (e.target.style.borderColor = '#E5E7EB')} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: '#1A1A1A' }}>Project</label>
            <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: '#E5E7EB', color: '#1A1A1A' }}>
              <option value="">Geen project</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: '#1A1A1A' }}>Omschrijving</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none resize-none" style={{ borderColor: '#E5E7EB', color: '#1A1A1A' }} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#1A1A1A' }}>Datum *</label>
              <input required type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: '#E5E7EB', color: '#1A1A1A' }} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#1A1A1A' }}>Tijd</label>
              <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: '#E5E7EB', color: '#1A1A1A' }} />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-medium border" style={{ borderColor: '#E5E7EB', color: '#6B7280' }}>Annuleren</button>
            <button type="submit" disabled={loading || !title} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-50" style={{ backgroundColor: '#288760' }}>
              {loading ? 'Opslaan...' : 'Toevoegen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CalendarPage() {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(today.getDate());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isMobileList, setIsMobileList] = useState(false);

  useEffect(() => {
    setIsMobileList(window.innerWidth < 768);
    const handler = () => setIsMobileList(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [projectsRes, tasksRes, remindersRes] = await Promise.all([
        supabase.from('projects').select('*').eq('user_id', user.id),
        supabase.from('tasks').select('*, projects(name)').in(
          'project_id',
          (await supabase.from('projects').select('id').eq('user_id', user.id)).data?.map((p: { id: string }) => p.id) || []
        ).not('due_date', 'is', null),
        supabase.from('reminders').select('*').eq('user_id', user.id),
      ]);

      setProjects(projectsRes.data || []);
      setTasks(tasksRes.data || []);
      setReminders(remindersRes.data || []);
      setLoading(false);

      // Realtime reminders
      const channel = supabase.channel('calendar-reminders')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'reminders', filter: `user_id=eq.${user.id}` }, async () => {
          const { data } = await supabase.from('reminders').select('*').eq('user_id', user.id);
          if (data) setReminders(data);
        }).subscribe();
      return () => { supabase.removeChannel(channel); };
    };
    load();
  }, []);

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayOffset = getFirstDayOfMonth(currentYear, currentMonth);

  const getEventsForDay = (day: number): DayEvent[] => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const events: DayEvent[] = [];

    tasks.forEach((t) => {
      if (t.due_date === dateStr) {
        events.push({
          id: t.id,
          title: t.title,
          type: 'task',
          projectName: (t as Task & { projects?: { name: string } }).projects?.name,
        });
      }
    });

    reminders.forEach((r) => {
      const remDate = r.remind_at.split('T')[0];
      if (remDate === dateStr) {
        events.push({
          id: r.id,
          title: r.title,
          type: 'reminder',
          description: r.description || undefined,
          time: r.remind_at.split('T')[1]?.slice(0, 5),
        });
      }
    });

    return events;
  };

  const selectedDayEvents = selectedDay ? getEventsForDay(selectedDay) : [];

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(currentYear - 1); }
    else setCurrentMonth(currentMonth - 1);
  };

  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(currentYear + 1); }
    else setCurrentMonth(currentMonth + 1);
  };

  const goToToday = () => {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
    setSelectedDay(today.getDate());
  };

  const isToday = (day: number) =>
    day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();

  const eventTypeColor = { task: '#288760', reminder: '#3B82F6', milestone: '#F59E0B' };

  // Mobile: list view
  if (isMobileList) {
    const allEvents: { date: string; events: DayEvent[] }[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const events = getEventsForDay(d);
      if (events.length > 0) {
        const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        allEvents.push({ date: dateStr, events });
      }
    }

    return (
      <div className="p-4 max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button onClick={prevMonth} className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center" style={{ color: '#6B7280' }}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <h1 className="text-lg font-bold" style={{ color: '#1A1A1A' }}>{MONTHS[currentMonth]} {currentYear}</h1>
            <button onClick={nextMonth} className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center" style={{ color: '#6B7280' }}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
          <button onClick={() => setShowAddModal(true)} className="px-3 py-1.5 rounded-xl text-sm font-medium text-white" style={{ backgroundColor: '#288760' }}>
            + Herinnering
          </button>
        </div>

        {allEvents.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-3xl mb-2">📅</p>
            <p className="text-sm" style={{ color: '#6B7280' }}>Geen evenementen deze maand</p>
          </div>
        ) : (
          <div className="space-y-4">
            {allEvents.map(({ date, events }) => (
              <div key={date} className="rounded-2xl bg-white border p-4" style={{ borderColor: '#E5E7EB' }}>
                <p className="text-sm font-semibold mb-2" style={{ color: '#1A1A1A' }}>
                  {new Date(date).toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
                <div className="space-y-1.5">
                  {events.map((ev) => (
                    <div key={ev.id} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: eventTypeColor[ev.type] }} />
                      <span className="text-sm" style={{ color: '#1A1A1A' }}>{ev.title}</span>
                      {ev.time && <span className="text-xs" style={{ color: '#9CA3AF' }}>{ev.time}</span>}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {showAddModal && (
          <AddReminderModal projects={projects} onClose={() => setShowAddModal(false)} onAdded={(r) => { setReminders((prev) => [...prev, r]); setShowAddModal(false); }} />
        )}
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={prevMonth} className="w-9 h-9 rounded-xl border hover:bg-gray-50 flex items-center justify-center" style={{ borderColor: '#E5E7EB', color: '#6B7280' }}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <h1 className="text-xl font-bold w-48 text-center" style={{ color: '#1A1A1A' }}>{MONTHS[currentMonth]} {currentYear}</h1>
          <button onClick={nextMonth} className="w-9 h-9 rounded-xl border hover:bg-gray-50 flex items-center justify-center" style={{ borderColor: '#E5E7EB', color: '#6B7280' }}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
          <button onClick={goToToday} className="px-3 py-1.5 rounded-xl border text-sm font-medium hover:bg-gray-50" style={{ borderColor: '#E5E7EB', color: '#6B7280' }}>
            Vandaag
          </button>
        </div>

        <div className="flex items-center gap-4">
          {/* Legend */}
          <div className="hidden lg:flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#288760' }} />Taken</div>
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#3B82F6' }} />Herinneringen</div>
          </div>
          <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-white" style={{ backgroundColor: '#288760' }}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Herinnering toevoegen
          </button>
        </div>
      </div>

      <div className="flex flex-1 gap-4 overflow-hidden">
        {/* Calendar grid */}
        <div className="flex-1 flex flex-col">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 mb-1">
            {WEEKDAYS.map((day) => (
              <div key={day} className="text-center py-2 text-xs font-medium" style={{ color: '#9CA3AF' }}>{day}</div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 flex-1 gap-px" style={{ backgroundColor: '#E5E7EB' }}>
            {/* Empty cells before first day */}
            {Array.from({ length: firstDayOffset }).map((_, i) => (
              <div key={`empty-${i}`} className="bg-white" style={{ backgroundColor: '#F9FAFB' }} />
            ))}

            {/* Days */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const events = getEventsForDay(day);
              const selected = selectedDay === day;
              const _isToday = isToday(day);

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className="bg-white flex flex-col p-1.5 min-h-[80px] text-left hover:bg-gray-50 transition-colors relative"
                  style={{
                    backgroundColor: selected ? '#F0FDF4' : _isToday ? '#F8FAF9' : 'white',
                    outline: selected ? '2px solid #288760' : _isToday ? '1px solid #288760' : 'none',
                    outlineOffset: '-1px',
                  }}
                >
                  <span
                    className="text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full"
                    style={{
                      color: _isToday ? 'white' : '#1A1A1A',
                      backgroundColor: _isToday ? '#288760' : 'transparent',
                    }}
                  >
                    {day}
                  </span>

                  {/* Event dots */}
                  <div className="flex flex-col gap-0.5 mt-1">
                    {events.slice(0, 3).map((ev) => (
                      <div
                        key={ev.id}
                        className="text-xs px-1.5 py-0.5 rounded font-medium truncate"
                        style={{ backgroundColor: ev.type === 'task' ? '#B7E5BA' : '#DBEAFE', color: ev.type === 'task' ? '#1A5140' : '#1D4ED8', fontSize: '10px' }}
                      >
                        {ev.title}
                      </div>
                    ))}
                    {events.length > 3 && (
                      <span className="text-xs" style={{ color: '#9CA3AF', fontSize: '10px' }}>+{events.length - 3} meer</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Day detail sidebar */}
        {selectedDay && (
          <div className="w-72 flex flex-col rounded-2xl border bg-white overflow-hidden shrink-0" style={{ borderColor: '#E5E7EB' }}>
            <div className="px-4 py-4 border-b" style={{ borderColor: '#E5E7EB' }}>
              <p className="text-sm font-semibold" style={{ color: '#1A1A1A' }}>
                {new Date(currentYear, currentMonth, selectedDay).toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
              <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>{selectedDayEvents.length} evenementen</p>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {selectedDayEvents.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-2xl mb-2">✨</p>
                  <p className="text-sm" style={{ color: '#6B7280' }}>Vrije dag</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedDayEvents.map((ev) => (
                    <div key={ev.id} className="rounded-xl p-3 border" style={{ borderColor: '#E5E7EB' }}>
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: eventTypeColor[ev.type] }} />
                        <span className="text-xs font-medium" style={{ color: ev.type === 'task' ? '#288760' : '#3B82F6' }}>
                          {ev.type === 'task' ? 'Taak' : 'Herinnering'}
                        </span>
                        {ev.time && <span className="text-xs ml-auto" style={{ color: '#9CA3AF' }}>{ev.time}</span>}
                      </div>
                      <p className="text-sm font-medium" style={{ color: '#1A1A1A' }}>{ev.title}</p>
                      {ev.projectName && <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>{ev.projectName}</p>}
                      {ev.description && <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>{ev.description}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {showAddModal && (
        <AddReminderModal
          projects={projects}
          onClose={() => setShowAddModal(false)}
          onAdded={(r) => { setReminders((prev) => [...prev, r]); setShowAddModal(false); }}
        />
      )}
    </div>
  );
}
