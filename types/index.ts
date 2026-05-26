export type Profile = {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  is_pro: boolean;
  plan: 'free' | 'pro' | null;
  trial_ends_at: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  notification_preferences: {
    budget_warning: boolean;
    task_reminders: boolean;
    quote_updates: boolean;
    extra_work_requests: boolean;
  } | null;
  created_at: string;
};

export type ProjectType =
  | 'badkamer'
  | 'keuken'
  | 'woonkamer'
  | 'slaapkamer'
  | 'gehele_woning'
  | 'anders';

export type ProjectStatus = 'gepland' | 'lopend' | 'gepauzeerd' | 'afgerond' | 'active';

export type Project = {
  id: string;
  user_id: string;
  name: string;
  type: ProjectType;
  status: ProjectStatus;
  budget: number;
  start_date: string | null;
  end_date: string | null;
  description: string | null;
  created_at: string;
};

export type Room = {
  id: string;
  project_id: string;
  name: string;
  created_at: string;
};

export type TaskStatus = 'openstaand' | 'in_uitvoering' | 'voltooid' | 'verlopen' | 'todo' | 'in_progress' | 'done';

export type Task = {
  id: string;
  project_id: string;
  room_id: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
};

export type Contractor = {
  id: string;
  project_id: string;
  name: string;
  type: string | null;
  phone: string | null;
  email: string | null;
  notes: string | null;
  created_at: string;
};

export type QuoteStatus = 'in_behandeling' | 'geaccepteerd' | 'afgewezen' | 'pending' | 'accepted' | 'rejected';

export type Quote = {
  id: string;
  project_id: string;
  contractor_id: string | null;
  description: string | null;
  amount: number;
  status: QuoteStatus;
  document_url: string | null;
  created_at: string;
};

export type ExpenseCategory =
  | 'materiaal'
  | 'arbeid'
  | 'vergunning'
  | 'transport'
  | 'overig';

export type Expense = {
  id: string;
  project_id: string;
  description: string;
  category: ExpenseCategory;
  amount: number;
  date: string;
  created_at: string;
};

export type Document = {
  id: string;
  project_id: string;
  quote_id: string | null;
  name: string;
  url: string;
  type: string | null;
  category: string | null;
  size: number | null;
  uploaded_by: string | null;
  created_at: string;
};

export type PhotoPhase = 'voor' | 'tijdens' | 'na';

export type Photo = {
  id: string;
  project_id: string;
  room_id: string | null;
  url: string;
  phase: PhotoPhase;
  note: string | null;
  taken_at: string;
  created_at: string;
};

export type ExtraWorkStatus = 'aangevraagd' | 'goedgekeurd' | 'afgewezen';

export type ExtraWork = {
  id: string;
  project_id: string;
  contractor_id: string | null;
  description: string;
  amount: number;
  status: ExtraWorkStatus;
  requested_at: string;
  created_at: string;
};

export type Reminder = {
  id: string;
  user_id: string;
  project_id: string;
  title: string;
  description: string | null;
  remind_at: string;
  is_done: boolean;
  created_by: 'user' | 'ai';
  created_at: string;
};

export type NotificationType = 'info' | 'warning' | 'success' | 'error';

export type Notification = {
  id: string;
  user_id: string;
  title: string;
  message: string | null;
  type: NotificationType;
  is_read: boolean;
  link: string | null;
  created_at: string;
};

export type AiMessage = {
  id: string;
  user_id: string;
  project_id: string | null;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
};
