import { TrendingUp, DollarSign, Users, Target, ArrowUpRight } from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Legend, PieChart, Pie, Cell,
    AreaChart, Area
} from 'recharts';
import { campaigns, leads } from '../../data/mockData';

const COLORS = ['#f97316', '#fbbf24', '#c084fc', '#ea580c', '#22c55e'];

const channelData = campaigns.map(c => ({
    name: c.channel,
    spend: c.spend / 1000,
    revenue: c.revenue / 1000,
    leads: c.leadsGenerated,
    conversions: c.conversions,
    roi: ((c.revenue - c.spend) / c.spend * 100).toFixed(0),
    cpl: (c.spend / c.leadsGenerated).toFixed(0),
    cac: (c.spend / c.conversions).toFixed(0),
}));

const conversionFunnel = [
    { stage: 'Leads', value: leads.length },
    { stage: 'Specs', value: leads.filter(l => ['Specs Received', 'Quoted', 'Sample Sent', 'Approved', 'In Production'].includes(l.stage)).length },
    { stage: 'Quoted', value: leads.filter(l => ['Quoted', 'Sample Sent', 'Approved', 'In Production'].includes(l.stage)).length },
    { stage: 'Won', value: leads.filter(l => ['Approved', 'In Production'].includes(l.stage)).length },
];

const monthlyLeads = [
    { month: 'Oct', leads: 8, conversions: 2 },
    { month: 'Nov', leads: 12, conversions: 3 },
    { month: 'Dec', leads: 10, conversions: 2 },
    { month: 'Jan', leads: 15, conversions: 4 },
    { month: 'Feb', leads: 18, conversions: 5 },
    { month: 'Mar', leads: 10, conversions: 3 },
];

import { useToast } from '../../context/ToastContext';
import { Plus, Download } from 'lucide-react';

export default function MarketingROI() {
    const { showToast } = useToast();
    const totalSpend = campaigns.reduce((s, c) => s + c.spend, 0);
    const totalRevenue = campaigns.reduce((s, c) => s + c.revenue, 0);
    const totalLeads = campaigns.reduce((s, c) => s + c.leadsGenerated, 0);
    const totalConversions = campaigns.reduce((s, c) => s + c.conversions, 0);
    const overallROI = ((totalRevenue - totalSpend) / totalSpend * 100).toFixed(0);

    const kpis = [
        { label: 'Total Ad Spend', value: `₹${(totalSpend / 1000).toFixed(0)}K`, icon: DollarSign, color: 'orange' },
        { label: 'Leads Generated', value: totalLeads, icon: Users, color: 'blue' },
        { label: 'Conversions', value: totalConversions, icon: Target, color: 'green' },
        { label: 'Overall ROI', value: `${overallROI}%`, icon: TrendingUp, color: 'purple' },
    ];

    return (
        <div className="page-content">
            <div className="flex items-center justify-between" style={{ marginBottom: 20 }}>
                <h2 style={{ fontSize: 20, fontWeight: 700 }}>Marketing Analytics</h2>
                <div className="flex gap-2">
                    <button className="btn btn-secondary btn-sm" onClick={() => showToast("Exporting marketing data...")}>
                        <Download size={14} /> Export Report
                    </button>
                    <button className="btn btn-primary btn-sm" onClick={() => showToast("New Campaign wizard coming soon!")}>
                        <Plus size={14} /> New Campaign
                    </button>
                </div>
            </div>

            {/* KPIs */}
            <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                {kpis.map((kpi, i) => (
                    <div className={`kpi-card ${kpi.color} animate-in`} key={i}>
                        <div className={`kpi-icon ${kpi.color}`}><kpi.icon size={22} /></div>
                        <div className="kpi-info">
                            <div className="kpi-label">{kpi.label}</div>
                            <div className="kpi-value">{kpi.value}</div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid-2">
                {/* Channel ROI Comparison */}
                <div className="card animate-in">
                    <div className="card-header">
                        <div className="card-title">Spend vs Revenue by Channel</div>
                        <span className="text-xs text-muted">(₹ in Thousands)</span>
                    </div>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={channelData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                            <Tooltip contentStyle={{ background: '#1a1f35', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#f1f5f9', fontSize: '12px' }} />
                            <Bar dataKey="spend" fill="#ef4444" radius={[4, 4, 0, 0]} name="Spend (₹K)" />
                            <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} name="Revenue (₹K)" />
                            <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Lead Trend */}
                <div className="card animate-in">
                    <div className="card-header">
                        <div className="card-title">Monthly Lead & Conversion Trend</div>
                    </div>
                    <ResponsiveContainer width="100%" height={250}>
                        <AreaChart data={monthlyLeads}>
                            <defs>
                                <linearGradient id="leadGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#f97316" stopOpacity={0.3} />
                                    <stop offset="100%" stopColor="#f97316" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                            <Tooltip contentStyle={{ background: '#1a1f35', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#f1f5f9', fontSize: '12px' }} />
                            <Area type="monotone" dataKey="leads" stroke="#f97316" strokeWidth={2} fill="url(#leadGrad)" name="Leads" />
                            <Area type="monotone" dataKey="conversions" stroke="#10b981" strokeWidth={2} fill="rgba(16,185,129,0.1)" name="Conversions" />
                            <Legend wrapperStyle={{ fontSize: '11px' }} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="grid-7-3">
                {/* Campaign Table */}
                <div className="card animate-in">
                    <div className="card-header">
                        <div className="card-title">Campaign Performance</div>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Campaign</th>
                                    <th>Channel</th>
                                    <th>Spend</th>
                                    <th>Leads</th>
                                    <th>Conv</th>
                                    <th>CPL</th>
                                    <th>CAC</th>
                                    <th>Revenue</th>
                                    <th>ROI</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {campaigns.map(c => {
                                    const roi = ((c.revenue - c.spend) / c.spend * 100).toFixed(0);
                                    const cpl = (c.spend / c.leadsGenerated).toFixed(0);
                                    return (
                                        <tr key={c.id}>
                                            <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.name}</td>
                                            <td>{c.channel}</td>
                                            <td>₹{(c.spend / 1000).toFixed(0)}K</td>
                                            <td>{c.leadsGenerated}</td>
                                            <td>{c.conversions}</td>
                                            <td>₹{cpl}</td>
                                            <td>₹{(c.spend / c.conversions / 1000).toFixed(1)}K</td>
                                            <td style={{ color: 'var(--accent-green)' }}>₹{(c.revenue / 100000).toFixed(1)}L</td>
                                            <td><span className={`badge ${parseInt(roi) > 500 ? 'green' : 'blue'}`}><ArrowUpRight size={10} />{roi}%</span></td>
                                            <td><span className={`badge ${c.status === 'Active' ? 'green' : 'gray'}`}><span className="badge-dot"></span>{c.status}</span></td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Conversion Funnel */}
                <div className="card animate-in">
                    <div className="card-header">
                        <div className="card-title">Conversion Funnel</div>
                    </div>
                    <div className="flex flex-col gap-3">
                        {conversionFunnel.map((stage, i) => {
                            const pct = ((stage.value / conversionFunnel[0].value) * 100).toFixed(0);
                            return (
                                <div key={stage.stage}>
                                    <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
                                        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{stage.stage}</span>
                                        <span style={{ fontSize: 12, fontWeight: 700, color: COLORS[i] }}>{stage.value} ({pct}%)</span>
                                    </div>
                                    <div className="progress-bar">
                                        <div className="progress-fill" style={{ width: `${pct}%`, background: COLORS[i] }}></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Source Pie */}
                    <div style={{ marginTop: 20 }}>
                        <div className="card-title" style={{ fontSize: 13, marginBottom: 8 }}>Lead Source Split</div>
                        <ResponsiveContainer width="100%" height={150}>
                            <PieChart>
                                <Pie
                                    data={channelData.map(c => ({ name: c.name, value: c.leads }))}
                                    cx="50%" cy="50%" innerRadius={30} outerRadius={55}
                                    paddingAngle={3} dataKey="value"
                                >
                                    {channelData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                                </Pie>
                                <Tooltip contentStyle={{ background: '#1a1f35', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#f1f5f9', fontSize: '12px' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}
