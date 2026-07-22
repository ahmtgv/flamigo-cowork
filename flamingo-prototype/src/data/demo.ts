// СИНТЕТИЧЕСКИЕ данные. Никаких реальных учеников. Только для прототипа.
export const courses = [
  { id: 'c1', title: 'Математика, 7 класс', lessons: 12, progress: 0.42 },
  { id: 'c2', title: 'Русский язык, 7 класс', lessons: 10, progress: 0.20 },
  { id: 'c3', title: 'Английский, 7 класс', lessons: 14, progress: 0.65 },
];

export const schedule = [
  { day: 'Пн', time: '10:00', title: 'Математика · Дроби' },
  { day: 'Ср', time: '12:00', title: 'Английский · Present Simple' },
  { day: 'Пт', time: '11:00', title: 'Русский · Причастия' },
];

export const materials = [
  { id: 'm1', title: 'Конспект: обыкновенные дроби' },
  { id: 'm2', title: 'Видео: сложение дробей' },
  { id: 'm3', title: 'Тест для самопроверки' },
];

export const submissions = [
  { id: 's1', student: 'Ученик A', assignment: 'Дроби · ДЗ 3', status: 'на проверке' },
  { id: 's2', student: 'Ученик B', assignment: 'Дроби · ДЗ 3', status: 'на проверке' },
];

export const students = [
  { id: 'st1', name: 'Ученик A', group: '7-А', progress: 0.42 },
  { id: 'st2', name: 'Ученик B', group: '7-А', progress: 0.71 },
  { id: 'st3', name: 'Ученик C', group: '7-Б', progress: 0.33 },
];

// Заранее заготовленный тренд SEduM (НЕ реальная камера). Язык роста, без «диагнозов».
export const sedumTrend = [
  { week: 'Нед 1', focus: 0.55, note: 'Больше вовлечённости в задачах с примерами' },
  { week: 'Нед 2', focus: 0.61, note: 'Дольше удерживает внимание после разминки' },
  { week: 'Нед 3', focus: 0.58, note: 'Небольшой спад к концу недели' },
  { week: 'Нед 4', focus: 0.66, note: 'Растёт вовлечённость на коротких уроках' },
];
