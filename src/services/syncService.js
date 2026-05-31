import { initDB, markAsSynced, writeLog } from './db';

// Simulate sending data to backend
const simulateSync = async (prospect) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log('Synced prospect to backend:', prospect);
      resolve(true);
    }, 1000); // 1 second mock network delay
  });
};

export const syncData = async () => {
  if (!navigator.onLine) {
    console.log('Offline: sync deferred');
    return false;
  }
  
  try {
    const db = await initDB();
    const queue = await db.getAll('sync-queue');
    
    if (queue.length === 0) {
      return true; // nothing to sync
    }

    console.log(`Starting sync for ${queue.length} items...`);
    let syncedCount = 0;
    
    for (const item of queue) {
      const prospect = await db.get('prospects', item.prospectId);
      if (prospect && !prospect.synced) {
        const success = await simulateSync(prospect);
        if (success) {
          await markAsSynced(item.prospectId);
          await db.delete('sync-queue', item.id);
          syncedCount++;
        }
      } else {
        // Remove from queue if prospect was deleted or already synced
        await db.delete('sync-queue', item.id);
      }
    }
    
    if (syncedCount > 0) {
      // Write log for sync event
      await writeLog('SYNC_DATA', `Berhasil sinkronisasi otomatis ${syncedCount} data prospek offline ke server pusat.`);
    }

    console.log('Sync completed successfully');
    return true;
  } catch (err) {
    console.error('Error during sync:', err);
    return false;
  }
};
