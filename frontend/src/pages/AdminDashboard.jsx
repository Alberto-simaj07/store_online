import { useEffect, useState } from 'react';
import api from '../api/client';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Tooltip, Legend,
} from 'chart.js';
import ProductsManager from '../components/admin/ProductsManager';
import InventoryManager from '../components/admin/InventoryManager';
import SalesManager from '../components/admin/SalesManager';
import TransfersManager from '../components/admin/TransfersManager';
import LogsViewer from '../components/admin/LogsViewer';
import UsersManager from '../components/admin/UsersManager';
import ReportsPanel from '../components/admin/ReportsPanel';



ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Tooltip, Legend);

export default function AdminDashboard() {
  const [tab, setTab] = useState('reportes');
  const [top, setTop] = useState([]);
  const [low, setLow] = useState([]);
  const [monthly, setMonthly] = useState([]);

  const load = async () => {
    const [t, l, m] = await Promise.all([
      api.get('/reports/top-products?limit=10'),
      api.get('/reports/low-stock'),
      api.get('/reports/monthly-sales'),
    ]);
    setTop(t.data);
    setLow(l.data);
    setMonthly(m.data);
  };

  useEffect(() => { load(); }, []);

  const topData = {
    labels: top.map(x => x.name),
    datasets: [{
      label: 'Unidades vendidas',
      data: top.map(x => x.total_sold),
    }]
  };

  const monthlyData = {
    labels: monthly.map(x => x.month),
    datasets: [{
      label: 'Monto Q',
      data: monthly.map(x => Number(x.total_amount)),
    }]
  };

  return (
    <>
      <h3 className="mb-3">Dashboard</h3>

      {/* Tabs */}
      <ul className="nav nav-pills gap-2 mb-3">
        <li className="nav-item">
          <button className={`nav-link ${tab==='reportes' ? 'active' : ''}`} onClick={()=>setTab('reportes')}>Reportes</button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${tab==='productos' ? 'active' : ''}`} onClick={()=>setTab('productos')}>Productos</button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${tab==='inventario' ? 'active' : ''}`} onClick={()=>setTab('inventario')}>Inventario</button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${tab==='ventas' ? 'active' : ''}`} onClick={()=>setTab('ventas')}>Ventas</button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${tab==='traslados' ? 'active' : ''}`} onClick={()=>setTab('traslados')}>Traslados</button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${tab==='logs' ? 'active' : ''}`} onClick={()=>setTab('logs')}>Logs</button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${tab==='usuarios' ? 'active' : ''}`} onClick={()=>setTab('usuarios')}>Usuarios</button>
        </li>
      </ul>

      {/* Contenido pestañas */}
      {tab === 'reportes' && (
        <div className="row g-4">
          <div className="col-lg-6">
            <div className="card sleek p-3">
              <h5 className="mb-3">Top 10 productos</h5>
              <Bar data={topData} options={{ responsive: true, plugins:{legend:{display:false}} }} />
              <ul className="list-group list-group-flush mt-3">
                {top.map((x) => (
                  <li key={x.id} className="list-group-item d-flex justify-content-between">
                    <span>{x.name}</span><b>{x.total_sold}</b>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="col-lg-6">
            <div className="card sleek p-3">
              <h5 className="mb-3">Ventas mensuales (Q)</h5>
              <Line data={monthlyData} options={{ responsive: true, plugins:{legend:{display:false}} }} />
              <div className="small text-muted mt-2">Periodo: {new Date().getFullYear()}</div>
            </div>
          </div>

          <div className="col-12">
            <div className="card sleek p-3">
              <h5 className="mb-3">Bajo stock (primeros 20)</h5>
              <div className="table-responsive">
                <table className="table">
                  <thead><tr><th>Sucursal</th><th>Producto</th><th>Stock</th></tr></thead>
                  <tbody>
                    {low.map((x,i)=>(
                      <tr key={i}>
                        <td>{x.store}</td>
                        <td>{x.name}</td>
                        <td><span className="badge text-bg-danger">{x.stock}</span></td>
                      </tr>
                    ))}
                    {low.length===0 && <tr><td colSpan="3" className="text-muted">Sin alertas.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'productos' && <ProductsManager />}
      {tab === 'inventario' && <InventoryManager />}
      {tab === 'ventas' && <SalesManager />}
      {tab === 'traslados' && <TransfersManager />}
      {tab === 'logs' && <LogsViewer />}
      {tab === 'usuarios' && <UsersManager />}
      {tab === 'reportes' && <ReportsPanel />}


      {tab !== 'reportes' && tab !== 'productos' && tab !== 'inventario' && tab !== 'ventas' && tab !== 'traslados' && tab !== 'logs' &&(
        <div className="alert alert-info">
          Esta pestaña es el esqueleto listo para conectar: <b>{tab}</b>.
        </div>
      )}
    </>
  );
}
