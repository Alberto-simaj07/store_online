import { useEffect, useState } from 'react';
import api from '../../api/client';

export default function LogsViewer(){
  const [users, setUsers] = useState([]);
  const [stores, setStores] = useState([]);
  const [rows, setRows] = useState([]);

  const [userId, setUserId] = useState('');
  const [entity, setEntity] = useState('');
  const [storeId, setStoreId] = useState('');

  const [loading, setLoading] = useState(false);

  const loadFilters = async ()=>{
    try{
      // Usuarios y tiendas para selects (re-uso endpoints existentes)
      const u = await api.get('/api/users-list-not-implemented'); // placeholder si no tienes endpoint
      // Si no tienes endpoint de usuarios, puedes borrarlo y dejar solo stores.
    }catch{}
    try{ setStores((await api.get('/stores')).data||[]); }catch{}
  };

  const load = async ()=>{
    setLoading(true);
    const params = {};
    if(userId) params.user_id = userId;
    if(entity) params.entity = entity;
    if(storeId) params.store_id = storeId;
    const r = await api.get('/logs', { params });
    setRows(r.data||[]);
    setLoading(false);
  };

  useEffect(()=>{ loadFilters(); load(); }, []);
  useEffect(()=>{ load(); }, [userId, entity, storeId]);

  const uniqueUsers = Array.from(new Set(rows.map(r=>`${r.user_id}|${r.user_name}`)))
    .map(s=>({ id: s.split('|')[0], name: s.split('|')[1] }));
  const entities = Array.from(new Set(rows.map(r=>r.entity))).filter(Boolean);

  return (
    <div className="vstack gap-3">
      <div className="d-flex flex-wrap gap-2">
        <select className="form-select" style={{maxWidth:260}} value={userId} onChange={e=>setUserId(e.target.value)}>
          <option value="">Todos los usuarios</option>
          {uniqueUsers.map(u=> <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>

        <select className="form-select" style={{maxWidth:220}} value={entity} onChange={e=>setEntity(e.target.value)}>
          <option value="">Todas las entidades</option>
          {entities.map(en=> <option key={en} value={en}>{en}</option>)}
        </select>

        <select className="form-select" style={{maxWidth:280}} value={storeId} onChange={e=>setStoreId(e.target.value)}>
          <option value="">Todas las sucursales</option>
          {stores.map(s=> <option key={s.id} value={s.id}>{s.name} — {s.city}</option>)}
        </select>

        <button className="btn btn-outline-secondary ms-auto" onClick={load}>Actualizar</button>
      </div>

      <div className="card sleek">
        <div className="table-responsive">
          <table className="table align-middle mb-0">
            <thead>
              <tr>
                <th>Fecha/Hora</th>
                <th>Usuario</th>
                <th>Acción</th>
                <th>Entidad</th>
                <th>ID Entidad</th>
                <th>Sucursal</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan="6" className="text-center text-muted">Cargando…</td></tr>}
              {!loading && rows.length===0 && <tr><td colSpan="6" className="text-center text-muted">Sin registros</td></tr>}
              {rows.map(l=>(
                <tr key={l.id}>
                  <td>{new Date(l.created_at).toLocaleString()}</td>
                  <td>{l.user_name}</td>
                  <td>{l.action}</td>
                  <td>{l.entity}</td>
                  <td>{l.entity_id}</td>
                  <td>{l.store_id || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
