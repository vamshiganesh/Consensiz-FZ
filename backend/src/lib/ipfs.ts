/**
 * IPFS Pinning via Pinata HTTP API
 * Pins finding data as JSON to IPFS and returns the CID.
 * No IPFS node required — uses Pinata's free-tier REST API.
 */
import fetch from 'node-fetch';

interface PinataResponse {
  IpfsHash: string;
  PinSize: number;
  Timestamp: string;
}

export async function pinToIPFS(
  data: Record<string, any>,
  pinataApiKey: string,
  pinataSecretKey: string
): Promise<string> {
  const body = JSON.stringify({
    pinataContent: data,
    pinataMetadata: {
      name: `consensiz-finding-${Date.now()}`
    }
  });

  const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'pinata_api_key': pinataApiKey,
      'pinata_secret_api_key': pinataSecretKey
    },
    body
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Pinata IPFS pinning failed (${response.status}): ${errorText}`);
  }

  const result = (await response.json()) as PinataResponse;
  return result.IpfsHash;
}
