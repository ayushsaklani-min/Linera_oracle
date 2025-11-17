import { ethers } from "ethers";

const CHAINLINK_ABI = [
  {
    inputs: [],
    name: "latestRoundData",
    outputs: [
      { internalType: "uint80", name: "roundId", type: "uint80" },
      { internalType: "int256", name: "answer", type: "int256" },
      { internalType: "uint256", name: "startedAt", type: "uint256" },
      { internalType: "uint256", name: "updatedAt", type: "uint256" },
      { internalType: "uint80", name: "answeredInRound", type: "uint80" },
    ],
    stateMutability: "view",
    type: "function",
  },
];

const CHAINLINK_FEEDS = {
  ETH: "0x694AA1769357215DE4FAC081bf1f309aDC325306", // Sepolia ETH/USD
  BTC: "0x1b44F3514812d835EB1BDB0acB33d3fA3351Ee43", // Sepolia BTC/USD
  LINK: "0xc59E3633BAAC79493d908e63626716e204A45EdF", // Sepolia LINK/USD
};

export class ChainlinkOracle {
  constructor(rpcUrl = "https://ethereum-sepolia.publicnode.com") {
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.name = "Chainlink";
  }

  async getPrice(token) {
    const contractAddress = CHAINLINK_FEEDS[token];
    if (!contractAddress) {
      throw new Error(`Chainlink feed not available for ${token}`);
    }

    const startTime = Date.now();
    try {
      const contract = new ethers.Contract(
        contractAddress,
        CHAINLINK_ABI,
        this.provider
      );
      const roundData = await contract.latestRoundData();
      const price = Number(roundData.answer) / 1e8;
      const latency = Date.now() - startTime;

      return {
        token,
        price,
        source: this.name,
        latency,
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error(`Chainlink error for ${token}:`, error.message);
      return null;
    }
  }

  async getPrices(tokens) {
    const promises = tokens.map((token) => this.getPrice(token));
    const results = await Promise.allSettled(promises);
    return results
      .filter((r) => r.status === "fulfilled" && r.value !== null)
      .map((r) => r.value);
  }
}
