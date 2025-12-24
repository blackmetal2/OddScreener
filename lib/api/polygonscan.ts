/**
 * Etherscan V2 API client for tracking wallet token transfers on Polygon
 * Uses the unified Etherscan V2 endpoint with chainid for Polygon (137)
 * Free API: 5 requests/second limit
 * Get API key at: https://polygonscan.com/apis
 */

export interface PolygonscanTokenTransfer {
  blockNumber: string;
  timeStamp: string;
  hash: string;
  from: string;
  to: string;
  value: string;
  tokenName: string;
  tokenSymbol: string;
  tokenDecimal: string;
  contractAddress: string;
}

export interface TokenTransfer {
  id: string;
  timestamp: Date;
  type: 'deposit' | 'withdrawal';
  tokenSymbol: string;
  tokenName: string;
  amount: number;
  txHash: string;
  fromAddress: string;
  toAddress: string;
}

interface PolygonscanResponse {
  status: string;
  message: string;
  result: PolygonscanTokenTransfer[] | string;
}

// Etherscan V2 unified endpoint with Polygon chain ID
const ETHERSCAN_V2_API_URL = 'https://api.etherscan.io/v2/api';
const POLYGON_CHAIN_ID = '137';

// Rate limiting: max 5 requests per second
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 200; // 200ms = 5 req/sec

async function rateLimitedFetch(url: string): Promise<Response> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;

  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    await new Promise((resolve) =>
      setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest)
    );
  }

  lastRequestTime = Date.now();
  return fetch(url);
}

/**
 * Parse token value with decimals
 */
function parseTokenValue(value: string, decimals: string): number {
  const decimalPlaces = parseInt(decimals) || 18;
  const bigValue = BigInt(value);
  const divisor = BigInt(10 ** decimalPlaces);
  const wholePart = bigValue / divisor;
  const fractionalPart = bigValue % divisor;

  // Convert to number with proper decimal places
  const result =
    Number(wholePart) +
    Number(fractionalPart) / Number(divisor);

  return Math.round(result * 100) / 100; // Round to 2 decimal places
}

/**
 * Fetch all ERC-20 token transfers for a wallet address
 */
export async function fetchWalletTokenTransfers(
  walletAddress: string,
  page: number = 1,
  offset: number = 50
): Promise<TokenTransfer[]> {
  const apiKey = process.env.NEXT_PUBLIC_POLYGONSCAN_API_KEY || '';

  if (!apiKey) {
    console.warn('Polygonscan API key not configured');
    return [];
  }

  try {
    const url = new URL(ETHERSCAN_V2_API_URL);
    url.searchParams.set('chainid', POLYGON_CHAIN_ID);
    url.searchParams.set('module', 'account');
    url.searchParams.set('action', 'tokentx');
    url.searchParams.set('address', walletAddress);
    url.searchParams.set('page', page.toString());
    url.searchParams.set('offset', offset.toString());
    url.searchParams.set('sort', 'desc'); // Newest first
    url.searchParams.set('apikey', apiKey);

    const response = await rateLimitedFetch(url.toString());

    if (!response.ok) {
      console.error('Polygonscan API error:', response.status);
      return [];
    }

    const data: PolygonscanResponse = await response.json();

    if (data.status !== '1' || typeof data.result === 'string') {
      // API returned error or no results
      if (data.message !== 'No transactions found') {
        console.error('Polygonscan API error:', data.message);
      }
      return [];
    }

    const addressLower = walletAddress.toLowerCase();

    return data.result.map((tx) => {
      const isDeposit = tx.to.toLowerCase() === addressLower;

      return {
        id: tx.hash,
        timestamp: new Date(parseInt(tx.timeStamp) * 1000),
        type: isDeposit ? 'deposit' : 'withdrawal',
        tokenSymbol: tx.tokenSymbol,
        tokenName: tx.tokenName,
        amount: parseTokenValue(tx.value, tx.tokenDecimal),
        txHash: tx.hash,
        fromAddress: tx.from,
        toAddress: tx.to,
      };
    });
  } catch (error) {
    console.error('Error fetching token transfers:', error);
    return [];
  }
}

/**
 * Get summary of wallet activity
 */
export async function getWalletActivitySummary(
  walletAddress: string
): Promise<{
  deposits: TokenTransfer[];
  withdrawals: TokenTransfer[];
  recentTransfers: TokenTransfer[];
}> {
  const transfers = await fetchWalletTokenTransfers(walletAddress, 1, 100);

  const deposits = transfers.filter((t) => t.type === 'deposit');
  const withdrawals = transfers.filter((t) => t.type === 'withdrawal');

  return {
    deposits,
    withdrawals,
    recentTransfers: transfers.slice(0, 10),
  };
}

/**
 * Format transfer for display
 */
export function formatTransfer(transfer: TokenTransfer): string {
  const sign = transfer.type === 'deposit' ? '+' : '-';
  const amount =
    transfer.amount >= 1000
      ? `${(transfer.amount / 1000).toFixed(1)}K`
      : transfer.amount.toFixed(2);

  return `${sign}${amount} ${transfer.tokenSymbol}`;
}

/**
 * Get Polygonscan transaction URL
 */
export function getPolygonscanTxUrl(txHash: string): string {
  return `https://polygonscan.com/tx/${txHash}`;
}

/**
 * Get Polygonscan address URL
 */
export function getPolygonscanAddressUrl(address: string): string {
  return `https://polygonscan.com/address/${address}`;
}
