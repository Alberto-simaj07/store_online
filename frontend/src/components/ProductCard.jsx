import api from '../api/client';
import { useState } from 'react';
import { FiCheck } from 'react-icons/fi';

export default function ProductCard({ p, onAdded }) {
  const [ok, setOk] = useState(false);
  const img = p.images?.find(i => i.is_primary)?.url;

  const add = async () => {
    await api.post('/cart/add', { product_id: p.id, quantity: 1 });
    setOk(true); setTimeout(()=>setOk(false), 1200);
    onAdded?.();
  };

  return (
    <div className="card sleek h-100">
      {img
        ? <img src={img} className="product-img" alt={p.name} />
        : <div className="product-img d-flex align-items-center justify-content-center text-muted">Sin imagen</div>}
      <div className="card-body d-flex flex-column">
        <span className="text-muted small">{p.sku}</span>
        <h5 className="card-title mt-1">{p.name}</h5>

        <div className="mt-auto d-flex justify-content-between align-items-center">
          <span className="badge badge-price px-3 py-2">Q {Number(p.price).toFixed(2)}</span>
          <button className={`btn ${ok ? 'btn-success' : 'btn-outline-success'} w-50`}
                  onClick={add}>
            {ok ? <><FiCheck className="me-1" />Añadido</> : 'Agregar'}
          </button>
        </div>
      </div>
    </div>
  );
}
