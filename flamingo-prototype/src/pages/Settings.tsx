import { setConsent, hasConsent } from '../lib/session';
import { useState } from 'react';

export function PrivacySettings() {
  const [consent, setC] = useState(hasConsent());
  return (
    <main className="cabinet">
      <h1>Приватность</h1>
      <section className="card">
        <p>Сырые данные камеры не покидают устройство. На сервер — только агрегаты.</p>
        <p>Согласие на аналитику вовлечённости: <b>{consent ? 'дано' : 'не дано'}</b></p>
        <button onClick={() => { setConsent(false); setC(false); }}>Отозвать согласие</button>
      </section>
    </main>
  );
}

export function SecuritySettings() {
  return (
    <main className="cabinet">
      <h1>Безопасность</h1>
      <section className="card">
        <button data-testid="logout-all-button" onClick={() => alert('DEMO: выход со всех устройств')}>
          Выйти со всех устройств
        </button>
      </section>
    </main>
  );
}
