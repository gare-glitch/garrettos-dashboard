import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { settingsStatuses } from '@/data/mock';

export default function SettingsPage() {
  return <div className="page-stack"><div><p className="eyebrow">Settings</p><h1>Profile and integration status</h1><p className="muted">Configure the profile basics now; integration controls remain placeholders until Phase 2 connections are wired.</p></div><section className="dashboard-grid"><Card title="Profile basics" className="span-6"><div className="settings-form"><input placeholder="Display name" /><input placeholder="Primary email" /><input placeholder="Timezone" /></div></Card><Card title="Connection status" className="span-6">{settingsStatuses.map((item) => <div className="row" key={item.label}><span>{item.label}</span><b>{item.status}</b></div>)}<EmptyState integration="Settings integrations" /></Card></section></div>;
}
