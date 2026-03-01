import { useEffect, useState } from 'react';
import api from '../api/client';
import ProductCard from '../components/ProductCard';
import { FiSearch } from 'react-icons/fi';

export default function Home() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const r = await api.get('/products', { params: q ? { q } : {} });
    setItems(r.data);
    setLoading(false);
  };
  useEffect(()=>{ load(); /* eslint-disable-line */ }, []);

  return (
    <>
      <div className="d-flex gap-2 mb-4">
        <div className="flex-grow-1 position-relative">
          <input className="form-control input-ghost" placeholder="Buscar productos..."
                 value={q} onChange={e=>setQ(e.target.value)} />
          <FiSearch className="position-absolute" style={{right:16, top:12, color:'var(--muted)'}} />
        </div>
        <button className="btn btn-gradient rounded-pill px-4" onClick={load}>Buscar</button>
      </div>

      {loading ? (
        <div className="row g-3">
          {Array.from({length:6}).map((_,i)=>(
            <div className="col-12 col-sm-6 col-md-4 col-lg-3" key={i}>
              <div className="card sleek placeholder-wave" style={{height:260}} />
            </div>
          ))}
        </div>
      ) : (
        <div className="row g-3">
          {items.map(p => (
            <div className="col-12 col-sm-6 col-md-4 col-lg-3" key={p.id}>
              <ProductCard p={p} onAdded={load} />
            </div>
          ))}
          {items.length === 0 && (
            <div className="text-center text-muted py-5">Sin resultados.</div>
          )}
        </div>
      )}
    </>
  );
}
