import { useState } from 'react';
import { Plus, Phone, Mail, Calendar, ExternalLink, X, Trash2 } from 'lucide-react';
import { pipelineStages } from '../../data/mockData';
import { useData } from '../../context/DataContext';

const stageColors = {
    'New Lead': '#f97316',
    'Specs Received': '#ea580c',
    'Quoted': '#f59e0b',
    'Sample Sent': '#c084fc',
    'Approved': '#fbbf24',
    'In Production': '#22c55e',
};

const formatCurrency = (v) => `₹${(v / 1000).toFixed(0)}K`;

import { useToast } from '../../context/ToastContext';

export default function SalesPipeline() {
    const { showToast } = useToast();
    const { allLeads, addLead, updateLead, deleteLead } = useData();
    const [selectedLead, setSelectedLead] = useState(null);
    const [showAddLead, setShowAddLead] = useState(false);
    const [formData, setFormData] = useState({
        company: '',
        contact: '',
        phone: '',
        email: '',
        product: '',
        qty: '',
        value: '',
        source: 'Direct Outbound',
        assignedTo: 'Vikram S.',
        notes: '',
    });

    const totalPipeline = allLeads.reduce((sum, l) => sum + l.value, 0);

    const handleAddLead = (e) => {
        e.preventDefault();
        if (!formData.company || !formData.contact || !formData.email || !formData.product || !formData.qty || !formData.value) {
            showToast("Please fill in all required fields");
            return;
        }

        const newLead = {
            id: `L${String(allLeads.length + 1).padStart(3, '0')}`,
            company: formData.company,
            contact: formData.contact,
            phone: formData.phone,
            email: formData.email,
            stage: 'New Lead',
            product: formData.product,
            qty: parseInt(formData.qty),
            value: parseInt(formData.value),
            source: formData.source,
            assignedTo: formData.assignedTo,
            lastActivity: new Date().toISOString().split('T')[0],
            notes: formData.notes,
        };

        addLead(newLead);

        setFormData({
            company: '',
            contact: '',
            phone: '',
            email: '',
            product: '',
            qty: '',
            value: '',
            source: 'Direct Outbound',
            assignedTo: 'Vikram S.',
            notes: '',
        });

        setShowAddLead(false);
        showToast(`✅ New lead "${formData.company}" added successfully!`);
    };

    const handleMoveStage = (lead) => {
        const currentStageIndex = pipelineStages.indexOf(lead.stage);
        if (currentStageIndex < pipelineStages.length - 1) {
            const nextStage = pipelineStages[currentStageIndex + 1];
            updateLeadStage(lead.id, nextStage, lead.company);
        } else {
            showToast("🎉 Lead is already in the final stage!");
        }
    };

    const updateLeadStage = (leadId, newStage, company) => {
        const lead = allLeads.find(l => l.id === leadId);
        if (lead) {
            const updatedLead = { ...lead, stage: newStage, lastActivity: new Date().toISOString().split('T')[0] };
            updateLead(updatedLead);
            if (selectedLead && selectedLead.id === leadId) {
                setSelectedLead(updatedLead);
            }
            showToast(`✅ ${company} moved to "${newStage}"`);
        }
    };

    const handleDragStart = (e, lead) => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('leadId', lead.id);
        e.dataTransfer.setData('leadCompany', lead.company);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDropOnStage = (e, stage) => {
        e.preventDefault();
        const leadId = e.dataTransfer.getData('leadId');
        const leadCompany = e.dataTransfer.getData('leadCompany');
        updateLeadStage(leadId, stage, leadCompany);
    };

    return (
        <div className="page-content">
            {/* Pipeline Summary */}
            <div className="flex items-center justify-between" style={{ marginBottom: 20 }}>
                <div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Total Pipeline Value</div>
                    <div style={{ fontSize: 28, fontWeight: 800, background: 'linear-gradient(135deg, #f97316, #fbbf24)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        ₹{(totalPipeline / 100000).toFixed(1)} Lakhs
                    </div>
                </div>
                <button className="btn btn-primary" onClick={() => setShowAddLead(true)}>
                    <Plus size={16} /> Add Lead
                </button>
            </div>

            {/* Kanban Board */}
            <div className="kanban-board">
                {pipelineStages.map(stage => {
                    const stageLeads = allLeads.filter(l => l.stage === stage);
                    const stageValue = stageLeads.reduce((sum, l) => sum + l.value, 0);
                    return (
                        <div
                            className="kanban-column"
                            key={stage}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDropOnStage(e, stage)}
                            style={{ minHeight: 600 }}
                        >
                            <div className="kanban-column-header">
                                <div className="kanban-column-title">
                                    <span style={{
                                        width: 8, height: 8, borderRadius: '50%',
                                        background: stageColors[stage], display: 'inline-block'
                                    }}></span>
                                    {stage}
                                    <span className="kanban-count">{stageLeads.length}</span>
                                </div>
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8, paddingLeft: 4 }}>
                                {formatCurrency(stageValue)}
                            </div>
                            <div className="kanban-cards">
                                {stageLeads.map(lead => (
                                    <div
                                        className="kanban-card"
                                        key={lead.id}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, lead)}
                                        onClick={() => setSelectedLead(lead)}
                                        style={{
                                            borderLeft: `3px solid ${stageColors[stage]}`,
                                            cursor: 'grab',
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.cursor = 'grab'}
                                    >
                                        <div className="kanban-card-title">{lead.company}</div>
                                        <div className="kanban-card-subtitle">{lead.product}</div>
                                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>
                                            {lead.contact} • {lead.assignedTo}
                                        </div>
                                        <div className="kanban-card-meta">
                                            <span className="badge gray" style={{ fontSize: 10 }}>{lead.source}</span>
                                            <span className="kanban-card-value">₹{(lead.value / 1000).toFixed(0)}K</span>
                                        </div>
                                        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 6 }}>
                                            Qty: {lead.qty.toLocaleString('en-IN')}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Lead Detail Modal */}
            {selectedLead && (
                <div
                    style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999,
                        background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        backdropFilter: 'blur(4px)'
                    }}
                    onClick={() => setSelectedLead(null)}
                >
                    <div
                        className="card"
                        style={{ width: 500, maxHeight: '80vh', overflow: 'auto', animation: 'slideUp 0.3s ease' }}
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
                            <div>
                                <h3 style={{ fontSize: 18, fontWeight: 700 }}>{selectedLead.company}</h3>
                                <span className="badge" style={{
                                    background: `${stageColors[selectedLead.stage]}22`,
                                    color: stageColors[selectedLead.stage],
                                    marginTop: 4
                                }}>
                                    <span className="badge-dot"></span>
                                    {selectedLead.stage}
                                </span>
                            </div>
                            <button className="btn-icon" onClick={() => setSelectedLead(null)}>✕</button>
                        </div>

                        <div className="divider"></div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                            <div>
                                <div className="text-xs text-muted">Contact</div>
                                <div style={{ fontSize: 13, fontWeight: 600 }}>{selectedLead.contact}</div>
                            </div>
                            <div>
                                <div className="text-xs text-muted">Product</div>
                                <div style={{ fontSize: 13, fontWeight: 600 }}>{selectedLead.product}</div>
                            </div>
                            <div>
                                <div className="text-xs text-muted">Quantity</div>
                                <div style={{ fontSize: 13, fontWeight: 600 }}>{selectedLead.qty.toLocaleString('en-IN')}</div>
                            </div>
                            <div>
                                <div className="text-xs text-muted">Deal Value</div>
                                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-green)' }}>₹{selectedLead.value.toLocaleString('en-IN')}</div>
                            </div>
                            <div>
                                <div className="text-xs text-muted">Source</div>
                                <div style={{ fontSize: 13 }}>{selectedLead.source}</div>
                            </div>
                            <div>
                                <div className="text-xs text-muted">Assigned To</div>
                                <div style={{ fontSize: 13 }}>{selectedLead.assignedTo}</div>
                            </div>
                        </div>

                        <div style={{ background: 'var(--bg-secondary)', padding: 12, borderRadius: 'var(--radius-sm)', marginBottom: 12 }}>
                            <div className="text-xs text-muted" style={{ marginBottom: 4 }}>Notes</div>
                            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{selectedLead.notes}</div>
                        </div>

                        <div className="flex gap-2">
                            <button className="btn btn-secondary btn-sm" onClick={() => showToast(`Initiating call to ${selectedLead.contact}...`)}><Phone size={12} /> Call</button>
                            <button className="btn btn-secondary btn-sm" onClick={() => showToast(`Opening email client for ${selectedLead.contact}...`)}><Mail size={12} /> Email</button>
                            <button className="btn btn-sm" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', marginLeft: 'auto' }} onClick={async () => {
                                const idToDelete = selectedLead.id;
                                deleteLead(idToDelete);
                                setSelectedLead(null);
                                showToast(`Lead "${selectedLead.company}" deleted permanently`);
                            }}><Trash2 size={12} /> Delete</button>
                            <button className="btn btn-primary btn-sm" onClick={() => handleMoveStage(selectedLead)}>Move Stage →</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Lead Modal */}
            {showAddLead && (
                <div
                    style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999,
                        background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        backdropFilter: 'blur(4px)'
                    }}
                    onClick={() => setShowAddLead(false)}
                >
                    <div
                        className="card"
                        style={{ width: 550, maxHeight: '90vh', overflow: 'auto', animation: 'slideUp 0.3s ease' }}
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between" style={{ marginBottom: 20 }}>
                            <h3 style={{ fontSize: 20, fontWeight: 700 }}>Add New Lead</h3>
                            <button className="btn-icon" onClick={() => setShowAddLead(false)}>
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleAddLead}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4, color: 'var(--text-muted)' }}>
                                        Company Name *
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g., Bosch India"
                                        value={formData.company}
                                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                                        style={{
                                            width: '100%', padding: '8px 10px', fontSize: 13, border: '1px solid var(--border-color)',
                                            borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', boxSizing: 'border-box'
                                        }}
                                        required
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4, color: 'var(--text-muted)' }}>
                                        Contact Person *
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g., Rajesh Mehta"
                                        value={formData.contact}
                                        onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                                        style={{
                                            width: '100%', padding: '8px 10px', fontSize: 13, border: '1px solid var(--border-color)',
                                            borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', boxSizing: 'border-box'
                                        }}
                                        required
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4, color: 'var(--text-muted)' }}>
                                        Phone
                                    </label>
                                    <input
                                        type="tel"
                                        placeholder="+91 98765 43210"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        style={{
                                            width: '100%', padding: '8px 10px', fontSize: 13, border: '1px solid var(--border-color)',
                                            borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', boxSizing: 'border-box'
                                        }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4, color: 'var(--text-muted)' }}>
                                        Email *
                                    </label>
                                    <input
                                        type="email"
                                        placeholder="contact@company.com"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        style={{
                                            width: '100%', padding: '8px 10px', fontSize: 13, border: '1px solid var(--border-color)',
                                            borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', boxSizing: 'border-box'
                                        }}
                                        required
                                    />
                                </div>
                                <div style={{ gridColumn: '1 / -1' }}>
                                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4, color: 'var(--text-muted)' }}>
                                        Product/Service *
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g., Compression Springs 2.5mm"
                                        value={formData.product}
                                        onChange={(e) => setFormData({ ...formData, product: e.target.value })}
                                        style={{
                                            width: '100%', padding: '8px 10px', fontSize: 13, border: '1px solid var(--border-color)',
                                            borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', boxSizing: 'border-box'
                                        }}
                                        required
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4, color: 'var(--text-muted)' }}>
                                        Quantity *
                                    </label>
                                    <input
                                        type="number"
                                        placeholder="50000"
                                        value={formData.qty}
                                        onChange={(e) => setFormData({ ...formData, qty: e.target.value })}
                                        style={{
                                            width: '100%', padding: '8px 10px', fontSize: 13, border: '1px solid var(--border-color)',
                                            borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', boxSizing: 'border-box'
                                        }}
                                        required
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4, color: 'var(--text-muted)' }}>
                                        Deal Value (₹) *
                                    </label>
                                    <input
                                        type="number"
                                        placeholder="425000"
                                        value={formData.value}
                                        onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                                        style={{
                                            width: '100%', padding: '8px 10px', fontSize: 13, border: '1px solid var(--border-color)',
                                            borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', boxSizing: 'border-box'
                                        }}
                                        required
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4, color: 'var(--text-muted)' }}>
                                        Source
                                    </label>
                                    <select
                                        value={formData.source}
                                        onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                                        style={{
                                            width: '100%', padding: '8px 10px', fontSize: 13, border: '1px solid var(--border-color)',
                                            borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', boxSizing: 'border-box'
                                        }}
                                    >
                                        <option>Trade Show</option>
                                        <option>Google Ads</option>
                                        <option>LinkedIn</option>
                                        <option>Direct Outbound</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4, color: 'var(--text-muted)' }}>
                                        Assign To
                                    </label>
                                    <select
                                        value={formData.assignedTo}
                                        onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                                        style={{
                                            width: '100%', padding: '8px 10px', fontSize: 13, border: '1px solid var(--border-color)',
                                            borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', boxSizing: 'border-box'
                                        }}
                                    >
                                        <option>Vikram S.</option>
                                        <option>Priya K.</option>
                                    </select>
                                </div>
                                <div style={{ gridColumn: '1 / -1' }}>
                                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4, color: 'var(--text-muted)' }}>
                                        Notes
                                    </label>
                                    <textarea
                                        placeholder="Any additional notes about this lead..."
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        style={{
                                            width: '100%', padding: '8px 10px', fontSize: 13, border: '1px solid var(--border-color)',
                                            borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', boxSizing: 'border-box',
                                            minHeight: 80, fontFamily: 'inherit'
                                        }}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-2" style={{ marginTop: 20 }}>
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setShowAddLead(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    style={{ marginLeft: 'auto' }}
                                >
                                    <Plus size={14} /> Create Lead
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
