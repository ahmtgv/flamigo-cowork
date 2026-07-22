import { Link } from 'react-router-dom';
import { courses } from '../data/demo';
import { useState } from 'react';

export default function Courses() {
  const [enrolled, setEnrolled] = useState<string | null>(null);
  return (
    <main className="cabinet">
      <h1>Курсы</h1>
      <div className="grid">
        {courses.map(c => (
          <section className="card course" key={c.id} data-testid="course-card">
            <h3>{c.title}</h3>
            <p className="muted">{c.lessons} уроков</p>
            {enrolled === c.id
              ? <Link className="btn" to="/lesson/1" data-testid="start-lesson-button">Начать урок</Link>
              : <button data-testid="enroll-button" onClick={() => setEnrolled(c.id)}>Записаться</button>}
          </section>
        ))}
      </div>
    </main>
  );
}
