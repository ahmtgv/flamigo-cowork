import { Link } from 'react-router-dom';
import { courses, schedule, materials } from '../data/demo';
import TrendView from '../components/TrendView';

export default function StudentCabinet() {
  return (
    <main data-testid="cabinet-dashboard" className="cabinet">
      <h1>Кабинет ученика</h1>
      <div className="grid">
        <section className="card" data-testid="progress-widget" aria-label="Прогресс">
          <h3>Прогресс</h3>
          {courses.map(c => (
            <div key={c.id} className="progress-line">
              <span>{c.title}</span>
              <div className="bar-track"><div className="bar-fill" style={{ width: `${c.progress * 100}%` }} /></div>
            </div>
          ))}
        </section>
        <section className="card" data-testid="schedule-widget" aria-label="Расписание">
          <h3>Расписание</h3>
          <ul>{schedule.map((s, i) => <li key={i}>{s.day} {s.time} — {s.title}</li>)}</ul>
        </section>
        <section className="card" data-testid="materials-list" aria-label="Материалы">
          <h3>Материалы</h3>
          <ul>{materials.map(m => <li key={m.id}>{m.title}</li>)}</ul>
        </section>
      </div>
      <Link className="btn" to="/lesson/1" data-testid="continue-learning-button">Продолжить обучение</Link>
      <TrendView />
    </main>
  );
}
