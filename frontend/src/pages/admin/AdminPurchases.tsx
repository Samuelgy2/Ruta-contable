import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { Compra } from '../../types';
import { formatCurrency, formatDateShort } from '../../utils/format';

interface AdminPurchasesProps {
  onNavigate?: (tab: string) => void;
}

export function AdminPurchases({ onNavigate }: AdminPurchasesProps) {
  const { compras, categories, addCompra, updateCompra, deleteCompra } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingCompraId, setEditingCompraId] = useState<string | null>(null);
  const createEmptyForm = () => ({
    concepto: '',
    tipo: '',
    cantidad: '1',
    valorUnitario: '',
    fecha: new Date().toISOString().split('T')[0],
    proveedor: '',
    factura: '',
    categoriaId: '',
    observaciones: '',
  });
  const [form, setForm] = useState(createEmptyForm);

  const filteredCompras = compras
    .filter(c => c.concepto.toLowerCase().includes(searchTerm.toLowerCase()) || 
                 (c.proveedor && c.proveedor.toLowerCase().includes(searchTerm.toLowerCase())))
    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

  const getCategoryName = (categoriaId?: string) => {
    if (!categoriaId) return '-';
    const category = categories.find(c => c.id === categoriaId);
    return category?.name || '-';
  };

  const resetForm = () => {
    setForm(createEmptyForm());
    setEditingCompraId(null);
    setShowForm(false);
  };

  const handleEdit = (compra: Compra) => {
    setForm({
      concepto: compra.concepto,
      tipo: compra.tipo || '',
      cantidad: String(compra.cantidad),
      valorUnitario: String(compra.valorUnitario),
      fecha: compra.fecha,
      proveedor: compra.proveedor || '',
      factura: compra.factura || '',
      categoriaId: compra.categoriaId || '',
      observaciones: compra.observaciones || '',
    });
    setEditingCompraId(compra.id);
    setShowForm(true);
  };

  const handleApprove = (compra: Compra) => {
    if (!window.confirm(`¿Confirmas la aprobación de la compra "${compra.concepto}"?`)) {
      return;
    }

    updateCompra(compra.id, { estadoAprobacion: 'aprobada' });
  };

  const handleUndoApproval = (compra: Compra) => {
    updateCompra(compra.id, { estadoAprobacion: 'pendiente' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.concepto.trim() || !form.valorUnitario || !form.fecha) {
      alert('Por favor completa los campos requeridos');
      return;
    }

    const cantidad = Number(form.cantidad);
    if (!Number.isInteger(cantidad) || cantidad < 1) {
      alert('La cantidad debe ser un número entero mayor que cero');
      return;
    }

    const valorUnitario = parseFloat(form.valorUnitario);
    const valorTotal = valorUnitario * cantidad;
    const compraData = {
      concepto: form.concepto,
      tipo: form.tipo,
      cantidad,
      valorUnitario,
      valorTotal,
      fecha: form.fecha,
      proveedor: form.proveedor || undefined,
      factura: form.factura || undefined,
      categoriaId: form.categoriaId || undefined,
      observaciones: form.observaciones,
    };

    if (editingCompraId) {
      updateCompra(editingCompraId, compraData);
      alert('Compra actualizada correctamente');
    } else {
      addCompra({ ...compraData, createdBy: 'admin' });
      alert('Compra registrada correctamente');
    }

    resetForm();
  };

  // Statistics
  const totalCompras = compras.reduce((sum, c) => sum + c.valorTotal, 0);
  const totalThisMonth = compras
    .filter(c => {
      const fecha = new Date(c.fecha);
      const now = new Date();
      return fecha.getMonth() === now.getMonth() && fecha.getFullYear() === now.getFullYear();
    })
    .reduce((sum, c) => sum + c.valorTotal, 0);

  return (
    <div className="app">
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h3 style={{ margin: 0 }}>Gestión de Compras</h3>
          <button 
            onClick={() => showForm ? resetForm() : setShowForm(true)}
            className="btn btn-primary"
          >
            {showForm ? 'Cancelar' : '+ Nueva Compra'}
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '24px' }}>
          <div className="stat-card">
            <div className="stat-label">Total Compras</div>
            <div className="stat-value" style={{ color: 'red' }}>{formatCurrency(totalCompras, 'COP')}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Compras del Mes</div>
            <div className="stat-value" style={{ color: '#f59e0b' }}>{formatCurrency(totalThisMonth, 'COP')}</div>
          </div>
        </div>

        {showForm && (
          <div className="card" style={{ marginBottom: '24px', padding: '24px' }}>
            <h4>{editingCompraId ? 'Editar Compra' : 'Registrar Compra'}</h4>
            <form onSubmit={handleSubmit} noValidate>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Concepto *</label>
                  <input 
                    type="text" 
                    value={form.concepto}
                    onChange={(e) => setForm({...form, concepto: e.target.value})}
                    className="input"
                    placeholder="Descripción del producto"
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Tipo</label>
                  <select 
                    value={form.tipo}
                    onChange={(e) => setForm({...form, tipo: e.target.value})}
                    className="input"
                  >
                    <option value="">Seleccionar...</option>
                    <option value="Deportivo">Deportivo</option>
                    <option value="Oficina">Oficina</option>
                    <option value="Mantenimiento">Mantenimiento</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Cantidad</label>
                  <input 
                    type="number" 
                    value={form.cantidad}
                    onChange={(e) => setForm({...form, cantidad: e.target.value})}
                    className="input"
                    required
                    min="1"
                    step="1"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Valor Unitario *</label>
                  <input 
                    type="number" 
                    value={form.valorUnitario}
                    onChange={(e) => setForm({...form, valorUnitario: e.target.value})}
                    className="input"
                    placeholder="0"
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Fecha *</label>
                  <input 
                    type="date" 
                    value={form.fecha}
                    onChange={(e) => setForm({...form, fecha: e.target.value})}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Proveedor</label>
                  <input 
                    type="text" 
                    value={form.proveedor}
                    onChange={(e) => setForm({...form, proveedor: e.target.value})}
                    className="input"
                    placeholder="Nombre del proveedor"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Factura</label>
                  <input 
                    type="text" 
                    value={form.factura}
                    onChange={(e) => setForm({...form, factura: e.target.value})}
                    className="input"
                    placeholder="Número de factura"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Categoría</label>
                  <select 
                    value={form.categoriaId}
                    onChange={(e) => setForm({...form, categoriaId: e.target.value})}
                    className="input"
                  >
                    <option value="">Seleccionar...</option>
                    {categories.filter(c => c.type === 'expense').map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Observaciones</label>
                <textarea 
                  value={form.observaciones}
                  onChange={(e) => setForm({...form, observaciones: e.target.value})}
                  className="input"
                  rows={2}
                />
              </div>
              <button type="submit" className="btn btn-primary">
                {editingCompraId ? 'Actualizar Compra' : 'Guardar Compra'}
              </button>
            </form>
          </div>
        )}

        <div style={{ marginBottom: '24px' }}>
          <input 
            type="text" 
            placeholder="Buscar por concepto o proveedor..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input"
            style={{ flex: 1, width: '100%' }}
          />
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Concepto</th>
                <th>Tipo</th>
                <th>Cant.</th>
                <th>Vr. Unitario</th>
                <th>Vr. Total</th>
                <th>Proveedor</th>
                <th>Factura</th>
                <th>Categoría</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredCompras.length === 0 ? (
                <tr>
                  <td colSpan={11} style={{ textAlign: 'center', padding: '32px' }}>
                    No hay compras registradas
                  </td>
                </tr>
              ) : (
                filteredCompras.map((compra) => (
                  <tr key={compra.id}>
                    <td>{formatDateShort(compra.fecha)}</td>
                    <td>{compra.concepto}</td>
                    <td>{compra.tipo || '-'}</td>
                    <td>{compra.cantidad}</td>
                    <td>{formatCurrency(compra.valorUnitario, 'COP')}</td>
                    <td><strong>{formatCurrency(compra.valorTotal, 'COP')}</strong></td>
                    <td>{compra.proveedor || '-'}</td>
                    <td>{compra.factura || '-'}</td>
                    <td>{getCategoryName(compra.categoriaId)}</td>
                    <td>
                      <span className={compra.estadoAprobacion === 'aprobada' ? 'badge-success' : 'badge-warning'}>
                        {compra.estadoAprobacion === 'aprobada' ? 'Aprobada' : 'Pendiente'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => handleEdit(compra)}
                        >
                          Editar
                        </button>
                        {compra.estadoAprobacion === 'aprobada' ? (
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => handleUndoApproval(compra)}
                          >
                            Deshacer aprobación
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="btn btn-primary"
                            onClick={() => handleApprove(compra)}
                          >
                            Aprobar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
