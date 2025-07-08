export const Constants = {
  VENEAR_CONTRACT_ID: "v.hos03.testnet",
  VOTING_CONTRACT_ID: "vote.hos03.testnet",
  NUM_ACCOUNTS_PER_QUERY: 100,
  FACTORY_CONTRACTS: [
    {
      id: "ballotbox",
      address: "ballotbox.testnet",
      name: "Voting Contract Factory",
      method_get_number_contracts: "get_number_contracts",
      method_get_contracts: "get_contracts",
    },
    {
      id: "constructive",
      address: "constructive.testnet",
      name: "Work in progress...",
      method_get_number_contracts: "get_number_contracts",
      method_get_contracts: "get_contracts",
    },
  ],
};
