import { useEffect, useState } from 'react';
import api from '../../api/client';

const StatusBadge = ({s}) => (
  <span className={
    'badge ' + (s==='COMPLETADO' ? 'text-bg-success' :
                s==='ANULADO' ? 'text-bg-danger' :
                s==='EN_PROCESO' ? 'text-bg-warning' : 'text-bg-secondary')
  }>{s}</span>
);

export default function TransfersManager(){
  const [stores, setStores] = useState([]);
  const [products, setProducts] = useState([]);
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  // form
  const [fromStore, setFromStore] = useState('');
  const [toStore, setToStore] = useState('');
  const [items, setItems] = useState([{ product_id:'', quantity:1 }]);
  const [msg, setMsg] = useState('');

  const loadBase = async () => {
    const s = await api.get('/stores'); setStores(s.data||[]);
    const p = await api.get('/products'); setProducts(p.data||[]);
  };
  const loadTransfers = async () => {
    setLoading(true);
    const r = await api.get('/transfers', { params: status ? { status } : {} });
    setRows(r.data||[]);
    setLoading(false);
  };

  useEffect(()=>{ loadBase(); loadTransfers(); }, []);
  useEffect(()=>{ loadTransfers(); }, [status]);

  const addRow = () => setItems([...items, { product_id:'', quantity:1 }]);
  const rmRow  = (idx) => setItems(items.filter((_,i)=>i!==idx));
  const changeItem = (idx, key, val) => {
    const copy = [...items]; copy[idx] = { ...copy[idx], [key]: val }; setItems(copy);
  };

  const createTransfer = async (e) => {
    e.preventDefault(); setMsg('');
    try{
      if(!fromStore || !toStore) return setMsg('Selecciona tienda origen y destino');
      const clean = items.filter(x=>x.product_id && Number(x.quantity)>0);
      if(!clean.length) return setMsg('Agrega al menos un producto con cantidad > 0');
      await api.post('/transfers', {
        from_store_id: Number(fromStore),
        to_store_id: Number(toStore),
        items: clean.map(x=>({ product_id: Number(x.product_id), quantity: Number(x.quantity) }))
      });
      // reset
      setFromStore(''); setToStore(''); setItems([{ product_id:'', quantity:1 }]);
      await loadTransfers();
    }catch(err){
      setMsg(err.response?.data?.error || 'Error creando traslado');
    }
  };

  const approve = async (id) => { await api.post(`/transfers/${id}/approve`); await loadTransfers(); };
  const cancel  = async (id) => { await api.post(`/transfers/${id}/cancel`);  await loadTransfers(); };

  return (
    <div className="vstack gap-4">

      {/* Filtros y estado */}
      <div className="d-flex flex-wrap gap-2 align-items-end">
        <div>
          <label className="form-label mb-1">Estado</label>
          <select className="form-select" value={status} onChange={e=>setStatus(e.target.value)}>
            <option value="">Todos</option>
            <option value="PENDIENTE">Pendiente</option>
            <option value="EN_PROCESO">En proceso</option>
            <option value="COMPLETADO">Completado</option>
            <option value="ANULADO">Anulado</option>
          </select>
        </div>
        <button className="btn btn-outline-secondary ms-auto" onClick={loadTransfers}>Actualizar</button>
      </div>

      {/* Formulario de creación */}
      <div className="card sleek p-3">
        <h5 className="mb-3">Nuevo traslado</h5>
        {msg && <div className="alert alert-danger py-2">{msg}</div>}
        <form onSubmit={createTransfer} className="vstack gap-3">
          <div className="row g-2">
            <div className="col-md-6">
              <label className="form-label mb-1">Tienda origen</label>
              <select className="form-select" value={fromStore} onChange={e=>setFromStore(e.target.value)}>
                <option value="">Seleccione...</option>
                {stores.map(s=><option key={s.id} value={s.id}>{s.name} — {s.city}</option>)}
              </select>
            </div>
            <div className="col-md-6">
              <label className="form-label mb-1">Tienda destino</label>
              <select className="form-select" value={toStore} onChange={e=>setToStore(e.target.value)}>
                <option value="">Seleccione...</option>
                {stores.map(s=><option key={s.id} value={s.id}>{s.name} — {s.city}</option>)}
              </select>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table align-middle">
              <thead><tr><th>Producto</th><th style={{width:140}}>Cantidad</th><th style={{width:80}}></th></tr></thead>
              <tbody>
                {items.map((it,idx)=>(
                  <tr key={idx}>
                    <td>
                      <select className="form-select" value={it.product_id} onChange={e=>changeItem(idx,'product_id',e.target.value)}>
                        <option value="">Seleccione producto...</option>
                        {products.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </td>
                    <td>
                      <input type="number" className="form-control" min="1" value={it.quantity}
                             onChange={e=>changeItem(idx,'quantity',e.target.value)} />
                    </td>
                    <td className="text-end">
                      <button className="btn btn-sm btn-outline-danger" type="button" onClick={()=>rmRow(idx)} disabled={items.length===1}>Quitar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="d-flex justify-content-between">
            <button className="btn btn-outline-secondary" type="button" onClick={addRow}>+ Agregar línea</button>
            <button className="btn btn-primary" type="submit">Crear traslado</button>
          </div>
        </form>
      </div>

      {/* Listado */}
      <div className="card sleek">
        <div className="table-responsive">
          <table className="table align-middle mb-0">
            <thead>
              <tr>
                <th>#</th><th>Origen</th><th>Destino</th><th>Creado por</th><th>Estado</th><th>Creado</th><th className="text-end">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan="7" className="text-center text-muted">Cargando…</td></tr>}
              {!loading && rows.length===0 && <tr><td colSpan="7" className="text-center text-muted">Sin traslados</td></tr>}
              {rows.map(t=>(
                <tr key={t.id}>
                  <td>{t.id}</td>
                  <td>{t.from_store}</td>
                  <td>{t.to_store}</td>
                  <td>{t.created_by_user || '-'}</td>
                  <td><StatusBadge s={t.status} /></td>
                  <td>{new Date(t.created_at).toLocaleString()}</td>
                  <td className="text-end">
                    <div className="btn-group">
                      <button className="btn btn-sm btn-outline-success" disabled={t.status!=='PENDIENTE'} onClick={()=>approve(t.id)}>Aprobar</button>
                      <button className="btn btn-sm btn-outline-danger"  disabled={t.status!=='PENDIENTE'} onClick={()=>cancel(t.id)}>Anular</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
