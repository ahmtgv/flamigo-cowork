// Кабинеты «учебное заведение» и «родитель» — упрощённые демо-страницы
import TrendView from '../components/TrendView';
import { students } from '../data/demo';

export function SchoolCabinet() {
  return (
    <main className="cabinet" data-testid="cabinet-dashboard">
      <h1>Кабинет учебного заведения</h1>
      <section className="card"><h3>Классы</h3><ul><li>7-А — 24 ученика</li><li>7-Б — 22 ученика</li></ul></section>
      <section className="card"><h3>Сводная вовлечённость (агрегаты)</h3><p className="muted">Без персональной биометрии.</p></section>
    </main>
  );
}

export function ParentCabinet() {
  const child = students[0];
  return (
    <main className="cabinet" data-testid="cabinet-dashboard">
      <h1>Кабинет родителя</h1>
      <section className="card"><h3>{child.name}</h3><p>Группа {child.group}, прогресс {Math.round(child.progress*100)}%</p></section>
      <TrendView />
    </main>
  );
}
