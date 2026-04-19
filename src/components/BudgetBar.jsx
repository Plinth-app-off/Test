export default function BudgetBar({ spent, budget }) {
  const pct = budget > 0 ? Math.min(120, (spent / budget) * 100) : 0;
  const cls = pct >= 100 ? 'red' : pct >= 80 ? 'amber' : '';
  return (
    <div className="budget-bar">
      <div className={'fill ' + cls} style={{ width: Math.min(100, pct) + '%' }} />
    </div>
  );
}
