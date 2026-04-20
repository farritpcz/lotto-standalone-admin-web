// Types: downline — role config + form state shared across subcomponents
// Parent: src/app/downline/page.tsx

export const ROLE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  admin:           { label: 'Admin',         color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
  share_holder:    { label: 'Share Holder',  color: '#8b5cf6', bg: 'rgba(139,92,246,0.15)' },
  senior:          { label: 'Senior',        color: '#3b82f6', bg: 'rgba(59,130,246,0.15)' },
  master:          { label: 'Master',        color: '#10b981', bg: 'rgba(16,185,129,0.15)' },
  agent:           { label: 'Agent',         color: '#06b6d4', bg: 'rgba(6,182,212,0.15)' },
  agent_downline:  { label: 'Downline',      color: '#6b7280', bg: 'rgba(107,114,128,0.15)' },
}

export interface CreateForm {
  name: string
  username: string
  password: string
  share_percent: number
  phone: string
  line_id: string
  note: string
  code: string
  domain: string
  site_name: string
  theme: string
}

export interface EditForm {
  name: string
  share_percent: number
  phone: string
  line_id: string
  note: string
  status: string
  password: string
  domain: string
  site_name: string
  theme: string
}

export interface ThemeOption {
  code: string
  name: string
}
