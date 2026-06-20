import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Package, AlertTriangle, ScanBarcode, FileDown, Plus,
    ArrowRight, CheckCircle, XCircle, Clock, X, Save, Trash2, Edit,
    Settings, ShoppingCart, Factory
} from 'lucide-react';
import { mrpAlerts, materialPricing } from '../../data/mockData';
import { useToast } from '../../context/ToastContext';
import { useData } from '../../context/DataContext';
import { SupabaseService } from '../../services/SupabaseService';

const statusColors = {
    'In Stock': 'green',
    'Low Stock': 'orange',
    'Critical': 'red',
};

const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, animation: 'fadeIn 0.2s ease'
        }} onClick={onClose}>
            <div style={{
                background: 'var(--bg-card)',
                width: '90%', maxWidth: '600px',
                maxHeight: '85vh', overflowY: 'auto',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-color)',
                boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)',
                padding: '24px', position: 'relative'
            }} onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                    <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{title}</h3>
                    <button onClick={onClose} style={{
                        background: 'none', border: 'none',
                        color: 'var(--text-secondary)', cursor: 'pointer'
                    }}><X size={20} /></button>
                </div>
                {children}
            </div>
        </div>
    );
};

export default function InventoryMRP() {
    const { showToast } = useToast();
    const navigate = useNavigate();
    const {
        inventoryItems,
        vendors, setVendors,
        suppliersList, setSuppliersList,
        products, setProducts,
        isSupabaseConnected,
        setPendingPO
    } = useData();

    const [tab, setTab] = useState('inventory');
    const [vendorTypeTab, setVendorTypeTab] = useState('raw'); // 'raw' or 'finished'
    const [showModal, setShowModal] = useState(null);
    const [editingItem, setEditingItem] = useState(null);

    // Form states
    const [vendorForm, setVendorForm] = useState({ name: '', location: '', leadTime: '', paymentTerms: '', rating: '4.5' }); 
    
    const [productForm, setProductForm] = useState({
        name: '',
        category: 'Spring',
        type: 'Compression',
        material: 'Spring Steel',
        vendorId: '',
        stockQty: 0,
        uom: 'pcs',
        unitCost: 0,
        location: 'Finished Goods A'
    });

    const springTypes = ['Compression', 'Extension', 'Torsion', 'Wave', 'Disc/Belleville'];
    const washerTypes = ['Spring Lock Washer', 'Belleville Washer', 'Wave Washer', 'Curved Washer', 'Conical Washer'];

    const handleMockScan = () => {
        const allItems = [...inventoryItems, ...products.map(p => ({ ...p, lotNumber: p.id, wireGauge: p.type }))];
        if (allItems.length === 0) return;
        const item = allItems[Math.floor(Math.random() * allItems.length)];
        showToast(`Item ${item.lotNumber || item.id} scanned successfully`);
    };

    const handleDeleteProduct = async (id) => {
        setProducts(prev => prev.filter(p => p.id !== id));
        if (isSupabaseConnected) {
            await SupabaseService.deleteProduct(id);
        }
        showToast('Product removed permanently');
    };

    const handleDeleteSupplier = (id) => {
        setSuppliersList(prev => prev.filter(s => s.id !== id));
        showToast('Raw material supplier removed');
    };

    const handleEditProduct = (product) => {
        setEditingItem(product);
        setProductForm({
            name: product.name,
            category: product.category,
            type: product.type,
            material: product.material,
            vendorId: product.vendorId || '',
            stockQty: product.stockQty,
            uom: product.uom,
            unitCost: product.unitCost,
            location: product.location
        });
        setShowModal('product');
    };

    const handleSaveProduct = () => {
        if (!productForm.name) return;
        if (editingItem) {
            setProducts(prev => prev.map(p => p.id === editingItem.id ? { ...productForm, id: p.id } : p));
            showToast('Product updated successfully');
        } else {
            const newId = productForm.category === 'Spring' ? `SP-${Date.now().toString().slice(-4)}` : `WSH-${Date.now().toString().slice(-4)}`;
            const newItem = { ...productForm, id: newId };
            setProducts(prev => [...prev, newItem]);
            showToast(`${productForm.category} added to inventory`);
        }
        setShowModal(null);
        setEditingItem(null);
        setProductForm({ name: '', category: 'Spring', type: 'Compression', material: 'Spring Steel', vendorId: '', stockQty: 0, uom: 'pcs', unitCost: 0, location: 'Finished Goods A' });
    };

    const openVendorModal = (vendor = null) => {
        if (vendor) {
            setVendorForm(vendor);
            setEditingItem(vendor);
        } else {
            setVendorForm({ name: '', location: '', leadTime: '', paymentTerms: '', rating: '4.5' });
            setEditingItem(null);
        }
        setShowModal('vendor');
    };

    const handleSaveVendor = () => {
        if (!vendorForm.name) return;
        if (editingItem) {
            setVendors(prev => prev.map(v => v.id === editingItem.id ? { ...vendorForm, id: v.id } : v));
            showToast('Vendor updated');
        } else {
            const newId = `WVEN-${Date.now().toString().slice(-4)}`;
            setVendors(prev => [...prev, { ...vendorForm, id: newId }]);
            showToast('New vendor added');
        }
        setShowModal(null);
        setEditingItem(null);
    };

    const handleDeleteVendor = async (id) => {
        setVendors(prev => prev.filter(v => v.id !== id));
        if (isSupabaseConnected) await SupabaseService.deleteVendor(id);
        showToast('Vendor removed permanently');
    };

    const handleGeneratePO = (alert) => {
        // Suggested PO is in the format "ID - Name" (e.g., "SUP001 - Tata Steel Wire")
        let vendorName = '';
        if (alert.suggestedPO) {
            const parts = alert.suggestedPO.split(' - ');
            if (parts.length > 1) {
                // Try to find supplier by ID first
                const supId = parts[0].trim();
                const found = suppliersList.find(s => s.id === supId) || vendors.find(v => v.id === supId);
                if (found) {
                    vendorName = found.name;
                } else {
                    vendorName = parts[1].trim();
                }
            } else {
                vendorName = alert.suggestedPO;
            }
        }

        // Try to estimate unit price based on material and supplier
        let unitPriceKg = 90; // Default fallback
        if (alert.material) {
            // Strip out sizing/gauge information (e.g. "Spring Steel 2.0mm" -> "Spring Steel")
            const baseMaterial = alert.material.replace(/\s+\d+(\.\d+)?(mm|")?$/, '').trim();
            const pricing = materialPricing[baseMaterial];
            if (pricing) {
                const supId = alert.suggestedPO ? alert.suggestedPO.split(' - ')[0].trim() : '';
                unitPriceKg = pricing[supId] || pricing.default || 90;
            }
        }

        setPendingPO({
            material: alert.material.replace(/\s+\d+(\.\d+)?(mm|")?$/, '').trim(), // e.g. "Spring Steel"
            qtyKg: alert.shortfall || 100,
            vendorName: vendorName,
            unitPriceKg: unitPriceKg
        });
        showToast('✅ Opening PO Creator...');
        navigate('/purchase-orders');
    };

    const totalRawStock = inventoryItems.reduce((s, i) => s + (parseFloat(i.qtyKg) || 0), 0);
    const totalProducts = products.reduce((s, p) => s + (parseInt(p.stockQty) || 0), 0);

    return (
        <div className="page-content">
            {/* KPIs */}
            <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                <div className="kpi-card green animate-in">
                    <div className="kpi-icon green"><Package size={22} /></div>
                    <div className="kpi-info">
                        <div className="kpi-label">Raw Material</div>
                        <div className="kpi-value">{totalRawStock.toLocaleString('en-IN')} kg</div>
                    </div>
                </div>
                <div className="kpi-card blue animate-in">
                    <div className="kpi-icon blue"><ShoppingCart size={22} /></div>
                    <div className="kpi-info">
                        <div className="kpi-label">Finished Goods</div>
                        <div className="kpi-value">{totalProducts.toLocaleString('en-IN')} pcs</div>
                    </div>
                </div>
                <div className="kpi-card orange animate-in">
                    <div className="kpi-icon orange"><Factory size={22} /></div>
                    <div className="kpi-info">
                        <div className="kpi-label">Active Vendors</div>
                        <div className="kpi-value">{vendors.length + suppliersList.length}</div>
                    </div>
                </div>
                <div className="kpi-card red animate-in">
                    <div className="kpi-icon red"><AlertTriangle size={22} /></div>
                    <div className="kpi-info">
                        <div className="kpi-label">MRP Alerts</div>
                        <div className="kpi-value">{mrpAlerts.length}</div>
                    </div>
                </div>
            </div>

            <div className="tabs">
                <button className={`tab ${tab === 'inventory' ? 'active' : ''}`} onClick={() => setTab('inventory')}>📦 Raw Materials</button>
                <button className={`tab ${tab === 'products' ? 'active' : ''}`} onClick={() => setTab('products')}>⚙️ Finished Products</button>
                <button className={`tab ${tab === 'mrp' ? 'active' : ''}`} onClick={() => setTab('mrp')}>⚡ MRP Alerts</button>
                <button className={`tab ${tab === 'suppliers' ? 'active' : ''}`} onClick={() => setTab('suppliers')}>🏭 Supply Partners</button>
            </div>

            {/* Main Content Blocks */}
            {tab === 'inventory' && (
                <div className="card animate-in">
                    <div className="card-header">
                        <div className="card-title">Wire Spool & Lot Tracking</div>
                        <div className="flex gap-2">
                            <button className="btn btn-secondary btn-sm" onClick={handleMockScan}><ScanBarcode size={12} /> Scan</button>
                        </div>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Lot Number</th>
                                    <th>Material</th>
                                    <th>Gauge</th>
                                    <th>Supplier</th>
                                    <th>Qty (kg)</th>
                                    <th>Location</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {inventoryItems.map(item => (
                                    <tr key={item.id}>
                                        <td style={{ fontWeight: 600 }}>{item.lotNumber}</td>
                                        <td>{item.material}</td>
                                        <td>{item.wireGauge}</td>
                                        <td>{item.supplier}</td>
                                        <td>{item.qtyKg}</td>
                                        <td><span className="badge gray">{item.location}</span></td>
                                        <td><span className={`badge ${statusColors[item.status]}`}>{item.status}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {tab === 'products' && (
                <div className="card animate-in">
                    <div className="card-header">
                        <div className="card-title">Finished Goods Inventory</div>
                        <button className="btn btn-primary btn-sm" onClick={() => setShowModal('product')}><Plus size={12} /> Add Product</button>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Category</th>
                                    <th>Type</th>
                                    <th>Material</th>
                                    <th>Stock</th>
                                    <th>Vendor</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.map(p => (
                                    <tr key={p.id}>
                                        <td style={{ fontWeight: 700 }}>{p.name}</td>
                                        <td>{p.category}</td>
                                        <td>{p.type}</td>
                                        <td>{p.material}</td>
                                        <td>{p.stockQty} {p.uom}</td>
                                        <td>{vendors.find(v => v.id === p.vendorId)?.name || 'In-House'}</td>
                                        <td>
                                            <div className="flex gap-2">
                                                <button className="btn btn-secondary btn-sm" onClick={() => handleEditProduct(p)}><Edit size={12}/></button>
                                                <button className="btn btn-secondary btn-sm" onClick={() => handleDeleteProduct(p.id)}><Trash2 size={12}/></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {tab === 'suppliers' && (
                <div className="animate-in">
                    <div className="flex gap-4" style={{ marginBottom: 20 }}>
                        <div style={{ background: 'var(--bg-card)', padding: '4px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', display: 'flex' }}>
                            <button className={`btn ${vendorTypeTab === 'raw' ? 'btn-primary' : 'btn-secondary'}`} style={{ fontSize: 12, padding: '6px 16px' }} onClick={() => setVendorTypeTab('raw')}>Raw Materials</button>
                            <button className={`btn ${vendorTypeTab === 'finished' ? 'btn-primary' : 'btn-secondary'}`} style={{ fontSize: 12, padding: '6px 16px' }} onClick={() => setVendorTypeTab('finished')}>Finished Goods</button>
                        </div>
                    </div>

                    {vendorTypeTab === 'raw' ? (
                        <div className="card">
                            <div className="card-header">
                                <div className="card-title">Raw Material Suppliers</div>
                                <button className="btn btn-primary btn-sm" onClick={() => showToast('Raw supplier addition coming soon')}><Plus size={12} /> Add Supplier</button>
                            </div>
                            <table className="data-table">
                                <thead><tr><th>Name</th><th>Location</th><th>Materials</th><th>Rating</th><th>Action</th></tr></thead>
                                <tbody>
                                    {suppliersList.map(s => (
                                        <tr key={s.id}>
                                            <td style={{fontWeight: 700}}>{s.name}</td>
                                            <td>{s.location}</td>
                                            <td>{s.materials.join(', ')}</td>
                                            <td>⭐ {s.rating}</td>
                                            <td>
                                                <button className="btn btn-secondary btn-sm" onClick={() => handleDeleteSupplier(s.id)}>
                                                    <Trash2 size={12}/>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="card">
                            <div className="card-header">
                                <div className="card-title">Finished Goods Vendors</div>
                                <button className="btn btn-primary btn-sm" onClick={() => openVendorModal()}><Plus size={12} /> Add Vendor</button>
                            </div>
                            <table className="data-table">
                                <thead><tr><th>Vendor Name</th><th>City</th><th>Lead Time</th><th>Rating</th><th>Action</th></tr></thead>
                                <tbody>
                                    {vendors.map(v => (
                                        <tr key={v.id}>
                                            <td style={{fontWeight: 700}}>{v.name}</td>
                                            <td>{v.location}</td>
                                            <td>{v.leadTime}</td>
                                            <td>⭐ {v.rating}</td>
                                            <td>
                                                <div className="flex gap-2">
                                                    <button className="btn btn-secondary btn-sm" onClick={() => openVendorModal(v)}><Edit size={12}/></button>
                                                    <button className="btn btn-secondary btn-sm" onClick={() => handleDeleteVendor(v.id)}><Trash2 size={12}/></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {tab === 'mrp' && (
                <div className="card animate-in">
                    <div className="card-header"><div className="card-title">MRP Alerts</div></div>
                    <div className="flex flex-col gap-3">
                        {mrpAlerts.map(alert => (
                            <div key={alert.id} className="flex justify-between items-center p-3 border rounded">
                                <div><strong>{alert.material}</strong> - {alert.urgency}</div>
                                <button className="btn btn-primary btn-sm" onClick={() => handleGeneratePO(alert)}>Generate PO</button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Modals */}
            <Modal isOpen={showModal === 'product'} onClose={() => {setShowModal(null); setEditingItem(null);}} title={editingItem ? "Edit Product" : "Add Product"}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div className="form-group" style={{ gridColumn: 'span 2' }}><label>Name</label><input className="form-input" value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})} /></div>
                    <div className="form-group"><label>Category</label><select className="form-select" value={productForm.category} onChange={e => setProductForm({...productForm, category: e.target.value})}><option>Spring</option><option>Washer</option></select></div>
                    <div className="form-group"><label>Type</label><select className="form-select" value={productForm.type} onChange={e => setProductForm({...productForm, type: e.target.value})}>{(productForm.category === 'Spring' ? springTypes : washerTypes).map(t => <option key={t}>{t}</option>)}</select></div>
                    <div className="form-group">
                        <label style={{display:'flex', justifyContent:'space-between'}}>Vendor <button className="btn-link" onClick={() => openVendorModal()}>+ New</button></label>
                        <select className="form-select" value={productForm.vendorId} onChange={e => setProductForm({...productForm, vendorId: e.target.value})}><option value="">In-House</option>{vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}</select>
                    </div>
                    <div className="form-group"><label>Stock</label><input className="form-input" type="number" value={productForm.stockQty} onChange={e => setProductForm({...productForm, stockQty: e.target.value})} /></div>
                </div>
                <div className="flex gap-2 mt-4"><button className="btn btn-secondary flex-1" onClick={() => setShowModal(null)}>Cancel</button><button className="btn btn-primary flex-1" onClick={handleSaveProduct}>Save</button></div>
            </Modal>

            <Modal isOpen={showModal === 'vendor'} onClose={() => {setShowModal(null); setEditingItem(null);}} title={editingItem ? "Edit Vendor" : "Add Vendor"}>
                <div className="flex flex-col gap-4">
                    <div className="form-group"><label>Vendor Name</label><input className="form-input" value={vendorForm.name} onChange={e => setVendorForm({...vendorForm, name: e.target.value})} /></div>
                    <div className="form-group"><label>City</label><input className="form-input" value={vendorForm.location} onChange={e => setVendorForm({...vendorForm, location: e.target.value})} /></div>
                    <div className="form-group"><label>Lead Time</label><input className="form-input" value={vendorForm.leadTime} onChange={e => setVendorForm({...vendorForm, leadTime: e.target.value})} /></div>
                    <div className="flex gap-2"><button className="btn btn-secondary flex-1" onClick={() => setShowModal(null)}>Cancel</button><button className="btn btn-primary flex-1" onClick={handleSaveVendor}>Save Vendor</button></div>
                </div>
            </Modal>
        </div>
    );
}
