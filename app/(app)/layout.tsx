import { createClient } from '@/lib/supabase/server';
import Sidebar from '@/components/layout/Sidebar';
import Navbar from '@/components/layout/Navbar';
import MobileBottomNav from '@/components/layout/MobileBottomNav';
import TrialBanner from '@/components/TrialBanner';
import TrialExpiredGate from '@/components/TrialExpiredGate';
import ChatSidebar from '@/components/ai/ChatSidebar';
import type { Profile } from '@/types';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let profile: Profile | null = null;
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    profile = data;

    // Auto-start 14-day trial the first time a user enters the app
    // (covers users who skip/bypass onboarding, or were created without trial_ends_at)
    if (profile && !profile.is_pro && !profile.trial_ends_at) {
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 14);
      const { data: updated } = await supabase
        .from('profiles')
        .update({ trial_ends_at: trialEndsAt.toISOString() })
        .eq('id', user.id)
        .select('*')
        .single();
      if (updated) profile = updated;
    }
  }

  return (
    <div className="h-screen flex overflow-hidden" style={{ backgroundColor: '#F8FAF9' }}>
      {/* Sidebar */}
      <Sidebar />

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Trial banner */}
        {profile && <TrialBanner profile={profile} />}

        {/* Navbar */}
        <Navbar />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden pb-36 md:pb-0">
          {children}
        </main>

        {/* Mobile bottom nav */}
        <MobileBottomNav />
      </div>

      {/* AI Chat Sidebar */}
      <ChatSidebar />

      {/* Trial expired full-screen gate */}
      <TrialExpiredGate />
    </div>
  );
}
