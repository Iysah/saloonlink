import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}



export const hasSubscriptionExpired = (endDate?: string) => {
  if (!endDate) return false;
  return new Date(endDate) < new Date();
};