'use client';

interface ChipProps {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
  'data-filter'?: string;
}

export function Chip({ children, active, onClick, 'data-filter': dataFilter }: ChipProps) {
  return (
    <button
      className={`chip ${active ? 'active' : ''}`}
      onClick={onClick}
      data-filter={dataFilter}
      type="button"
    >
      {children}
    </button>
  );
}