const path = require('path');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const config = require('../config/config');

let supabase;

// Local disk storage fallback for when Supabase Service Role Key is not configured
const createLocalBucket = () => {
  const baseDir = path.resolve(__dirname, '../../uploads/resumes');
  if (!fs.existsSync(baseDir)) {
    fs.mkdirSync(baseDir, { recursive: true });
  }

  return {
    async upload(filePath, buffer) {
      try {
        const fullPath = path.join(baseDir, filePath);
        const dir = path.dirname(fullPath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        await fs.promises.writeFile(fullPath, buffer);
        return { data: { path: filePath }, error: null };
      } catch (err) {
        return { data: null, error: err };
      }
    },
    async download(filePath) {
      try {
        const fullPath = path.join(baseDir, filePath);
        if (!fs.existsSync(fullPath)) {
          return { data: null, error: new Error('File not found') };
        }
        const buffer = await fs.promises.readFile(fullPath);
        return {
          data: {
            arrayBuffer: async () => buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength),
          },
          error: null,
        };
      } catch (err) {
        return { data: null, error: err };
      }
    },
    async remove(filePaths) {
      try {
        for (const fp of filePaths) {
          const fullPath = path.join(baseDir, fp);
          if (fs.existsSync(fullPath)) {
            await fs.promises.unlink(fullPath);
          }
        }
        return { data: filePaths, error: null };
      } catch (err) {
        return { data: null, error: err };
      }
    },
  };
};

const getBucket = () => {
  if (config.supabase.url && config.supabase.serviceRoleKey) {
    if (!supabase) {
      supabase = createClient(config.supabase.url, config.supabase.serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
    }
    return supabase.storage.from(config.supabase.resumeBucket);
  }

  // Graceful fallback to local disk storage
  return createLocalBucket();
};

module.exports = { getBucket };
