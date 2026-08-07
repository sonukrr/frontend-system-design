import { React, useState } from "react";

const CommentBox = ({ addComment }) => {
  const [text, setText] = useState("");

  const hasText = text.trim().length > 0;

  const submit = () => {
    if (!hasText) return;
    addComment(text);
    setText("");
  };

  return (
    <div className="sticky bottom-0 bg-white flex items-center py-2">
      <input
        className="w-full border-1 px-2 h-7 rounded-3xl text-sm"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        placeholder="Start typing to add a comment"
      />
      {hasText && (
        <button className="text-sm text-blue-600 cursor-pointer" onClick={submit}>
          Submit
        </button>
      )}
    </div>
  );
};

export default CommentBox;
