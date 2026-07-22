import { useState } from 'react';
import SedumSession from '../components/SedumSession';
import ConsentDialog from '../components/ConsentDialog';
import { hasConsent } from '../lib/session';

export default function Lesson() {
  const cameraDenied = new URLSearchParams(location.search).get('cam') === 'deny';
  const [consent, setConsent] = useState(hasConsent());
  const [submitted, setSubmitted] = useState(false);

  return (
    <main className="lesson" data-testid="lesson-player">
      <h1>Урок · Обыкновенные дроби</h1>
      <div className="lesson-body">
        <article>
          <p>Демонстрационный урок. Ниже — учебный материал и задание.</p>
          {!submitted
            ? <button data-testid="submit-assignment-button" onClick={() => setSubmitted(true)}>Сдать задание</button>
            : <p data-testid="assignment-status">Задание отправлено — на проверке</p>}
        </article>
        {!consent
          ? <ConsentDialog onDecide={setConsent} />
          : <SedumSession cameraDenied={cameraDenied} />}
      </div>
    </main>
  );
}
