import { Link, NavLink } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { FiShoppingCart, FiUser } from 'react-icons/fi';
import api from '../api/client';

export default function Navbar() {
  const [cartTotal, setCartTotal] = useState(0);
  const [me, setMe] = useState(null);

  const refresh = async () => {
    try {
      const c = await api.get('/cart');
      setCartTotal(c.data.items?.reduce((a, b) => a + b.quantity, 0) || 0);
    } catch {}
    try {
      const r = await api.get('/auth/me');
      setMe(r.data);
    } catch {
      setMe(null);
    }
  };

  useEffect(() => { refresh(); }, []);

  return (
    <nav className="navbar navbar-expand-lg bg-light border-bottom">
      <div className="container">
        <Link className="navbar-brand" to="/">Store Online</Link>

        <div>
          <NavLink className="btn btn-outline-primary me-2" to="/cart">
            Carrito <span className="badge text-bg-secondary">{cartTotal}</span>
          </NavLink>

          {me ? (
            <div className="btn-group">
              <NavLink className="btn btn-gradient rounded-pill" to="/admin">
                <FiUser className="me-1" /> Dashboard
              </NavLink>
              <button
                className="btn btn-outline-danger rounded-pill"
                onClick={async () => {
                  await api.post('/auth/logout');
                  window.location.href = '/'; // redirige al Home
                }}
              >
                Salir
              </button>
            </div>
          ) : (
            <NavLink className="btn btn-outline-secondary rounded-pill" to="/login">
              <FiUser className="me-1" /> Login
            </NavLink>
          )}
        </div>
      </div>
    </nav>
  );
}
