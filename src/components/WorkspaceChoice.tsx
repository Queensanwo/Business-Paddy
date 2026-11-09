import type { WorkspaceKind } from '@/lib/professionalProfile';
import styles from './WorkspaceChoice.module.css';

const options = [
  { value: 'BUSINESS', title: 'Business', description: 'Manage customer chats and your team in one inbox.' },
  { value: 'PROFESSIONAL', title: 'Professional', description: 'Show your work and get enquiries through your portfolio.' },
] as const;

export function WorkspaceChoice({ value, onChange, disabled }: {
  value: WorkspaceKind;
  onChange: (value: WorkspaceKind) => void;
  disabled: boolean;
}) {
  return (
    <fieldset className={styles.group} disabled={disabled}>
      <legend>How will you use Business Paddy?</legend>
      <div className={styles.options}>
        {options.map((option) => (
          <label className={styles.option} key={option.value}>
            <input className={styles.radio} type="radio" name="workspaceKind" value={option.value}
              checked={value === option.value} onChange={() => onChange(option.value)} />
            <span className={styles.card}>
              <span className={styles.copy}><strong>{option.title}</strong><span>{option.description}</span></span>
              <span className={styles.indicator} aria-hidden="true" />
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
