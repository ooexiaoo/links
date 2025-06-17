import { format, formatDistanceToNow, isBefore, parseISO } from 'date-fns';

export const formatDate = (dateString: string | Date, formatStr = 'PPpp') => {
  const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
  return format(date, formatStr);
};

export const formatDateRelative = (dateString: string) => {
  return formatDistanceToNow(parseISO(dateString), { addSuffix: true });
};

export const isExpired = (expiresAt: string | null | undefined) => {
  if (!expiresAt) return false;
  return isBefore(parseISO(expiresAt), new Date());
};

export const formatExpiration = (expiresAt: string | null) => {
  if (!expiresAt) return 'Never';
  return formatDate(expiresAt);
};

export const getDefaultExpirationDate = (days = 30) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
};
