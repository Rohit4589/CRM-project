/**
 * Modern Interior CRM - Local Folder Bridge Client
 * 
 * Communicates with the local bridge service running on the office CPU (port 5001)
 * to create folders on the physical F:\ drive and open Windows File Explorer.
 */

const CANDIDATE_URLS = ['http://127.0.0.1:5001', 'http://localhost:5001'];
let activeBridgeUrl = CANDIDATE_URLS[0];

/**
 * Quick ping to see if the office CPU bridge is running
 * @param {number} timeoutMs
 * @returns {Promise<{online: boolean, data?: any}>}
 */
export async function checkBridgeStatus(timeoutMs = 1500) {
  for (const url of CANDIDATE_URLS) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      const res = await fetch(`${url}/api/status`, {
        method: 'GET',
        signal: controller.signal
      });
      clearTimeout(timer);

      if (res.ok) {
        const data = await res.json();
        activeBridgeUrl = url;
        return { online: true, data };
      }
    } catch {
      // Try next candidate URL
    }
  }
  return { online: false };
}

/**
 * Creates customer folder and all 9 nested subfolders on F:\ drive
 * @param {Object} siteData - { siteRef, customerName, location, referenceName, startDate }
 * @returns {Promise<{success: boolean, folderPath?: string, folderName?: string, error?: string}>}
 */
export async function createLocalProjectFolder(siteData) {
  try {
    const res = await fetch(`${activeBridgeUrl}/api/create-folder`, {
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
    const res = await fetch(`${activeBridgeUrl}/api/open-folder`, {
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
    const res = await fetch(`${activeBridgeUrl}/api/sync-all-sites`, {
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
