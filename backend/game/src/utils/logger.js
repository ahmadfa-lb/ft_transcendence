export  default {
    info: (message) => {
      console.log(`[INFO] ${new Date().toISOString()} - ${message}`);
    },
    
    error: (message) => {
      console.error(`[ERROR] ${new Date().toISOString()} - ${message}`);
    },
    
    warn: (message) => {
      console.warn(`[WARN] ${new Date().toISOString()} - ${message}`);
    },
    
    debug: (message) => {
      if (process.env.NODE_ENV !== 'production') {
        console.debug(`[DEBUG] ${new Date().toISOString()} - ${message}`);
      }
    }
  };
  