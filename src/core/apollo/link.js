import { HttpLink, from, split } from "@apollo/client";

import { RetryLink } from "@apollo/client/link/retry";

export const uniswap = from([
  new RetryLink(),
  new HttpLink({
    uri: "https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v2",
    shouldBatch: true,
  }),
]);

export const masterchef = from([
  new RetryLink(),
  new HttpLink({
    uri: "https://sparta-graph.polis.tech/subgraphs/name/hadeswap/plutus",
    shouldBatch: true,
  }),
]);

export const exchange = from([
  new RetryLink(),
  new HttpLink({
    uri: "https://sparta-graph.polis.tech/subgraphs/name/hadeswap/exchange",
    shouldBatch: true,
  }),
]);

export const blocklytics = from([
  new RetryLink(),
  new HttpLink({
    uri: "https://sparta-graph.polis.tech/subgraphs/name/blocklytics/ethereum-blocks",
    shouldBatch: true,
  }),
]);

export const lockup = from([
  new RetryLink(),
  new HttpLink({
    uri: "https://api.thegraph.com/subgraphs/name/matthewlilley/lockup",
    shouldBatch: true,
  }),
]);

export default split(
  (operation) => {
    return operation.getContext().clientName === "blocklytics";
  },
  blocklytics,
  split(
    (operation) => {
      return operation.getContext().clientName === "masterchef";
    },
    masterchef,
    split(
      (operation) => {
        return operation.getContext().clientName === "lockup";
      },
      lockup,
      exchange
    )
  )
);
