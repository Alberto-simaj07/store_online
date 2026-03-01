import { useState } from 'react';
import api from '../api/client';
import { useNavigate } from 'react-router-dom';

export default function Checkout() {
  const [form, setForm] = useState({ store_id: 1, customer_name: '', customer_email: '' });
  const [msg, setMsg] = useState('');
  const nav = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setMsg('');
    try {
      const r = await api.post('/sales/checkout', form);
      setMsg(`Venta #${r.data.sale_id} creada. Total Q ${r.data.total}`);
      setTimeout(()=>nav('/'), 1500);
    } catch (err) {
      setMsg(err.response?.data?.error || 'Error en checkout');
    }
  };

  return (
    <div className="col-md-6 mx-auto">
      <h3>Checkout</h3>
      <form onSubmit={submit} className="vstack gap-3">
        <select className="form-select"
          value={form.store_id}
          onChange={e=>setForm({...form, store_id: Number(e.target.value)})}>
          <option value={1}>Sucursal 1</option>
          <option value={2}>Sucursal 2</option>
          <option value={3}>Sucursal 3</option>
        </select>
        <input className="form-control" placeholder="Nombre"
          value={form.customer_name}
          onChange={e=>setForm({...form, customer_name: e.target.value})}/>
        <input className="form-control" placeholder="Correo (opcional)"
          value={form.customer_email}
          onChange={e=>setForm({...form, customer_email: e.target.value})}/>
        <button className="btn btn-success">Confirmar compra</button>
      </form>
      {msg && <div className="alert alert-info mt-3">{msg}</div>}
    </div>
  );
}
