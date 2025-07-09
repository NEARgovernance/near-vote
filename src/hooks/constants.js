export const Constants = {
  VENEAR_CONTRACT_ID: "stake.govai.near",
  VOTING_CONTRACT_ID: "vote.govai.near",
  NUM_ACCOUNTS_PER_QUERY: 100,
  FACTORY_CONTRACTS: [
    {
      id: "metavote",
      address: "metavote.near",
      name: "Voting Contract Factory",
      method_get_number_contracts: "get_number_contracts",
      method_get_contracts: "get_contracts",
    },
  ],
};
