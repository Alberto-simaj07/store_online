import { useEffect, useMemo, useState } from 'react';
import api from '../../api/client';

const emptyForm = { id:null, sku:'', name:'', description:'', category_id:'', price:'', is_active:1 };

export default function ProductsManager(){
  const [list, setList] = useState([]);
  const [cats, setCats] = useState([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [uploadFor, setUploadFor] = useState(null);
  const [file, setFile] = useState(null);
  const [msg, setMsg] = useState('');

  const load = async () => {
    setLoading(true);
    const r = await api.get('/products', { params: q ? { q } : {} });
    setList(r.data);
    // categorías (tomadas del backend directo)
    // TIP: si no tienes endpoint, puedes hardcodear IDs o consultarlas por SQL.
    try {
      const c = await api.get('/stores'); // usamos stores sólo para "ping" de que hay conexión
      if (c) setCats([{id:1,name:'Laptops'},{id:2,name:'Cámaras'},{id:3,name:'Celulares'},{id:4,name:'Smartwatch'},{id:5,name:'Accesorios'}]);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(()=>{ load(); }, []);

  const filtered = useMemo(()=> list, [list]); // ya trae el filtro del backend si pasaste q

  const openCreate = () => { setForm(emptyForm); setShowForm(true); };
  const openEdit = (p) => {
    setForm({
      id: p.id, sku: p.sku, name: p.name, description: p.description || '',
      category_id: p.category_id || '', price: p.price || '', is_active: p.is_active ? 1 : 0
    });
    setShowForm(true);
  };

  const save = async (e) => {
    e.preventDefault();
    setMsg('');
    try{
      if (!form.sku || !form.name) return setMsg('SKU y nombre son requeridos.');
      const payload = {
        sku: form.sku,
        name: form.name,
        description: form.description,
        category_id: form.category_id || null,
        price: form.price ? Number(form.price) : 0,
        is_active: Number(form.is_active) ? 1 : 0
      };
      if(form.id){
        await api.put(`/products/${form.id}`, payload);
      }else{
        const r = await api.post('/products', payload);
        form.id = r.data.id;
      }
      setShowForm(false);
      await load();
    }catch(err){
      setMsg(err.response?.data?.error || 'Error guardando');
    }
  };

  const removeItem = async (id) => {
    if (!confirm('¿Eliminar producto?')) return;
    await api.delete(`/products/${id}`);
    await load();
  };

  const openUpload = (p) => { setUploadFor(p); setFile(null); };
  const sendUpload = async () => {
    if (!file || !uploadFor) return;
    const fd = new FormData();
    fd.append('image', file);
    fd.append('is_primary', '1');
    await api.post(`/products/${uploadFor.id}/images`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    setUploadFor(null);
    await load();
  };

  return (
    <div className="vstack gap-3">
      <div className="d-flex justify-content-between align-items-center">
        <div className="d-flex gap-2">
          <input className="form-control" placeholder="Buscar…" value={q} onChange={e=>setQ(e.target.value)} />
          <button className="btn btn-primary" onClick={load}>Buscar</button>
        </div>
        <button className="btn btn-gradient rounded-pill" onClick={openCreate}>+ Nuevo producto</button>
      </div>

      <div className="card sleek">
        <div className="table-responsive">
          <table className="table mb-0 align-middle">
            <thead>
              <tr>
                <th>ID</th><th>SKU</th><th>Nombre</th><th>Categoría</th><th>Precio</th><th>Estado</th><th className="text-end">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan="7" className="text-center text-muted">Cargando…</td></tr>}
              {!loading && filtered.length===0 && <tr><td colSpan="7" className="text-center text-muted">Sin resultados</td></tr>}
              {filtered.map(p=>(
                <tr key={p.id}>
                  <td>{p.id}</td>
                  <td>{p.sku}</td>
                  <td>{p.name}</td>
                  <td>{p.category || '-'}</td>
                  <td>Q {Number(p.price||0).toFixed(2)}</td>
                  <td><span className={`badge ${p.is_active ? 'text-bg-success' : 'text-bg-secondary'}`}>{p.is_active ? 'Activo':'Inactivo'}</span></td>
                  <td className="text-end">
                    <div className="btn-group">
                      <button className="btn btn-sm btn-outline-primary" onClick={()=>openEdit(p)}>Editar</button>
                      <button className="btn btn-sm btn-outline-secondary" onClick={()=>openUpload(p)}>Imagen</button>
                      <button className="btn btn-sm btn-outline-danger" onClick={()=>removeItem(p.id)}>Eliminar</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form (simple) */}
      {showForm && (
        <div className="modal d-block" tabIndex="-1" onClick={()=>setShowForm(false)}>
          <div className="modal-dialog" onClick={e=>e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{form.id ? 'Editar producto' : 'Nuevo producto'}</h5>
                <button className="btn-close" onClick={()=>setShowForm(false)} />
              </div>
              <form onSubmit={save}>
                <div className="modal-body vstack gap-2">
                  {msg && <div className="alert alert-danger py-2 mb-2">{msg}</div>}
                  <input className="form-control" placeholder="SKU" value={form.sku} onChange={e=>setForm({...form, sku:e.target.value})}/>
                  <input className="form-control" placeholder="Nombre" value={form.name} onChange={e=>setForm({...form, name:e.target.value})}/>
                  <textarea className="form-control" placeholder="Descripción" value={form.description} onChange={e=>setForm({...form, description:e.target.value})}/>
                  <div className="row">
                    <div className="col">
                      <select className="form-select" value={form.category_id} onChange={e=>setForm({...form, category_id:e.target.value})}>
                        <option value="">Sin categoría</option>
                        {cats.map(c=> <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div className="col">
                      <input type="number" step="0.01" className="form-control" placeholder="Precio" value={form.price} onChange={e=>setForm({...form, price:e.target.value})}/>
                    </div>
                  </div>
                  <div className="form-check">
                    <input id="actv" type="checkbox" className="form-check-input" checked={!!Number(form.is_active)} onChange={e=>setForm({...form, is_active: e.target.checked ? 1 : 0})}/>
                    <label className="form-check-label" htmlFor="actv">Activo</label>
                  </div>
                </div>
                <div className="modal-footer">
                  <button className="btn btn-secondary" type="button" onClick={()=>setShowForm(false)}>Cancelar</button>
                  <button className="btn btn-primary" type="submit">Guardar</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal upload */}
      {uploadFor && (
        <div className="modal d-block" tabIndex="-1" onClick={()=>setUploadFor(null)}>
          <div className="modal-dialog" onClick={e=>e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Subir imagen: {uploadFor.name}</h5>
                <button className="btn-close" onClick={()=>setUploadFor(null)} />
              </div>
              <div className="modal-body">
                <input type="file" accept="image/*" className="form-control" onChange={e=>setFile(e.target.files?.[0]||null)} />
                <div className="small text-muted mt-2">Se guardará como imagen principal.</div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={()=>setUploadFor(null)}>Cancelar</button>
                <button className="btn btn-primary" disabled={!file} onClick={sendUpload}>Subir</button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
