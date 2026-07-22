import { useEffect, useState } from 'react';

type State = 'attentive' | 'away' | 'noface';
const LABEL: Record<State, string> = {
  attentive: 'Сосредоточен',
  away: 'Отвлечён',
  noface: 'Лицо не видно',
};

/**
 * Замоканный SEduM для прототипа.
 * Реальная камера/CMF не используются: демонстрируем ТОЛЬКО UI-поведение
 * (индикатор приватности, пауза, подсказка усталости, отказ камеры).
 * Состояние можно форсировать через ?sedum=away для показов.
 */
export default function SedumSession({ cameraDenied = false }: { cameraDenied?: boolean }) {
  const forced = new URLSearchParams(location.search).get('sedum') as State | null;
  const [paused, setPaused] = useState(false);
  const [state, setState] = useState<State>(forced ?? 'attentive');
  const [fatigue, setFatigue] = useState(new URLSearchParams(location.search).get('fatigue') === '1');

  useEffect(() => {
    if (forced || paused || cameraDenied) return;
    // Лёгкая «жизнь» индикатора в демо (не анализ, просто визуал)
    const t = setInterval(() => setState(s => (s === 'attentive' ? 'attentive' : s)), 4000);
    return () => clearInterval(t);
  }, [forced, paused, cameraDenied]);

  if (cameraDenied) {
    return (
      <div className="sedum" data-testid="camera-denied-notice">
        Камера отключена — урок доступен полностью, аналитика вовлечённости выключена.
      </div>
    );
  }

  return (
    <section className="sedum" data-testid="sedum-session" aria-label="Аналитика вовлечённости">
      {!paused && (
        <span className="privacy" data-testid="privacy-indicator" title="Камера активна локально">
          ● камера активна (локально)
        </span>
      )}
      <span className="badge" data-testid="attention-badge">{LABEL[state]}</span>
      {fatigue && (
        <span className="fatigue" data-testid="fatigue-hint">Сделай перерыв — глаза устали</span>
      )}
      <div className="row">
        {!paused ? (
          <button data-testid="pause-session-button" onClick={() => { setPaused(true); setFatigue(false); }}>
            Пауза
          </button>
        ) : (
          <button data-testid="resume-session-button" onClick={() => setPaused(false)}>Продолжить</button>
        )}
      </div>
    </section>
  );
}
