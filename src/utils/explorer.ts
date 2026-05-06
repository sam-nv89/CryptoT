import { WhaleNetwork } from '@/types/whales';

export function getExplorerUrl(network: WhaleNetwork, type: 'address' | 'tx', hashOrAddress: string): string {
  const baseUrlMap: Record<WhaleNetwork, string> = {
    ETH: 'https://etherscan.io',
    BSC: 'https://bscscan.com',
    ARB: 'https://arbiscan.io',
    MANTLE: 'https://explorer.mantle.xyz',
    ZKSYNC: 'https://explorer.zksync.io',
    SOL: 'https://solscan.io',
    BTC: 'https://mempool.space',
    APTOS: 'https://explorer.aptoslabs.com'
  };

  const baseUrl = baseUrlMap[network] || baseUrlMap['ETH'];
  
  if (type === 'address') {
    if (network === 'SOL') {
      return `${baseUrl}/account/${hashOrAddress}`;
    }
    if (network === 'APTOS') {
      return `${baseUrl}/account/${hashOrAddress}?network=mainnet`;
    }
    return `${baseUrl}/address/${hashOrAddress}`;
  } else if (type === 'tx') {
    if (network === 'SOL') {
      return `${baseUrl}/tx/${hashOrAddress}`;
    }
    if (network === 'APTOS') {
      return `${baseUrl}/txn/${hashOrAddress}?network=mainnet`;
    }
    return `${baseUrl}/tx/${hashOrAddress}`;
  }

  return baseUrl;
}
