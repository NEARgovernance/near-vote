import * as near from "@fastnear/api";

window.near = near;
window.$$ = near.utils.convertUnit;

near.config({
  networkId: "mainnet", // or "testnet"
});

export function getNetworkId() {
  return near._config?.networkId || "mainnet";
}

export { near };
