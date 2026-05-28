'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/types';

// ─── Storage key for the dropdown's open/closed state ───────────────────────
const PROJECTS_OPEN_KEY = 'rf-sidebar-projects-open';

// ─── Status dot colors ───────────────────────────────────────────────────────
const statusDot: Record<string, string> = {
  gepland:    '#3B82F6',
  lopend:     '#10B981',
  gepauzeerd: '#F59E0B',
  afgerond:   '#6B7280',
};

// ─── Nav items (excluding "Mijn projecten" — rendered separately) ─────────────
const navItems = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    label: 'Kalender',
    href: '/calendar',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    label: 'Analytics',
    href: '/analytics',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    label: 'Streaks',
    href: '/streak',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M17.66 11.2C17.43 10.9 17.15 10.64 16.89 10.38C16.22 9.78 15.46 9.35 14.82 8.72C13.33 7.26 13 4.85 13.95 3C13 3.23 12.17 3.75 11.46 4.32C8.87 6.4 7.85 10.07 9.07 13.22C9.11 13.32 9.15 13.42 9.15 13.55C9.15 13.77 9 13.97 8.8 14.05C8.57 14.15 8.33 14.09 8.14 13.93C8.08 13.88 8.04 13.83 8 13.76C6.87 12.33 6.69 10.28 7.45 8.64C5.78 10 4.87 12.3 5 14.47C5.06 14.97 5.12 15.47 5.29 15.97C5.43 16.57 5.7 17.17 6 17.7C7.08 19.43 8.95 20.67 10.96 20.92C13.1 21.19 15.39 20.8 17.03 19.32C18.86 17.66 19.5 15 18.56 12.72L18.43 12.46C18.22 12 17.66 11.2 17.66 11.2Z" />
      </svg>
    ),
  },
  {
    label: 'Instellingen',
    href: '/settings',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

// ─── Projects folder icon ─────────────────────────────────────────────────────
const ProjectsIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
  </svg>
);

export default function Sidebar() {
  const pathname = usePathname();
  const [profile, setProfile]   = useState<Profile | null>(null);
  const [projects, setProjects] = useState<{ id: string; name: string; status: string }[]>([]);
  const [projectsOpen, setProjectsOpen] = useState(false);

  // ── Restore persisted dropdown state from localStorage ──────────────────
  useEffect(() => {
    try {
      const stored = localStorage.getItem(PROJECTS_OPEN_KEY);
      if (stored === 'true') setProjectsOpen(true);
    } catch {}
  }, []);

  // ── Fetch profile + projects ─────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [profileRes, projectsRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase
          .from('projects')
          .select('id, name, status')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(12),
      ]);

      if (profileRes.data)  setProfile(profileRes.data);
      if (projectsRes.data) setProjects(projectsRes.data);
    };
    load();
  }, []);

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  const projectsActive = pathname.startsWith('/projects');

  const toggleProjects = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const next = !projectsOpen;
    setProjectsOpen(next);
    try { localStorage.setItem(PROJECTS_OPEN_KEY, String(next)); } catch {}
  };

  return (
    <>
      {/* ── Desktop sidebar ──────────────────────────────────────────────── */}
      <aside
        className="hidden lg:flex flex-col w-60 border-r shrink-0"
        style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}
      >
        {/* Logo */}
        <div className="px-5 py-4 border-b" style={{ borderColor: '#E5E7EB' }}>
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-base shrink-0"
              style={{ background: 'linear-gradient(135deg, #1a5140 0%, #288760 100%)', boxShadow: '0 2px 8px rgba(40,135,96,0.35)' }}
            >
              R
            </div>
            <span className="text-xl font-black tracking-tight" style={{ color: '#288760' }}>Renofloww</span>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">

          {/* Dashboard */}
          {navItems.slice(0, 1).map((item) => {
            const active = isActive(item.href);
            return (
              <Link key={item.href} href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors"
                style={{ backgroundColor: active ? '#B7E5BA' : 'transparent', color: active ? '#1A5140' : '#6B7280' }}
              >
                <span style={{ color: active ? '#288760' : '#9CA3AF' }}>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}

          {/* ── Mijn projecten (with dropdown) ────────────────────────── */}
          <div>
            {/* Row: folder link + chevron toggle */}
            <div
              className="flex items-center rounded-xl transition-colors"
              style={{ backgroundColor: projectsActive ? '#B7E5BA' : 'transparent' }}
            >
              {/* Clicking icon+label navigates to /projects */}
              <Link
                href="/projects"
                className="flex items-center gap-3 px-3 py-2.5 flex-1 text-sm font-medium min-w-0"
                style={{ color: projectsActive ? '#1A5140' : '#6B7280' }}
              >
                <span style={{ color: projectsActive ? '#288760' : '#9CA3AF' }}>
                  <ProjectsIcon />
                </span>
                <span className="truncate">Mijn projecten</span>
              </Link>

              {/* Chevron — only toggles the dropdown */}
              <button
                onClick={toggleProjects}
                className="w-8 h-8 flex items-center justify-center rounded-lg mr-1 transition-colors hover:bg-black/5"
                title={projectsOpen ? 'Inklappen' : 'Uitklappen'}
                aria-label={projectsOpen ? 'Projectenlijst inklappen' : 'Projectenlijst uitklappen'}
              >
                <svg
                  className="w-3.5 h-3.5 transition-transform duration-200"
                  fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  style={{
                    color: projectsActive ? '#288760' : '#9CA3AF',
                    transform: projectsOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                  }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* ── Project list dropdown ──────────────────────────────── */}
            <div
              style={{
                maxHeight: projectsOpen ? `${Math.min(projects.length, 12) * 36 + 36}px` : '0px',
                overflow: 'hidden',
                transition: 'max-height 0.25s ease',
              }}
            >
              <div className="pl-9 pr-2 pb-1 space-y-0.5">
                {projects.length === 0 ? (
                  <p className="text-xs px-2 py-2" style={{ color: '#9CA3AF' }}>Geen projecten</p>
                ) : (
                  projects.map((p) => {
                    const isCurrentProject = pathname.startsWith(`/projects/${p.id}`);
                    const dot = statusDot[p.status] || '#9CA3AF';
                    return (
                      <Link
                        key={p.id}
                        href={`/projects/${p.id}`}
                        className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors truncate"
                        style={{
                          backgroundColor: isCurrentProject ? '#DCFCE7' : 'transparent',
                          color: isCurrentProject ? '#1A5140' : '#6B7280',
                        }}
                        onMouseEnter={e => {
                          if (!isCurrentProject) (e.currentTarget as HTMLElement).style.backgroundColor = '#F3F4F6';
                        }}
                        onMouseLeave={e => {
                          if (!isCurrentProject) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                        }}
                      >
                        {/* Status dot */}
                        <span
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: dot }}
                        />
                        <span className="truncate">{p.name}</span>
                      </Link>
                    );
                  })
                )}

                {/* "Alle projecten" link at the bottom */}
                <Link
                  href="/projects"
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-colors mt-0.5"
                  style={{ color: '#9CA3AF' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#288760'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#9CA3AF'; }}
                >
                  <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                  Alle projecten
                </Link>
              </div>
            </div>
          </div>

          {/* Remaining nav items (Kalender, Analytics, Streaks, Instellingen) */}
          {navItems.slice(1).map((item) => {
            const active = isActive(item.href);
            return (
              <Link key={item.href} href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors"
                style={{ backgroundColor: active ? '#B7E5BA' : 'transparent', color: active ? '#1A5140' : '#6B7280' }}
              >
                <span style={{ color: active ? '#288760' : '#9CA3AF' }}>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}

          {/* Upgrade button (only for non-pro) */}
          {profile && !profile.is_pro && (
            <>
              <style>{`
                @keyframes rf-shimmer {
                  0% { transform: translateX(-100%) skewX(-15deg); }
                  100% { transform: translateX(250%) skewX(-15deg); }
                }
                .rf-upgrade-btn .rf-shimmer { animation: rf-shimmer 4s ease-in-out infinite; }
              `}</style>
              <Link
                href="/settings#abonnement"
                className="rf-upgrade-btn group relative flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold overflow-hidden mt-1"
                style={{
                  background: 'linear-gradient(135deg, #D97706 0%, #F59E0B 50%, #FBBF24 100%)',
                  color: 'white',
                  boxShadow: '0 2px 10px rgba(245,158,11,0.4)',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 18px rgba(245,158,11,0.6)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 10px rgba(245,158,11,0.4)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}
              >
                <div className="rf-shimmer absolute inset-0 w-1/3 bg-white opacity-20 pointer-events-none" />
                <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
                <span>Upgrade naar Pro</span>
                <svg className="w-3.5 h-3.5 ml-auto shrink-0 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </>
          )}
        </nav>

        {/* User info */}
        {profile && (
          <div className="p-3 border-t" style={{ borderColor: '#E5E7EB' }}>
            <Link href="/settings" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold shrink-0"
                style={{ backgroundColor: '#288760' }}
              >
                {profile.name ? profile.name[0].toUpperCase() : profile.email[0].toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: '#1A1A1A' }}>{profile.name || 'Gebruiker'}</p>
                <p className="text-xs truncate" style={{ color: '#6B7280' }}>{profile.email}</p>
              </div>
            </Link>
          </div>
        )}
      </aside>

      {/* ── Tablet icon-only sidebar ─────────────────────────────────────── */}
      <aside
        className="hidden md:flex lg:hidden flex-col w-16 border-r shrink-0"
        style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}
      >
        <div className="p-3 border-b flex justify-center" style={{ borderColor: '#E5E7EB' }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: '#288760' }}>
            R
          </div>
        </div>

        <nav className="flex-1 p-2 space-y-1 flex flex-col items-center">
          {/* Dashboard */}
          {[...navItems.slice(0, 1), { label: 'Mijn projecten', href: '/projects', icon: <ProjectsIcon /> }, ...navItems.slice(1)].map((item) => {
            const active = isActive(item.href);
            return (
              <Link key={item.href} href={item.href} title={item.label}
                className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
                style={{ backgroundColor: active ? '#B7E5BA' : 'transparent', color: active ? '#288760' : '#9CA3AF' }}
              >
                {item.icon}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
