'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Project, Room, Task } from '@/types';

interface Props {
  project: Project;
  initialRooms: Room[];
  initialTasks: Task[];
}

export default function RuimtesTab({ project, initialRooms, initialTasks }: Props) {
  const [rooms, setRooms] = useState(initialRooms);
  const [tasks, setTasks] = useState(initialTasks);
  const [expandedRoom, setExpandedRoom] = useState<string | null>(null);
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [loading, setLoading] = useState(false);

  const getTasksForRoom = (roomId: string) => tasks.filter((t) => t.room_id === roomId);

  const getRoomProgress = (roomId: string) => {
    const roomTasks = getTasksForRoom(roomId);
    if (roomTasks.length === 0) return 0;
    const completed = roomTasks.filter((t) => t.status === 'voltooid' || t.status === 'done').length;
    return Math.round((completed / roomTasks.length) * 100);
  };

  const addRoom = async () => {
    if (!newRoomName.trim()) return;
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from('rooms')
      .insert({ project_id: project.id, name: newRoomName })
      .select()
      .single();
    if (data) {
      setRooms((prev) => [...prev, data]);
      setNewRoomName('');
      setShowAddRoom(false);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold" style={{ color: '#1A1A1A' }}>Ruimtes ({rooms.length})</h2>
        <button
          onClick={() => setShowAddRoom(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-white"
          style={{ backgroundColor: '#288760' }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Ruimte toevoegen
        </button>
      </div>

      {showAddRoom && (
        <div className="rounded-2xl p-4 bg-white border" style={{ borderColor: '#288760' }}>
          <div className="flex gap-3">
            <input
              autoFocus
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') addRoom(); if (e.key === 'Escape') setShowAddRoom(false); }}
              placeholder="Ruimte naam, bijv. Badkamer begane grond"
              className="flex-1 px-3 py-2 rounded-xl border text-sm outline-none"
              style={{ borderColor: '#E5E7EB', color: '#1A1A1A' }}
            />
            <button onClick={addRoom} disabled={loading} className="px-4 py-2 rounded-xl text-sm font-medium text-white" style={{ backgroundColor: '#288760' }}>
              {loading ? '...' : 'Toevoegen'}
            </button>
            <button onClick={() => setShowAddRoom(false)} className="px-3 py-2 rounded-xl text-sm border" style={{ borderColor: '#E5E7EB', color: '#6B7280' }}>
              Annuleren
            </button>
          </div>
        </div>
      )}

      {rooms.length === 0 ? (
        <div className="text-center py-12 rounded-2xl bg-white border" style={{ borderColor: '#E5E7EB' }}>
          <p className="text-3xl mb-3">🏠</p>
          <p className="text-sm font-medium mb-1" style={{ color: '#1A1A1A' }}>Nog geen ruimtes</p>
          <p className="text-sm" style={{ color: '#6B7280' }}>Voeg ruimtes toe om taken per ruimte bij te houden.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rooms.map((room) => {
            const progress = getRoomProgress(room.id);
            const roomTasks = getTasksForRoom(room.id);
            const isExpanded = expandedRoom === room.id;

            return (
              <div key={room.id} className="rounded-2xl bg-white border overflow-hidden" style={{ borderColor: '#E5E7EB', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                <button
                  onClick={() => setExpandedRoom(isExpanded ? null : room.id)}
                  className="w-full p-4 text-left"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold" style={{ color: '#1A1A1A' }}>{room.name}</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-xs" style={{ color: '#6B7280' }}>{roomTasks.length} taken</span>
                      <svg
                        className="w-4 h-4 transition-transform"
                        style={{ color: '#9CA3AF', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full" style={{ backgroundColor: '#E5E7EB' }}>
                      <div className="h-1.5 rounded-full" style={{ width: `${progress}%`, backgroundColor: '#288760' }} />
                    </div>
                    <span className="text-xs font-medium" style={{ color: '#288760' }}>{progress}%</span>
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t px-4 pb-4" style={{ borderColor: '#E5E7EB' }}>
                    {roomTasks.length === 0 ? (
                      <p className="text-xs py-3 text-center" style={{ color: '#6B7280' }}>Geen taken voor deze ruimte</p>
                    ) : (
                      <ul className="mt-3 space-y-1.5">
                        {roomTasks.map((task) => {
                          const done = task.status === 'voltooid' || task.status === 'done';
                          return (
                            <li key={task.id} className="flex items-center gap-2 text-sm">
                              <div
                                className="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0"
                                style={{ borderColor: done ? '#288760' : '#E5E7EB', backgroundColor: done ? '#288760' : 'transparent' }}
                              >
                                {done && (
                                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </div>
                              <span style={{ color: done ? '#9CA3AF' : '#1A1A1A', textDecoration: done ? 'line-through' : 'none' }}>
                                {task.title}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
