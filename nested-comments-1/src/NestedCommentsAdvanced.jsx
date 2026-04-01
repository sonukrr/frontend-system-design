import { useReducer, useState } from "react";
import { CommentsReducer, initialState } from "./CommentsReducer";

const Comment = ({ commentId, comments, dispatch, depth = 0 }) => {
  const comment = comments[commentId];
  const [replyText, setReplyText] = useState("");
  const [editText, setEditText] = useState(comment?.text || "");

  if (!comment) return null;

  const handleReply = () => {
    if (replyText.trim()) {
      dispatch({
        type: "REPLY",
        payload: { parentId: commentId, text: replyText.trim() },
      });
      setReplyText("");
      toggleReply();
    }
  };

  const handleEdit = () => {
    if (editText.trim() && editText !== comment.text) {
      dispatch({
        type: "EDIT",
        payload: { commentId, text: editText.trim() },
      });
    }
    toggleEdit();
  };

  const handleDelete = () => {
    dispatch({ type: "DELETE", payload: { commentId } });
  };

  const handleVote = (delta) => {
    dispatch({ type: "VOTE", payload: { commentId, delta } });
  };

  const toggleReply = () => {
    dispatch({ type: "TOGGLE_REPLY", payload: { commentId } });
  };

  const toggleEdit = () => {
    setEditText(comment.text);
    dispatch({ type: "TOGGLE_EDIT", payload: { commentId } });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (60 * 1000));
    const diffHours = Math.floor(diffMs / (60 * 60 * 1000));
    const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const maxDepth = 6;
  const shouldCollapse = depth >= maxDepth;

  return (
    <div
      style={{
        marginLeft: depth > 0 ? 24 : 0,
        borderLeft: depth > 0 ? "2px solid #e0e0e0" : "none",
        paddingLeft: depth > 0 ? 12 : 0,
        marginTop: 12,
      }}
    >
      <div style={{ marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
            <button
              onClick={() => handleVote(1)}
              style={{
                border: "none",
                background: "none",
                cursor: "pointer",
                fontSize: 16,
                padding: 2,
              }}
              title="Upvote"
            >
              ▲
            </button>
            <span style={{ fontSize: 12, fontWeight: "bold", minWidth: 20, textAlign: "center" }}>
              {comment.votes || 0}
            </span>
            <button
              onClick={() => handleVote(-1)}
              style={{
                border: "none",
                background: "none",
                cursor: "pointer",
                fontSize: 16,
                padding: 2,
              }}
              title="Downvote"
            >
              ▼
            </button>
          </div>

          <div style={{ flex: 1 }}>
            {comment.isEditing ? (
              <div>
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  style={{
                    width: "100%",
                    minHeight: 60,
                    padding: 8,
                    borderRadius: 4,
                    border: "1px solid #ccc",
                    fontFamily: "inherit",
                    fontSize: 14,
                  }}
                  autoFocus
                />
                <div style={{ marginTop: 4, display: "flex", gap: 8 }}>
                  <button
                    onClick={handleEdit}
                    style={{
                      padding: "4px 12px",
                      backgroundColor: "#007bff",
                      color: "white",
                      border: "none",
                      borderRadius: 4,
                      cursor: "pointer",
                      fontSize: 12,
                    }}
                  >
                    Save
                  </button>
                  <button
                    onClick={toggleEdit}
                    style={{
                      padding: "4px 12px",
                      backgroundColor: "#6c757d",
                      color: "white",
                      border: "none",
                      borderRadius: 4,
                      cursor: "pointer",
                      fontSize: 12,
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <p style={{ margin: 0, marginBottom: 4, fontSize: 14, lineHeight: 1.5 }}>
                  {comment.text}
                </p>
                <div style={{ fontSize: 11, color: "#666", marginBottom: 4 }}>
                  {formatDate(comment.createdAt)}
                  {comment.editedAt && " (edited)"}
                </div>
                <div style={{ display: "flex", gap: 12, fontSize: 12 }}>
                  <button
                    onClick={toggleReply}
                    style={{
                      border: "none",
                      background: "none",
                      color: "#007bff",
                      cursor: "pointer",
                      padding: 0,
                      fontWeight: 500,
                    }}
                  >
                    Reply
                  </button>
                  <button
                    onClick={toggleEdit}
                    style={{
                      border: "none",
                      background: "none",
                      color: "#007bff",
                      cursor: "pointer",
                      padding: 0,
                      fontWeight: 500,
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={handleDelete}
                    style={{
                      border: "none",
                      background: "none",
                      color: "#dc3545",
                      cursor: "pointer",
                      padding: 0,
                      fontWeight: 500,
                    }}
                  >
                    Delete
                  </button>
                  {comment.childIds?.length > 0 && (
                    <span style={{ color: "#666" }}>
                      {comment.childIds.length} {comment.childIds.length === 1 ? "reply" : "replies"}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {comment.showReplyBox && (
          <div style={{ marginTop: 8, marginLeft: 36 }}>
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Write a reply..."
              style={{
                width: "100%",
                minHeight: 60,
                padding: 8,
                borderRadius: 4,
                border: "1px solid #ccc",
                fontFamily: "inherit",
                fontSize: 14,
              }}
            />
            <div style={{ marginTop: 4, display: "flex", gap: 8 }}>
              <button
                onClick={handleReply}
                style={{
                  padding: "4px 12px",
                  backgroundColor: "#007bff",
                  color: "white",
                  border: "none",
                  borderRadius: 4,
                  cursor: "pointer",
                  fontSize: 12,
                }}
              >
                Reply
              </button>
              <button
                onClick={toggleReply}
                style={{
                  padding: "4px 12px",
                  backgroundColor: "#6c757d",
                  color: "white",
                  border: "none",
                  borderRadius: 4,
                  cursor: "pointer",
                  fontSize: 12,
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {comment.childIds && comment.childIds.length > 0 && (
        <div>
          {shouldCollapse ? (
            <div style={{ marginLeft: 36, fontSize: 12, color: "#007bff", cursor: "pointer" }}>
              ... {comment.childIds.length} more {comment.childIds.length === 1 ? "reply" : "replies"} (max depth reached)
            </div>
          ) : (
            comment.childIds.map((childId) => (
              <Comment
                key={childId}
                commentId={childId}
                comments={comments}
                dispatch={dispatch}
                depth={depth + 1}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
};

const NestedCommentsAdvanced = () => {
  const [input, setInput] = useState("");
  const [state, dispatch] = useReducer(CommentsReducer, initialState);

  const addComment = () => {
    if (input.trim()) {
      dispatch({
        type: "ADD",
        payload: { text: input.trim() },
      });
      setInput("");
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: 20, fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, marginBottom: 8 }}>Nested Comments System</h1>
        <p style={{ color: "#666", fontSize: 14, margin: 0 }}>
          System Design Interview - 1 Hour Coding Round
        </p>
      </div>

      <div style={{ marginBottom: 24, padding: 16, backgroundColor: "#f8f9fa", borderRadius: 8 }}>
        <h3 style={{ marginTop: 0, marginBottom: 12, fontSize: 16 }}>Add a comment</h3>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="What are your thoughts?"
          style={{
            width: "100%",
            minHeight: 80,
            padding: 12,
            borderRadius: 4,
            border: "1px solid #ccc",
            fontFamily: "inherit",
            fontSize: 14,
            resize: "vertical",
          }}
        />
        <div style={{ marginTop: 8 }}>
          <button
            onClick={addComment}
            disabled={!input.trim()}
            style={{
              padding: "8px 16px",
              backgroundColor: input.trim() ? "#007bff" : "#ccc",
              color: "white",
              border: "none",
              borderRadius: 4,
              cursor: input.trim() ? "pointer" : "not-allowed",
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            Post Comment
          </button>
        </div>
      </div>

      {Object.keys(state.comments).length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <span style={{ fontSize: 14, fontWeight: 500 }}>
            {Object.keys(state.comments).length} {Object.keys(state.comments).length === 1 ? "comment" : "comments"}
          </span>
        </div>
      )}

      <div>
        {state.rootIds.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40, color: "#666", fontSize: 14 }}>
            No comments yet. Be the first to comment!
          </div>
        ) : (
          state.rootIds.map((commentId) => (
            <Comment
              key={commentId}
              commentId={commentId}
              comments={state.comments}
              dispatch={dispatch}
              depth={0}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default NestedCommentsAdvanced;
