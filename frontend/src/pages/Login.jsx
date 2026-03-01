import { useState } from 'react';
import api from '../api/client';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('admin@store.com');
  const [password, setPassword] = useState('123456');
  const [err, setErr] = useState('');
  const nav = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    try {
      await api.post('/auth/login', { email, password });
      nav('/admin');
    } catch (e) {
      setErr(e.response?.data?.error || 'Error de login');
    }
  };

  return (
    <div className="col-md-4 mx-auto">
      <h3>Login</h3>
      <form onSubmit={submit} className="vstack gap-3">
        <input className="form-control" value={email} onChange={e=>setEmail(e.target.value)} />
        <input type="password" className="form-control" value={password} onChange={e=>setPassword(e.target.value)} />
        <button className="btn btn-primary">Entrar</button>
      </form>
      {err && <div className="alert alert-danger mt-3">{err}</div>}
    </div>
  );
}
