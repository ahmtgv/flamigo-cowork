/**
 * ЕДИНСТВЕННАЯ ТОЧКА АДАПТАЦИИ ПОД ПРИЛОЖЕНИЕ FLAMINGO.
 *
 * Всё, что зависит от вашей вёрстки и API, живёт здесь.
 * Правите этот файл — все тесты подхватывают изменения.
 * В самих тестах не должно быть ни одного literal-селектора и ни одного literal-URL.
 */

export const ROLES = ['student', 'teacher', 'admin', 'parent'] as const;
export type Role = (typeof ROLES)[number];

export const env = {
  baseURL: process.env.BASE_URL ?? 'http://localhost:3000',
  backendOrigin: process.env.BACKEND_ORIGIN ?? 'http://localhost:8000',
  password: process.env.TEST_PASSWORD ?? 'change-me',
  maxAggregateBytes: Number(process.env.MAX_AGGREGATE_BYTES ?? 4096),
  privacyObserveMs: Number(process.env.PRIVACY_OBSERVE_MS ?? 30_000),
};

/** Логины сид-пользователей. Должны совпадать со скриптом seed:test. */
export const users: Record<Role, { login: string; id: string }> = {
  student: { login: 'student_1', id: process.env.STUDENT_1_ID ?? '' },
  teacher: { login: 'teacher_1', id: process.env.TEACHER_1_ID ?? '' },
  admin:   { login: 'admin_1',   id: process.env.ADMIN_1_ID   ?? '' },
  parent:  { login: 'parent_1',  id: process.env.PARENT_1_ID  ?? '' },
};

/** Второй ученик — «чужой» пользователь для проверок IDOR. */
export const foreignStudentId = process.env.STUDENT_2_ID ?? '';

/**
 * ── АУТЕНТИФИКАЦИЯ ────────────────────────────────────────────────
 * Выберите модель под ваш бэкенд.
 *  'cookie'   — сессия в httpOnly cookie (storageState с request-контекста достаточно)
 *  'token'    — JWT в localStorage (нужен браузерный контекст — см. auth.setup.ts)
 */
export const authMode: 'cookie' | 'token' | 'demo' = 'demo';

/**
 * Demo-режим: входа нет, роль задаётся ссылкой /r/<role>.
 * Для раннего прототипа на бесплатном хосте (без бэкенда).
 * ВАЖНО: тесты, которым нужен реальный бэкенд (права/IDOR, logout-all,
 * троттлинг), в demo-режиме не осмысленны — гоняйте `npm run test:demo`.
 */
export const demoRolePath = (role: Role) => `/r/${role}`;

export const api = {
  login: '/api/auth/login',
  /** Ключ в localStorage, если authMode === 'token' */
  tokenStorageKey: 'auth_token',
  /** Поле с токеном в ответе логина */
  tokenResponseField: 'token',
};

/**
 * ── СЕЛЕКТОРЫ ─────────────────────────────────────────────────────
 * Договорённость: только data-testid. Никаких CSS/XPath.
 * Попросите фронтенд проставить эти testid — это разовая работа на пару часов,
 * которая экономит недели на поддержке тестов.
 */
export const testIds = {
  userMenu: 'user-menu',
  // Обучение
  courseCard: 'course-card',
  enrollButton: 'enroll-button',
  lessonPlayer: 'lesson-player',
  startLessonButton: 'start-lesson-button',
  submitAssignmentButton: 'submit-assignment-button',
  assignmentStatus: 'assignment-status',
  // Преподаватель
  submissionsList: 'submissions-list',
  gradeInput: 'grade-input',
  publishGradeButton: 'publish-grade-button',
  // Согласие / приватность
  consentDialog: 'consent-dialog',
  consentAcceptButton: 'consent-accept-button',
  consentDeclineButton: 'consent-decline-button',
  privacyIndicator: 'privacy-indicator',
  // SEduM
  sedumSession: 'sedum-session',
  attentionBadge: 'attention-badge',
  fatigueHint: 'fatigue-hint',
  sedumTrend: 'sedum-trend',              // лонгитюдный график вовлечённости
  cameraDeniedNotice: 'camera-denied-notice',
  pauseSessionButton: 'pause-session-button',
  resumeSessionButton: 'resume-session-button',

  // Аккаунт и вход
  registerForm: 'register-form',
  loginForm: 'login-form',
  forgotPasswordLink: 'forgot-password-link',
  resetPasswordForm: 'reset-password-form',
  twoFactorInput: 'twofactor-input',
  sessionExpiredNotice: 'session-expired-notice',
  logoutAllButton: 'logout-all-button',

  // Учебный кабинет ученика
  cabinetDashboard: 'cabinet-dashboard',
  progressWidget: 'progress-widget',
  scheduleWidget: 'schedule-widget',
  materialsList: 'materials-list',
  continueLearningButton: 'continue-learning-button',

  // Кабинеты преподавателя / админа
  adminPanel: 'admin-panel',
  manageCoursesButton: 'manage-courses-button',
  manageGroupsButton: 'manage-groups-button',
  studentsTable: 'students-table',
  reportsPanel: 'reports-panel',
  exportDataButton: 'export-data-button',
} as const;

/** Ожидаемые подписи дискретных состояний внимания (не float-значения!). */
export const attentionLabels = {
  attentive: 'Сосредоточен',
  away: 'Отвлечён',
  noFace: 'Лицо не видно',
} as const;

/** Подпись подсказки об усталости (физическое состояние, НЕ эмоция). */
export const fatigueHintText = 'Сделай перерыв';

/**
 * ── PRIVACY-GATE ──────────────────────────────────────────────────
 * Маркеры, наличие которых в исходящем payload означает утечку сырой биометрии.
 * Дополняйте под свою реализацию (названия полей MediaPipe/CMF).
 */
export const rawBiometricMarkers = [
  'landmark', 'blendshape', 'facemesh', 'face_mesh',
  'rawframe', 'raw_frame', 'imagedata', 'image_data',
  'pixelbuffer', 'data:image', 'base64,',
  'irisdistance', 'eyecontour',
];

/** Эндпоинты, куда SEduM ИМЕЕТ ПРАВО слать агрегаты. Всё остальное — подозрительно. */
export const allowedSedumEndpoints = [
  '/api/sedum/aggregate',
  '/api/sedum/session',
];

/**
 * ── МАТРИЦА ПРАВ ДОСТУПА (IDOR) ───────────────────────────────────
 * Каждая строка: роль пытается обратиться к ресурсу → ожидаемый HTTP-статус.
 * Это ядро защиты данных несовершеннолетних. Расширяйте при каждом новом эндпоинте.
 */
export interface PermissionCase {
  name: string;
  role: Role;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: (ids: { foreign: string; own: string }) => string;
  expect: number | number[];
}

export const permissionMatrix: PermissionCase[] = [
  {
    name: 'ученик НЕ читает аналитику другого ученика',
    role: 'student', method: 'GET',
    path: ids => `/api/analytics/student/${ids.foreign}`,
    expect: [403, 404],
  },
  {
    name: 'ученик читает свою аналитику',
    role: 'student', method: 'GET',
    path: ids => `/api/analytics/student/${ids.own}`,
    expect: 200,
  },
  {
    name: 'ученик НЕ читает чужие сдачи заданий',
    role: 'student', method: 'GET',
    path: ids => `/api/submissions?studentId=${ids.foreign}`,
    expect: [403, 404],
  },
  {
    name: 'ученик НЕ может выставить оценку',
    role: 'student', method: 'POST',
    path: () => `/api/grades`,
    expect: [403, 404, 405],
  },
  {
    name: 'ученик НЕ читает список пользователей',
    role: 'student', method: 'GET',
    path: () => `/api/admin/users`,
    expect: [403, 404],
  },
  {
    name: 'преподаватель НЕ читает админские настройки',
    role: 'teacher', method: 'GET',
    path: () => `/api/admin/settings`,
    expect: [403, 404],
  },
  {
    name: 'родитель НЕ читает аналитику чужого ребёнка',
    role: 'parent', method: 'GET',
    path: ids => `/api/analytics/student/${ids.foreign}`,
    expect: [403, 404],
  },
  {
    name: 'сырые кадры SEduM недоступны через API никому',
    role: 'admin', method: 'GET',
    path: ids => `/api/sedum/raw/${ids.own}`,
    expect: [403, 404],
  },
  {
    name: 'преподаватель НЕ управляет чужими группами',
    role: 'teacher', method: 'PUT',
    path: () => `/api/groups/foreign-group-1`,
    expect: [403, 404],
  },
  {
    name: 'ученик НЕ вызывает экспорт данных',
    role: 'student', method: 'POST',
    path: () => `/api/admin/export`,
    expect: [403, 404, 405],
  },
  {
    name: 'родитель НЕ меняет оценки',
    role: 'parent', method: 'POST',
    path: () => `/api/grades`,
    expect: [403, 404, 405],
  },
  {
    name: 'неистёкший токен обязателен: без него аналитика 401',
    role: 'student', method: 'GET',
    path: ids => `/api/analytics/student/${ids.own}?noauth=1`,
    expect: [200, 401],   // 200 если own-доступ, 401 если бэкенд трактует noauth — оба валидны как явный контроль
  },
];

/** Видео-фикстуры для SEduM и ожидаемое дискретное состояние. */
export const videoFixtures = {
  attentive:  { file: 'attentive_15s.y4m',  expect: attentionLabels.attentive },
  lookingAway:{ file: 'looking_away_15s.y4m', expect: attentionLabels.away },
  noFace:     { file: 'no_face_10s.y4m',    expect: attentionLabels.noFace },
  eyesClosed: { file: 'eyes_closed_15s.y4m', expect: attentionLabels.attentive },
  lowLight:   { file: 'low_light_15s.y4m',  expect: attentionLabels.attentive },
} as const;


/**
 * ── SEduM: проекты по фикстурам ───────────────────────────────────
 * Каждая запись → отдельный проект Playwright, запускающий Chrome
 * с подменённой камерой (своё видео). Тест читает project.name и
 * сверяет фактическое дискретное состояние с ожидаемым.
 * Это единый источник правды: и для playwright.config.ts, и для теста.
 */
export interface SedumFixtureCase {
  file: string;            // Y4M-фикстура в tests/fixtures/video/
  expect: string;          // ожидаемое дискретное состояние
  fatigue?: boolean;       // ожидается подсказка об усталости
  noFace?: boolean;        // кадр без лица: сессия не должна падать
}

export const sedumFixtureProjects: Record<string, SedumFixtureCase> = {
  'sedum-attentive':  { file: 'attentive_15s.y4m',   expect: attentionLabels.attentive },
  'sedum-away':       { file: 'looking_away_15s.y4m', expect: attentionLabels.away },
  'sedum-noface':     { file: 'no_face_10s.y4m',      expect: attentionLabels.noFace, noFace: true },
  'sedum-eyesclosed': { file: 'eyes_closed_15s.y4m',  expect: attentionLabels.attentive, fatigue: true },
  'sedum-lowlight':   { file: 'low_light_15s.y4m',    expect: attentionLabels.attentive },
};
