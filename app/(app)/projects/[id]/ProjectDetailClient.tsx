'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency } from '@/lib/utils';
import type { Project, Room, Task, Contractor, Quote, Expense, ExtraWork } from '@/types';
import OverzichtTab from '@/components/projects/tabs/OverzichtTab';
import RuimtesTab from '@/components/projects/tabs/RuimtesTab';
import TakenTab from '@/components/projects/tabs/TakenTab';
import AannemersTab from '@/components/projects/tabs/AannemersTab';
import OffertesTab from '@/components/projects/tabs/OffertesTab';
import KostenTab from '@/components/projects/tabs/KostenTab';
import MeerwerkTab from '@/components/projects/tabs/MeerwerkTab';
import DocumentenTab from '@/components/projects/tabs/DocumentenTab';
import FotosTab from '@/components/projects/tabs/FotosTab';
import InstellingenTab from '@/components/projects/tabs/InstellingenTab';

const tabs = [
  { id: 'overzicht', label: 'Overzicht' },
  { id: 'ruimtes', label: 'Ruimtes' },
  { id: 'taken', label: 'Taken' },
  { id: 'aannemers', label: 'Aannemers' },
  { id: 'offertes', label: 'Offertes' },
  { id: 'kosten', label: 'Kosten' },
  { id: 'meerwerk', label: 'Meerwerk' },
  { id: 'documenten', label: 'Documenten' },
  { id: 'fotos', label: "Foto's" },
  { id: 'instellingen', label: '⚙️ Instellingen' },
];

const statusOptions = ['gepland', 'lopend', 'gepauzeerd', 'afgerond'];
const statusLabels: Record<string, string> = {
  gepland: 'Gepland', lopend: 'Lopend', gepauzeerd: 'Gepauzeerd', afgerond: 'Afgerond'
};

interface Props {
  initialProject: Project;
  initialRooms: Room[];
  initialTasks: Task[];
  initialContractors: Contractor[];
  initialQuotes: (Quote & { contractors?: { name: string } | null })[];
  initialExpenses: Expense[];
  initialExtraWork: (ExtraWork & { contractors?: { name: string } | null })[];
}

export default function ProjectDetailClient({
  initialProject,
  initialRooms,
  initialTasks,
  initialContractors,
  initialQuotes,
  initialExpenses,
  initialExtraWork,
}: Props) {
  const [project, setProject] = useState(initialProject);
  const [activeTab, setActiveTab] = useState('overzicht');
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(project.name);

  const totalExpenses = initialExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const budget = Number(project.budget) || 0;
  const budgetPercentage = budget > 0 ? Math.min(Math.round((totalExpenses / budget) * 100), 100) : 0;
  const budgetColor = budgetPercentage >= 90 ? '#EF4444' : budgetPercentage >= 75 ? '#F59E0B' : '#288760';

  const saveName = async () => {
    if (!nameInput.trim()) return;
    const supabase = createClient();
    const { data } = await supabase
      .from('projects')
      .update({ name: nameInput })
      .eq('id', project.id)
      .select()
      .single();
    if (data) setProject(data);
    setEditingName(false);
  };

  const updateStatus = async (status: string) => {
    const supabase = createClient();
    const { data } = await supabase
      .from('projects')
      .update({ status })
      .eq('id', project.id)
      .select()
      .single();
    if (data) setProject(data);
  };

  return (
    <div className="flex flex-col min-h-full">
      {/* Project header */}
      <div className="px-4 sm:px-6 pt-6 pb-0 bg-white border-b" style={{ borderColor: '#E5E7EB' }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-start gap-4 mb-4">
            <Link
              href="/projects"
              className="mt-1 text-sm flex items-center gap-1 transition-opacity hover:opacity-70"
              style={{ color: '#6B7280' }}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Projecten
            </Link>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
            <div className="flex-1">
              {/* Editable project name */}
              {editingName ? (
                <div className="flex items-center gap-2">
                  <input
                    autoFocus
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    onBlur={saveName}
                    onKeyDown={(e) => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') { setEditingName(false); setNameInput(project.name); } }}
                    className="text-2xl font-bold outline-none border-b-2 pb-1"
                    style={{ borderColor: '#288760', color: '#1A1A1A' }}
                  />
                </div>
              ) : (
                <button
                  onClick={() => setEditingName(true)}
                  className="flex items-center gap-2 group text-left"
                >
                  <h1 className="text-2xl font-bold" style={{ color: '#1A1A1A' }}>{project.name}</h1>
                  <svg className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: '#9CA3AF' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              )}
            </div>

            {/* Status selector */}
            <select
              value={project.status}
              onChange={(e) => updateStatus(e.target.value)}
              className="px-3 py-1.5 rounded-xl border text-sm font-medium outline-none"
              style={{ borderColor: '#E5E7EB', color: '#1A1A1A' }}
            >
              {statusOptions.map((s) => (
                <option key={s} value={s}>{statusLabels[s]}</option>
              ))}
            </select>
          </div>

          {/* Budget progress bar */}
          {budget > 0 && (
            <div className="mb-4">
              <div className="flex justify-between text-xs mb-1.5">
                <span style={{ color: '#6B7280' }}>Budget: {formatCurrency(totalExpenses)} / {formatCurrency(budget)}</span>
                <span style={{ color: budgetColor }}>{budgetPercentage}%</span>
              </div>
              <div className="w-full h-2 rounded-full" style={{ backgroundColor: '#E5E7EB' }}>
                <div className="h-2 rounded-full transition-all" style={{ width: `${budgetPercentage}%`, backgroundColor: budgetColor }} />
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-0 overflow-x-auto -mb-px">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors"
                style={{
                  borderColor: activeTab === tab.id ? '#288760' : 'transparent',
                  color: activeTab === tab.id ? '#288760' : '#6B7280',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-auto p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          {activeTab === 'overzicht' && (
            <OverzichtTab
              project={project}
              rooms={initialRooms}
              tasks={initialTasks}
              expenses={initialExpenses}
              contractors={initialContractors}
              quotes={initialQuotes}
              onTabChange={setActiveTab}
            />
          )}
          {activeTab === 'ruimtes' && (
            <RuimtesTab
              project={project}
              initialRooms={initialRooms}
              initialTasks={initialTasks}
            />
          )}
          {activeTab === 'taken' && (
            <TakenTab
              project={project}
              initialTasks={initialTasks}
              initialRooms={initialRooms}
            />
          )}
          {activeTab === 'aannemers' && (
            <AannemersTab
              project={project}
              initialContractors={initialContractors}
            />
          )}
          {activeTab === 'offertes' && (
            <OffertesTab
              project={project}
              initialQuotes={initialQuotes}
              initialContractors={initialContractors}
            />
          )}
          {activeTab === 'kosten' && (
            <KostenTab
              project={project}
              initialExpenses={initialExpenses}
            />
          )}
          {activeTab === 'meerwerk' && (
            <MeerwerkTab
              project={project}
              initialExtraWork={initialExtraWork}
              initialContractors={initialContractors}
            />
          )}
          {activeTab === 'documenten' && (
            <DocumentenTab project={project} />
          )}
          {activeTab === 'fotos' && (
            <FotosTab
              project={project}
              initialRooms={initialRooms}
            />
          )}
          {activeTab === 'instellingen' && (
            <InstellingenTab
              project={project}
              onProjectUpdated={(updated) => {
                setProject(updated);
                setNameInput(updated.name);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
