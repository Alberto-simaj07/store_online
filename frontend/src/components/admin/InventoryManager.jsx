import { useEffect, useMemo, useState } from 'react';
import api from '../../api/client';

export default function InventoryManager() {
  const [stores, setStores] = useState([]);
  const [storeId, setStoreId] = useState('');
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);

  // modal ajuste
  const [adjustRow, setAdjustRow] = useState(null);
  const [delta, setDelta] = useState(0);
  const [msg, setMsg] = useState('');

  const loadStores = async () => {
    const r = await api.get('/stores');      // ya tienes este endpoint
    setStores(r.data);
    if (r.data?.length && !storeId) setStoreId(String(r.data[0].id));
  };

  const loadInventory = async () => {
    setLoading(true);
    const params = storeId ? { store_id: storeId } : {};
    const r = await api.get('/inventory', { params });
    setRows(r.data);
    setLoading(false);
  };

  useEffect(() => { loadStores(); }, []);
  useEffect(() => { if (storeId) loadInventory(); }, [storeId]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter(x =>
      x.product?.toLowerCase().includes(term) || String(x.product_id).includes(term)
    );
  }, [rows, q]);

  const openAdjust = (row) => {
    setAdjustRow(row);
    setDelta(0);
    setMsg('');
  };

  const doAdjust = async () => {
    try {
      if (!delta || Number.isNaN(Number(delta))) {
        setMsg('Ingrese una cantidad distinta de 0.');
        return;
      }
      await api.put('/inventory/adjust', {
        store_id: adjustRow.store_id,
        product_id: adjustRow.product_id,
        quantity: Number(delta)
      });
      setAdjustRow(null);
      await loadInventory();
    } catch (err) {
      setMsg(err.response?.data?.error || 'Error ajustando stock');
    }
  };

  return (
    <div className="vstack gap-3">
      {/* Filtros */}
      <div className="d-flex flex-wrap gap-2 align-items-center">
        <select className="form-select" style={{maxWidth: 280}}
                value={storeId} onChange={e => setStoreId(e.target.value)}>
          {stores.map(s => <option key={s.id} value={s.id}>{s.name} — {s.city}</option>)}
        </select>

        <input className="form-control" placeholder="Buscar producto…"
               value={q} onChange={e => setQ(e.target.value)} />

        <button className="btn btn-outline-secondary" onClick={loadInventory}>Actualizar</button>
      </div>

      {/* Tabla */}
      <div className="card sleek">
        <div className="table-responsive">
          <table className="table align-middle mb-0">
            <thead>
              <tr>
                <th>ID Prod.</th>
                <th>Producto</th>
                <th className="text-center">Stock</th>
                <th className="text-end">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan="4" className="text-center text-muted">Cargando…</td></tr>}
              {!loading && filtered.length === 0 &&
                <tr><td colSpan="4" className="text-center text-muted">Sin resultados</td></tr>}
              {filtered.map(r => (
                <tr key={`${r.store_id}-${r.product_id}`}>
                  <td>{r.product_id}</td>
                  <td>{r.product}</td>
                  <td className="text-center">
                    <span className={`badge ${r.stock < 10 ? 'text-bg-danger' : 'text-bg-success'}`}>
                      {r.stock}
                    </span>
                  </td>
                  <td className="text-end">
                    <div className="btn-group">
                      <button className="btn btn-sm btn-outline-primary"
                              onClick={() => openAdjust(r)}>Ajustar</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Ajuste */}
      {adjustRow && (
        <div className="modal d-block" tabIndex="-1" onClick={() => setAdjustRow(null)}>
          <div className="modal-dialog" onClick={e => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  Ajustar stock — {adjustRow.product} (Actual: {adjustRow.stock})
                </h5>
                <button className="btn-close" onClick={() => setAdjustRow(null)} />
              </div>
              <div className="modal-body vstack gap-2">
                {msg && <div className="alert alert-danger py-2">{msg}</div>}
                <div className="input-group">
                  <span className="input-group-text">Cantidad</span>
                  <input type="number" className="form-control" value={delta}
                         onChange={e => setDelta(e.target.value)} />
                </div>
                <div className="small text-muted">
                  Use valores positivos para **sumar** y negativos para **restar**.
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setAdjustRow(null)}>Cancelar</button>
                <button className="btn btn-primary" onClick={doAdjust}>Aplicar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
