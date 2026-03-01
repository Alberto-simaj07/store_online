import { useEffect, useMemo, useState } from 'react';
import api from '../../api/client';

const fmtQ = (n)=>`Q ${Number(n||0).toFixed(2)}`;
const Badge = ({status}) => (
  <span className={
    'badge ' + (status==='PAGADA' ? 'text-bg-success' :
                status==='ANULADA' ? 'text-bg-danger' : 'text-bg-secondary')
  }>{status}</span>
);

export default function SalesManager(){
  const [stores, setStores]   = useState([]);
  const [storeId, setStoreId] = useState('');
  const [from, setFrom]       = useState('');
  const [to, setTo]           = useState('');
  const [rows, setRows]       = useState([]);
  const [q, setQ]             = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg]         = useState('');

  useEffect(()=>{ (async ()=>{
    try{
      const s = await api.get('/stores'); setStores(s.data||[]);
      // setea por defecto hoy como rango
      const now = new Date();
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth()+1).padStart(2,'0');
      const dd = String(now.getDate()).padStart(2,'0');
      setFrom(`${yyyy}-${mm}-01`);
      setTo(`${yyyy}-${mm}-${dd}`);
    }catch{}
  })(); }, []);

  const load = async ()=>{
    setLoading(true); setMsg('');
    try{
      const params = {};
      if(from && to){ params.from = from; params.to = to; }
      if(storeId){ params.store_id = storeId; }
      const r = await api.get('/sales', { params });
      setRows(r.data||[]);
    }catch(err){
      setMsg(err.response?.data?.error || 'Error cargando ventas');
    }finally{ setLoading(false); }
  };

  useEffect(()=>{ if(from && to) load(); }, [from, to, storeId]);

  const filtered = useMemo(()=>{
    const term = q.trim().toLowerCase();
    if(!term) return rows;
    return rows.filter(r =>
      r.customer?.toLowerCase().includes(term) ||
      r.store?.toLowerCase().includes(term) ||
      String(r.id).includes(term)
    );
  }, [rows, q]);

  const changeStatus = async (id, status)=>{
    try{
      await api.put(`/sales/${id}/status`, { status });
      await load();
    }catch(err){
      alert(err.response?.data?.error || 'No se pudo actualizar el estado');
    }
  };

  return (
    <div className="vstack gap-3">
      {/* Filtros */}
      <div className="d-flex flex-wrap gap-2 align-items-end">
        <div>
          <label className="form-label mb-1">Sucursal</label>
          <select className="form-select" style={{minWidth:260}}
                  value={storeId} onChange={e=>setStoreId(e.target.value)}>
            <option value="">Todas</option>
            {stores.map(s => <option key={s.id} value={s.id}>{s.name} — {s.city}</option>)}
          </select>
        </div>
        <div>
          <label className="form-label mb-1">Desde</label>
          <input type="date" className="form-control" value={from} onChange={e=>setFrom(e.target.value)} />
        </div>
        <div>
          <label className="form-label mb-1">Hasta</label>
          <input type="date" className="form-control" value={to} onChange={e=>setTo(e.target.value)} />
        </div>
        <div className="ms-auto d-flex gap-2">
          <input className="form-control" placeholder="Buscar cliente / sucursal / #ID"
                 value={q} onChange={e=>setQ(e.target.value)} style={{minWidth:280}} />
          <button className="btn btn-outline-secondary" onClick={load}>Actualizar</button>
        </div>
      </div>

      {/* Mensajes */}
      {msg && <div className="alert alert-danger py-2">{msg}</div>}

      {/* Tabla */}
      <div className="card sleek">
        <div className="table-responsive">
          <table className="table align-middle mb-0">
            <thead>
              <tr>
                <th>#</th>
                <th>Cliente</th>
                <th>Sucursal</th>
                <th>Fecha</th>
                <th>Total</th>
                <th>Estado</th>
                <th className="text-end">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan="7" className="text-center text-muted">Cargando…</td></tr>}
              {!loading && filtered.length===0 &&
                <tr><td colSpan="7" className="text-center text-muted">Sin resultados</td></tr>}
              {filtered.map(v => (
                <tr key={v.id}>
                  <td>{v.id}</td>
                  <td>{v.customer}</td>
                  <td>{v.store}</td>
                  <td>{new Date(v.created_at).toLocaleString()}</td>
                  <td>{fmtQ(v.total)}</td>
                  <td><Badge status={v.status} /></td>
                  <td className="text-end">
                    <div className="btn-group">
                      <button className="btn btn-sm btn-outline-success"
                        disabled={v.status==='PAGADA'}
                        onClick={()=>changeStatus(v.id,'PAGADA')}>Marcar pagada</button>
                      <button className="btn btn-sm btn-outline-danger"
                        disabled={v.status==='ANULADA'}
                        onClick={()=>changeStatus(v.id,'ANULADA')}>Anular</button>
                      <button className="btn btn-sm btn-outline-secondary"
                        disabled={v.status==='NUEVA'}
                        onClick={()=>changeStatus(v.id,'NUEVA')}>Revertir</button>
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
