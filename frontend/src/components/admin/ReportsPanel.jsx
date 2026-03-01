import { useEffect, useMemo, useRef, useState } from 'react';
import api from '../../api/client';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, PointElement, LineElement,
  Tooltip, Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Tooltip, Legend);

/* ---------- utils CSV ---------- */
const toCSV = (rows) => {
  if (!rows?.length) return '';
  const headers = Object.keys(rows[0]);
  const body = rows.map(r => headers.map(h => JSON.stringify(r[h] ?? '')).join(',')).join('\n');
  return `${headers.join(',')}\n${body}`;
};
const downloadCSV = (rows, filename='reporte.csv') => {
  const blob = new Blob([toCSV(rows)], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
};

export default function ReportsPanel(){
  /* ---------- filtros globales ---------- */
  const [stores, setStores] = useState([]);
  const [storeId, setStoreId] = useState('');
  const [year, setYear] = useState(String(new Date().getFullYear()));

  /* ---------- datasets ---------- */
  const [top, setTop] = useState([]);
  const [low, setLow] = useState([]);
  const [byMonth, setByMonth] = useState([]);
  const [frequent, setFrequent] = useState([]);
  const [salesRange, setSalesRange] = useState([]);

  /* ---------- limites / rangos ---------- */
  const [limitTop, setLimitTop] = useState(10);
  const [limitLow, setLimitLow] = useState(20);
  const [limitFrequent, setLimitFrequent] = useState(20);

  const today = useMemo(() => {
    const d = new Date(); const y=d.getFullYear(), m=String(d.getMonth()+1).padStart(2,'0'), dd=String(d.getDate()).padStart(2,'0');
    return `${y}-${m}-${dd}`;
  }, []);
  const [from, setFrom] = useState(`${new Date().getFullYear()}-01-01`);
  const [to, setTo] = useState(today);

  /* ---------- chart refs ---------- */
  const topChartRef = useRef(null);
  const monthlyChartRef = useRef(null);

  /* ---------- loaders ---------- */
  const loadStores = async () => {
    const s = await api.get('/stores');
    setStores(s.data||[]);
  };

  const loadTop = async () => {
    const r = await api.get('/reports/top-products', { params: { limit: limitTop, store_id: storeId||undefined }});
    setTop(r.data||[]);
  };
  const loadLow = async () => {
    const r = await api.get('/reports/low-stock', { params: { limit: limitLow, store_id: storeId||undefined }});
    setLow(r.data||[]);
  };
  const loadByMonth = async () => {
    const r = await api.get('/reports/top-products-by-month', { params: { year, store_id: storeId||undefined }});
    setByMonth(r.data||[]);
  };
  const loadFrequent = async () => {
    const r = await api.get('/reports/frequent-customers', { params: { limit: limitFrequent, store_id: storeId||undefined }});
    setFrequent(r.data||[]);
  };
  const loadSalesRange = async () => {
    if (!from || !to) return;
    const r = await api.get('/reports/sales-by-range', { params: { from, to, store_id: storeId||undefined }});
    setSalesRange(r.data||[]);
  };

  useEffect(()=>{ loadStores(); }, []);
  useEffect(()=>{
    loadTop(); loadLow(); loadByMonth(); loadFrequent(); loadSalesRange();
    // eslint-disable-next-line
  }, [storeId, limitTop, limitLow, year, limitFrequent, from, to]);

  /* ---------- charts data ---------- */
  const chartTop = {
    labels: top.map(x=>x.name),
    datasets: [{ label:'Unidades', data: top.map(x=>x.total_sold) }]
  };

  const byMonthAgg = useMemo(()=>{
    const map = {};
    byMonth.forEach(r=>{ (map[r.month] ||= []).push({ product:r.product, qty:Number(r.qty) }); });
    const months = Object.keys(map).sort();
    const series = months.map(m => map[m].sort((a,b)=>b.qty-a.qty)[0]); // top producto por mes
    return { months, series };
  }, [byMonth]);

  const chartMonthly = {
    labels: byMonthAgg.months,
    datasets: [{ label:'Producto top (qty)', data: byMonthAgg.series.map(s=>s?.qty||0) }]
  };

  /* ---------- Exportar PDF (todo) ---------- */
  const exportPDF = () => {
    try {
      const doc = new jsPDF({ unit: 'pt', format: 'a4' });
      const margin = 36;
      let y = margin;

      const addTitle = (t) => { doc.setFont('helvetica','bold'); doc.setFontSize(16); doc.text(t, margin, y); y+=18; doc.setFont('helvetica','normal'); };
      const addSubtitle = (t) => { doc.setFont('helvetica','bold'); doc.setFontSize(12); doc.text(t, margin, y); y+=14; doc.setFont('helvetica','normal'); };
      const pageBreakIfNeeded = (extra=0) => {
        if (y + extra > doc.internal.pageSize.getHeight() - margin) { doc.addPage(); y = margin; }
      };
      const addFilters = () => {
        doc.setFontSize(10);
        const storeLabel = stores.find(s => String(s.id) === String(storeId))?.name || 'Todas';
        doc.text(`Sucursal: ${storeLabel}   Año: ${year}   Rango: ${from} a ${to}`, margin, y);
        y += 12;
      };
      const addTable = (head, body) => {
        autoTable(doc, {
          startY: y,
          head: [head],
          body,
          styles: { fontSize: 9, cellPadding: 4 },
          margin: { left: margin, right: margin }
        });
        y = doc.lastAutoTable.finalY + 12;
      };

      // Portada
      addTitle('Reporte - Store Online');
      addFilters();
      y += 10;

      // Top productos (chart + tabla)
      addSubtitle(`Top productos (Top ${limitTop})`);
      try {
        const url = topChartRef.current?.toBase64Image?.();
        if (url) {
          const imgW = doc.internal.pageSize.getWidth() - margin*2;
          const imgH = imgW * 9/16;
          pageBreakIfNeeded(imgH + 20);
          doc.addImage(url, 'PNG', margin, y, imgW, imgH);
          y += imgH + 10;
        }
      } catch {}
      pageBreakIfNeeded(120);
      addTable(['Producto','Unidades'], top.map(r => [r.name, r.total_sold]));

      // Bajo stock
      addSubtitle(`Bajo stock (< 10) - Top ${limitLow}`);
      pageBreakIfNeeded(140);
      addTable(['Sucursal','Producto','Stock'], low.map(r => [r.store, r.name, r.stock]));

      // Productos más vendidos por mes (chart + tabla)
      addSubtitle(`Productos más vendidos por mes (${year})`);
      try {
        const url2 = monthlyChartRef.current?.toBase64Image?.();
        if (url2) {
          const imgW2 = doc.internal.pageSize.getWidth() - margin*2;
          const imgH2 = imgW2 * 9/16;
          pageBreakIfNeeded(imgH2 + 20);
          doc.addImage(url2, 'PNG', margin, y, imgW2, imgH2);
          y += imgH2 + 10;
        }
      } catch {}
      pageBreakIfNeeded(140);
      addTable(['Producto','Mes','Cantidad'], byMonth.map(r => [r.product, r.month, r.qty]));

      // Clientes frecuentes
      addSubtitle(`Clientes frecuentes (Top ${limitFrequent})`);
      pageBreakIfNeeded(160);
      addTable(['Cliente','Email','Sucursal','Pedidos','Total Q'],
               frequent.map(r => [r.customer, r.email, r.store_id || '-', r.orders, Number(r.total).toFixed(2)]));

      // Ventas por rango
      addSubtitle(`Ventas por rango (${from} a ${to})`);
      pageBreakIfNeeded(180);
      addTable(['#','Fecha','Cliente','Sucursal','Estado','Total Q'],
               salesRange.map(v => [
                 v.id,
                 new Date(v.created_at).toLocaleString(),
                 v.customer,
                 v.store,
                 v.status,
                 Number(v.total).toFixed(2)
               ]));

      doc.save(`reportes_${new Date().toISOString().slice(0,10)}.pdf`);
    } catch (err) {
      console.error('PDF_error:', err);
      // fallback mínimo para comprobar descarga
      const d = new jsPDF();
      d.text('Prueba PDF', 10, 10);
      d.save('test.pdf');
    }
  };

  /* ---------- UI ---------- */
  return (
    <div className="vstack gap-4">

      {/* Filtros globales */}
      <div className="d-flex flex-wrap gap-2 align-items-center">
        <select className="form-select" style={{maxWidth:280}}
                value={storeId} onChange={e=>setStoreId(e.target.value)}>
          <option value="">Todas las sucursales</option>
          {stores.map(s=><option key={s.id} value={s.id}>{s.name} — {s.city}</option>)}
        </select>

        <div className="input-group" style={{maxWidth:200}}>
          <span className="input-group-text">Año</span>
          <input type="number" className="form-control" value={year}
                 onChange={e=>setYear(e.target.value)} />
        </div>

        <div className="ms-auto d-flex gap-2">
          <button className="btn btn-outline-dark" onClick={exportPDF}>Exportar PDF</button>
        </div>
      </div>

      {/* Top productos */}
      <div className="card sleek p-3">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h5 className="mb-0">Top productos</h5>
          <div className="d-flex gap-2">
            <select className="form-select" value={limitTop} onChange={e=>setLimitTop(Number(e.target.value))}>
              {[10,20,50,100].map(n=><option key={n} value={n}>Top {n}</option>)}
            </select>
            <button className="btn btn-outline-secondary"
                    onClick={()=>downloadCSV(top, 'top_productos.csv')}>Exportar CSV</button>
          </div>
        </div>
        <Bar ref={topChartRef} data={chartTop} options={{ plugins:{legend:{display:false}} }} />
        <div className="table-responsive mt-3">
          <table className="table">
            <thead><tr><th>Producto</th><th>Unidades</th></tr></thead>
            <tbody>
              {top.map((r,i)=>(<tr key={i}><td>{r.name}</td><td>{r.total_sold}</td></tr>))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bajo stock */}
      <div className="card sleek p-3">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h5 className="mb-0">Bajo stock ( &lt; 10 )</h5>
          <div className="d-flex gap-2">
            <select className="form-select" value={limitLow} onChange={e=>setLimitLow(Number(e.target.value))}>
              {[10,20,50].map(n=><option key={n} value={n}>Top {n}</option>)}
            </select>
            <button className="btn btn-outline-secondary"
                    onClick={()=>downloadCSV(low, 'bajo_stock.csv')}>Exportar CSV</button>
          </div>
        </div>
        <div className="table-responsive">
          <table className="table">
            <thead><tr><th>Sucursal</th><th>Producto</th><th>Stock</th></tr></thead>
            <tbody>
              {low.map((r,i)=>(<tr key={i}><td>{r.store}</td><td>{r.name}</td><td>{r.stock}</td></tr>))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Productos más vendidos por mes */}
      <div className="card sleek p-3">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h5 className="mb-0">Productos más vendidos por mes</h5>
          <button className="btn btn-outline-secondary"
                  onClick={()=>downloadCSV(byMonth, 'top_por_mes.csv')}>Exportar CSV</button>
        </div>
        <Line ref={monthlyChartRef} data={chartMonthly} options={{ plugins:{legend:{display:false}} }} />
        <div className="table-responsive mt-3">
          <table className="table">
            <thead><tr><th>Producto</th><th>Mes</th><th>Cantidad</th></tr></thead>
            <tbody>
              {byMonth.map((r,i)=>(<tr key={i}><td>{r.product}</td><td>{r.month}</td><td>{r.qty}</td></tr>))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Clientes frecuentes */}
      <div className="card sleek p-3">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h5 className="mb-0">Clientes frecuentes</h5>
          <div className="d-flex gap-2">
            <select className="form-select" value={limitFrequent} onChange={e=>setLimitFrequent(Number(e.target.value))}>
              {[10,20,50].map(n=><option key={n} value={n}>Top {n}</option>)}
            </select>
            <button className="btn btn-outline-secondary"
                    onClick={()=>downloadCSV(frequent, 'clientes_frecuentes.csv')}>Exportar CSV</button>
          </div>
        </div>
        <div className="table-responsive">
          <table className="table">
            <thead><tr><th>Cliente</th><th>Email</th><th>Sucursal</th><th>Pedidos</th><th>Total Q</th></tr></thead>
            <tbody>
              {frequent.map((r,i)=>(<tr key={i}>
                <td>{r.customer}</td><td>{r.email}</td><td>{r.store_id || '-'}</td>
                <td>{r.orders}</td><td>{Number(r.total).toFixed(2)}</td>
              </tr>))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ventas por rango */}
      <div className="card sleek p-3">
        <div className="d-flex flex-wrap gap-2 align-items-end mb-2">
          <h5 className="mb-0 me-auto">Ventas por rango</h5>
          <div>
            <label className="form-label mb-1">Desde</label>
            <input type="date" className="form-control" value={from} onChange={e=>setFrom(e.target.value)} />
          </div>
          <div>
            <label className="form-label mb-1">Hasta</label>
            <input type="date" className="form-control" value={to} onChange={e=>setTo(e.target.value)} />
          </div>
          <button className="btn btn-outline-secondary" onClick={loadSalesRange}>Actualizar</button>
          <button className="btn btn-outline-secondary"
                  onClick={()=>downloadCSV(salesRange, 'ventas_rango.csv')}>Exportar CSV</button>
        </div>
        <div className="table-responsive">
          <table className="table">
            <thead><tr><th>#</th><th>Fecha</th><th>Cliente</th><th>Sucursal</th><th>Estado</th><th>Total</th></tr></thead>
            <tbody>
              {salesRange.map(v=>(
                <tr key={v.id}>
                  <td>{v.id}</td>
                  <td>{new Date(v.created_at).toLocaleString()}</td>
                  <td>{v.customer}</td>
                  <td>{v.store}</td>
                  <td>{v.status}</td>
                  <td>{Number(v.total).toFixed(2)}</td>
                </tr>
              ))}
              {salesRange.length===0 && <tr><td colSpan="6" className="text-muted text-center">Sin resultados para el rango.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
