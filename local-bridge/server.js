/**
 * Modern Interior CRM - Local Folder Bridge Server
 * 
 * Runs on the office CPU workstation at http://127.0.0.1:5001
 * Creates project folders on F:\ drive and opens Windows File Explorer
 * directly when commands are sent from the live CRM website.
 * 
 * Uses standard Node.js built-ins only (no npm install required).
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const PORT = process.env.BRIDGE_PORT || 5001;

// Base directory requested by user
const TARGET_BASE_DIR = process.env.CUSTOMER_PROJECTS_DIR || 'F:\\1. MODERN INTERIOR\\RUNNING FOLDER\\MODERN-2024-25- RUNNING';

// Subfolders matching Modern Interior project standards
const PROJECT_SUBFOLDERS = [
  path.join('Drawings', 'AutoCad Drawings', 'Auto Cad File'),
  path.join('Drawings', 'AutoCad Drawings', 'PDF & JPG'),
  path.join('Drawings', 'Sketch up Drawings', 'PDF & JPG'),
  path.join('Drawings', 'Sketch up Drawings', 'Sketch Up File'),
  path.join('Estimate', 'PDF'),
  'Materials Order and Bills',
  path.join('Site Images & Videos', 'After Work'),
  path.join('Site Images & Videos', 'Before Work'),
  path.join('Site Images & Videos', 'Running work'),
];

/**
 * Clean string for safe Windows folder names
 */
const sanitizeFolderName = (str) => {
  if (!str) return '';
  return String(str)
    .replace(/[\\/:*?"<>|]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Builds standard folder name:
 * [ORDER_NO] - [CUSTOMER_NAME] - [REFERENCE/LOCATION]
 */
const buildProjectFolderName = ({ siteRef, customerName, referenceName, location }) => {
  const cleanOrder = sanitizeFolderName(siteRef || '').replace(/^MI-\d{4}-\d{2}-/i, '').trim();
  const cleanName = sanitizeFolderName(customerName || '').trim();
  const cleanRef = sanitizeFolderName(referenceName || location || '').trim();

  const parts = [cleanOrder, cleanName];
  if (cleanRef && cleanRef.toLowerCase() !== cleanName.toLowerCase()) {
    parts.push(cleanRef);
  }
  return parts.filter(Boolean).join(' - ');
};

/**
 * Resolves the actual base directory:
 * Uses F:\ if connected; falls back to local Testing directory if on a dev laptop without F:\.
 */
const getEffectiveBaseDir = () => {
  const driveMatch = String(TARGET_BASE_DIR).match(/^([a-zA-Z]:)/);
  if (driveMatch && !fs.existsSync(driveMatch[1] + '\\')) {
    // If running on a laptop where F: isn't plugged in yet, fallback to local Testing directory
    const fallback = path.resolve(__dirname, '../Testing');
    return {
      baseDir: fallback,
      isTargetDriveConnected: false,
      targetDrive: driveMatch[1],
      isFallback: true
    };
  }

  return {
    baseDir: TARGET_BASE_DIR,
    isTargetDriveConnected: true,
    targetDrive: driveMatch ? driveMatch[1] : '',
    isFallback: false
  };
};

/**
 * Creates customer folder and all 9 nested subfolders on disk
 */
const createFolderOnDisk = ({ siteRef, customerName, referenceName, location }) => {
  const { baseDir, isTargetDriveConnected, targetDrive, isFallback } = getEffectiveBaseDir();

  if (!fs.existsSync(baseDir)) {
    fs.mkdirSync(baseDir, { recursive: true });
  }

  const folderName = buildProjectFolderName({ siteRef, customerName, referenceName, location });
  if (!folderName) {
    throw new Error('Customer name or site reference is missing.');
  }

  const customerFolderPath = path.join(baseDir, folderName);

  if (!fs.existsSync(customerFolderPath)) {
    fs.mkdirSync(customerFolderPath, { recursive: true });
  }

  for (const sub of PROJECT_SUBFOLDERS) {
    const fullSubPath = path.join(customerFolderPath, sub);
    if (!fs.existsSync(fullSubPath)) {
      fs.mkdirSync(fullSubPath, { recursive: true });
    }
  }

  return {
    success: true,
    folderName,
    folderPath: customerFolderPath,
    baseDir,
    isTargetDriveConnected,
    targetDrive,
    isFallback
  };
};

/**
 * Opens Windows File Explorer for a folder path
 */
const openInExplorer = (folderPath) => {
  return new Promise((resolve, reject) => {
    if (!folderPath) {
      return reject(new Error('Folder path is required.'));
    }

    if (!fs.existsSync(folderPath)) {
      return reject(new Error(`Folder does not exist: ${folderPath}`));
    }

    const normalized = path.normalize(folderPath);
    // Explorer /select or open folder
    const cmd = `explorer.exe "${normalized}"`;
    exec(cmd, (err) => {
      // explorer.exe often returns code 1 even on success in some Windows versions
      if (err && err.code !== 1) {
        console.error('[Bridge] Error opening explorer:', err);
        return reject(err);
      }
      resolve(true);
    });
  });
};

// Send JSON response with CORS headers
const sendJson = (res, statusCode, data) => {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Allow-Private-Network': 'true',
  });
  res.end(JSON.stringify(data));
};

// Parse JSON request body
const parseBody = (req) => {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        resolve({});
      }
    });
  });
};

const server = http.createServer(async (req, res) => {
  // CORS Preflight (including Chrome Private Network Access)
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      'Access-Control-Allow-Private-Network': 'true',
    });
    return res.end();
  }

  const url = req.url.split('?')[0];

  try {
    // 1. Health / Status check
    if (req.method === 'GET' && (url === '/' || url === '/health' || url === '/api/status')) {
      const { baseDir, isTargetDriveConnected, targetDrive, isFallback } = getEffectiveBaseDir();
      return sendJson(res, 200, {
        success: true,
        service: 'Modern Interior Local Folder Bridge',
        status: 'online',
        port: PORT,
        targetBaseDir: TARGET_BASE_DIR,
        activeBaseDir: baseDir,
        isTargetDriveConnected,
        targetDrive,
        isFallback
      });
    }

    // 2. Create Project Folder
    if (req.method === 'POST' && url === '/api/create-folder') {
      const body = await parseBody(req);
      const result = createFolderOnDisk(body);
      console.log(`[Bridge] Created folder: ${result.folderPath}`);
      return sendJson(res, 200, result);
    }

    // 3. Open Project Folder in Windows Explorer
    if (req.method === 'POST' && url === '/api/open-folder') {
      const body = await parseBody(req);
      let targetPath = body.folderPath;

      // If no valid folderPath was provided or it points to a cloud/Linux path (/opt/render/...),
      // regenerate the real path on the Windows machine
      if (!targetPath || targetPath.startsWith('/opt/render') || !fs.existsSync(targetPath)) {
        const createRes = createFolderOnDisk(body);
        targetPath = createRes.folderPath;
      }

      await openInExplorer(targetPath);
      console.log(`[Bridge] Opened in File Explorer: ${targetPath}`);
      return sendJson(res, 200, {
        success: true,
        message: 'Folder opened in Windows File Explorer',
        folderPath: targetPath
      });
    }

    // 4. Batch Sync All Sites
    if (req.method === 'POST' && url === '/api/sync-all-sites') {
      const body = await parseBody(req);
      const sites = Array.isArray(body.sites) ? body.sites : [];
      const synced = [];

      for (const s of sites) {
        try {
          const resObj = createFolderOnDisk({
            siteRef: s.siteRef || s.id,
            customerName: s.customerName,
            referenceName: s.location || s.refName,
            location: s.location
          });
          synced.push({
            id: s.dbId || s.id,
            siteRef: s.siteRef || s.id,
            customerName: s.customerName,
            folderPath: resObj.folderPath
          });
        } catch (err) {
          console.warn(`[Bridge] Failed to sync folder for ${s.customerName}:`, err.message);
        }
      }

      return sendJson(res, 200, {
        success: true,
        count: synced.length,
        synced
      });
    }

    return sendJson(res, 404, { success: false, message: 'Endpoint not found' });
  } catch (error) {
    console.error('[Bridge] Request error:', error);
    return sendJson(res, 500, {
      success: false,
      error: error.message
    });
  }
});

server.listen(PORT, '0.0.0.0', () => {
  const { baseDir, isTargetDriveConnected } = getEffectiveBaseDir();
  console.log(`\n======================================================`);
  console.log(`🟢 Modern Interior Local Folder Bridge is RUNNING!`);
  console.log(`📡 URL: http://127.0.0.1:${PORT}`);
  console.log(`📁 Target Folder: ${TARGET_BASE_DIR}`);
  console.log(`💾 Active Base Dir: ${baseDir}`);
  console.log(`💿 F: Drive Detected: ${isTargetDriveConnected ? 'YES (Ready)' : 'NO (Using local fallback)'}`);
  console.log(`======================================================\n`);
});
