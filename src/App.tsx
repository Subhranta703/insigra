import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Building2,
  LogOut,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { supabase, CampaignData } from "./lib/supabase";

type Profile = {
  id: string;
  company_name: string;
};

function Login({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: FormEvent) {
    e.preventDefault();

    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setError(error.message);
    } else {
      onLogin();
    }

    setLoading(false);
  }

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <div className="brand-mark">
          <ShieldCheck size={24} />
        </div>

        <p className="eyebrow">INSIGRA REPORTS</p>

        <h1>Campaign Intelligence</h1>

        <p className="muted">
          Sign in to view marketing data for your company.
        </p>

        <form onSubmit={submit} className="form">
          <label>
            Email

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alpha@test.com"
              required
            />
          </label>

          <label>
            Password

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>

          {error && <div className="error">{error}</div>}

          <button className="primary-button" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="spin" size={17} />
                Signing in...
              </>
            ) : (
              "Sign in"
            )}
          </button>
        </form>

        <div className="security-note">
          <ShieldCheck size={17} />

          <span>
            Company data is isolated at the PostgreSQL database layer using
            Row-Level Security.
          </span>
        </div>
      </section>
    </main>
  );
}

function Dashboard({ onLogout }: { onLogout: () => void }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [rows, setRows] = useState<CampaignData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);

    const { data: a } = await supabase.auth.getUser();

    if (!a.user) {
      onLogout();
      return;
    }

    const {
      data: p,
      error: pe,
    } = await supabase
      .from("profiles")
      .select("id,company_name")
      .eq("id", a.user.id)
      .single();

    if (pe) {
      setError(pe.message);
      setLoading(false);
      return;
    }

    const {
      data: d,
      error: de,
    } = await supabase
      .from("campaign_data")
      .select("company_name,channel,leads")
      .order("channel");

    if (de) {
      setError(de.message);
      setLoading(false);
      return;
    }

    setProfile(p);
    setRows(d ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function logout() {
    await supabase.auth.signOut();
    onLogout();
  }

  const total = useMemo(
    () => rows.reduce((s, r) => s + Number(r.leads), 0),
    [rows]
  );

  if (loading) {
    return (
      <div className="loading-screen">
        <Loader2 className="spin" size={28} />
        Loading dashboard...
      </div>
    );
  }

  return (
    <main className="dashboard-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">INSIGRA REPORTS</p>

          <h1>Marketing Dashboard</h1>
        </div>

        <button className="ghost-button" onClick={logout}>
          <LogOut size={17} />
          Sign out
        </button>
      </header>

      {error && <div className="error page-error">{error}</div>}

      <section className="company-card">
        <div className="company-icon">
          <Building2 size={23} />
        </div>

        <div>
          <span className="muted small">Authenticated company</span>

          <h2>{profile?.company_name}</h2>
        </div>

        <div className="secure-badge">
          <ShieldCheck size={16} />
          RLS protected
        </div>
      </section>

      <section className="stats-grid">
        <div className="stat-card">
          <span className="muted">Company</span>

          <strong>{profile?.company_name}</strong>
        </div>

        <div className="stat-card">
          <span className="muted">Campaign rows</span>

          <strong>{rows.length}</strong>
        </div>

        <div className="stat-card">
          <span className="muted">Total leads</span>

          <strong>{total}</strong>
        </div>
      </section>

      <section className="content-grid">
        <div className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">CAMPAIGN DATA</p>

              <h2>Leads by channel</h2>
            </div>

            <BarChart3 size={21} />
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Channel</th>
                  <th>Leads</th>
                </tr>
              </thead>

              <tbody>
                {rows.map((r, i) => (
                  <tr key={`${r.channel}-${i}`}>
                    <td>{r.company_name}</td>
                    <td>{r.channel}</td>
                    <td>{r.leads}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">ANALYTICS</p>

              <h2>Leads by channel</h2>
            </div>
          </div>

          <div className="chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rows}>
                <CartesianGrid strokeDasharray="3 3" />

                <XAxis dataKey="channel" />

                <YAxis />

                <Tooltip />

                <Bar dataKey="leads" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <footer className="footer-note">
        <ShieldCheck size={16} />

        The database RLS policy enforces the company boundary; the frontend
        does not filter another company's rows.
      </footer>
    </main>
  );
}

export default function App() {
  const [ready, setReady] = useState(false);
  const [logged, setLogged] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setLogged(Boolean(data.session));
      setReady(true);
    });

    const { data: l } = supabase.auth.onAuthStateChange(
      (_e, s) => setLogged(Boolean(s))
    );

    return () => l.subscription.unsubscribe();
  }, []);

  if (!ready) {
    return (
      <div className="loading-screen">
        <Loader2 className="spin" size={28} />
        Starting app...
      </div>
    );
  }

  return logged ? (
    <Dashboard onLogout={() => setLogged(false)} />
  ) : (
    <Login onLogin={() => setLogged(true)} />
  );
}