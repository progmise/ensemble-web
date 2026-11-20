import { useState } from 'react';
import { Ico, ICON } from './Icons.jsx';

// Checklist filter popover — "Filtros <n>" button opens a titled panel with
// a searchable checkbox list. Picks are staged; "Aplicar" commits them,
// "Limpiar" clears the staging (applied stays until committed).
export default function ChecklistFilter({ title, options, applied = [], onApply,
                                         placeholder = 'Seleccionar' }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState([]);
  const [q, setQ] = useState('');

  const toggleOpen = () => {
    if (!open) { setDraft(applied); setQ(''); }
    setOpen((o) => !o);
  };
  const check = (v) => setDraft((d) =>
    d.includes(v) ? d.filter((x) => x !== v) : [...d, v]);
  const visible = options.filter((o) => o.toLowerCase().includes(q.toLowerCase()));

  return (
    <span className="filters-menu">
      <button className={`btn btn-teal${applied.length ? ' has-active' : ''}`}
        onClick={toggleOpen}>
        Filtros {applied.length > 0 && <span className="filters-count">{applied.length}</span>}
        <Ico d={ICON.chevronDown} />
      </button>
      {open && (
        <span className="filters-pop filters-check" onMouseLeave={() => setOpen(false)}>
          <span className="filters-title">{title}</span>
          <span className="filters-search">
            <input value={q}
              placeholder={draft.length ? `${draft.length} elementos seleccionados` : placeholder}
              onChange={(e) => setQ(e.target.value)} />
            {draft.length > 0 &&
              <button title="Quitar selección" onClick={() => setDraft([])}>✕</button>}
            <button title="Cerrar" onClick={() => setOpen(false)}>
              <Ico d={ICON.chevronUp} /></button>
          </span>
          <span className="filters-list">
            {visible.map((o) => (
              <label key={o} className="filters-opt">
                <input type="checkbox" checked={draft.includes(o)}
                  onChange={() => check(o)} />
                {o}
              </label>
            ))}
            {!visible.length && <span className="muted">Sin opciones</span>}
          </span>
          <span className="filters-foot">
            <button className="btn-text btn-cancel" onClick={() => setDraft([])}>Limpiar</button>
            <button className="btn-text btn-next"
              onClick={() => { onApply(draft); setOpen(false); }}>Aplicar</button>
          </span>
        </span>
      )}
    </span>
  );
}
