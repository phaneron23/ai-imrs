import { useState, useContext, useRef, useEffect } from 'react';
import { Plus, Edit2, Trash2, Eye, CheckCircle2, Loader } from 'lucide-react';
import { DataContext } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import { EmailService } from '../../services/EmailService';
import html2pdf from 'html2pdf.js';

export default function PurchaseOrders() {
    const { 
        purchaseOrders, 
        addPO,
        updatePO, 
        deletePO, 
        updateInventoryItem, 
        addInventoryItem,
        inventoryItems, 
        pendingPO, 
        setPendingPO,
        vendors,
        suppliersList
    } = useContext(DataContext);
    const { showToast } = useToast();
    const [filter, setFilter] = useState('all');
    const [showModal, setShowModal] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [selectedPO, setSelectedPO] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const previewRef = useRef(null);

    const [formData, setFormData] = useState({
        vendorName: '',
        material: '',
        qtyKg: '',
        unitPriceKg: '',
        dueDate: '',
        notes: ''
    });

    // Auto-open modal and pre-fill if pendingPO is set
    useEffect(() => {
        if (pendingPO) {
            setFormData({
                vendorName: pendingPO.vendorName || '',
                material: pendingPO.material || '',
                qtyKg: pendingPO.qtyKg || '',
                unitPriceKg: pendingPO.unitPriceKg || '',
                dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
                notes: ''
            });
            setShowModal(true);
            setPendingPO(null); // Clear pending PO
        }
    }, [pendingPO, setPendingPO]);

    const filteredPOs = purchaseOrders.filter(po => {
        if (filter === 'all') return true;
        return po.status === filter;
    });

    const getStatusColor = (status) => {
        const colors = {
            'Draft': '#94a3b8',
            'Sent': '#3b82f6',
            'Received': '#10b981',
            'Cancelled': '#ef4444'
        };
        return colors[status] || '#94a3b8';
    };

    const handleOpenAddModal = () => {
        setFormData({
            vendorName: '',
            material: '',
            qtyKg: '',
            unitPriceKg: '',
            dueDate: '',
            notes: ''
        });
        setSelectedPO(null);
        setShowModal(true);
    };

    const handleEditPO = (po) => {
        setFormData({
            vendorName: po.vendorName,
            material: po.material,
            qtyKg: po.qtyKg,
            unitPriceKg: po.unitPriceKg,
            dueDate: po.dueDate,
            notes: po.notes || ''
        });
        setSelectedPO(po);
        setShowModal(true);
    };

    const handleSavePO = async () => {
        if (!formData.vendorName || !formData.material || !formData.qtyKg || !formData.unitPriceKg) {
            showToast('⚠️ Please fill all required fields');
            return;
        }

        // Resolve vendorId
        let resolvedVendorId = selectedPO?.vendorId;
        if (!resolvedVendorId) {
            const trimmedName = formData.vendorName.trim().toLowerCase();
            const foundVendor = vendors?.find(v => v.name.trim().toLowerCase() === trimmedName) ||
                                suppliersList?.find(s => s.name.trim().toLowerCase() === trimmedName);
            if (foundVendor) {
                resolvedVendorId = foundVendor.id;
            } else {
                resolvedVendorId = `VEND-${Date.now().toString().slice(-4)}`;
            }
        }

        const poData = {
            ...selectedPO,
            vendorId: resolvedVendorId,
            vendorName: formData.vendorName,
            material: formData.material,
            qtyKg: parseFloat(formData.qtyKg),
            unitPriceKg: parseFloat(formData.unitPriceKg),
            total: parseFloat(formData.qtyKg) * parseFloat(formData.unitPriceKg),
            dueDate: formData.dueDate,
            notes: formData.notes,
            orderDate: selectedPO?.orderDate || new Date().toISOString().split('T')[0],
            status: selectedPO?.status || 'Draft'
        };

        if (!selectedPO) {
            poData.id = `PO-${Date.now()}`;
        }

        try {
            if (selectedPO) {
                await updatePO(poData);
                showToast('✅ PO updated');
            } else {
                await addPO(poData);
                showToast('✅ PO created');
            }
            setShowModal(false);
        } catch (e) {
            showToast('❌ Failed to save PO: ' + e.message);
        }
    };

    const handleDeletePO = async (id) => {
        if (confirm('Are you sure?')) {
            try {
                await deletePO(id);
                showToast('✅ PO deleted');
            } catch {
                showToast('❌ Failed to delete PO');
            }
        }
    };

    const handleMarkReceived = async (po) => {
        if (!confirm(`Mark this PO as received? This will add ${po.qtyKg} kg of ${po.material} to inventory.`)) {
            return;
        }

        setIsProcessing(true);
        try {
            // 1. Find matching inventory item
            const inventoryItem = inventoryItems.find(i => i.material === po.material);
            
            if (inventoryItem) {
                // Update inventory quantity
                const updatedItem = {
                    ...inventoryItem,
                    qtyKg: inventoryItem.qtyKg + po.qtyKg
                };
                await updateInventoryItem(updatedItem);
            } else {
                // Create a new inventory item
                const newItem = {
                    id: `INV-${Date.now()}`,
                    material: po.material,
                    wireGauge: '2.0mm', // default fallback gauge
                    lotNumber: `LOT-${po.vendorId || 'VEND'}-${Date.now().toString().slice(-4)}`,
                    supplier: po.vendorName,
                    supplierId: po.vendorId,
                    qtyKg: po.qtyKg,
                    minQtyKg: 100, // default minQty
                    location: 'General Rack',
                    receivedDate: new Date().toISOString().split('T')[0],
                    expiryDate: null,
                    status: 'In Stock'
                };
                await addInventoryItem(newItem);
            }

            // 2. Update PO status
            await updatePO({
                ...po,
                status: 'Received'
            });

            showToast(`✅ PO marked as received. Inventory updated with ${po.qtyKg} kg of ${po.material}`);
        } catch (e) {
            showToast('❌ Failed to mark PO as received: ' + e.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDownloadPO = () => {
        if (!selectedPO || !previewRef.current) return;
        
        const element = previewRef.current;
        const opt = {
            margin: 10,
            filename: `PO-${selectedPO.id}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
        };
        
        html2pdf().set(opt).from(element).save();
        showToast('📥 PO downloaded');
    };

    const handleEmailPO = async () => {
        if (!selectedPO) return;
        
        setIsProcessing(true);
        try {
            const config = EmailService.getConfig();
            if (!config.smtpHost) {
                showToast('⚠️ SMTP not configured. Go to Settings first.');
                setIsProcessing(false);
                return;
            }

            const emailHtml = generatePOHTML(selectedPO);
            await EmailService.sendEmail(
                '', // Empty for now - user would need to specify
                `Purchase Order ${selectedPO.id}`,
                emailHtml
            );
            showToast('✅ PO emailed');
        } catch (e) {
            showToast('❌ Failed to email PO: ' + e.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const generatePOHTML = (po) => {
        return `
            <div style="font-family: Arial, sans-serif; padding: 20px; background: white;">
                <h1>Purchase Order</h1>
                <p><strong>PO ID:</strong> ${po.id}</p>
                <p><strong>Vendor:</strong> ${po.vendorName}</p>
                <p><strong>Material:</strong> ${po.material}</p>
                <p><strong>Quantity:</strong> ${po.qtyKg} kg</p>
                <p><strong>Unit Price:</strong> ₹${po.unitPriceKg}</p>
                <p><strong>Total:</strong> ₹${po.total.toFixed(2)}</p>
                <p><strong>Order Date:</strong> ${po.orderDate}</p>
                <p><strong>Due Date:</strong> ${po.dueDate}</p>
                <p><strong>Status:</strong> ${po.status}</p>
                ${po.notes ? `<p><strong>Notes:</strong> ${po.notes}</p>` : ''}
            </div>
        `;
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1>Purchase Orders</h1>
                    <p>Manage vendor orders and inventory replenishment</p>
                </div>
                <button onClick={handleOpenAddModal} className="btn-primary">
                    <Plus size={18} /> New PO
                </button>
            </div>

            {/* Filter Tabs */}
            <div className="filter-tabs" style={{ marginBottom: '24px' }}>
                {['all', 'Draft', 'Sent', 'Received', 'Cancelled'].map(status => (
                    <button
                        key={status}
                        onClick={() => setFilter(status)}
                        style={{
                            padding: '8px 16px',
                            borderRadius: '6px',
                            border: 'none',
                            background: filter === status ? 'var(--accent-blue)' : 'var(--bg-secondary)',
                            color: filter === status ? 'white' : 'var(--text-muted)',
                            cursor: 'pointer',
                            fontSize: '14px'
                        }}
                    >
                        {status === 'all' ? 'All' : status}
                    </button>
                ))}
            </div>

            {/* PO List */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '16px' }}>
                {filteredPOs.map(po => (
                    <div key={po.id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '16px' }}>{po.material}</h3>
                                <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '13px' }}>{po.vendorName}</p>
                            </div>
                            <span style={{
                                padding: '6px 12px',
                                borderRadius: '12px',
                                background: getStatusColor(po.status),
                                color: 'white',
                                fontSize: '12px',
                                fontWeight: 600
                            }}>
                                {po.status}
                            </span>
                        </div>

                        <div style={{ flex: 1 }}>
                            <p style={{ margin: '8px 0', fontSize: '13px' }}>
                                <strong>Qty:</strong> {po.qtyKg} kg
                            </p>
                            <p style={{ margin: '8px 0', fontSize: '13px' }}>
                                <strong>Price:</strong> ₹{po.unitPriceKg}/kg
                            </p>
                            <p style={{ margin: '8px 0', fontSize: '13px' }}>
                                <strong>Total:</strong> ₹{po.total.toFixed(2)}
                            </p>
                            <p style={{ margin: '8px 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                                Due: {po.dueDate}
                            </p>
                        </div>

                        <div style={{ display: 'flex', gap: '8px', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border-color)' }}>
                            <button
                                onClick={() => { setSelectedPO(po); setShowPreview(true); }}
                                style={{ flex: 1, padding: '8px', background: 'var(--bg-secondary)', border: 'none', borderRadius: '4px', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '12px' }}
                            >
                                <Eye size={14} style={{ marginRight: '4px' }} /> Preview
                            </button>
                            {po.status !== 'Received' && (
                                <button
                                    onClick={() => handleMarkReceived(po)}
                                    disabled={isProcessing}
                                    style={{ flex: 1, padding: '8px', background: 'var(--accent-green)', border: 'none', borderRadius: '4px', color: 'white', cursor: 'pointer', fontSize: '12px' }}
                                >
                                    <CheckCircle2 size={14} style={{ marginRight: '4px' }} /> Received
                                </button>
                            )}
                            <button
                                onClick={() => handleEditPO(po)}
                                style={{ padding: '8px', background: 'var(--bg-secondary)', border: 'none', borderRadius: '4px', color: 'var(--text-primary)', cursor: 'pointer' }}
                            >
                                <Edit2 size={14} />
                            </button>
                            <button
                                onClick={() => handleDeletePO(po.id)}
                                style={{ padding: '8px', background: 'var(--bg-secondary)', border: 'none', borderRadius: '4px', color: '#ef4444', cursor: 'pointer' }}
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {filteredPOs.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    <p>No purchase orders found</p>
                </div>
            )}

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <h2>{selectedPO ? 'Edit Purchase Order' : 'New Purchase Order'}</h2>
                        <div style={{ display: 'grid', gap: '12px' }}>
                            <input
                                type="text"
                                placeholder="Vendor Name"
                                value={formData.vendorName}
                                onChange={e => setFormData({ ...formData, vendorName: e.target.value })}
                                style={{ padding: '10px', border: '1px solid var(--border-color)', borderRadius: '4px', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                            />
                            <input
                                type="text"
                                placeholder="Material (e.g., Spring Steel)"
                                value={formData.material}
                                onChange={e => setFormData({ ...formData, material: e.target.value })}
                                style={{ padding: '10px', border: '1px solid var(--border-color)', borderRadius: '4px', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                            />
                            <input
                                type="number"
                                placeholder="Quantity (kg)"
                                value={formData.qtyKg}
                                onChange={e => setFormData({ ...formData, qtyKg: e.target.value })}
                                style={{ padding: '10px', border: '1px solid var(--border-color)', borderRadius: '4px', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                            />
                            <input
                                type="number"
                                placeholder="Unit Price (₹/kg)"
                                value={formData.unitPriceKg}
                                onChange={e => setFormData({ ...formData, unitPriceKg: e.target.value })}
                                style={{ padding: '10px', border: '1px solid var(--border-color)', borderRadius: '4px', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                            />
                            <input
                                type="date"
                                value={formData.dueDate}
                                onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                                style={{ padding: '10px', border: '1px solid var(--border-color)', borderRadius: '4px', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                            />
                            <textarea
                                placeholder="Notes (optional)"
                                value={formData.notes}
                                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                style={{ padding: '10px', border: '1px solid var(--border-color)', borderRadius: '4px', background: 'var(--bg-secondary)', color: 'var(--text-primary)', minHeight: '80px', fontFamily: 'inherit' }}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                            <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: '10px', background: 'var(--bg-secondary)', border: 'none', borderRadius: '4px', color: 'var(--text-primary)', cursor: 'pointer' }}>
                                Cancel
                            </button>
                            <button onClick={handleSavePO} style={{ flex: 1, padding: '10px', background: 'var(--accent-blue)', border: 'none', borderRadius: '4px', color: 'white', cursor: 'pointer' }}>
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Preview Modal */}
            {showPreview && selectedPO && (
                <div className="modal-overlay" onClick={() => setShowPreview(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '800px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h2>PO Preview</h2>
                            <button onClick={() => setShowPreview(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '20px' }}>✕</button>
                        </div>

                        <div ref={previewRef} style={{ background: 'white', color: '#000', padding: '40px', borderRadius: '4px', marginBottom: '20px', minHeight: '600px', fontFamily: 'Arial, sans-serif' }}>
                            <div style={{ textAlign: 'center', marginBottom: '30px', borderBottom: '2px solid #000', paddingBottom: '20px' }}>
                                <h1 style={{ margin: '0 0 10px 0', fontSize: '32px' }}>PURCHASE ORDER</h1>
                                <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>Aggarwal Industries Pvt. Ltd.</p>
                            </div>

                            <table style={{ width: '100%', marginBottom: '30px', fontSize: '13px', lineHeight: '1.8' }}>
                                <tbody>
                                    <tr>
                                        <td style={{ fontWeight: 'bold', width: '50%' }}>PO ID: {selectedPO.id}</td>
                                        <td style={{ fontWeight: 'bold' }}>Date: {selectedPO.orderDate}</td>
                                    </tr>
                                    <tr>
                                        <td colspan="2" style={{ paddingTop: '15px' }}>
                                            <strong>Vendor:</strong> {selectedPO.vendorName}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>

                            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', fontSize: '13px' }}>
                                <thead>
                                    <tr style={{ background: '#f0f0f0', borderBottom: '2px solid #000' }}>
                                        <th style={{ padding: '10px', textAlign: 'left' }}>Description</th>
                                        <th style={{ padding: '10px', textAlign: 'right' }}>Quantity</th>
                                        <th style={{ padding: '10px', textAlign: 'right' }}>Unit Price</th>
                                        <th style={{ padding: '10px', textAlign: 'right' }}>Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr style={{ borderBottom: '1px solid #ddd' }}>
                                        <td style={{ padding: '10px' }}>{selectedPO.material}</td>
                                        <td style={{ padding: '10px', textAlign: 'right' }}>{selectedPO.qtyKg} kg</td>
                                        <td style={{ padding: '10px', textAlign: 'right' }}>₹{selectedPO.unitPriceKg}</td>
                                        <td style={{ padding: '10px', textAlign: 'right' }}>₹{selectedPO.total.toFixed(2)}</td>
                                    </tr>
                                </tbody>
                            </table>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '30px' }}>
                                <div style={{ width: '200px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #000', paddingTop: '8px', fontWeight: 'bold', fontSize: '14px' }}>
                                        <span>TOTAL</span>
                                        <span>₹{selectedPO.total.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>

                            <div style={{ marginTop: '40px', paddingTop: '20px', borderTop: '1px solid #ccc', fontSize: '12px', color: '#666' }}>
                                <p><strong>Due Date:</strong> {selectedPO.dueDate}</p>
                                <p><strong>Status:</strong> {selectedPO.status}</p>
                                {selectedPO.notes && <p><strong>Notes:</strong> {selectedPO.notes}</p>}
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button onClick={handleDownloadPO} style={{ flex: 1, padding: '10px', background: 'var(--accent-blue)', border: 'none', borderRadius: '4px', color: 'white', cursor: 'pointer' }}>
                                📥 Download PDF
                            </button>
                            <button onClick={handleEmailPO} disabled={isProcessing} style={{ flex: 1, padding: '10px', background: 'var(--accent-blue)', border: 'none', borderRadius: '4px', color: 'white', cursor: 'pointer' }}>
                                {isProcessing ? <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> : '📧 Email'} Email
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .modal-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.7);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                }
                .modal {
                    background: var(--bg-primary);
                    border: 1px solid var(--border-color);
                    borderRadius: '8px';
                    padding: '24px';
                    maxWidth: '500px';
                    width: '90%';
                    maxHeight: '90vh';
                    overflow: 'auto';
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
