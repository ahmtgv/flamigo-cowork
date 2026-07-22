import { Link } from 'react-router-dom';
import { students } from '../data/demo';

export function AdminPanel() {
  return (
    <main className="cabinet" data-testid="admin-panel">
      <h1>Администрирование</h1>
      <div className="row">
        <button data-testid="manage-courses-button">Управление курсами</button>
        <button data-testid="manage-groups-button">Управление группами</button>
        <Link className="btn ghost" to="/admin/reports">Отчёты</Link>
      </div>
      <section className="card" data-testid="students-table" aria-label="Ученики">
        <h3>Ученики</h3>
        <table>
          <thead><tr><th>Имя</th><th>Группа</th><th>Прогресс</th></tr></thead>
          <tbody>
            {students.map(s => <tr key={s.id}><td>{s.name}</td><td>{s.group}</td><td>{Math.round(s.progress*100)}%</td></tr>)}
          </tbody>
        </table>
      </section>
    </main>
  );
}

export function AdminReports() {
  return (
    <main className="cabinet">
      <h1>Отчёты</h1>
      <section className="card" data-testid="reports-panel" aria-label="Отчёты вовлечённости">
        <h3>Вовлечённость по группам (агрегаты)</h3>
        <p className="muted">Только агрегированные показатели. Сырых кадров и биометрии здесь нет.</p>
        <ul><li>7-А: средняя вовлечённость 61%</li><li>7-Б: средняя вовлечённость 54%</li></ul>
      </section>
      <button className="btn" data-testid="export-data-button">Экспорт данных</button>
    </main>
  );
}
