/**
 * Browser-compatible Azure Blob Storage upload via Vite dev proxy.
 * Uses Web Crypto API (crypto.subtle) for HMAC-SHA256 signing.
 * Requests are routed through /blob-proxy/ to avoid CORS.
 */

/**
 * Parse an Azure Storage connection string into its components.
 */
function parseConnectionString(connectionString) {
    const parts = {};
    connectionString.split(';').forEach(segment => {
        const idx = segment.indexOf('=');
        if (idx > -1) {
            const key = segment.substring(0, idx);
            const value = segment.substring(idx + 1);
            parts[key] = value;
        }
    });

    const accountName = parts['AccountName'];
    const accountKey = parts['AccountKey'];
    const endpointSuffix = parts['EndpointSuffix'] || 'core.windows.net';
    const protocol = parts['DefaultEndpointsProtocol'] || 'https';

    if (!accountName || !accountKey) {
        throw new Error('Connection string must contain AccountName and AccountKey.');
    }

    return { accountName, accountKey, endpointSuffix, protocol };
}

/**
 * Sign a string using HMAC-SHA256 with the given base64 key.
 * Returns a base64-encoded signature.
 */
async function hmacSha256(base64Key, stringToSign) {
    const keyBytes = Uint8Array.from(atob(base64Key), c => c.charCodeAt(0));
    const cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyBytes,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );
    const encoder = new TextEncoder();
    const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(stringToSign));
    return btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)));
}

/**
 * Build the Authorization header for an Azure Storage REST API request.
 */
async function buildAuthHeader(accountName, accountKey, method, canonicalPath, headers, contentLength) {
    // Canonicalized headers (x-ms-*)
    const xmsHeaders = {};
    for (const [key, value] of Object.entries(headers)) {
        const lower = key.toLowerCase();
        if (lower.startsWith('x-ms-')) {
            xmsHeaders[lower] = value;
        }
    }
    const canonicalizedHeaders = Object.keys(xmsHeaders)
        .sort()
        .map(k => `${k}:${xmsHeaders[k]}`)
        .join('\n');

    // Canonicalized resource
    const canonicalizedResource = `/${accountName}${canonicalPath}`;

    const stringToSign = [
        method,                                         // HTTP Verb
        headers['Content-Encoding'] || '',
        headers['Content-Language'] || '',
        contentLength === 0 ? '' : String(contentLength),
        headers['Content-MD5'] || '',
        headers['Content-Type'] || '',
        '',                                              // Date (empty when x-ms-date is used)
        headers['If-Modified-Since'] || '',
        headers['If-Match'] || '',
        headers['If-None-Match'] || '',
        headers['If-Unmodified-Since'] || '',
        headers['Range'] || '',
        canonicalizedHeaders,
        canonicalizedResource
    ].join('\n');

    const signature = await hmacSha256(accountKey, stringToSign);
    return `SharedKey ${accountName}:${signature}`;
}

/**
 * Upload a file to Azure Blob Storage via the Vite dev proxy.
 *
 * @param {string} connectionString - Azure Storage connection string
 * @param {string} containerName - Blob container name
 * @param {string} blobName - Name for the blob
 * @param {File} file - File object to upload
 * @returns {Promise<string>} The URL of the uploaded blob
 */
export async function uploadToBlob(connectionString, containerName, blobName, file) {
    const { accountName, accountKey, endpointSuffix, protocol } = parseConnectionString(connectionString);

    // The real Azure path (used for auth signing)
    const encodedBlobName = encodeURIComponent(blobName);
    const canonicalPath = `/${containerName}/${encodedBlobName}`;
    const realBlobUrl = `${protocol}://${accountName}.blob.${endpointSuffix}${canonicalPath}`;

    // The proxy path (used for the actual fetch to avoid CORS)
    const proxyUrl = `/blob-proxy/${containerName}/${encodedBlobName}`;

    const contentType = file.type || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    const fileBuffer = await file.arrayBuffer();
    const contentLength = fileBuffer.byteLength;

    const now = new Date().toUTCString();

    const headers = {
        'x-ms-date': now,
        'x-ms-version': '2024-11-04',
        'x-ms-blob-type': 'BlockBlob',
        'Content-Type': contentType,
        'Content-Length': String(contentLength),
    };

    const authorization = await buildAuthHeader(
        accountName, accountKey, 'PUT', canonicalPath, headers, contentLength
    );

    const response = await fetch(proxyUrl, {
        method: 'PUT',
        headers: {
            ...headers,
            'Authorization': authorization,
        },
        body: fileBuffer,
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Blob yükleme hatası (${response.status}): ${errorText}`);
    }

    // Return the real Azure blob URL (not the proxy URL)
    return realBlobUrl;
}
