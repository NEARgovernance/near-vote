import { Link } from "react-router-dom";
import { useAccount } from "../hooks/useAccount.js";
import { Constants } from "../hooks/constants.js";
import { useState } from "react";
import { useNearView } from "../hooks/useNearView.js";
import { useNearAccount } from "../hooks/useNearAccount.js";
import { useNonce } from "../hooks/useNonce.js";
import Big from "big.js";
import { toNear, toVeNear } from "../hooks/utils.js";

export function AccountPage({ accountId }) {
  const nonce = useNonce();
  const [loading, setLoading] = useState(false);
  const [showDebugStaking, setShowDebugStaking] = useState(false);
  const [selectStakingPool, setSelectStakingPool] = useState(
    "chorusone.pool.f863973.m0"
  );

  // Account data
  const accountBalance = useNearAccount({
    initialValue: null,
    condition: ({ accountId }) => !!accountId,
    accountId,
    extraDeps: [nonce],
    errorValue: null,
  })?.amount;

  const veNearBalance = useNearView({
    initialValue: "0",
    condition: ({ extraDeps }) => !!extraDeps[1],
    contractId: Constants.VENEAR_CONTRACT_ID,
    methodName: "ft_balance_of",
    args: { account_id: accountId },
    extraDeps: [nonce, accountId],
    errorValue: "0",
  });

  const accountInfo = useNearView({
    initialValue: undefined,
    contractId: Constants.VENEAR_CONTRACT_ID,
    methodName: "get_account_info",
    args: { account_id: accountId },
    extraDeps: [nonce],
    errorValue: null,
  });

  const [showAccountInfo, setShowAccountInfo] = useState(false);
  const accountInfoReady = accountInfo !== undefined;
  const isDelegating = !!accountInfo?.account?.delegation;
  const [delegateTo, setDelegateTo] = useState("");

  // Lockup data
  let isLockupDeployed = !!accountInfo?.internal?.lockup_version;

  const lockupId = useNearView({
    initialValue: null,
    condition: ({ extraDeps }) => extraDeps[1],
    contractId: Constants.VENEAR_CONTRACT_ID,
    methodName: "get_lockup_account_id",
    args: { account_id: accountId },
    extraDeps: [nonce, accountId],
    errorValue: null,
  });

  const lockupBalance = useNearAccount({
    initialValue: null,
    condition: ({ extraDeps }) => extraDeps[1],
    accountId: lockupId,
    extraDeps: [nonce, isLockupDeployed],
    errorValue: null,
  })?.amount;

  const lockupInfoReady = accountInfo && lockupId && lockupBalance !== null;
  isLockupDeployed =
    isLockupDeployed && lockupBalance !== null && lockupBalance !== undefined;

  const lockedAmount = useNearView({
    initialValue: null,
    condition: ({ extraDeps }) => extraDeps[1],
    contractId: lockupId,
    methodName: "get_venear_locked_balance",
    args: {},
    extraDeps: [nonce, isLockupDeployed],
    errorValue: null,
  });

  const lockupLiquidOwnersBalance = useNearView({
    initialValue: null,
    condition: ({ extraDeps }) => extraDeps[1],
    contractId: lockupId,
    methodName: "get_liquid_owners_balance",
    args: {},
    extraDeps: [nonce, isLockupDeployed],
    errorValue: null,
  });

  const lockupLiquidAmount = useNearView({
    initialValue: null,
    condition: ({ extraDeps }) => extraDeps[1],
    contractId: lockupId,
    methodName: "get_venear_liquid_balance",
    args: {},
    extraDeps: [nonce, isLockupDeployed],
    errorValue: null,
  });

  const withdrawableAmount =
    lockupLiquidOwnersBalance && lockupLiquidAmount
      ? Big(lockupLiquidOwnersBalance).gt(Big(lockupLiquidAmount))
        ? lockupLiquidAmount
        : lockupLiquidOwnersBalance
      : "0";

  const lockupPendingAmount = useNearView({
    initialValue: null,
    condition: ({ extraDeps }) => extraDeps[1],
    contractId: lockupId,
    methodName: "get_venear_pending_balance",
    args: {},
    extraDeps: [nonce, isLockupDeployed],
    errorValue: null,
  });

  const lockupUnlockTimestampNs = useNearView({
    initialValue: null,
    condition: ({ extraDeps }) => extraDeps[1],
    contractId: lockupId,
    methodName: "get_venear_unlock_timestamp",
    args: {},
    extraDeps: [nonce, isLockupDeployed],
    errorValue: null,
  });

  const untilUnlock = Math.max(
    0,
    parseFloat(lockupUnlockTimestampNs || "0") / 1e6 - new Date().getTime()
  );

  const registrationCost = useNearView({
    initialValue: null,
    contractId: Constants.VENEAR_CONTRACT_ID,
    methodName: "storage_balance_bounds",
    args: {},
    errorValue: null,
  })?.min;

  const lockupCost = useNearView({
    initialValue: null,
    contractId: Constants.VENEAR_CONTRACT_ID,
    methodName: "get_lockup_deployment_cost",
    args: {},
    errorValue: null,
  });

  const stakingPool = useNearView({
    initialValue: null,
    condition: ({ extraDeps }) => extraDeps[1],
    contractId: lockupId,
    methodName: "get_staking_pool_account_id",
    args: {},
    extraDeps: [nonce, isLockupDeployed],
    errorValue: null,
  });

  const knownDepositedBalance = useNearView({
    initialValue: null,
    condition: ({ extraDeps }) => extraDeps[1],
    contractId: lockupId,
    methodName: "get_known_deposited_balance",
    args: {},
    extraDeps: [nonce, isLockupDeployed],
    errorValue: null,
  });

  const accountUnstakedBalance = useNearView({
    initialValue: "0",
    condition: ({ extraDeps }) => extraDeps[1] && extraDeps[2],
    contractId: stakingPool,
    methodName: "get_account_unstaked_balance",
    args: { account_id: lockupId },
    extraDeps: [nonce, isLockupDeployed, stakingPool],
    errorValue: "0",
  });

  const isUnstakeAvailable = useNearView({
    initialValue: false,
    condition: ({ extraDeps }) => extraDeps[1] && extraDeps[2],
    contractId: stakingPool,
    methodName: "is_account_unstaked_balance_available",
    args: { account_id: lockupId },
    extraDeps: [nonce, isLockupDeployed, stakingPool],
    errorValue: false,
  });

  if (!accountId) {
    return (
      <div className="mt-5">
        <nav aria-label="breadcrumb">
          <ol className="breadcrumb">
            <li className="breadcrumb-item">
              <Link to="/">Home</Link>
            </li>
            <li className="breadcrumb-item active" aria-current="page">
              Account
            </li>
          </ol>
        </nav>

        <div className="alert alert-warning" role="alert">
          <h4 className="alert-heading">Sign In Required</h4>
          <p>Please sign in to view and manage your account.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-5 mb-5">
      <div className="d-flex justify-content-between align-items-right mb-4">
        <nav aria-label="breadcrumb">
          <ol className="breadcrumb">
            <li className="breadcrumb-item">
              <Link
                to="/"
                style={{
                  fontWeight: "bold",
                  color: "gray",
                  textDecoration: "none",
                }}
              >
                Home
              </Link>
            </li>
            <li className="breadcrumb-item active" aria-current="page">
              Account
            </li>
          </ol>
        </nav>
      </div>

      {/* Account Information */}
      <div className="row mt-3 mb-4">
        <div className="col-lg-4">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Overview</h5>
            </div>
            <div className="card-body">
              <div className="mb-2">
                <strong>Account ID:</strong> <code>{accountId}</code>
              </div>
              <div className="mb-2">
                <strong>Role:</strong>{" "}
                {!accountInfo ? (
                  <span className="badge bg-danger">Not Registered</span>
                ) : accountInfo.account.delegation ? (
                  <span className="badge bg-primary">Constituent</span>
                ) : accountInfo.account.delegated_balance &&
                  (accountInfo.account.delegated_balance.near_balance > 0 ||
                    accountInfo.account.delegated_balance.extra_venear_balance >
                      0) ? (
                  <span className="badge bg-success">Representative</span>
                ) : (
                  <span className="badge bg-secondary">Registered</span>
                )}
              </div>
              <div className="mb-2">
                <strong>Balance:</strong>{" "}
                <code>
                  {accountBalance ? toNear(accountBalance) : "0 NEAR"}
                </code>
              </div>
              <div className="mb-2">
                <strong>Voting Power:</strong>{" "}
                <code>{toVeNear(veNearBalance)}</code>
              </div>
              <div className="mb-2">
                <strong>Liquid:</strong>{" "}
                <code>{toNear(lockupLiquidAmount)}</code>
              </div>
              <div className="mb-2">
                <strong>Withdrawable:</strong>{" "}
                <code>{toNear(withdrawableAmount)}</code>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Lockup</h5>
            </div>
            <div className="card-body">
              <div className="mb-2">
                <div className="d-flex align-items-center gap-2">
                  <strong>Contract:</strong>{" "}
                  <code
                    className="text-truncate"
                    style={{ maxWidth: "200px" }}
                    title={lockupId}
                  >
                    {lockupId}
                  </code>
                  {lockupId && (
                    <button
                      className="btn btn-outline-secondary btn-sm"
                      style={{ fontSize: "12px", padding: "2px 6px" }}
                      onClick={() => navigator.clipboard.writeText(lockupId)}
                      title="Copy"
                    >
                      📋
                    </button>
                  )}
                </div>
              </div>
              <div className="mb-2">
                <strong>Status:</strong>{" "}
                <span
                  className={`badge ${
                    isLockupDeployed ? "bg-success" : "bg-warning"
                  }`}
                >
                  {isLockupDeployed ? "Deployed" : "Not Deployed"}
                </span>
              </div>

              {isLockupDeployed && (
                <>
                  <div className="mb-2">
                    <strong>Version:</strong>{" "}
                    <code>
                      v{accountInfo?.internal?.lockup_version || "Unknown"}
                    </code>
                  </div>
                  <div className="mb-2">
                    <strong>Balance:</strong>{" "}
                    <code>{toNear(lockupBalance)}</code>
                  </div>
                  <div className="mb-2">
                    <strong>Locked:</strong> <code>{toNear(lockedAmount)}</code>
                  </div>
                  {lockupPendingAmount && (
                    <div className="mb-2">
                      <strong>Pending Unlock:</strong>{" "}
                      <code>{toNear(lockupPendingAmount)}</code>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
        <div className="col-lg-4">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Staking</h5>
            </div>
            <div className="card-body">
              {isLockupDeployed ? (
                <>
                  <div className="mb-2">
                    <strong>Pool: </strong>
                    {stakingPool ? (
                      <code>{stakingPool}</code>
                    ) : (
                      <code>None</code>
                    )}
                  </div>
                  {stakingPool && (
                    <>
                      {Big(knownDepositedBalance || "0").gt(0) && (
                        <div className="mb-2">
                          <strong>Staked: </strong>
                          <code>{toNear(knownDepositedBalance)}</code>
                        </div>
                      )}

                      {Big(accountUnstakedBalance || "0").gt(0) && (
                        <div className="mb-2">
                          <strong>Unstaked: </strong>
                          <code>{toNear(accountUnstakedBalance)}</code>
                          {isUnstakeAvailable ? (
                            <span className="badge bg-success ms-2">
                              Ready to withdraw!
                            </span>
                          ) : (
                            <span className="badge bg-secondary ms-2">
                              Cooling period (4 epochs, ~48 hours)
                            </span>
                          )}
                        </div>
                      )}
                    </>
                  )}

                  {Big(accountUnstakedBalance || "0").gt(0) &&
                    isUnstakeAvailable && (
                      <div className="alert alert-warning mt-2 py-2">
                        <small>
                          💡 <strong>Tip:</strong> You have{" "}
                          {toNear(accountUnstakedBalance)} NEAR ready to
                          withdraw. Consider withdrawing first to maximize
                          staking efficiency.
                        </small>
                      </div>
                    )}

                  {!stakingPool ? (
                    <div className="mb-3">
                      <div className="input-group input-group-sm">
                        <input
                          className="form-control"
                          type="text"
                          value={selectStakingPool}
                          onChange={(e) => setSelectStakingPool(e.target.value)}
                          placeholder="staking-pool.near"
                        />
                        <button
                          className="btn btn-primary btn-sm"
                          disabled={loading || !lockupId || !selectStakingPool}
                          onClick={async () => {
                            setLoading(true);
                            try {
                              const res = await near.sendTx({
                                receiverId: lockupId,
                                actions: [
                                  near.actions.functionCall({
                                    methodName: "select_staking_pool",
                                    gas: "100000000000000",
                                    deposit: "1",
                                    args: {
                                      staking_pool_account_id:
                                        selectStakingPool,
                                    },
                                  }),
                                ],
                                waitUntil: "INCLUDED",
                              });
                              console.log("select_staking_pool TX", res);
                            } catch (error) {
                              console.error(
                                "Select staking pool failed:",
                                error
                              );
                            } finally {
                              setLoading(false);
                            }
                          }}
                        >
                          {loading ? "Selecting..." : "Select"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="row g-1 mt-2">
                      <div className="col-6">
                        <button
                          className="btn btn-info btn-sm w-100"
                          disabled={loading || !lockupId}
                          onClick={async () => {
                            setLoading(true);
                            try {
                              const res = await near.sendTx({
                                receiverId: lockupId,
                                actions: [
                                  near.actions.functionCall({
                                    methodName: "refresh_staking_pool_balance",
                                    gas: "100000000000000",
                                    deposit: "1",
                                    args: {},
                                  }),
                                ],
                                waitUntil: "INCLUDED",
                              });
                              console.log(
                                "refresh_staking_pool_balance TX",
                                res
                              );
                            } catch (error) {
                              console.error("Refresh balance failed:", error);
                            } finally {
                              setLoading(false);
                            }
                          }}
                        >
                          Refresh
                        </button>
                      </div>

                      <div className="col-6">
                        <button
                          className="btn btn-primary btn-sm w-100"
                          disabled={
                            loading ||
                            !lockupId ||
                            !lockupLiquidOwnersBalance ||
                            Big(lockupLiquidOwnersBalance).lt(Big(10).pow(21))
                          }
                          onClick={async () => {
                            setLoading(true);
                            try {
                              const res = await near.sendTx({
                                receiverId: lockupId,
                                actions: [
                                  near.actions.functionCall({
                                    methodName: "deposit_and_stake",
                                    gas: "200000000000000",
                                    deposit: "1",
                                    args: { amount: lockupLiquidOwnersBalance },
                                  }),
                                ],
                                waitUntil: "INCLUDED",
                              });
                              console.log("deposit_and_stake TX", res);
                            } catch (error) {
                              console.error("Stake failed:", error);
                            } finally {
                              setLoading(false);
                            }
                          }}
                        >
                          Stake All
                        </button>
                      </div>

                      <div className="col-6 mt-1">
                        <button
                          className="btn btn-warning btn-sm w-100"
                          disabled={
                            loading ||
                            !lockupId ||
                            !knownDepositedBalance ||
                            Big(knownDepositedBalance).eq(0) ||
                            (Big(accountUnstakedBalance || "0").gt(0) &&
                              !isUnstakeAvailable)
                          }
                          title={
                            Big(accountUnstakedBalance || "0").gt(0) &&
                            !isUnstakeAvailable
                              ? "Already unstaking - wait for cooling period"
                              : ""
                          }
                          onClick={async () => {
                            setLoading(true);
                            try {
                              const res = await near.sendTx({
                                receiverId: lockupId,
                                actions: [
                                  near.actions.functionCall({
                                    methodName: "unstake_all",
                                    gas: "200000000000000",
                                    deposit: "1",
                                    args: {},
                                  }),
                                ],
                                waitUntil: "INCLUDED",
                              });
                              console.log("unstake_all TX", res);
                            } catch (error) {
                              console.error("Unstake all failed:", error);
                            } finally {
                              setLoading(false);
                            }
                          }}
                        >
                          {Big(accountUnstakedBalance || "0").gt(0) &&
                          !isUnstakeAvailable
                            ? "Unstaking..."
                            : "Unstake All"}
                        </button>
                      </div>

                      <div className="col-6 mt-1">
                        <button
                          className="btn btn-outline-primary btn-sm w-100"
                          disabled={
                            loading ||
                            !lockupId ||
                            Big(accountUnstakedBalance || "0").eq(0) ||
                            !isUnstakeAvailable
                          }
                          title={
                            Big(accountUnstakedBalance || "0").gt(0) &&
                            !isUnstakeAvailable
                              ? "Waiting for cooling period to complete"
                              : Big(accountUnstakedBalance || "0").eq(0)
                              ? "No unstaked funds to withdraw"
                              : ""
                          }
                          onClick={async () => {
                            setLoading(true);
                            try {
                              const res = await near.sendTx({
                                receiverId: lockupId,
                                actions: [
                                  near.actions.functionCall({
                                    methodName:
                                      "withdraw_all_from_staking_pool",
                                    gas: "200000000000000",
                                    deposit: "1",
                                    args: {},
                                  }),
                                ],
                                waitUntil: "INCLUDED",
                              });
                              console.log(
                                "withdraw_all_from_staking_pool TX",
                                res
                              );
                            } catch (error) {
                              console.error("Withdraw all failed:", error);
                            } finally {
                              setLoading(false);
                            }
                          }}
                        >
                          {!isUnstakeAvailable &&
                          Big(accountUnstakedBalance || "0").gt(0)
                            ? "Withdraw (Cooling)"
                            : "Withdraw All"}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-muted text-center py-3">
                  <p className="mb-2">
                    💡 Please deploy your lockup contract first.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Account Registration */}
      {accountInfoReady && !accountInfo && (
        <div className="card mb-4">
          <div className="card-header">
            <h5 className="mb-0">Register</h5>
          </div>
          <div className="card-body">
            <p>Get started by joining the list of participants.</p>
            <div className="mb-3">
              <strong>Registration Cost:</strong>{" "}
              <code>{toNear(registrationCost)}</code>
            </div>
            <button
              className="btn btn-primary"
              disabled={loading || !registrationCost}
              onClick={async () => {
                setLoading(true);
                try {
                  const res = await near.sendTx({
                    receiverId: Constants.VENEAR_CONTRACT_ID,
                    actions: [
                      near.actions.functionCall({
                        methodName: "storage_deposit",
                        gas: "200000000000000",
                        deposit: registrationCost,
                        args: {},
                      }),
                    ],
                    waitUntil: "INCLUDED",
                  });
                  console.log("registration TX", res);
                } catch (error) {
                  console.error("Registration failed:", error);
                } finally {
                  setLoading(false);
                }
              }}
            >
              {loading ? "Registering..." : "Start Here"}
            </button>
          </div>
        </div>
      )}

      {/* Lockup Management */}
      {accountInfo && !isLockupDeployed ? (
        <div className="card mb-4">
          <div className="card-header">
            <h5 className="mb-0">Deploy Lockup Contract</h5>
          </div>
          <div className="card-body">
            <p>
              Deploy a lockup contract to start earning veNEAR tokens through
              locked NEAR.
            </p>
            <div className="mb-3">
              <strong>Deployment Cost:</strong>{" "}
              <code>{toNear(lockupCost)}</code>
            </div>
            <button
              className="btn btn-success"
              disabled={loading || !lockupCost}
              onClick={async () => {
                setLoading(true);
                try {
                  const res = await near.sendTx({
                    receiverId: Constants.VENEAR_CONTRACT_ID,
                    actions: [
                      near.actions.functionCall({
                        methodName: "deploy_lockup",
                        gas: "100000000000000",
                        deposit: lockupCost,
                        args: {},
                      }),
                    ],
                    waitUntil: "INCLUDED",
                  });
                  console.log("deploy TX", res);
                } catch (error) {
                  console.error("Deployment failed:", error);
                } finally {
                  setLoading(false);
                }
              }}
            >
              {loading ? "Deploying..." : "Deploy Lockup Contract"}
            </button>
          </div>
        </div>
      ) : (
        isLockupDeployed && (
          <>
            {/* Lockup Actions */}
            <div className="card mb-4">
              <div className="card-header">
                <h5 className="mb-0">Lockup Actions</h5>
              </div>
              <div className="card-body">
                <div className="row g-2 mb-3">
                  <div className="col-md-6 col-lg-3">
                    <button
                      className="btn btn-primary w-100"
                      disabled={loading || !lockupId}
                      onClick={async () => {
                        setLoading(true);
                        try {
                          const res = await near.sendTx({
                            receiverId: lockupId,
                            actions: [
                              near.actions.transfer(
                                Big(10).pow(24).mul(5).toFixed(0)
                              ),
                            ],
                            waitUntil: "INCLUDED",
                          });
                          console.log("deposit TX", res);
                        } catch (error) {
                          console.error("Deposit failed:", error);
                        } finally {
                          setLoading(false);
                        }
                      }}
                    >
                      Deposit 5 NEAR
                    </button>
                  </div>

                  <div className="col-md-6 col-lg-3">
                    <button
                      className="btn btn-success w-100"
                      disabled={
                        loading ||
                        !lockupId ||
                        !lockupLiquidAmount ||
                        Big(lockupLiquidAmount).lt(Big(10).pow(21))
                      }
                      onClick={async () => {
                        setLoading(true);
                        try {
                          const res = await near.sendTx({
                            receiverId: lockupId,
                            actions: [
                              near.actions.functionCall({
                                methodName: "lock_near",
                                gas: "100000000000000",
                                deposit: "1",
                                args: {},
                              }),
                            ],
                            waitUntil: "INCLUDED",
                          });
                          console.log("lock all TX", res);
                        } catch (error) {
                          console.error("Lock failed:", error);
                        } finally {
                          setLoading(false);
                        }
                      }}
                    >
                      Lock All
                    </button>
                  </div>

                  <div className="col-md-6 col-lg-3">
                    <button
                      className="btn btn-secondary w-100"
                      disabled={
                        loading ||
                        !lockupId ||
                        !withdrawableAmount ||
                        Big(withdrawableAmount).lt(Big(10).pow(21))
                      }
                      onClick={async () => {
                        setLoading(true);
                        try {
                          const res = await near.sendTx({
                            receiverId: lockupId,
                            actions: [
                              near.actions.functionCall({
                                methodName: "transfer",
                                gas: "100000000000000",
                                deposit: "1",
                                args: {
                                  amount: withdrawableAmount,
                                  receiver_id: accountId,
                                },
                              }),
                            ],
                            waitUntil: "INCLUDED",
                          });
                          console.log("transfer TX", res);
                        } catch (error) {
                          console.error("Transfer failed:", error);
                        } finally {
                          setLoading(false);
                        }
                      }}
                    >
                      Withdraw {toNear(withdrawableAmount)}
                    </button>
                  </div>

                  <div className="col-md-6 col-lg-3">
                    <button
                      className="btn btn-warning w-100"
                      disabled={
                        loading ||
                        !lockupId ||
                        !lockedAmount ||
                        Big(lockedAmount).eq(0)
                      }
                      onClick={async () => {
                        setLoading(true);
                        try {
                          const res = await near.sendTx({
                            receiverId: lockupId,
                            actions: [
                              near.actions.functionCall({
                                methodName: "begin_unlock_near",
                                gas: "100000000000000",
                                deposit: "1",
                                args: {},
                              }),
                            ],
                            waitUntil: "INCLUDED",
                          });
                          console.log("begin_unlock_near TX", res);
                        } catch (error) {
                          console.error("Begin unlock failed:", error);
                        } finally {
                          setLoading(false);
                        }
                      }}
                    >
                      Begin Unlock
                    </button>
                  </div>
                </div>

                <div className="row g-2">
                  <div className="col-md-6 col-lg-3">
                    <button
                      className="btn btn-info w-100"
                      disabled={
                        loading ||
                        !lockupId ||
                        !lockupPendingAmount ||
                        Big(lockupPendingAmount).eq(0) ||
                        untilUnlock > 0
                      }
                      onClick={async () => {
                        setLoading(true);
                        try {
                          const res = await near.sendTx({
                            receiverId: lockupId,
                            actions: [
                              near.actions.functionCall({
                                methodName: "end_unlock_near",
                                gas: "100000000000000",
                                deposit: "1",
                                args: {},
                              }),
                            ],
                            waitUntil: "INCLUDED",
                          });
                          console.log("end_unlock_near TX", res);
                        } catch (error) {
                          console.error("End unlock failed:", error);
                        } finally {
                          setLoading(false);
                        }
                      }}
                    >
                      {untilUnlock > 0 ? "⌛ " : ""}Finish Unlock
                    </button>
                  </div>

                  <div className="col-md-6 col-lg-3">
                    <button
                      className="btn btn-outline-warning w-100"
                      disabled={
                        loading ||
                        !lockupId ||
                        !lockupPendingAmount ||
                        Big(lockupPendingAmount).eq(0)
                      }
                      onClick={async () => {
                        setLoading(true);
                        try {
                          const res = await near.sendTx({
                            receiverId: lockupId,
                            actions: [
                              near.actions.functionCall({
                                methodName: "lock_pending_near",
                                gas: "100000000000000",
                                deposit: "1",
                                args: {},
                              }),
                            ],
                            waitUntil: "INCLUDED",
                          });
                          console.log("lock_pending_near TX", res);
                        } catch (error) {
                          console.error("Lock pending failed:", error);
                        } finally {
                          setLoading(false);
                        }
                      }}
                    >
                      Re-lock Pending
                    </button>
                  </div>
                </div>

                {untilUnlock > 0 && (
                  <div className="alert alert-info mt-3">
                    <strong>Unlock Progress:</strong>{" "}
                    {(() => {
                      const totalSeconds = Math.floor(untilUnlock / 1000);
                      const minutes = Math.floor(totalSeconds / 60);
                      const seconds = totalSeconds % 60;
                      return `${minutes}m ${seconds}s remaining`;
                    })()}
                  </div>
                )}
              </div>
            </div>

            {/* Delegation Management */}
            {accountInfo?.account && (
              <div className="card mb-4">
                <div className="card-header">
                  <h5 className="mb-0">veNEAR Delegation</h5>
                </div>
                <div className="card-body">
                  {isDelegating ? (
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <strong>Currently delegating to:</strong>
                        <br />
                        <h5 className="mt-2">
                          <code>
                            {accountInfo.account.delegation?.account_id}
                          </code>
                        </h5>
                      </div>
                      <button
                        className="btn btn-outline-danger"
                        disabled={loading}
                        onClick={async () => {
                          setLoading(true);
                          try {
                            const res = await near.sendTx({
                              receiverId: Constants.VENEAR_CONTRACT_ID,
                              actions: [
                                near.actions.functionCall({
                                  methodName: "undelegate",
                                  gas: "100000000000000",
                                  deposit: "1",
                                  args: {},
                                }),
                              ],
                              waitUntil: "INCLUDED",
                            });
                            console.log("undelegate TX", res);
                          } catch (error) {
                            console.error("Undelegate failed:", error);
                          } finally {
                            setLoading(false);
                          }
                        }}
                      >
                        {loading ? "Undelegating..." : "Undelegate All veNEAR"}
                      </button>
                    </div>
                  ) : (
                    <div>
                      <p>Delegate all your veNEAR tokens to another account:</p>
                      <div className="input-group">
                        <input
                          className="form-control"
                          type="text"
                          placeholder="receiver_id"
                          value={delegateTo}
                          onChange={(e) => setDelegateTo(e.target.value)}
                        />
                        <button
                          className="btn btn-primary"
                          disabled={loading || !delegateTo}
                          onClick={async () => {
                            setLoading(true);
                            try {
                              const res = await near.sendTx({
                                receiverId: Constants.VENEAR_CONTRACT_ID,
                                actions: [
                                  near.actions.functionCall({
                                    methodName: "delegate_all",
                                    gas: "100000000000000",
                                    deposit: "1",
                                    args: {
                                      receiver_id: delegateTo,
                                    },
                                  }),
                                ],
                                waitUntil: "INCLUDED",
                              });
                              console.log("delegate_all TX", res);
                            } catch (error) {
                              console.error("Delegate failed:", error);
                            } finally {
                              setLoading(false);
                            }
                          }}
                        >
                          {loading ? "Delegating..." : "Delegate All"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )
      )}

      {/* Debug Info */}
      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h6 className="mb-0">Account Details</h6>
          <button
            className="btn btn-sm btn-light"
            onClick={() => setShowAccountInfo(!showAccountInfo)}
          >
            {showAccountInfo ? "Hide" : "Show"} Raw Data
          </button>
        </div>
        {showAccountInfo && (
          <div className="card-body">
            <div className="mb-3">
              <pre
                className="small mt-2"
                style={{
                  fontSize: "11px",
                  maxHeight: "333px",
                  overflow: "auto",
                }}
              >
                {accountInfo
                  ? JSON.stringify(accountInfo, null, 2)
                  : "Not registered"}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
