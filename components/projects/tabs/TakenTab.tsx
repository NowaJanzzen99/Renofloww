'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { formatDate } from '@/lib/utils';
import type { Project, Task, Room } from '@/types';

type Filter = 'alle' | 'openstaand' | 'voltooid' | 'verlopen';

interface Props {
  project: Project;
  initialTasks: Task[];
  initialRooms: Room[];
}

function AddTaskModal({ project, rooms, onClose, onAdded }: {
  project: Project;
  rooms: Room[];
  onClose: () => void;
  onAdded: (task: Task) => void;
}) {
  const [title, setTitle] = useState('');
  const [roomId, setRoomId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from('tasks')
      .insert({
        project_id: project.id,
        room_id: roomId || null,
        title,
        description: description || null,
        due_date: dueDate || null,
        status: 'openstaand',
      })
      .select()
      .single();
    if (data) onAdded(data);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: '#E5E7EB' }}>
          <h2 className="text-base font-semibold" style={{ color: '#1A1A1A' }}>Taak toevoegen</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center" style={{ color: '#6B7280' }}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: '#1A1A1A' }}>Titel *</label>
            <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Bijv. Tegels plaatsen" className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: '#E5E7EB', color: '#1A1A1A' }} onFocus={(e) => (e.target.style.borderColor = '#288760')} onBlur={(e) => (e.target.style.borderColor = '#E5E7EB')} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: '#1A1A1A' }}>Ruimte</label>
            <select value={roomId} onChange={(e) => setRoomId(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: '#E5E7EB', color: '#1A1A1A' }}>
              <option value="">Geen specifieke ruimte</option>
              {rooms.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: '#1A1A1A' }}>Deadline</label>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: '#E5E7EB', color: '#1A1A1A' }} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: '#1A1A1A' }}>Omschrijving</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Optionele details..." className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none resize-none" style={{ borderColor: '#E5E7EB', color: '#1A1A1A' }} />
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

export default function TakenTab({ project, initialTasks, initialRooms }: Props) {
  const [tasks, setTasks] = useState(initialTasks);
  const [filter, setFilter] = useState<Filter>('alle');
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel('tasks-tab')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks', filter: `project_id=eq.${project.id}` }, async () => {
        const { data } = await supabase.from('tasks').select('*').eq('project_id', project.id).order('created_at', { ascending: false });
        if (data) setTasks(data);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [project.id]);

  const toggleTask = async (task: Task) => {
    const newStatus = task.status === 'voltooid' || task.status === 'done' ? 'openstaand' : 'voltooid';
    const supabase = createClient();
    await supabase.from('tasks').update({ status: newStatus, completed_at: newStatus === 'voltooid' ? new Date().toISOString() : null }).eq('id', task.id);
    setTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, status: newStatus as Task['status'] } : t));
  };

  const today = new Date().toISOString().split('T')[0];

  const filteredTasks = tasks.filter((t) => {
    const done = t.status === 'voltooid' || t.status === 'done';
    const expired = t.due_date && t.due_date < today && !done;
    if (filter === 'voltooid') return done;
    if (filter === 'openstaand') return !done && !expired;
    if (filter === 'verlopen') return expired;
    return true;
  });

  // Group by room
  const tasksByRoom = initialRooms.reduce((acc, room) => {
    acc[room.id] = filteredTasks.filter((t) => t.room_id === room.id);
    return acc;
  }, {} as Record<string, Task[]>);

  const unassignedTasks = filteredTasks.filter((t) => !t.room_id);

  const statusColors: Record<string, { color: string; bg: string; label: string }> = {
    openstaand: { color: '#3B82F6', bg: '#EFF6FF', label: 'Openstaand' },
    in_uitvoering: { color: '#F59E0B', bg: '#FFFBEB', label: 'In uitvoering' },
    voltooid: { color: '#10B981', bg: '#ECFDF5', label: 'Voltooid' },
    verlopen: { color: '#EF4444', bg: '#FEF2F2', label: 'Verlopen' },
    done: { color: '#10B981', bg: '#ECFDF5', label: 'Voltooid' },
    todo: { color: '#3B82F6', bg: '#EFF6FF', label: 'Openstaand' },
  };

  const TaskItem = ({ task }: { task: Task }) => {
    const done = task.status === 'voltooid' || task.status === 'done';
    const isExpired = task.due_date && task.due_date < today && !done;
    const statusKey = isExpired ? 'verlopen' : task.status;
    const status = statusColors[statusKey] || statusColors.openstaand;

    return (
      <li className="flex items-start gap-3 py-3 border-b last:border-b-0" style={{ borderColor: '#F3F4F6' }}>
        <button
          onClick={() => toggleTask(task)}
          className="mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all"
          style={{ borderColor: done ? '#288760' : '#E5E7EB', backgroundColor: done ? '#288760' : 'transparent' }}
        >
          {done && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm" style={{ color: done ? '#9CA3AF' : '#1A1A1A', textDecoration: done ? 'line-through' : 'none' }}>{task.title}</p>
            <span className="px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap shrink-0" style={{ backgroundColor: status.bg, color: status.color }}>
              {status.label}
            </span>
          </div>
          {task.due_date && (
            <p className="text-xs mt-0.5" style={{ color: isExpired ? '#EF4444' : '#9CA3AF' }}>
              Deadline: {formatDate(task.due_date)}
            </p>
          )}
          {task.description && (
            <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>{task.description}</p>
          )}
        </div>
      </li>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex gap-2 overflow-x-auto">
          {(['alle', 'openstaand', 'voltooid', 'verlopen'] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors"
              style={{
                backgroundColor: filter === f ? '#288760' : '#F3F4F6',
                color: filter === f ? '#FFFFFF' : '#6B7280',
              }}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-white shrink-0"
          style={{ backgroundColor: '#288760' }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Taak toevoegen
        </button>
      </div>

      {filteredTasks.length === 0 ? (
        <div className="text-center py-12 rounded-2xl bg-white border" style={{ borderColor: '#E5E7EB' }}>
          <p className="text-2xl mb-2">✓</p>
          <p className="text-sm" style={{ color: '#6B7280' }}>Geen taken gevonden</p>
        </div>
      ) : (
        <>
          {/* Tasks per room */}
          {initialRooms.map((room) => {
            const roomTasks = tasksByRoom[room.id];
            if (!roomTasks || roomTasks.length === 0) return null;
            return (
              <div key={room.id} className="rounded-2xl bg-white border" style={{ borderColor: '#E5E7EB', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                <div className="px-5 py-3 border-b" style={{ borderColor: '#E5E7EB' }}>
                  <h3 className="text-sm font-semibold" style={{ color: '#1A1A1A' }}>{room.name}</h3>
                </div>
                <ul className="px-5">
                  {roomTasks.map((task) => <TaskItem key={task.id} task={task} />)}
                </ul>
              </div>
            );
          })}

          {/* Unassigned tasks */}
          {unassignedTasks.length > 0 && (
            <div className="rounded-2xl bg-white border" style={{ borderColor: '#E5E7EB', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <div className="px-5 py-3 border-b" style={{ borderColor: '#E5E7EB' }}>
                <h3 className="text-sm font-semibold" style={{ color: '#1A1A1A' }}>Algemeen</h3>
              </div>
              <ul className="px-5">
                {unassignedTasks.map((task) => <TaskItem key={task.id} task={task} />)}
              </ul>
            </div>
          )}
        </>
      )}

      {showAddModal && (
        <AddTaskModal
          project={project}
          rooms={initialRooms}
          onClose={() => setShowAddModal(false)}
          onAdded={(task) => { setTasks((prev) => [task, ...prev]); setShowAddModal(false); }}
        />
      )}
    </div>
  );
}
