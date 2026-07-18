import React from 'react';
import { primaryRooms } from './headquartersData';

export default function HeadquartersDoors({ onNavigate }) {
  return (
    <section className="hq-section" aria-labelledby="primary-rooms-title">
      <h2 id="primary-rooms-title">Explore Headquarters</h2>
      <div className="hq-rooms" data-testid="headquarters-primary-doors">
        {primaryRooms.map((room) => (
          <article className={`hq-room-card hq-room-card--${room.key}`} data-testid="headquarters-primary-door" key={room.key}>
            <div className="hq-room-card__icon" aria-hidden="true">{room.icon}</div>
            <h3>{room.title}<span>{room.room}</span></h3>
            <p>{room.purpose}</p>
            <button type="button" disabled={!room.enabled} onClick={() => room.enabled && onNavigate(room.destination)}>{room.actionLabel} <span aria-hidden="true">→</span></button>{!room.enabled ? <small>Coming Soon</small> : null}
          </article>
        ))}
      </div>
    </section>
  );
}
