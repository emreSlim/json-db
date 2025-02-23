export interface JsonDBConfig {
  downloadDbJson: () => Promise<object>;
  uploadDbJson: (object: object) => Promise<void>;
}

export class JsonDB {
  private static db = undefined as Record<string, any[]> | undefined;
  private static fetchDBPromise = undefined as Promise<any> | undefined;
  private static config: JsonDBConfig = {
    downloadDbJson: undefined,
    uploadDbJson: undefined,
  };

  static configure(config: JsonDBConfig) {
    JsonDB.config.downloadDbJson = config.downloadDbJson;
    JsonDB.config.uploadDbJson = config.uploadDbJson;
  }

  static checkConfigured() {
    if (
      JsonDB.config.downloadDbJson != null &&
      JsonDB.config.uploadDbJson != null
    ) {
      return;
    }

    throw new Error('JsonDB not configured');
  }

  private static fetchDB = async () => {
    JsonDB.checkConfigured();
    try {
      // fetch from remote file
      return await JsonDB.config.downloadDbJson();
    } catch (e) {
      console.error(e);
      throw e;
    } finally {
      JsonDB.fetchDBPromise = undefined;
    }
  };

  static async getDB() {
    if (JsonDB.db == null || Object.keys(JsonDB.db).length === 0) {
      JsonDB.fetchDBPromise = JsonDB.fetchDB();
      JsonDB.db = await JsonDB.fetchDBPromise;
    } else if (JsonDB.fetchDBPromise) {
      JsonDB.db = await JsonDB.fetchDBPromise;
    }
    return JsonDB.db;
  }

  private static saveTimeout = undefined as NodeJS.Timeout;
  private static saveDelay = 1000;

  static saveDB = () => {
    JsonDB.checkConfigured();
    clearTimeout(JsonDB.saveTimeout);
    JsonDB.saveTimeout = setTimeout(() => {
      // save to remote file
      JsonDB.config.uploadDbJson(JsonDB.db);
    }, JsonDB.saveDelay);
  };

  static async getTable(tableName: string) {
    const db = await JsonDB.getDB();
    return db[tableName] || [];
  }

  static saveTable(tableName: string, data: any[]) {
    JsonDB.db[tableName] = data;
    JsonDB.saveDB();
  }
}
