/**
 * Modern Interior CRM - Local Folder Bridge Client
 * 
 * Communicates with the local bridge service running on the office CPU (http://127.0.0.1:5001)
 * to create folders on the physical F:\ drive and open Windows File Explorer.
 */

const BRIDGE_URL = 'http://127.0.0.1:5001';

/**
 * Quick ping to see if the office CPU bridge is running
 * @param {number} timeoutMs
 * @returns {Promise<{online: boolean, data?: any}>}
 */
export async function checkBridgeStatus(timeoutMs = 1200) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const res = await fetch(`${BRIDGE_URL}/api/status`, {
      method: 'GET',
      signal: controller.signal
    });
    clearTimeout(timer);

    if (res.ok) {
      const data = await res.json();
      return { online: true, data };
    }
    return { online: false };
  } catch {
    return { online: false };
  }
}

/**
 * Creates customer folder and all 9 nested subfolders on F:\ drive
 * @param {Object} siteData - { siteRef, customerName, location, referenceName, startDate }
 * @returns {Promise<{success: boolean, folderPath?: string, folderName?: string, error?: string}>}
 */
export async function createLocalProjectFolder(siteData) {
  try {
    const res = await fetch(`${BRIDGE_URL}/api/create-folder`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        siteRef: siteData.siteRef || siteData.siteCode || siteData.id,
        customerName: siteData.customerName,
        referenceName: siteData.location || siteData.refName,
        location: siteData.location
      })
    });

    const data = await res.json();
    return data;
  } catch (err) {
    return {
      success: false,
      error: 'Could not connect to local folder bridge on port 5001: ' + err.message
    };
  }
}

/**
 * Opens project folder in Windows File Explorer
 * @param {Object} params - { folderPath, siteRef, customerName, location, referenceName }
 * @returns {Promise<{success: boolean, message?: string, error?: string}>}
 */
export async function openLocalProjectFolder(params) {
  try {
    const res = await fetch(`${BRIDGE_URL}/api/open-folder`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        folderPath: params.folderPath,
        siteRef: params.siteRef || params.siteCode || params.id,
        customerName: params.customerName,
        referenceName: params.location || params.refName,
        location: params.location
      })
    });

    const data = await res.json();
    return data;
  } catch (err) {
    return {
      success: false,
      error: 'Could not connect to local folder bridge on port 5001: ' + err.message
    };
  }
}

/**
 * Batch creates folders on F:\ drive for all existing sites in database
 * @param {Array} sites
 * @returns {Promise<{success: boolean, count?: number, synced?: Array, error?: string}>}
 */
export async function syncAllLocalFolders(sites) {
  try {
    const res = await fetch(`${BRIDGE_URL}/api/sync-all-sites`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sites })
    });

    const data = await res.json();
    return data;
  } catch (err) {
    return {
      success: false,
      error: 'Could not connect to local folder bridge: ' + err.message
    };
  }
}
