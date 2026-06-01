// NotificationService temporarily disabled due to dependency corruption.
// Will be restored once expo-notifications install is fixed.

export class NotificationService {
  static async registerForPushNotificationsAsync() {
    return null;
  }

  static async scheduleLocalNotification() {
    return;
  }

  static async initBackgroundHandler() {
    return;
  }

  static addNotificationListeners() {
    return () => {};
  }
}

export default NotificationService;
