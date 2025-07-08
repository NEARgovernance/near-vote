import { useState } from "react";
import { Constants } from "../hooks/constants.js";

export function CreateProposalModal({ show, onClose, accountId }) {
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [link, setLink] = useState("");
  const [votingOptions, setVotingOptions] = useState(["", ""]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const isValidProposal =
    title.trim().length >= 3 &&
    (description.trim().length >= 10 || link.trim().length > 0) &&
    votingOptions.filter((opt) => opt.trim().length > 0).length >= 2;

  const handleSubmit = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await near.sendTx({
        receiverId: Constants.VOTING_CONTRACT_ID,
        actions: [
          near.actions.functionCall({
            methodName: "create_proposal",
            gas: $$`100 Tgas`,
            deposit: $$`0.2 NEAR`,
            args: {
              metadata: {
                title: title.trim(),
                description: description.trim() || null,
                link: link.trim() || null,
                voting_options: votingOptions.filter(
                  (f) => f.trim().length > 0
                ),
              },
            },
          }),
        ],
        waitUntil: "INCLUDED",
      });

      console.log("create proposal TX", res);
      setSuccess(true);

      // Reset form after success
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (err) {
      console.error("Failed to create proposal:", err);
      setError(err.message || "Failed to create proposal");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setTitle("");
      setDescription("");
      setLink("");
      setVotingOptions(["", ""]);
      setError("");
      setSuccess(false);
      onClose();
    }
  };

  const addOption = () => {
    if (votingOptions.length < 8) {
      // Reasonable limit
      setVotingOptions([...votingOptions, ""]);
    }
  };

  const removeOption = (index) => {
    if (votingOptions.length > 2) {
      const newOptions = [...votingOptions];
      newOptions.splice(index, 1);
      setVotingOptions(newOptions);
    }
  };

  const updateOption = (index, value) => {
    const newOptions = [...votingOptions];
    newOptions[index] = value;
    setVotingOptions(newOptions);
  };

  if (!show) return null;

  return (
    <div
      className="modal show d-block"
      tabIndex="-1"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
    >
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Create Proposal</h5>
            <button
              type="button"
              className="btn-close"
              onClick={handleClose}
              disabled={loading}
            ></button>
          </div>

          <div className="modal-body">
            {!accountId ? (
              <div className="alert alert-warning">
                <h6>Sign In Required</h6>
                <p className="mb-0">Please sign in to create a proposal.</p>
              </div>
            ) : success ? (
              <div className="alert alert-success text-center">
                <h6>🎉 Proposal Created Successfully!</h6>
                <p className="mb-0">
                  Your proposal has been submitted for review.
                </p>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSubmit();
                }}
              >
                {error && (
                  <div className="alert alert-danger">
                    <strong>Error:</strong> {error}
                  </div>
                )}

                {/* Title */}
                <div className="mb-3">
                  <label htmlFor="proposal-title" className="form-label">
                    Title <span className="text-danger">*</span>
                  </label>
                  <input
                    id="proposal-title"
                    type="text"
                    className="form-control"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Brief, descriptive title for your proposal"
                    maxLength={100}
                    disabled={loading}
                  />
                  <div className="form-text">
                    {title.length}/100 characters (minimum 3)
                  </div>
                </div>

                {/* Description */}
                <div className="mb-3">
                  <label htmlFor="proposal-description" className="form-label">
                    Description{" "}
                    {!link.trim() && <span className="text-danger">*</span>}
                  </label>
                  <textarea
                    id="proposal-description"
                    className="form-control"
                    rows="4"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Detailed explanation of your proposal..."
                    maxLength={2000}
                    disabled={loading}
                  />
                  <div className="form-text">
                    {description.length}/2000 characters
                    {!link.trim() && " (minimum 10 required)"}
                  </div>
                </div>

                {/* Link */}
                <div className="mb-3">
                  <label htmlFor="proposal-link" className="form-label">
                    Reference Link{" "}
                    {!description.trim() && (
                      <span className="text-danger">*</span>
                    )}
                  </label>
                  <input
                    id="proposal-link"
                    type="url"
                    className="form-control"
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    placeholder="https://forum.near.org/discussion/..."
                    disabled={loading}
                  />
                  <div className="form-text">
                    Link to detailed discussion or documentation
                    {!description.trim() && " (required if no description)"}
                  </div>
                </div>

                {/* Voting Options */}
                <div className="mb-3">
                  <label className="form-label">
                    Voting Options <span className="text-danger">*</span>
                  </label>
                  {votingOptions.map((option, index) => (
                    <div key={index} className="input-group mb-2">
                      <span className="input-group-text">#{index + 1}</span>
                      <input
                        type="text"
                        className="form-control"
                        value={option}
                        onChange={(e) => updateOption(index, e.target.value)}
                        placeholder={`Option ${index + 1}`}
                        maxLength={100}
                        disabled={loading}
                      />
                      {votingOptions.length > 2 && (
                        <button
                          type="button"
                          className="btn btn-outline-danger"
                          onClick={() => removeOption(index)}
                          disabled={loading}
                        >
                          ❌
                        </button>
                      )}
                    </div>
                  ))}

                  <div className="d-flex justify-content-between align-items-center">
                    <button
                      type="button"
                      className="btn btn-outline-secondary btn-sm"
                      onClick={addOption}
                      disabled={loading || votingOptions.length >= 8}
                    >
                      Add Option
                    </button>
                    <small className="text-muted">
                      {
                        votingOptions.filter((opt) => opt.trim().length > 0)
                          .length
                      }{" "}
                      of {votingOptions.length} options filled
                    </small>
                  </div>
                </div>

                {/* Cost Info */}
                <div className="alert alert-info">
                  <strong>💰 Creation Cost:</strong> 0.2 NEAR
                  <br />
                  <small>This covers storage costs and platform fees.</small>
                </div>
              </form>
            )}
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleClose}
              disabled={loading}
            >
              {success ? "Close" : "Cancel"}
            </button>
            {accountId && !success && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSubmit}
                disabled={loading || !isValidProposal}
              >
                {loading ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                    ></span>
                    Creating...
                  </>
                ) : (
                  "Create Proposal"
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
