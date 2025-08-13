class CustomNotificationService {
  constructor() {
    this.showNotification = null;
    this.recentNotifications = new Map(); // messageId -> timestamp
    this.duplicateThreshold = 3000; // 3 saniye içinde aynı mesaj duplicate sayılır
    this.notificationCounter = 0; // Debug için
  }

  // Set the showNotification function from context
  setShowNotification(showNotificationFn) {
    this.showNotification = showNotificationFn;
    console.log("✅ CustomNotificationService: showNotification function set");
  }

  // ✅ Enhanced duplicate notification kontrolü
  isDuplicate(messageId, content, source = "unknown") {
    this.notificationCounter++;

    console.log(`🔔 NOTIFICATION #${this.notificationCounter} ATTEMPT:`, {
      source,
      messageId,
      content: content?.substring(0, 50),
      timestamp: new Date().toISOString(),
    });

    if (!messageId && !content) {
      console.log("⚠️ No messageId or content for duplicate check");
      return false;
    }

    // Create multiple keys for different scenarios
    const keys = [
      messageId,
      `content_${content?.substring(0, 100)}`,
      `${messageId}_${source}`,
    ].filter(Boolean);

    const now = Date.now();

    // Check if any key exists in recent notifications
    for (const key of keys) {
      if (this.recentNotifications.has(key)) {
        const lastTime = this.recentNotifications.get(key);
        const timeDiff = now - lastTime;

        if (timeDiff < this.duplicateThreshold) {
          console.log(`🔄 DUPLICATE NOTIFICATION PREVENTED (${source}):`, {
            key,
            timeDiff: `${timeDiff}ms`,
            threshold: `${this.duplicateThreshold}ms`,
            lastTime: new Date(lastTime).toISOString(),
            currentTime: new Date(now).toISOString(),
          });
          return true;
        }
      }
    }

    // Not duplicate - save all keys
    keys.forEach((key) => {
      this.recentNotifications.set(key, now);
    });

    console.log(`✅ NEW NOTIFICATION ALLOWED (${source}):`, {
      keys,
      savedAt: new Date(now).toISOString(),
    });

    // Clean up old notifications
    this.cleanupOldNotifications(now);

    return false;
  }

  // Eski notification kayıtlarını temizle
  cleanupOldNotifications(currentTime) {
    let cleanupCount = 0;
    for (const [key, timestamp] of this.recentNotifications.entries()) {
      if (currentTime - timestamp > this.duplicateThreshold * 3) {
        this.recentNotifications.delete(key);
        cleanupCount++;
      }
    }

    if (cleanupCount > 0) {
      console.log(`🧹 Cleaned up ${cleanupCount} old notification records`);
    }
  }

  // Show a custom notification with enhanced logging
  show({
    title,
    message,
    profileImage = null,
    isOnline = false,
    data = {},
    duration = 4000,
    source = "unknown", // ✅ Add source tracking
  }) {
    console.log(`📱 SHOW NOTIFICATION CALLED (${source}):`, {
      title,
      message: message?.substring(0, 50),
      messageId: data?.messageId || data?.id,
      source,
      hasShowFunction: !!this.showNotification,
      timestamp: new Date().toISOString(),
    });

    if (!this.showNotification) {
      console.warn(
        `❌ CustomNotificationService: showNotification not set (${source})`
      );
      return;
    }

    // ✅ Enhanced duplicate kontrolü with source tracking
    const messageId = data?.messageId || data?.id;
    if (this.isDuplicate(messageId, message, source)) {
      console.log(`🚫 NOTIFICATION BLOCKED (${source}): Duplicate detected`);
      return; // Duplicate, gösterme
    }

    console.log(`🎯 SHOWING NOTIFICATION (${source}):`, {
      title,
      messageId,
      source,
      notificationCount: this.notificationCounter,
    });

    return this.showNotification({
      title,
      message,
      profileImage,
      isOnline,
      data,
      duration,
    });
  }

  // Show chat message notification
  showChatMessage({
    senderName,
    messageContent,
    senderImage = null,
    chatId,
    messageId = null,
    isOnline = true,
  }) {
    return this.show({
      title: senderName,
      message: messageContent,
      profileImage: senderImage,
      isOnline,
      data: {
        type: "new_message",
        chatId,
        messageId,
        senderName,
      },
      duration: 4000,
      source: "chatMessage", // ✅ Source tracking
    });
  }

  // Show offer notification
  showOfferNotification({ title, message, offerId = null }) {
    return this.show({
      title,
      message,
      data: {
        type: "new_offer",
        offerId,
      },
      duration: 4000,
      source: "offer", // ✅ Source tracking
    });
  }

  // Show Firebase notification
  showFirebaseNotification({ title, body, data = {} }) {
    return this.show({
      title: title || "Yeni mesaj",
      message: body,
      profileImage: data?.senderImage || data?.profileImage,
      isOnline: data?.isOnline || false,
      data: {
        ...data,
        type: data?.type || "firebase_notification",
      },
      duration: 4000,
      source: "firebase", // ✅ Source tracking
    });
  }

  // ✅ Cache temizleme metodu with logging
  clearCache() {
    const cacheSize = this.recentNotifications.size;
    this.recentNotifications.clear();
    this.notificationCounter = 0;
    console.log(`🧹 Notification cache cleared: ${cacheSize} items removed`);
  }

  // ✅ Debug metodu - cache durumunu göster
  debugStatus() {
    console.log("📊 NOTIFICATION SERVICE DEBUG STATUS:", {
      cacheSize: this.recentNotifications.size,
      totalNotificationAttempts: this.notificationCounter,
      hasShowFunction: !!this.showNotification,
      recentNotifications: Array.from(this.recentNotifications.entries()).map(
        ([key, timestamp]) => ({
          key,
          timestamp: new Date(timestamp).toISOString(),
          ageMs: Date.now() - timestamp,
        })
      ),
    });
  }
}

export default new CustomNotificationService();
