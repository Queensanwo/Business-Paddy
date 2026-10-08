'use client';

interface MetricCardsProps {
  total: number;
  answered: number;
  unanswered: number;
}

export function MetricCards({ total, answered, unanswered }: MetricCardsProps) {
  return (
    <div className="metrics">
      <article className="card received">
        <div className="label">Conversations received</div>
        <div className="value" id="metricReceived">{total}</div>
      </article>
      <article className="card answered">
        <div className="label">Conversations answered</div>
        <div className="value" id="metricAnswered">{answered}</div>
      </article>
      <article className="card unanswered">
        <div className="label">Conversations unanswered</div>
        <div className="value" id="metricUnanswered">{unanswered}</div>
      </article>
    </div>
  );
}