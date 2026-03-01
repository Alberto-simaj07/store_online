import { useEffect, useState } from 'react';
import api from '../api/client';
import { Link } from 'react-router-dom';

export default function Cart() {
  const [cart, setCart] = useState({ items: [], total: 0 });

  const load = async () => {
    const r = await api.get('/cart');
    setCart(r.data);
  };
  const updateQty = async (id, q) => {
    await api.put('/cart/item', { item_id: id, quantity: q });
    load();
  };
  const clear = async () => {
    await api.delete('/cart/clear');
    load();
  };

  useEffect(()=>{ load(); }, []);

  return (
    <>
      <h3>Carrito</h3>
      {cart.items.length === 0 ? <p>No hay productos.</p> : (
        <>
          <table className="table">
            <thead><tr><th>Producto</th><th>Cant.</th><th>Precio</th><th>Subtotal</th></tr></thead>
            <tbody>
              {cart.items.map(it => (
                <tr key={it.id}>
                  <td>{it.name}</td>
                  <td style={{maxWidth:120}}>
                    <input type="number" className="form-control"
                      value={it.quantity}
                      onChange={e=>updateQty(it.id, Number(e.target.value))}/>
                  </td>
                  <td>Q {Number(it.price).toFixed(2)}</td>
                  <td>Q {Number(it.subtotal).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="d-flex justify-content-between">
            <button className="btn btn-outline-danger" onClick={clear}>Vaciar</button>
            <div className="h5">Total: Q {Number(cart.total).toFixed(2)}</div>
          </div>
          <div className="text-end mt-3">
            <Link to="/checkout" className="btn btn-success">Continuar a pago</Link>
          </div>
        </>
      )}
    </>
  );
}
