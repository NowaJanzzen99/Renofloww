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

  // Quick-add task state per room
  const [quickAddRoomId, setQuickAddRoomId] = useState<string | null>(null);
  const [quickTaskTitle, setQuickTaskTitle] = useState('');
  const [quickTaskLoading, setQuickTaskLoading] = useState(false);

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

  const quickAddTask = async (roomId: string) => {
    if (!quickTaskTitle.trim()) return;
    setQuickTaskLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from('tasks')
      .insert({
        project_id: project.id,
        room_id: roomId,
        title: quickTaskTitle.trim(),
        status: 'openstaand',
      })
      .select()
      .single();
    if (data) {
      setTasks((prev) => [...prev, data]);
      setQuickTaskTitle('');
      setQuickAddRoomId(null);
    }
    setQuickTaskLoading(false);
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
        <div className="text-center py-16 rounded-2xl bg-white border" style={{ borderColor: '#E5E7EB' }}>
          <div className="text-5xl mb-4">🏠</div>
          <p className="text-base font-semibold mb-1" style={{ color: '#1A1A1A' }}>Nog geen ruimtes aangemaakt</p>
          <p className="text-sm mb-5" style={{ color: '#6B7280' }}>Voeg ruimtes toe om taken per vertrek bij te houden, zoals badkamer, keuken of woonkamer.</p>
          <button
            onClick={() => setShowAddRoom(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ backgroundColor: '#288760' }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Eerste ruimte toevoegen
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rooms.map((room) => {
            const progress = getRoomProgress(room.id);
            const roomTasks = getTasksForRoom(room.id);
            const isExpanded = expandedRoom === room.id;
            const isQuickAdding = quickAddRoomId === room.id;

            return (
              <div key={room.id} className="rounded-2xl bg-white border overflow-hidden" style={{ borderColor: '#E5E7EB', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                <button
                  onClick={() => setExpandedRoom(isExpanded ? null : room.id)}
                  className="w-full p-4 text-left"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold" style={{ color: '#1A1A1A' }}>{room.name}</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-xs" style={{ color: '#6B7280' }}>{roomTasks.length} {roomTasks.length === 1 ? 'taak' : 'taken'}</span>
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
                      <div className="h-1.5 rounded-full transition-all" style={{ width: `${progress}%`, backgroundColor: progress === 100 ? '#10B981' : '#288760' }} />
                    </div>
                    <span className="text-xs font-medium" style={{ color: progress === 100 ? '#10B981' : '#288760' }}>{progress}%</span>
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t px-4 pb-4" style={{ borderColor: '#E5E7EB' }}>
                    {roomTasks.length === 0 ? (
                      <div className="text-center py-4">
                        <div className="text-2xl mb-2">📋</div>
                        <p className="text-xs mb-3" style={{ color: '#6B7280' }}>Nog geen taken voor deze ruimte</p>
                        {isQuickAdding ? (
                          <div className="flex gap-2">
                            <input
                              autoFocus
                              value={quickTaskTitle}
                              onChange={(e) => setQuickTaskTitle(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') quickAddTask(room.id);
                                if (e.key === 'Escape') { setQuickAddRoomId(null); setQuickTaskTitle(''); }
                              }}
                              placeholder="Taaknaam..."
                              className="flex-1 px-3 py-1.5 rounded-lg border text-xs outline-none"
                              style={{ borderColor: '#288760', color: '#1A1A1A' }}
                            />
                            <button
                              onClick={() => quickAddTask(room.id)}
                              disabled={quickTaskLoading || !quickTaskTitle.trim()}
                              className="px-3 py-1.5 rounded-lg text-xs font-medium text-white disabled:opacity-50"
                              style={{ backgroundColor: '#288760' }}
                            >
                              {quickTaskLoading ? '...' : 'Toevoegen'}
                            </button>
                            <button
                              onClick={() => { setQuickAddRoomId(null); setQuickTaskTitle(''); }}
                              className="px-2 py-1.5 rounded-lg text-xs border"
                              style={{ borderColor: '#E5E7EB', color: '#6B7280' }}
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => { e.stopPropagation(); setQuickAddRoomId(room.id); setQuickTaskTitle(''); }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors hover:bg-gray-50"
                            style={{ borderColor: '#288760', color: '#288760' }}
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Voeg eerste taak toe
                          </button>
                        )}
                      </div>
                    ) : (
                      <>
                        <ul className="mt-3 space-y-1.5 mb-3">
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
                        {/* Quick add for rooms that already have tasks */}
                        {isQuickAdding ? (
                          <div className="flex gap-2 mt-2">
                            <input
                              autoFocus
                              value={quickTaskTitle}
                              onChange={(e) => setQuickTaskTitle(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') quickAddTask(room.id);
                                if (e.key === 'Escape') { setQuickAddRoomId(null); setQuickTaskTitle(''); }
                              }}
                              placeholder="Nieuwe taak..."
                              className="flex-1 px-3 py-1.5 rounded-lg border text-xs outline-none"
                              style={{ borderColor: '#288760', color: '#1A1A1A' }}
                            />
                            <button
                              onClick={() => quickAddTask(room.id)}
                              disabled={quickTaskLoading || !quickTaskTitle.trim()}
                              className="px-3 py-1.5 rounded-lg text-xs font-medium text-white disabled:opacity-50"
                              style={{ backgroundColor: '#288760' }}
                            >
                              {quickTaskLoading ? '...' : '+'}
                            </button>
                            <button
                              onClick={() => { setQuickAddRoomId(null); setQuickTaskTitle(''); }}
                              className="px-2 py-1.5 rounded-lg text-xs border"
                              style={{ borderColor: '#E5E7EB', color: '#6B7280' }}
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => { e.stopPropagation(); setQuickAddRoomId(room.id); setQuickTaskTitle(''); }}
                            className="flex items-center gap-1 text-xs mt-1 transition-opacity hover:opacity-70"
                            style={{ color: '#288760' }}
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Taak toevoegen
                          </button>
                        )}
                      </>
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
