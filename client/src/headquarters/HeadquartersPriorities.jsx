import React from 'react';
import { priorities } from './headquartersData';

export default function HeadquartersPriorities({ onNavigate }) {
  return (
    <section className="hq-priority-bar" aria-labelledby="priorities-title">
      <h2 id="priorities-title">Quick Actions</h2>
      <div className="hq-priority-actions" data-testid="headquarters-priorities">
        {priorities.map((priority) => (
          <button data-testid="headquarters-priority-item" type="button" disabled={!priority.enabled} onClick={() => priority.enabled && onNavigate(priority.destination)} key={priority.description}>
            <span aria-hidden="true">{priority.icon}</span>{priority.description}
          </button>
        ))}
      </div>
    </section>
  );
}
