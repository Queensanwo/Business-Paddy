'use client';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'whatsapp' | 'instagram' | 'email' | 'tiktok' | 'paddy_chat' | 'facebook' | 'status';
  statusType?: 'new' | 'in-progress' | 'waiting' | 'follow-up' | 'needs-approval' | 'escalated' | 'resolved';
  className?: string;
}

export function Badge({ children, variant, statusType, className = '' }: BadgeProps) {
  const baseClass = 'badge';
  const variantClass = variant ? ` ${variant}` : '';
  const statusClass = statusType ? ` status ${statusType}` : '';

  return (
    <span className={`${baseClass}${variantClass}${statusClass} ${className}`}>
      {children}
    </span>
  );
}