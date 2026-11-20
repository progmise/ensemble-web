import { Ico, ICON } from '../../components/Icons.jsx';

const initials = (s = '') =>
  (s.split(/[\s-_]+/).map((w) => w[0]).join('') || s || '?').slice(0, 2).toUpperCase();

// Home — welcome hero + "Mis aplicaciones" alphabetical tile grid.
// Tiles are the registered applications; clicking one opens its detail.
export default function HomeView({ me, applications = [], onOpen }) {
  const fullName = me?.member?.full_name || me?.user?.name || me?.user?.login || '';
  const apps = [...applications]
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <>
      <div className="home-hero">
        <span className="avatar gold big">{initials(fullName)}</span>
        <div>
          <h2>Bienvenido/a{fullName ? `, ${fullName}` : ''}</h2>
          <p className="muted">Miembro de la compañía</p>
        </div>
      </div>
      <div className="card home-card">
        <h2><Ico d={ICON.grid} />Mis aplicaciones</h2>
        <p className="muted" style={{ fontSize: 12 }}>Orden alfabético</p>
        <div className="home-grid">
          {apps.map((a) => (
            <button key={a.name} className="home-tile" onClick={() => onOpen(a.id ?? a.name)}>
              <span className="avatar sq">{(a.alias || a.name)[0]}</span>
              <span>
                <strong>{a.name.toUpperCase()}</strong>
                <small className="muted">ID: {a.id}</small>
              </span>
            </button>
          ))}
          {!apps.length && <p className="muted">No hay aplicaciones registradas</p>}
        </div>
      </div>
    </>
  );
}
