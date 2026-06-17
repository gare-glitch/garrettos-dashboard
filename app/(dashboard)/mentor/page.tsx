import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';

export default function MentorPage() {
  return <div className="page-stack"><div><p className="eyebrow">AI Mentor</p><h1>Daily advice without browser AI keys</h1><p className="muted">Phase 1 is UI-only. Phase 2 calls server routes that choose Anthropic, local, or OpenClaw providers.</p></div><section className="dashboard-grid"><Card title="Mentor prompt" className="span-8"><textarea rows={8} placeholder="Ask for advice using dashboard context..." /><button className="primary-button">Send via server provider</button></Card><Card title="Readable context" className="span-4"><ul className="clean-list"><li>Health summaries</li><li>Gym progression</li><li>Water and supplements</li><li>Projects and revenue</li><li>OpenClaw agent status</li></ul></Card><EmptyState integration="AI Mentor" /></section></div>;
}
