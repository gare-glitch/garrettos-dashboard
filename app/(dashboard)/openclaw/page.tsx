import { Card } from '@/components/Card';
import { getAgentRuns } from '@/lib/dashboard-data';

export default async function OpenClawPage() {
  const agentRuns = await getAgentRuns();
  return <div className="page-stack"><div><p className="eyebrow">OpenClaw Control</p><h1>Agent run queue and approvals</h1></div><section className="dashboard-grid"><Card title="Runs" className="span-8">{agentRuns.map((run) => <div className="row" key={run.title}><span>{run.title}<small>{run.approval}</small></span><b>{run.status}</b></div>)}<div className="action-grid"><button>Start</button><button>Review</button><button>Send back</button><button>Approve</button></div></Card><Card title="Guardrails" className="span-4"><p className="muted">Privileged actions are modeled as approval records before Phase 2 VPS execution is enabled.</p></Card></section></div>;
}
