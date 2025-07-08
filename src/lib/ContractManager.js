import { Constants } from "../hooks/constants.js";
import { near } from "../hooks/fastnear.js";

class ContractManager {
  constructor() {
    this.contracts = new Map();
    this.currentAddress = null;
    this.listeners = [];

    this.networkSuffix =
      near.config.networkId === "mainnet" ? ".near" : ".testnet";

    const contractId = Constants.VOTING_CONTRACT_ID; // full address
    const contractName = contractId.split(".")[0];
    this.addContract({
      contractId,
      contractName,
      type: "official",
    });
    this.currentAddress = contractId;
  }

  notifyListeners() {
    this.listeners.forEach((fn) => fn());
  }

  addListener(fn) {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter((f) => f !== fn);
    };
  }

  addContract(contract) {
    const contractId = contract.contractId || contract.address;
    const contractName =
      contract.contractName || contractId?.split(".")[0] || "unknown";

    const final = {
      contractId, // full NEAR address
      contractName,
      factoryName: contract.factoryName,
      type:
        contract.type || (contract.factoryName ? "factory-deployed" : "custom"),
    };

    this.contracts.set(contractId, final);
    this.notifyListeners();
  }

  removeContract(contractId) {
    this.contracts.delete(contractId);
    this.notifyListeners();
  }

  switchContract(contractId) {
    const contract = this.contracts.get(contractId);
    if (!contract) {
      throw new Error(`Contract not found: ${contractId}`);
    }
    this.currentAddress = contractId;
    this.notifyListeners();
    return contract;
  }

  getCurrentContract() {
    return this.contracts.get(this.currentAddress);
  }

  getAllContracts() {
    return Array.from(this.contracts.values());
  }

  buildAddress(factoryName, contractName) {
    const endsWithSuffix =
      contractName.endsWith(".testnet") || contractName.endsWith(".near");
    const base = factoryName ? `${contractName}.${factoryName}` : contractName;
    return endsWithSuffix ? contractName : `${base}${this.networkSuffix}`;
  }

  getContractPath(contract) {
    if (!contract) return "/";
    if (contract.factoryName) {
      return `/${contract.factoryName}/${contract.contractName}`;
    }
    return `/${contract.contractName}`;
  }

  getContractByAddress(contractId) {
    return this.contracts.get(contractId) || null;
  }

  async tryCreateFromPath(factoryName, contractName) {
    const contractId = this.buildAddress(factoryName, contractName);

    try {
      const num = await near.view({
        contractId,
        methodName: "get_num_proposals",
        args: {},
      });
      if (typeof num !== "number") {
        throw new Error("INVALID VOTING CONTRACT");
      }
    } catch (err) {
      console.warn(`ERROR: ${contractId}`, err);
      throw new Error(`NOT FOUND: ${contractId}`);
    }

    const contract = {
      contractId,
      contractName,
      factoryName,
      type: factoryName ? "factory-deployed" : "custom",
    };

    this.addContract(contract);
    return this.switchContract(contractId);
  }

  async switchContractByPath(pathParts) {
    let factoryName, contractName, fullContractId;

    if (pathParts.length === 1) {
      const single = pathParts[0];

      if (single.includes(".")) {
        fullContractId = single;
      } else {
        contractName = single;
      }
    } else if (pathParts.length >= 2) {
      [factoryName, contractName] = pathParts;
    }

    const contractId =
      fullContractId || this.buildAddress(factoryName, contractName);
    const existing = this.contracts.get(contractId);
    if (existing) return this.switchContract(contractId);

    return this.tryCreateFromPath(factoryName, contractName, fullContractId);
  }

  async discoverFactoryContracts(factoryName) {
    const factory = Constants.FACTORY_CONTRACTS.find(
      (f) => f.id === factoryName
    );
    if (!factory) throw new Error(`Unknown factory: ${factoryName}`);

    let deployed;
    try {
      deployed = await near.view({
        contractId: factory.address,
        methodName: factory.method_get_contracts,
        args: { from_index: 0, limit: 50 },
      });
    } catch (err) {
      console.warn(`Failed to list contracts from ${factoryName}`, err);
      return;
    }

    if (!Array.isArray(deployed)) return;

    for (const fullAddr of deployed) {
      const parts = fullAddr.split(".");
      if (parts.length < 2) continue;
      const contractName = parts[0];

      try {
        await this.tryCreateFromPath(factoryName, contractName);
      } catch (e) {
        console.warn(`Skipping invalid contract ${fullAddr}`, e);
      }
    }
  }
}

const shared = new ContractManager();
export default shared;
