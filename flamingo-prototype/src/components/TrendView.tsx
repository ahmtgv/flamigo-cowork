import { sedumTrend } from '../data/demo';

/** Лонгитюдный тренд: эволюция во времени, язык роста. НИКАКИХ «диагнозов». */
export default function TrendView() {
  const max = Math.max(...sedumTrend.map(t => t.focus));
  return (
    <section className="trend" data-testid="sedum-trend" aria-label="Тренд вовлечённости">
      <h3>Тренд вовлечённости за 4 недели</h3>
      <p className="muted">Это меняющийся во времени тренд, а не оценка способностей и не диагноз.</p>
      <div className="bars">
        {sedumTrend.map(t => (
          <div className="bar-row" key={t.week}>
            <span className="bar-label">{t.week}</span>
            <div className="bar-track">
              <div className="bar-fill" style={{ width: `${(t.focus / max) * 100}%` }} />
            </div>
            <span className="bar-note">{t.note}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
