import {
    IndianRupee, ShoppingCart, Gauge, AlertTriangle,
    TrendingUp, Target, ArrowUpRight, ArrowDownRight, Activity, Database, Cloud, ExternalLink
} from 'lucide-react';
import {
    AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell
} from 'recharts';
import {
    dashboardKPIs, revenueData, productionData, orders,
    mrpAlerts
} from '../../data/mockData';
import { useState } from 'react';
import { useData } from '../../context/DataContext';

const formatCurrency = (v) => `₹${(v / 100000).toFixed(1)}L`;
const formatNumber = (v) => v.toLocaleString('en-IN');

const COLORS = ['#f97316', '#fbbf24', '#22c55e', '#ea580c', '#ef4444', '#c084fc'];

const leadsBySource = [
    { name: 'Trade Show', value: 3 },
    { name: 'Google Ads', value: 3 },
    { name: 'LinkedIn', value: 2 },
    { name: 'Direct', value: 2 },
];

import { useToast } from '../../context/ToastContext';

export default function Dashboard() {
    const { showToast } = useToast();
    const { allLeads, inventoryItems, isSupabaseConnected, connectSupabase } = useData();
    const [sbUrl, setSbUrl] = useState('');
    const [sbKey, setSbKey] = useState('');
    const [showInstructions, setShowInstructions] = useState(false);

    // Dynamic KPI calculations
    const activePipelineValue = allLeads.reduce((sum, l) => sum + l.value, 0);
    const criticalInventory = inventoryItems.filter(i => i.status === 'Critical').length;

    const kpis = [
        { label: 'Monthly Revenue', value: formatCurrency(dashboardKPIs.monthlyRevenue), change: `+${dashboardKPIs.revenueChange}%`, up: true, icon: IndianRupee, color: 'green' },
        { label: 'Active Orders', value: dashboardKPIs.activeOrders, change: '+2 this week', up: true, icon: ShoppingCart, color: 'blue' },
        { label: 'Machine Utilization', value: `${dashboardKPIs.machineUtilization}%`, change: '-3% vs last month', up: false, icon: Gauge, color: 'cyan' },
        { label: 'Inventory Alerts', value: criticalInventory, change: `${criticalInventory} critical`, up: criticalInventory === 0, icon: AlertTriangle, color: criticalInventory > 0 ? 'red' : 'green' },
        { label: 'Pipeline Value', value: formatCurrency(activePipelineValue), change: `${allLeads.length} leads`, up: true, icon: Target, color: 'purple' },
        { label: 'QC Pass Rate', value: `${dashboardKPIs.qualityPassRate}%`, change: 'Below target', up: false, icon: Activity, color: 'orange' },
    ];

    return (
        <div className="page-content">
            {/* KPI Cards */}
            <div className="kpi-grid">
                {kpis.map((kpi, i) => (
                    <div className={`kpi-card ${kpi.color} animate-in`} key={i}>
                        <div className={`kpi-icon ${kpi.color}`}>
                            <kpi.icon size={22} />
                        </div>
                        <div className="kpi-info">
                            <div className="kpi-label">{kpi.label}</div>
                            <div className="kpi-value">{kpi.value}</div>
                            <div className={`kpi-change ${kpi.up ? 'up' : 'down'}`}>
                                {kpi.up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                                {kpi.change}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Revenue & Production Charts */}
            <div className="grid-2">
                <div className="card animate-in">
                    <div className="card-header">
                        <div>
                            <div className="card-title">Revenue vs Target</div>
                            <div className="card-subtitle">Last 6 months (₹ in Lakhs)</div>
                        </div>
                        <span className="badge green"><TrendingUp size={12} /> Growth</span>
                    </div>
                    <ResponsiveContainer width="100%" height={260}>
                        <AreaChart data={revenueData}>
                            <defs>
                                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#f97316" stopOpacity={0.3} />
                                    <stop offset="100%" stopColor="#f97316" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="targetGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#fbbf24" stopOpacity={0.15} />
                                    <stop offset="100%" stopColor="#fbbf24" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={v => `${(v / 100000).toFixed(0)}L`} />
                            <Tooltip
                                contentStyle={{ background: '#1a1f35', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#f1f5f9', fontSize: '12px' }}
                                formatter={(v) => [`₹${(v / 100000).toFixed(1)}L`, '']}
                            />
                            <Area type="monotone" dataKey="target" stroke="#fbbf24" strokeWidth={2} strokeDasharray="5 5" fill="url(#targetGrad)" name="Target" />
                            <Area type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={2.5} fill="url(#revGrad)" name="Revenue" />
                            <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                <div className="card animate-in">
                    <div className="card-header">
                        <div>
                            <div className="card-title">Production Volume</div>
                            <div className="card-subtitle">Springs vs Washers (units)</div>
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={productionData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={v => `${(v / 1000)}K`} />
                            <Tooltip
                                contentStyle={{ background: '#1a1f35', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#f1f5f9', fontSize: '12px' }}
                                formatter={(v) => [formatNumber(v), '']}
                            />
                            <Bar dataKey="springs" fill="#f97316" radius={[4, 4, 0, 0]} name="Springs" />
                            <Bar dataKey="washers" fill="#fbbf24" radius={[4, 4, 0, 0]} name="Washers" />
                            <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Bottom Row: Active Orders + Alerts */}
            <div className="grid-7-3">
                <div className="card animate-in">
                    <div className="card-header">
                        <div className="card-title">Active Orders</div>
                        <span className="badge blue">{orders.filter(o => o.status === 'In Production').length} in production</span>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Order ID</th>
                                    <th>Customer</th>
                                    <th>Product</th>
                                    <th>Qty</th>
                                    <th>Value</th>
                                    <th>Progress</th>
                                    <th>Due</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.filter(o => o.status !== 'Completed').map(order => (
                                    <tr key={order.id}>
                                        <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{order.id}</td>
                                        <td>{order.customer}</td>
                                        <td>{order.product}</td>
                                        <td>{formatNumber(order.qty)}</td>
                                        <td style={{ color: 'var(--accent-green)' }}>₹{formatNumber(order.total)}</td>
                                        <td style={{ minWidth: 120 }}>
                                            <div className="flex items-center gap-2">
                                                <div className="progress-bar" style={{ flex: 1 }}>
                                                    <div className={`progress-fill ${order.progress > 50 ? 'green' : order.progress > 0 ? 'orange' : ''}`} style={{ width: `${order.progress}%` }}></div>
                                                </div>
                                                <span className="text-xs text-muted">{order.progress}%</span>
                                            </div>
                                        </td>
                                        <td>{order.dueDate}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="card animate-in">
                    <div className="card-header">
                        <div className="card-title">Cloud Database</div>
                        {!isSupabaseConnected ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
                                <p style={{ fontSize: 12, opacity: 0.7, margin: 0 }}>
                                    Connect Supabase for permanent cloud storage on Vercel. 
                                    <button onClick={() => setShowInstructions(!showInstructions)} 
                                            style={{ color: 'var(--accent-blue)', background: 'none', border: 'none', cursor: 'pointer', marginLeft: 4 }}>
                                        How to set up?
                                    </button>
                                </p>
                                {showInstructions && (
                                    <div style={{ padding: 12, background: 'rgba(255,255,255,0.05)', borderRadius: 8, fontSize: 11 }}>
                                        1. Create free project at <a href="https://supabase.com" target="_blank" style={{ color: 'var(--accent-blue)' }}>supabase.com</a><br/>
                                        2. In SQL Editor, run: <code style={{ color: 'var(--accent-green)' }}>CREATE TABLE app_state (id TEXT PRIMARY KEY, data JSONB, updated_at TIMESTAMPTZ);</code><br/>
                                        3. Paste URL & Anon Key below.
                                    </div>
                                )}
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        placeholder="Supabase URL" 
                                        className="input" 
                                        style={{ fontSize: 11, padding: '4px 8px', flex: 1, height: 28 }}
                                        value={sbUrl}
                                        onChange={(e) => setSbUrl(e.target.value)}
                                    />
                                    <input 
                                        type="password" 
                                        placeholder="Anon Key" 
                                        className="input" 
                                        style={{ fontSize: 11, padding: '4px 8px', flex: 1, height: 28 }}
                                        value={sbKey}
                                        onChange={(e) => setSbKey(e.target.value)}
                                    />
                                    <button className="btn btn-sm btn-primary" onClick={() => {
                                        if (sbUrl.includes('.supabase.co') && sbKey.length > 20) {
                                            connectSupabase(sbUrl, sbKey);
                                            showToast('Connecting to Supabase...');
                                        } else {
                                            showToast('Please enter valid Supabase credentials.');
                                        }
                                    }}>Connect</button>
                                </div>
                            </div>
                        ) : (
                            <div style={{ color: 'var(--accent-green)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 500 }}>
                                <Cloud size={14} /> Cloud Active (Permanent)
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col gap-3">
                        {mrpAlerts.map(alert => (
                            <div key={alert.id} style={{
                                padding: '12px',
                                background: alert.urgency === 'Critical' ? 'rgba(239,68,68,0.08)' : 'rgba(245,158,11,0.06)',
                                border: `1px solid ${alert.urgency === 'Critical' ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.15)'}`,
                                borderRadius: 'var(--radius-sm)'
                            }}>
                                <div className="flex items-center gap-2 mb-1" style={{ marginBottom: 4 }}>
                                    <AlertTriangle size={14} color={alert.urgency === 'Critical' ? '#ef4444' : '#f59e0b'} />
                                    <span style={{ fontSize: 12, fontWeight: 700, color: alert.urgency === 'Critical' ? '#ef4444' : '#f59e0b' }}>{alert.urgency}</span>
                                </div>
                                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>
                                    <strong>{alert.material}</strong> — shortfall of {alert.shortfall} kg
                                </div>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                    Required for: {alert.requiredFor}
                                </div>
                                {alert.autoGenerated && (
                                    <button className="btn btn-sm btn-primary" style={{ marginTop: 8 }} onClick={() => showToast(`PO generated for ${alert.material} (${alert.shortfall}kg)`)}>
                                        Auto-Generate PO
                                    </button>
                                )}
                            </div>
                        ))}

                        {/* Lead Source Pie */}
                        <div style={{ marginTop: 8 }}>
                            <div className="card-title" style={{ fontSize: 13, marginBottom: 8 }}>Lead Sources</div>
                            <ResponsiveContainer width="100%" height={140}>
                                <PieChart>
                                    <Pie data={leadsBySource} cx="50%" cy="50%" innerRadius={35} outerRadius={55} paddingAngle={4} dataKey="value">
                                        {leadsBySource.map((_, i) => (
                                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ background: '#1a1f35', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#f1f5f9', fontSize: '12px' }} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="flex gap-2" style={{ flexWrap: 'wrap', justifyContent: 'center' }}>
                                {leadsBySource.map((s, i) => (
                                    <span key={s.name} style={{ fontSize: 10, color: COLORS[i], fontWeight: 600 }}>● {s.name}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
