import { Constants } from "./constants.js";
import Big from "big.js";

export function tryToJSON(value, defaultValue = null) {
  try {
    return JSON.stringify(value);
  } catch (e) {
    return defaultValue;
  }
}

export function processAccount(account) {
  const delegatedBalance = Big(account.delegated_balance.near_balance).add(
    Big(account.delegated_balance.extra_venear_balance)
  );
  const balance = Big(account.balance.near_balance).add(
    Big(account.balance.extra_venear_balance)
  );
  let totalBalance = delegatedBalance;
  if (!account.delegationx) {
    totalBalance = totalBalance.add(balance);
  }
  return {
    accountId: account.account_id,
    balance,
    delegatedBalance,
    totalBalance,
    delegation: account.delegation,
  };
}

export const toNear = (amount) =>
  amount ? `${(parseFloat(amount) / 1e24).toFixed(3)} NEAR` : `...`;

export const toVeNear = (amount) =>
  amount ? `${(parseFloat(amount) / 1e24).toFixed(3)} veNEAR` : `...`;

export function getProposalPath(proposal) {
  const normalize = (s) => (typeof s === "string" ? s.toLowerCase() : "");
  const officialContractId = normalize(Constants.VOTING_CONTRACT_ID);
  const contractId = normalize(proposal.contractId);

  if (!contractId) {
    throw new Error(
      `Missing contractId in proposal: ${JSON.stringify(proposal)}`
    );
  }

  if (contractId === officialContractId) {
    return `/proposal/${proposal.id}`;
  }

  const parts = contractId.split(".");
  if (parts.length < 2) {
    throw new Error(`Invalid contractId: ${contractId}`);
  }

  const reversed = parts.slice(0, -1).reverse();
  return `/${reversed.join("/")}/${proposal.id}`;
}

export function decorateProposal(proposal, contract) {
  if (!contract?.contractId) {
    throw new Error("Missing contract metadata when decorating proposal.");
  }

  return {
    ...proposal,
    contractId: contract.contractId,
    contractName: contract.contractName,
    factoryName: contract.factoryName,
  };
}
