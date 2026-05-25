'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { Notification, Profile } from '@/types';
import { timeAgo } from '@/lib/utils';

export default function Navbar() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [profileRes, notifsRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(20),
      ]);

      if (profileRes.data) setProfile(profileRes.data);
      if (notifsRes.data) setNotifications(notifsRes.data);

      // Realtime: notifications + profile updates (avatar, name)
      const channel = supabase
        .channel('navbar-realtime')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
          (payload) => {
            setNotifications((prev) => [payload.new as Notification, ...prev]);
          }
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` },
          (payload) => {
            setProfile((prev) => prev ? { ...prev, ...(payload.new as Profile) } : payload.new as Profile);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    fetchData();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifs(false);
      }
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAsRead = async (id: string) => {
    const supabase = createClient();
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
  };

  const markAllAsRead = async () => {
    const supabase = createClient();
    const ids = notifications.filter((n) => !n.is_read).map((n) => n.id);
    if (ids.length === 0) return;
    await supabase.from('notifications').update({ is_read: true }).in('id', ids);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const notifTypeColor: Record<string, string> = {
    info: '#288760',
    warning: '#F59E0B',
    success: '#10B981',
    error: '#EF4444',
  };

  return (
    <header
      className="h-14 flex items-center justify-between px-4 border-b shrink-0 bg-white"
      style={{ borderColor: '#E5E7EB' }}
    >
      {/* Mobile logo */}
      <Link href="/dashboard" className="md:hidden flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-xs" style={{ backgroundColor: '#288760' }}>
          R
        </div>
        <span className="font-bold text-sm" style={{ color: '#1A1A1A' }}>Renofloww</span>
      </Link>

      {/* Search bar */}
      <div className="hidden md:flex flex-1 max-w-md">
        <div className="relative w-full">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: '#9CA3AF' }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Zoek projecten, taken, aannemers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border text-sm outline-none transition-colors"
            style={{ borderColor: '#E5E7EB', color: '#1A1A1A', backgroundColor: '#F8FAF9' }}
            onFocus={(e) => (e.target.style.borderColor = '#288760')}
            onBlur={(e) => (e.target.style.borderColor = '#E5E7EB')}
          />
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-colors hover:bg-gray-100"
            style={{ color: '#6B7280' }}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {unreadCount > 0 && (
              <span
                className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
                style={{ backgroundColor: '#EF4444' }}
              />
            )}
          </button>

          {showNotifs && (
            <div
              className="absolute right-0 top-full mt-2 w-80 rounded-2xl border bg-white shadow-xl z-50"
              style={{ borderColor: '#E5E7EB', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: '#E5E7EB' }}>
                <span className="text-sm font-semibold" style={{ color: '#1A1A1A' }}>
                  Meldingen {unreadCount > 0 && <span className="ml-1 text-xs px-1.5 py-0.5 rounded-full text-white" style={{ backgroundColor: '#EF4444' }}>{unreadCount}</span>}
                </span>
                {unreadCount > 0 && (
                  <button onClick={markAllAsRead} className="text-xs font-medium" style={{ color: '#288760' }}>
                    Alles gelezen
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center">
                    <p className="text-sm" style={{ color: '#6B7280' }}>Geen meldingen</p>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <button
                      key={notif.id}
                      onClick={() => {
                        markAsRead(notif.id);
                        if (notif.link) router.push(notif.link);
                      }}
                      className="w-full text-left px-4 py-3 border-b hover:bg-gray-50 transition-colors"
                      style={{ borderColor: '#F3F4F6', backgroundColor: notif.is_read ? 'transparent' : '#F8FAF9' }}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                          style={{ backgroundColor: notifTypeColor[notif.type] || '#288760' }}
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate" style={{ color: '#1A1A1A' }}>{notif.title}</p>
                          {notif.message && (
                            <p className="text-xs mt-0.5 line-clamp-2" style={{ color: '#6B7280' }}>{notif.message}</p>
                          )}
                          <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>{timeAgo(notif.created_at)}</p>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User menu */}
        <div className="relative" ref={userRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <div className="w-7 h-7 rounded-full overflow-hidden shrink-0">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.name || 'Avatar'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center text-white text-xs font-semibold"
                  style={{ backgroundColor: '#288760' }}
                >
                  {profile?.name ? profile.name[0].toUpperCase() : profile?.email?.[0]?.toUpperCase() || 'U'}
                </div>
              )}
            </div>
            <span className="hidden sm:block text-sm font-medium" style={{ color: '#1A1A1A' }}>
              {profile?.name?.split(' ')[0] || 'Gebruiker'}
            </span>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: '#9CA3AF' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showUserMenu && (
            <div
              className="absolute right-0 top-full mt-2 w-52 rounded-2xl border bg-white shadow-xl z-50"
              style={{ borderColor: '#E5E7EB', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}
            >
              <div className="px-4 py-3 border-b flex items-center gap-3" style={{ borderColor: '#E5E7EB' }}>
                <div className="w-9 h-9 rounded-full overflow-hidden shrink-0">
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile.name || 'Avatar'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center text-white text-sm font-semibold"
                      style={{ backgroundColor: '#288760' }}
                    >
                      {profile?.name ? profile.name[0].toUpperCase() : profile?.email?.[0]?.toUpperCase() || 'U'}
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: '#1A1A1A' }}>{profile?.name || 'Gebruiker'}</p>
                  <p className="text-xs truncate" style={{ color: '#6B7280' }}>{profile?.email}</p>
                </div>
              </div>
              <div className="p-1.5">
                <Link
                  href="/settings"
                  onClick={() => setShowUserMenu(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm hover:bg-gray-50 transition-colors"
                  style={{ color: '#1A1A1A' }}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: '#6B7280' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Profiel
                </Link>
                <Link
                  href="/settings"
                  onClick={() => setShowUserMenu(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm hover:bg-gray-50 transition-colors"
                  style={{ color: '#1A1A1A' }}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: '#6B7280' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Instellingen
                </Link>
                <hr className="my-1" style={{ borderColor: '#E5E7EB' }} />
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm hover:bg-red-50 transition-colors"
                  style={{ color: '#EF4444' }}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Uitloggen
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
