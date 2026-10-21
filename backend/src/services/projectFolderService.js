const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

/**
 * Calculates Indian Financial Year string (e.g. "2024-25", "2026-27")
 * Apr - Dec belongs to current year - next year
 * Jan - Mar belongs to previous year - current year
 */
const getFinancialYear = (d = new Date()) => {
  const date = new Date(d);
  const validDate = isNaN(date.getTime()) ? new Date() : date;
  const month = validDate.getMonth(); // 0 is January, 3 is April
  const fullYear = validDate.getFullYear();
  const startYear = month >= 3 ? fullYear : fullYear - 1;
  const endYear = (startYear + 1).toString().slice(-2);
  return `${startYear}-${endYear}`;
};

/**
 * Sanitizes a string for use in Windows folder names
 * Removes / \ : * ? " < > | and trims spaces
 */
const sanitizeFolderName = (str) => {
  if (!str) return '';
  return String(str)
    .replace(/[\\/:*?"<>|]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Subfolder structure matching the user's handwritten diagram
 */
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
 * Formats standard project folder name:
 * [ORDER_NO] - [CUSTOMER_NAME] - [REFERENCE_NAME]
 * e.g., "187 - Pranjal Spaces - Ravet"
 */
const buildProjectFolderName = ({ siteRef, customerName, referenceName, location, startDate }) => {
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
 * Creates customer folder and all nested subfolders on disk
 */
const createCustomerProjectFolder = async ({ siteRef, customerName, referenceName, location, startDate }) => {
  try {
    let baseDir = process.env.CUSTOMER_PROJECTS_DIR || 'F:\\1. MODERN INTERIOR\\RUNNING FOLDER\\MODERN-2024-25- RUNNING';

    // Smart drive detection: if target drive (e.g. F:\) is not available on this machine (e.g. testing on laptop),
    // automatically fallback to the local Testing directory.
    const driveMatch = String(baseDir).match(/^([a-zA-Z]:)/);
    if (driveMatch && !fs.existsSync(driveMatch[1] + '\\')) {
      console.warn(`[ProjectFolderService] Target drive ${driveMatch[1]} not connected on this machine. Falling back to local Testing directory.`);
      baseDir = path.resolve(__dirname, '../../../../Testing');
    }

    // Ensure base directory exists
    if (!fs.existsSync(baseDir)) {
      fs.mkdirSync(baseDir, { recursive: true });
    }

    const folderName = buildProjectFolderName({ siteRef, customerName, referenceName, location, startDate });
    const customerFolderPath = path.join(baseDir, folderName);

    // Create main customer folder
    if (!fs.existsSync(customerFolderPath)) {
      fs.mkdirSync(customerFolderPath, { recursive: true });
    }

    // Create all nested subfolders
    for (const sub of PROJECT_SUBFOLDERS) {
      const fullSubPath = path.join(customerFolderPath, sub);
      if (!fs.existsSync(fullSubPath)) {
        fs.mkdirSync(fullSubPath, { recursive: true });
      }
    }

    console.log(`[ProjectFolderService] Successfully created project folder: ${customerFolderPath}`);
    return {
      success: true,
      folderName,
      folderPath: customerFolderPath
    };
  } catch (error) {
    console.error('[ProjectFolderService] Error creating customer folder:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Opens the project folder in Windows File Explorer
 */
const openProjectFolder = (folderPath) => {
  return new Promise((resolve, reject) => {
    if (!folderPath) {
      return reject(new Error('Folder path is required'));
    }

    if (!fs.existsSync(folderPath)) {
      return reject(new Error(`Folder does not exist at: ${folderPath}`));
    }

    // Windows command to open explorer reliably without exit code errors
    const normalized = path.normalize(folderPath);
    const cmd = `cmd /c start "" "${normalized}"`;
    exec(cmd, (error) => {
      if (error && error.code !== 1) {
        console.error('[ProjectFolderService] Error opening explorer:', error);
        return reject(error);
      }
      resolve(true);
    });
  });
};

module.exports = {
  createCustomerProjectFolder,
  openProjectFolder,
  buildProjectFolderName,
  getFinancialYear,
  PROJECT_SUBFOLDERS
};
