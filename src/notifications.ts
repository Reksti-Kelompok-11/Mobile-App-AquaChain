import AsyncStorage from '@react-native-async-storage/async-storage';

export type NotificationStatus = 'bahaya' | 'waspada' | 'info' | 'selesai';

export type NotificationItem = {
  id: string;
  title: string;
  description: string;
  status: NotificationStatus;
  sourceLabel?: string;
  createdAt: string;
  iconName?: string;
  actionLabel?: string;
  telemetryId?: string;
  pondId?: string;
};

const STORAGE_KEY = 'aquachain.notifications';
const MAX_NOTIFICATIONS = 200;

function isNotificationItem(value: unknown): value is NotificationItem {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.id === 'string' &&
    typeof record.title === 'string' &&
    typeof record.description === 'string' &&
    typeof record.status === 'string' &&
    typeof record.createdAt === 'string'
  );
}

export async function loadNotifications(): Promise<NotificationItem[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isNotificationItem);
  } catch (error) {
    console.warn('Failed to read notifications', error);
    return [];
  }
}

export async function saveNotifications(items: NotificationItem[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export async function addNotification(item: NotificationItem): Promise<NotificationItem[]> {
  const current = await loadNotifications();
  if (current.some((existing) => existing.id === item.id)) return current;

  const next = [item, ...current].slice(0, MAX_NOTIFICATIONS);
  await saveNotifications(next);
  return next;
}

export async function clearNotifications(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}
