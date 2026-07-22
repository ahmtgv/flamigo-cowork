import { Navigate, useParams } from 'react-router-dom';
import { setRole, Role } from '../lib/session';

const VALID: Role[] = ['student', 'teacher', 'school', 'parent', 'admin'];

/** /r/<role> — демо-вход по ссылке: кладёт роль и ведёт на «/». */
export default function RoleEntry() {
  const { role } = useParams();
  if (role && VALID.includes(role as Role)) {
    setRole(role as Role);
    return <Navigate to="/" replace />;
  }
  return <Navigate to="/" replace />;
}
