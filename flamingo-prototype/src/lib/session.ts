export type Role = 'student' | 'teacher' | 'school' | 'parent' | 'admin';
export const ROLE_LABELS: Record<Role, string> = {
  student: 'Ученик',
  teacher: 'Преподаватель',
  school: 'Учебное заведение',
  parent: 'Родитель',
  admin: 'Администратор',
};
const KEY = 'demo_role';
export const setRole = (r: Role) => localStorage.setItem(KEY, r);
export const getRole = (): Role | null => (localStorage.getItem(KEY) as Role) ?? null;
export const clearRole = () => localStorage.removeItem(KEY);

// Демо-состояние согласия (в реальном продукте — согласие законного представителя через бэкенд)
export const CONSENT_KEY = 'demo_consent';
export const hasConsent = () => localStorage.getItem(CONSENT_KEY) === '1';
export const setConsent = (v: boolean) => localStorage.setItem(CONSENT_KEY, v ? '1' : '0');
