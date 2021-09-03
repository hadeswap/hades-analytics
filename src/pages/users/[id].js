import { AppShell, KPI, Link, Loading, PageHeader, PairIcon } from "app/components";
import {
  Avatar,
  Box,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  makeStyles,
} from "@material-ui/core";
import {
  blockQuery,
  currencyFormatter,
  decimalFormatter,
  ethPriceQuery,
  formatCurrency,
  getApollo,
  getEthPrice,
  getLatestBlock,
  getPairs,
  getPoolUser,
  getSushiToken,
  getToken,
  latestBlockQuery,
  lockupUserQuery,
  pairSubsetQuery,
  pairsQuery,
  poolUserQuery,
  tokenQuery,
  useInterval,
  userIdsQuery
} from "app/core";
import { getUnixTime, startOfMinute, startOfSecond } from "date-fns";

import { AvatarGroup } from "@material-ui/lab";
import Head from "next/head";
import { POOL_DENY } from "app/core/constants";
import { toChecksumAddress } from "web3-utils";
import { useQuery } from "@apollo/client";
import { useRouter } from "next/router";

const useStyles = makeStyles((theme) => ({
  root: {},
  title: {
    fontSize: 14,
  },
  avatar: {
    marginRight: theme.spacing(1),
  },
  paper: {
    padding: theme.spacing(2),
  },
}));

function UserPage() {
  const router = useRouter();

  if (router.isFallback) {
    return <Loading />;
  }
  const classes = useStyles();

  const id = router && router.query && router.query.id && router.query.id.toLowerCase();

  const {
    data: { bundles },
  } = useQuery(ethPriceQuery, {
    pollInterval: 60000,
  });


  const { data: poolData } = useQuery(poolUserQuery, {
    variables: {
      address: id.toLowerCase(),
    },
    context: {
      clientName: "masterchef",
    },
  });

  const {
    data: { token },
  } = useQuery(tokenQuery, {
    variables: {
      id: "0xc9ec2edd1ba38918a55b5ab637dd0ac02e6e4058",
    },
  });

  const {
    data: { pairs },
  } = useQuery(pairsQuery);

  const poolUsers = poolData.users.filter(
    (user) =>
      user.pool &&
      !POOL_DENY.includes(user.pool.id) &&
      user.pool.allocPoint !== "0" &&
      pairs.find((pair) => pair?.id === user.pool.pair)
  );

  // useInterval(
  //   () =>
  //     Promise.all([
  //       getPairs,
  //       getSoulToken,
  //       getPoolUser(id.toLowerCase()),
  //       getBarUser(id.toLocaleLowerCase()),
  //       getEthPrice,
  //     ]),
  //   60000
  // );

  const soulPrice =
    parseFloat(token?.derivedETH) * parseFloat(bundles[0].ethPrice);


  const { data: blocksData } = useQuery(latestBlockQuery, {
    context: {
      clientName: "blocklytics",
    },
  });

  // POOLS

  const poolsUSD = poolUsers?.reduce((previousValue, currentValue) => {
    const pair = pairs.find((pair) => pair.id == currentValue?.pool?.pair);
    if (!pair) {
      return previousValue;
    }
    const share = Number(currentValue.amount / 1e18) / pair.totalSupply;
    return previousValue + pair.reserveUSD * share;
  }, 0);

  const poolsPendingUSD =
    poolUsers?.reduce((previousValue, currentValue) => {
      return (
        previousValue +
        ((currentValue.amount * currentValue.pool.accSoulPerShare) / 1e12 -
          currentValue.rewardDebt) /
          1e18
      );
    }, 0) * soulPrice;

  const [
    poolEntriesUSD,
    poolExitsUSD,
    poolHarvestedUSD,
  ] = poolData?.users.reduce(
    (previousValue, currentValue) => {
      const [entries, exits, harvested] = previousValue;
      return [
        entries + parseFloat(currentValue.entryUSD),
        exits + parseFloat(currentValue.exitUSD),
        harvested + parseFloat(currentValue.soulHarvestedUSD),
      ];
    },
    [0, 0, 0]
  );

  // Global

  // const originalInvestments =
  //   parseFloat(barData?.user?.soulStakedUSD) + parseFloat(poolEntriesUSD);

  const investments =
    poolEntriesUSD + poolsPendingUSD + poolExitsUSD;

  return (
    <AppShell>
      <Head>
        <title>User {id} | SoulSwap Analytics</title>
      </Head>

      <PageHeader>
        <Typography variant="h5" component="h1" gutterBottom noWrap>
          Portfolio {id}
        </Typography>
      </PageHeader>
      )}

      <Typography
        variant="h6"
        component="h2"
        color="textSecondary"
        gutterBottom
      >
        Pools
      </Typography>

      {!poolData?.users.length ? (
        <Typography>Address isn't farming...</Typography>
      ) : (
        <>
          <Box mb={4}>
            <Grid container spacing={2}>
              <Grid item xs>
                <KPI
                  title="Value"
                  value={formatCurrency(poolsUSD + poolsPendingUSD)}
                />
              </Grid>
              <Grid item xs>
                <KPI title="Invested" value={formatCurrency(poolEntriesUSD)} />
              </Grid>
              <Grid item xs>
                <KPI
                  title="Profit/Loss"
                  value={formatCurrency(
                    poolsUSD +
                      poolExitsUSD +
                      poolHarvestedUSD +
                      poolsPendingUSD -
                      poolEntriesUSD
                  )}
                />
              </Grid>
            </Grid>
          </Box>

          <Box my={4}>
            <TableContainer variant="outlined">
              <Table aria-label="farming">
                <TableHead>
                  <TableRow>
                    <TableCell key="pool">Pool</TableCell>
                    <TableCell key="hlp" align="right">
                      HLP
                    </TableCell>
                    <TableCell key="entryUSD" align="right">
                      Deposited
                    </TableCell>
                    <TableCell key="exitUSD" align="right">
                      Withdrawn
                    </TableCell>
                    <TableCell key="balance" align="right">
                      Balance
                    </TableCell>
                    <TableCell key="value" align="right">
                      Value
                    </TableCell>
                    <TableCell key="pendingSoul" align="right">
                      Soul Pending
                    </TableCell>
                    <TableCell key="soulHarvested" align="right">
                      Soul Harvested
                    </TableCell>
                    <TableCell key="pl" align="right">
                      Profit/Loss
                    </TableCell>
                    {/* <TableCell key="apy" align="right">
                      APY
                    </TableCell> */}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {poolUsers.map((user) => {
                    const pair = pairs.find(
                      (pair) => pair.id == user.pool.pair
                    );
                    const hlp = Number(user.amount / 1e18);

                    const share = hlp / pair.totalSupply;

                    const token0 = pair.reserve0 * share;
                    const token1 = pair.reserve1 * share;

                    const pendingSoul =
                      ((user.amount * user.pool.accSoulPerShare) / 1e12 -
                        user.rewardDebt) /
                      1e18;
                    // user.amount.mul(accSoulPerShare).div(1e12).sub(user.rewardDebt);

                    // console.log(
                    //   user,
                    //   user.entryUSD,
                    //   user.exitUSD,
                    //   pendingSoul * soulPrice
                    // );

                    return (
                      <TableRow key={user.pool.id}>
                        <TableCell component="th" scope="row">
                          <Box display="flex" alignItems="center">
                            <PairIcon
                              base={pair.token0.id}
                              quote={pair.token1.id}
                            />
                            <Link
                              href={`/pools/${user.pool.id}`}
                              variant="body2"
                              noWrap
                            >
                              {pair.token0.symbol}-{pair.token1.symbol}
                            </Link>
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          <Typography noWrap variant="body2">
                            {decimalFormatter.format(hlp)} HLP
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography noWrap variant="body2">
                            {currencyFormatter.format(user.entryUSD)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography noWrap variant="body2">
                            {currencyFormatter.format(user.exitUSD)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography noWrap variant="body2">
                            {decimalFormatter.format(token0)}{" "}
                            {pair.token0.symbol} +{" "}
                            {decimalFormatter.format(token1)}{" "}
                            {pair.token1.symbol}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography noWrap variant="body2">
                            {currencyFormatter.format(pair.reserveUSD * share)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography noWrap variant="body2">
                            {decimalFormatter.format(pendingSoul)} (
                            {currencyFormatter.format(
                              pendingSoul * soulPrice
                            )}
                            )
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography noWrap variant="body2">
                            {decimalFormatter.format(user.soulHarvested)} (
                            {currencyFormatter.format(user.soulHarvestedUSD)})
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography noWrap variant="body2">
                            {currencyFormatter.format(
                              parseFloat(pair.reserveUSD * share) +
                                parseFloat(user.exitUSD) +
                                parseFloat(user.soulHarvestedUSD) +
                                parseFloat(pendingSoul * soulPrice) -
                                parseFloat(user.entryUSD)
                            )}
                          </Typography>
                        </TableCell>
                        {/* <TableCell align="right">23.76%</TableCell> */}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </>
      )}
    </AppShell>
  );
}

export async function getStaticProps({ params }) {
  const client = getApollo();

  const id = params.id.toLowerCase();

  await getEthPrice(client);

  await getSushiToken(client);

  await getPoolUser(id.toLowerCase(), client);

  await getPairs(client);

  await getLatestBlock(client);

  return {
    props: {
      initialApolloState: client.cache.extract(),
    },
    revalidate: 1,
  };
}

export async function getStaticPaths() {
  return {
    paths: [],
    fallback: true,
  };
}

export default UserPage;
