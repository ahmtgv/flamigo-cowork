import { Link } from 'react-router-dom';
import { getRole, ROLE_LABELS, clearRole } from '../lib/session';

export default function TopBar() {
  const role = getRole();
  return (
    <header className="topbar">
      <Link to="/" className="brand">Flamingo<span>+</span></Link>
      <nav aria-label="Основная навигация">
        <Link to="/courses">Курсы</Link>
        <Link to="/cabinet">Кабинет</Link>
        <Link to="/settings/privacy">Приватность</Link>
      </nav>
      <div className="usermenu" data-testid="user-menu">
        <span>{role ? ROLE_LABELS[role] : 'Гость'}</span>
        <button onClick={() => { clearRole(); location.href = '/'; }} aria-label="Сменить роль">Сменить роль</button>
      </div>
    </header>
  );
}
