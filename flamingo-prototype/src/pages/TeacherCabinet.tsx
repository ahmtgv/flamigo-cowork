import { useState } from 'react';
import { submissions } from '../data/demo';

export default function TeacherCabinet() {
  const [graded, setGraded] = useState(false);
  return (
    <main className="cabinet">
      <h1>Кабинет преподавателя</h1>
      <section className="card" data-testid="submissions-list" aria-label="Работы на проверке">
        <h3>Работы на проверке</h3>
        <ul>{submissions.map(s => <li key={s.id}>{s.student} — {s.assignment} ({s.status})</li>)}</ul>
      </section>
      <div className="card">
        <label htmlFor="grade">Оценка</label>
        <input id="grade" data-testid="grade-input" type="number" min={2} max={5} defaultValue={5} />
        <button data-testid="publish-grade-button" onClick={() => setGraded(true)}>Опубликовать оценку</button>
        {graded && <p data-testid="assignment-status">Оценка опубликована</p>}
      </div>
    </main>
  );
}
