import { useCallback, useEffect, useState } from 'react';
import { Activity, Clock3, RefreshCw, ShieldCheck, UserRound, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { api } from '../services/backendClient';

const date = (value: string) => new Date(value).toLocaleString('en-GB', {
  timeZone: 'Asia/Karachi', month: 'short', day: 'numeric', year: 'numeric',
  hour: '2-digit', minute: '2-digit',
});

const eventLabels: Record<string, string> = {
  'user.login': 'Signed in',
  'user.logout': 'Signed out',
  'user.registered': 'Account registered',
  'user.created': 'Account created by administrator',
  'user.updated': 'Account access changed',
  'auth.session_revoked': 'Session revoked by administrator',
};

export function AdminSecurityView({ adminUserId }: { adminUserId: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  const reload = useCallback(async () => {
    setError('');
    try {
      setData(await api.request('/admin/security'));
    } catch (e: any) {
      setError(e.message || 'Unable to load campus security data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void reload(); }, [reload]);

  async function revoke(session: any) {
    if (session.user_id === adminUserId) return;
    if (!window.confirm(`Revoke this active session for ${session.user_name}? They will need to sign in again.`)) return;
    setBusy(session.id);
    try {
      await api.request(`/admin/security/sessions/${session.id}/revoke`, { method: 'POST' });
      toast.success('Session revoked. The user must sign in again.');
      await reload();
    } catch (e: any) {
      toast.error(e.message || 'Unable to revoke this session.');
    } finally {
      setBusy('');
    }
  }

  return <>
    {error && <p className="ai-notice" role="alert">{error}</p>}
    <div className="stats-grid">
      <div className="stat"><span className="stat-icon blue"><UserRound size={20}/></span><div><p>Active accounts</p><strong>{loading ? '…' : data?.active_users ?? 0}</strong><small>Within this campus</small></div></div>
      <div className="stat"><span className="stat-icon green"><ShieldCheck size={20}/></span><div><p>Active sessions</p><strong>{loading ? '…' : data?.active_sessions ?? 0}</strong><small>Unexpired, signed-in sessions</small></div></div>
      <div className="stat"><span className="stat-icon amber"><Activity size={20}/></span><div><p>Recent security events</p><strong>{loading ? '…' : data?.events?.length ?? 0}</strong><small>Latest 50 recorded events</small></div></div>
    </div>

    <div className="section-gap">
      <Panel title="Active sign-in sessions" subtitle="Review campus accounts currently signed in. Revoking a session requires the user to sign in again." action={<button className="text-btn" onClick={() => { setLoading(true); void reload(); }}><RefreshCw size={14}/>Refresh</button>}>
        <div className="table-scroll"><Table><TableHeader><TableRow>{['Account','Role','Signed in','Expires','Action'].map(label => <TableHead key={label}>{label}</TableHead>)}</TableRow></TableHeader>
          <TableBody>{(data?.sessions || []).map((session: any) => <TableRow key={session.id}>
            <TableCell><strong>{session.user_name}</strong><small>{session.email}</small></TableCell>
            <TableCell><span className="badge assigned">{session.role}</span></TableCell>
            <TableCell>{date(session.created_at)}</TableCell>
            <TableCell>{date(session.expires_at)}</TableCell>
            <TableCell>{session.user_id === adminUserId
              ? <span className="muted">Admin account protected</span>
              : <button className="outline-link" disabled={busy === session.id} onClick={() => void revoke(session)}><XCircle size={14}/>{busy === session.id ? 'Revoking…' : 'Revoke'}</button>}</TableCell>
          </TableRow>)}</TableBody></Table></div>
        {!loading && !data?.sessions?.length && <p className="empty">No active sessions are recorded for this campus.</p>}
      </Panel>
    </div>

    <div className="section-gap">
      <Panel title="Recent security events" subtitle="Successful sign-ins, sign-outs, account changes, and session revocations recorded by CampusNet.">
        <div className="activity-feed">{(data?.events || []).map((event: any) => <div className="activity-item" key={event.id}>
          <span className="small-icon blue"><Clock3 size={18}/></span>
          <div><strong>{eventLabels[event.action] || event.action}</strong><small>{event.actor_name} · {event.actor_email} · {date(event.created_at)}</small></div>
        </div>)}</div>
        {!loading && !data?.events?.length && <p className="empty">No security events have been recorded yet.</p>}
      </Panel>
    </div>

    <div className="section-gap">
      <Panel title="Account protection" subtitle="Review access regularly and revoke sessions when an account may be exposed.">
        <div className="config-notice"><ShieldCheck size={18}/><p>CampusNet records successful sign-ins and account changes. Use Users to deactivate accounts that should no longer have access. This panel does not detect failed password attempts, MFA enrollment, or endpoint threats.</p></div>
      </Panel>
    </div>
  </>;
}

function Panel({ title, subtitle, action, children }: { title: string; subtitle: string; action?: React.ReactNode; children: React.ReactNode }) {
  return <section className="panel"><div className="panel-heading"><div><h2>{title}</h2><p>{subtitle}</p></div>{action}</div>{children}</section>;
}
