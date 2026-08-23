import { forwardRef } from 'react';

const classes = (...values) => values.filter(Boolean).join(' ');

export function StudioSection({ title, help, className, children, ...props }) {
  return <section className={classes('studio-section', className)} {...props}>
    {title && <h3 className="studio-section__title">{title}</h3>}
    {help && <p className="studio-section__help">{help}</p>}
    {children}
  </section>;
}

export function StudioControlGroup({ className, children, ...props }) {
  return <div className={classes('studio-control-group', className)} {...props}>{children}</div>;
}

export const StudioTile = forwardRef(function StudioTile({ className, children, selected, editing, unavailable, ...props }, ref) {
  return <button ref={ref} type="button" className={classes('studio-tile', className)} aria-selected={selected} data-editing={editing || undefined} data-unavailable={unavailable || undefined} {...props}>{children}</button>;
});

export const StudioAction = forwardRef(function StudioAction({ className, children, variant = 'secondary', ...props }, ref) {
  return <button ref={ref} type="button" className={classes('studio-action', `studio-action--${variant}`, className)} {...props}>{children}</button>;
});

export const StudioIconButton = forwardRef(function StudioIconButton({ className, children, label, ...props }, ref) {
  return <button ref={ref} type="button" className={classes('studio-icon-button', className)} aria-label={label} {...props}>{children}</button>;
});

export const StudioChip = forwardRef(function StudioChip({ className, children, pressed, ...props }, ref) {
  return <button ref={ref} type="button" className={classes('studio-chip', className)} aria-pressed={pressed} {...props}>{children}</button>;
});

export function StudioContextPanel({ className, children, ...props }) {
  return <aside className={classes('studio-context-panel', className)} {...props}>{children}</aside>;
}
