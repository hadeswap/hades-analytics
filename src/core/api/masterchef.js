import { getAverageBlockTime, getEthPrice, getToken } from "../api";
import {
  liquidityPositionSubsetQuery,
  pairQuery,
  pairSubsetQuery,
} from "../queries/exchange";
import {
  poolHistoryQuery,
  poolIdsQuery,
  poolQuery,
  poolUserQuery,
  poolsQuery,
} from "../queries/masterchef";

import { POOL_DENY } from "app/core/constants";
import { getApollo } from "../apollo";
import { sub } from "date-fns";

export async function getPoolIds(client = getApollo()) {
  const {
    data: { pools },
  } = await client.query({
    query: poolIdsQuery,
    context: {
      clientName: "masterchef",
    },
  });
  await client.cache.writeQuery({
    query: poolIdsQuery,
    data: {
      pools: pools.filter(
        (pool) => !POOL_DENY.includes(pool.id) && pool.allocPoint !== "0"
      ),
    },
  });
  return await client.cache.readQuery({
    query: poolIdsQuery,
  });
}

export async function getPoolUser(id, client = getApollo()) {
  const { data } = await client.query({
    query: poolUserQuery,
    fetchPolicy: "network-only",
    variables: {
      address: id,
    },
    context: {
      clientName: "masterchef",
    },
  });

  await client.cache.writeQuery({
    query: poolUserQuery,
    data,
  });

  return await client.cache.readQuery({
    query: poolUserQuery,
  });
}

export async function getPoolHistories(id, client = getApollo()) {
  const {
    data: { poolHistories },
  } = await client.query({
    query: poolHistoryQuery,
    fetchPolicy: "network-only",
    variables: { id },
    context: {
      clientName: "masterchef",
    },
  });

  await client.cache.writeQuery({
    query: poolHistoryQuery,
    data: {
      poolHistories,
    },
  });

  return await client.cache.readQuery({
    query: poolHistoryQuery,
  });
}

export async function getPool(id, client = getApollo()) {
  const {
    data: { pool },
  } = await client.query({
    query: poolQuery,
    fetchPolicy: "network-only",
    variables: { id },
    context: {
      clientName: "masterchef",
    },
  });

  console.log(pool);

  const {
    data: { pair: liquidityPair },
  } = await client.query({
    query: pairQuery,
    variables: { id: pool.pair },
    fetchPolicy: "network-only",
  });

  await client.cache.writeQuery({
    query: poolQuery,
    data: {
      pool: {
        ...pool,
        liquidityPair,
      },
    },
  });

  return await client.cache.readQuery({
    query: poolQuery,
  });
}

export async function getPools(client = getApollo()) {
  const {
    data: { pools },
  } = await client.query({
    query: poolsQuery,
    context: {
      clientName: "masterchef",
    },
  });

  const pairAddresses = pools
    .map((pool) => {
      return pool.pair;
    })
    .sort();

  const pool45 = pools.find((p) => p.id === "45");

  const {
    data: { pairs },
  } = await client.query({
    query: pairSubsetQuery,
    variables: { pairAddresses },
    fetchPolicy: "network-only",
  });

  // const averageBlockTime = (await getAverageBlockTime()) / 100;

  const averageBlockTime = await getAverageBlockTime();
  // const averageBlockTime = 13;

  const { bundles } = await getEthPrice();

  const ethPrice = bundles[0].ethPrice;

  // SOUL TOKEN
  const { token } = await getToken(
    "0xc9ec2edd1ba38918a55b5ab637dd0ac02e6e4058"
  );

  const sushiPrice = ethPrice * token.derivedETH;

  // MASTERCHEF
  const {
    data: { liquidityPositions },
  } = await client.query({
    query: liquidityPositionSubsetQuery,
    variables: { user: "0xb4be34c7430ff011b653166570e211c15a03e4fa" },
  });

  await client.cache.writeQuery({
    query: poolsQuery,
    data: {
      pools: pools
        .filter(
          (pool) =>
            !POOL_DENY.includes(pool.id) &&
            pool.allocPoint !== "0" &&
            pool.accSoulPerShare !== "0" &&
            pairs.find((pair) => pair?.id === pool.pair)
        )
        .map((pool) => {
          const pair = pairs.find((pair) => pair.id === pool.pair);

          const liquidityPosition = liquidityPositions.find(
            (liquidityPosition) => liquidityPosition.pair.id === pair.id
          );

          const balance = Number(pool.balance / 1e18);

          const blocksPerHour = 3600 / averageBlockTime;

          // const rewardPerBlock =
          //   100 - 100 * (pool45.allocPoint / pool45.owner.totalAllocPoint);

          // const roiPerBlock =
          //   (Number(token.derivedETH) *
          //     rewardPerBlock *
          //     3 *
          //     (Number(pool.allocPoint) / Number(pool.owner.totalAllocPoint))) /
          //   (Number(pair.reserveETH) * (balance / Number(pair.totalSupply)));

          const balanceUSD =
            (balance / Number(pair.totalSupply)) * Number(pair.reserveUSD);

          const rewardPerBlock =
            ((pool.allocPoint / pool.owner.totalAllocPoint) *
              pool.owner.soulPerBlock) /
            1e18;


          const roiPerBlock = (rewardPerBlock * sushiPrice) / balanceUSD;

          const roiPerHour = roiPerBlock * blocksPerHour;

          const roiPerDay = roiPerHour * 24;

          const roiPerMonth = roiPerDay * 30;

          const roiPerYear = roiPerMonth * 12;

          return {
            ...pool,
            liquidityPair: pair,
            roiPerBlock,
            roiPerHour,
            roiPerDay,
            roiPerMonth,
            roiPerYear,
            rewardPerThousand: 1 * roiPerDay * (1000 / sushiPrice),
            tvl:
              (pair.reserveUSD / pair.totalSupply) *
              liquidityPosition.liquidityTokenBalance,
          };
        }),
    },
  });

  return await client.cache.readQuery({
    query: poolsQuery,
  });
}
