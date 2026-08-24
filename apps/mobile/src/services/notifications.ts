import * as Notifications from 'expo-notifications';
import { strings } from '../i18n';

export function configureNotifications() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

export async function requestNotificationPermission(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

function parseTime(slot: string): { hour: number; minute: number } {
  const [hour, minute] = slot.split(':').map(Number);
  return { hour, minute };
}

/** Schedule a repeating daily notification for each "HH:mm" slot. */
export async function scheduleDailyReminders(times: string[]): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();

  for (const slot of times) {
    const { hour, minute } = parseTime(slot);
    await Notifications.scheduleNotificationAsync({
      content: {
        title: strings.appName,
        body: strings.reminderBody,
      },
      trigger: { hour, minute, repeats: true },
    });
  }
}

export async function cancelAllReminders(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
