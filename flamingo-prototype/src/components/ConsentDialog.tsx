import { setConsent } from '../lib/session';

export default function ConsentDialog({ onDecide }: { onDecide: (v: boolean) => void }) {
  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label="Согласие на обработку" data-testid="consent-dialog">
      <h2>Согласие законного представителя</h2>
      <p>
        Модуль вовлечённости (SEduM) использует камеру локально на устройстве.
        В демо ничего не записывается и не отправляется. В реальном продукте
        запуск возможен только после согласия родителя/опекуна (152-ФЗ).
      </p>
      <div className="row">
        <button data-testid="consent-accept-button" onClick={() => { setConsent(true); onDecide(true); }}>
          Согласен(на)
        </button>
        <button className="ghost" data-testid="consent-decline-button" onClick={() => { setConsent(false); onDecide(false); }}>
          Не сейчас
        </button>
      </div>
    </div>
  );
}
