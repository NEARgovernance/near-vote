import { useAccount } from "../hooks/useAccount.js";
import { useEffect, useState } from "react";
import React from "react";
import { useNearView } from "../hooks/useNearView.js";
import { Constants } from "../hooks/constants.js";
import { useNonce } from "../hooks/useNonce.js";
import { processAccount, toVeNear } from "../hooks/utils.js";
import Big from "big.js";

function voteText(proposal, vote) {
  const totalVotes = proposal.total_votes;
  const votes = proposal.votes[vote];
  const percent = Big(totalVotes.total_venear).gt(0)
    ? Big(votes.total_venear).div(Big(totalVotes.total_venear))
    : Big(0);
  const numVotes = votes.total_votes;
  return `${toVeNear(votes.total_venear)} (${percent
    .mul(100)
    .toFixed(2)}% ${numVotes} votes)`;
}

function timeLeft(proposal) {
  const now = new Date();
  const endTime = new Date(
    (parseFloat(proposal.voting_start_time_ns) +
      parseFloat(proposal.voting_duration_ns)) /
      1e6
  );
  const timeLeft = endTime - now;
  if (timeLeft < 0) {
    return "Voting ended";
  }
  const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeLeft / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((timeLeft / (1000 * 60)) % 60);
  const seconds = Math.floor((timeLeft / 1000) % 60);
  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

export function Proposal(props) {
  const { proposal, votingConfig } = props;
  const accountId = useAccount();
  const nonce = useNonce();
  const [loading, setLoading] = useState(false);
  const isVotingActive = proposal.status === "Voting";
  const [activeVote, setActiveVote] = useState(null);

  const existingVote = useNearView({
    initialValue: null,
    condition: ({ extraDeps }) => !!extraDeps[1],
    contractId: Constants.VOTING_CONTRACT_ID,
    methodName: "get_vote",
    args: {
      account_id: accountId,
      proposal_id: proposal.id,
    },
    extraDeps: [nonce, accountId],
    errorValue: null,
  });

  const snapshotBlockHeight =
    proposal?.snapshot_and_state?.snapshot?.block_height;
  const totalVotingPower = proposal?.snapshot_and_state?.total_venear;
  const snapshotLength = proposal?.snapshot_and_state?.snapshot?.length;
  let [merkleProof, vAccount] = useNearView({
    initialValue: [null, null],
    condition: ({ extraDeps: [nonce, accountId, snapshotBlockHeight] }) =>
      !!accountId && !!snapshotBlockHeight,
    contractId: Constants.VENEAR_CONTRACT_ID,
    methodName: "get_proof",
    args: {
      account_id: accountId,
    },
    blockId: snapshotBlockHeight,
    extraDeps: [nonce, accountId, snapshotBlockHeight],
    errorValue: [null, null],
  });
  // Temp fix for older contract version
  if (vAccount && vAccount.Current) {
    vAccount = {
      V0: vAccount.Current,
    };
  }
  const account = vAccount?.V0 ? processAccount(vAccount?.V0) : null;

  useEffect(() => {
    setActiveVote(null);
  }, [proposal]);

  useEffect(() => {
    if (activeVote === null && existingVote !== null) {
      setActiveVote(existingVote);
    }
  }, [proposal, activeVote, existingVote]);

  return (
    <div>
      <div className="m-1 mb-2">
        <strong>Proposer:</strong>{" "}
        <a
          href={`https://testnet.nearblocks.io/address/${proposal.proposer_id}`}
        >
          <code>{proposal.proposer_id}</code>
        </a>
      </div>
      <div className="m-1 mb-2">
        <strong>Status:</strong> {proposal.status}
      </div>
      {totalVotingPower && (
        <div className="m-1 mb-2" key="stats">
          <div>
            <strong>Voted:</strong>{" "}
            {toVeNear(proposal.total_votes.total_venear)} /{" "}
            {toVeNear(totalVotingPower)} (
            {Big(proposal.total_votes.total_venear)
              .div(Big(totalVotingPower))
              .mul(100)
              .toFixed(2)}
            %)
          </div>
          <div>
            <strong>Accounts voted:</strong> {proposal.total_votes.total_votes}{" "}
            / {snapshotLength} (
            {(
              (proposal.total_votes.total_votes * 100) /
              snapshotLength
            ).toFixed(2)}
            %)
          </div>
          <div>
            <strong>Time left to vote:</strong> {timeLeft(proposal)}
          </div>
        </div>
      )}
      <div className="m-1 mb-2">
        <strong>Description:</strong> <p>{proposal.description}</p>
      </div>
      <div className="m-1 mb-2">
        <strong>Link:</strong>{" "}
        <a href={proposal.link} target="_blank">
          {proposal.link}
        </a>
      </div>
      <div className="m-1">
        <strong>Voting Options:</strong>
        <div className="d-grid gap-2 ms-1 mt-3 mb-2">
          {proposal.voting_options.map((option, index) => (
            <React.Fragment key={index}>
              <input
                className="btn-check"
                type="radio"
                checked={activeVote === index}
                name="votes"
                id={`option-${proposal.id}-${index}`}
                onChange={(e) => {
                  if (e.target.checked) {
                    setActiveVote(index);
                  }
                }}
              />
              <label
                className="btn btn-outline-primary text-start"
                htmlFor={`option-${proposal.id}-${index}`}
              >
                <div className={"d-flex justify-content-between"}>
                  <div>
                    {existingVote === index && (
                      <span key={"vote"} title={"Your existing vote"}>
                        ✅{" "}
                      </span>
                    )}
                    {option}
                  </div>
                  <div>{voteText(proposal, index)}</div>
                </div>
              </label>
            </React.Fragment>
          ))}
        </div>
      </div>
      <div className="m-1">
        <button
          className="btn btn-success m-1"
          disabled={
            loading ||
            !isVotingActive ||
            !accountId ||
            activeVote === null ||
            !account ||
            account?.totalBalance.eq(0) ||
            existingVote === activeVote
          }
          onClick={async () => {
            setLoading(true);
            const res = await near.sendTx({
              receiverId: Constants.VOTING_CONTRACT_ID,
              actions: [
                near.actions.functionCall({
                  methodName: "vote",
                  gas: $$`100 Tgas`,
                  deposit: votingConfig.vote_storage_fee,
                  args: {
                    proposal_id: proposal.id,
                    vote: activeVote,
                    merkle_proof: merkleProof,
                    v_account: vAccount,
                  },
                }),
              ],
              waitUntil: "INCLUDED",
            });
            console.log("vote TX", res);
            setLoading(false);
          }}
        >
          {existingVote !== null && activeVote !== existingVote && "CHANGE"}{" "}
          Vote with {toVeNear(account?.totalBalance)}
        </button>
      </div>
    </div>
  );
}
