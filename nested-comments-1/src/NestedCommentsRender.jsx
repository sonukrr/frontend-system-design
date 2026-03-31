import { useEffect, useState } from "react";
import * as DATA from "./posts.json";

// TC - O(n), SC - O(n) - Use hasmaps for O(1) parent lookups
function transform() {
  const obj = {};
  const res = [];

//   Handle data ordering - To handle in case parents come before children. For robustness, do a two-pass approach

// First pass: create all comments
  DATA.default.forEach(c => {
    obj[c.id] = {...c, replies: []}
  });

  // Second pass: build relationships
  DATA.default.forEach(c => {
    if(!c.replyTo){
        res.push(obj[c.id]);
    }else if (obj[c.replyTo]){
        obj[c.replyTo].replies.push(obj[c.id]);
    }
  })


  return res;
}

const NestedCommentsRender = () => {
  const [allComments, setAllComments] = useState(transform());

  function renderComment(comment) {
    if (!comment) return <></>;

    if (Array.isArray(comment)) {
      return comment.map((c) => <div key={c.id}>{renderComment(c)}</div>);
    }

    return (
      <div key={comment.id} style={{ marginLeft: 20 }}>
        {"| " + comment.text}

        {comment.replies &&
          comment.replies.length > 0 &&
          renderComment(comment.replies)}
      </div>
    );
  }

  return (
    <>
      <h5>Nested Comments render 1</h5>
      {allComments.length > 0 && renderComment(allComments)}
    </>
  );
};

export default NestedCommentsRender;
