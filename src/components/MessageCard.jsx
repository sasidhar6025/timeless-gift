export default function MessageCard({ title, onClick }) {
  return (
    <div className="card" role="button" onClick={onClick} tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); }}>
      <div className="card-fold" aria-hidden="true" />
      <div className="card-title">{title}</div>
    </div>
  );
}
