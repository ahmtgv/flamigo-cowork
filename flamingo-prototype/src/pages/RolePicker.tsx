import { Link } from 'react-router-dom';
import { ROLE_LABELS, Role } from '../lib/session';

const roles: Role[] = ['student', 'teacher', 'school', 'parent', 'admin'];

export default function RolePicker() {
  return (
    <main className="rolepicker">
      <h1>Flamingo<span className="plus">+</span></h1>
      <p className="muted">Выберите роль (демо-вход без авторизации)</p>
      <ul className="role-list">
        {roles.map(r => (
          <li key={r}>
            <Link className="role-card" to={`/r/${r}`} data-testid={`role-${r}`}>
              {ROLE_LABELS[r]}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
