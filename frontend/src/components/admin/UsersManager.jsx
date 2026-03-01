import { useEffect, useState } from 'react';
import api from '../../api/client';

const DEFAULT_ROLES = [
  { id: 1, name: 'ADMIN' },
  { id: 2, name: 'GERENTE' },
];

export default function UsersManager() {
  const [rows, setRows] = useState([]);
  const [roles, setRoles] = useState(DEFAULT_ROLES);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  // modal crear
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name:'', email:'', password:'', role_id: 2 });

  const load = async () => {
    setLoading(true); setMsg('');
    try {
      const r = await api.get('/users'); // GET /api/users
      setRows(r.data || []);
      // si el backend expone /roles, úsalo para poblar
      try {
        const rr = await api.get('/roles'); // opcional
        if (rr?.data?.length) setRoles(rr.data);
      } catch {}
    } catch (e) {
      setMsg(e.response?.data?.error || 'Error cargando usuarios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = rows.filter(u => {
    const term = q.trim().toLowerCase();
    if (!term) return true;
    return (
      u.name?.toLowerCase().includes(term) ||
      u.email?.toLowerCase().includes(term) ||
      u.role?.toLowerCase().includes(term) ||
      String(u.id).includes(term)
    );
  });

  const openCreate = () => {
    setForm({ name:'', email:'', password:'', role_id: 2 });
    setShowForm(true);
    setMsg('');
  };

  const create = async (e) => {
    e.preventDefault(); setMsg('');
    if (!form.name || !form.email || !form.password) {
      setMsg('Nombre, email y contraseña son requeridos'); return;
    }
    try {
      await api.post('/users', form); // POST /api/users
      setShowForm(false);
      await load();
    } catch (e) {
      setMsg(e.response?.data?.error || 'Error creando usuario');
    }
  };

  const changeRole = async (id, role_id) => {
    await api.put(`/users/${id}/role`, { role_id }); // PUT /api/users/:id/role
    await load();
  };

  const deactivate = async (id) => {
    if (!confirm('¿Desactivar usuario?')) return;
    await api.delete(`/users/${id}`); // DELETE /api/users/:id
    await load();
  };

  return (
    <div className="vstack gap-3">
      <div className="d-flex justify-content-between">
        <div className="d-flex gap-2">
          <input className="form-control" placeholder="Buscar (nombre, email, rol, #ID)"
                 value={q} onChange={e=>setQ(e.target.value)} />
          <button className="btn btn-outline-secondary" onClick={load}>Actualizar</button>
        </div>
        <button className="btn btn-gradient rounded-pill" onClick={openCreate}>+ Nuevo usuario</button>
      </div>

      {msg && <div className="alert alert-danger py-2">{msg}</div>}

      <div className="card sleek">
        <div className="table-responsive">
          <table className="table align-middle mb-0">
            <thead>
              <tr>
                <th>#</th><th>Nombre</th><th>Email</th><th>Rol</th><th className="text-end">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan="5" className="text-center text-muted">Cargando…</td></tr>}
              {!loading && filtered.length===0 &&
                <tr><td colSpan="5" className="text-center text-muted">Sin usuarios</td></tr>}
              {filtered.map(u => (
                <tr key={u.id}>
                  <td>{u.id}</td>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td style={{minWidth:180}}>
                    <select className="form-select"
                            value={u.role_id}
                            onChange={e=>changeRole(u.id, Number(e.target.value))}>
                      {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                  </td>
                  <td className="text-end">
                    <button className="btn btn-sm btn-outline-danger" onClick={()=>deactivate(u.id)}>
                      Desactivar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal crear */}
      {showForm && (
        <div className="modal d-block" tabIndex="-1" onClick={()=>setShowForm(false)}>
          <div className="modal-dialog" onClick={e=>e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Nuevo usuario</h5>
                <button className="btn-close" onClick={()=>setShowForm(false)} />
              </div>
              <form onSubmit={create}>
                <div className="modal-body vstack gap-2">
                  {msg && <div className="alert alert-danger py-2">{msg}</div>}
                  <input className="form-control" placeholder="Nombre"
                         value={form.name} onChange={e=>setForm({...form, name:e.target.value})}/>
                  <input type="email" className="form-control" placeholder="Email"
                         value={form.email} onChange={e=>setForm({...form, email:e.target.value})}/>
                  <input type="password" className="form-control" placeholder="Contraseña"
                         value={form.password} onChange={e=>setForm({...form, password:e.target.value})}/>
                  <select className="form-select"
                          value={form.role_id} onChange={e=>setForm({...form, role_id:Number(e.target.value)})}>
                    {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>
                <div className="modal-footer">
                  <button className="btn btn-secondary" type="button" onClick={()=>setShowForm(false)}>Cancelar</button>
                  <button className="btn btn-primary" type="submit">Crear</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
