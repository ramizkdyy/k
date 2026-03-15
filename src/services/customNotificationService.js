class CustomNotificationService {
  constructor() {
    this.showNotification = null;
    this.shouldFilterNotification = null; // Navigation filtering function
    this.recentNotifications = new Map(); // messageId -> timestamp
    this.duplicateThreshold = 3000; // 3 saniye içinde aynı mesaj duplicate sayılır
    this.notificationCounter = 0; // Debug için
  }

  // Set the showNotification function from context
  setShowNotification(showNotificationFn) {
    this.showNotification = showNotificationFn;
  }

  // Set the filtering function from context
  setFilterFunction(filterFn) {
    this.shouldFilterNotification = filterFn;
  }

  // ✅ Enhanced duplicate notification kontrolü
  isDuplicate(messageId, content, source = "unknown") {
    this.notificationCounter++;


    if (!messageId && !content) {
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
          return true;
        }
      }
    }

    // Not duplicate - save all keys
    keys.forEach((key) => {
      this.recentNotifications.set(key, now);
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

    if (!this.showNotification) {
      return;
    }

    // ✅ Check navigation filtering first
    const notificationData = {
      title,
      message,
      profileImage,
      isOnline,
      data,
      duration
    };
    
    if (this.shouldFilterNotification && this.shouldFilterNotification(notificationData)) {
      return; // Filtered by navigation state
    }

    // ✅ Enhanced duplicate kontrolü with source tracking
    const messageId = data?.messageId || data?.id;
    if (this.isDuplicate(messageId, message, source)) {
      return; // Duplicate, gösterme
    }


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
  }

  // ✅ Debug metodu - cache durumunu göster
  debugStatus() {
  }
}

export default new CustomNotificationService();
