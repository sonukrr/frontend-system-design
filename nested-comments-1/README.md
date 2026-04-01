
## 90. Nested Comments I

- Difficulty: 🟠 Medium
- Featured Image: https://api.frontendlead.com/wp-content/uploads/2025/05/Screenshot-2025-05-26-at-1.19.58-PM.png

### Content

<p><img loading="lazy" decoding="async" class="alignnone size-full wp-image-1746" src="https://api.frontendlead.com/wp-content/uploads/2025/05/Screenshot-2025-05-26-at-1.19.58-PM.png" alt="" width="927" height="303" srcset="https://api.frontendlead.com/wp-content/uploads/2025/05/Screenshot-2025-05-26-at-1.19.58-PM.png 927w, https://api.frontendlead.com/wp-content/uploads/2025/05/Screenshot-2025-05-26-at-1.19.58-PM-300x98.png 300w, https://api.frontendlead.com/wp-content/uploads/2025/05/Screenshot-2025-05-26-at-1.19.58-PM-768x251.png 768w" sizes="(max-width: 927px) 100vw, 927px" /></p>
<p>You are given a flat array of posts and comments. Each item in the array represents either a top-level post or a comment on a post (or another comment). Each object has the following properties:</p>
<ul>
<li><code>id</code> (number): A unique identifier for the post or comment.</li>
<li><code>text</code> (string): The content of the post or comment.</li>
<li><code>replyTo</code> (number, optional): The <code>id</code> of the post or comment that this comment is replying to. If absent, the item is a top-level post.</li>
</ul>
<p>Your task is to convert this flat array into a nested tree structure that represents the parent-child relationships between posts and comments, and render this structure recursively in React as an indented list.</p>
<h3>Requirements</h3>
<ul>
<li>Write a function that transforms the flat array of posts and comments into a tree, where each comment object includes a <code>replies</code> array containing its direct children.</li>
<li>Implement a React component that recursively renders the tree, so each comment displays its nested replies as indented child lists.</li>
<li>Handle any depth of nesting—comments can reply to posts, or to other comments, indefinitely.</li>
<li>The input array may contain posts and comments in any order.</li>
<li>Do <b>not</b> mutate the original input array.</li>
</ul>
<h3>Input</h3>
<pre><code>
posts: Array&lt;{
  id: number,
  text: string,
  replyTo?: number
}&gt;
</code></pre>
<h3>Output</h3>
<pre><code>
Array&lt;{
  id: number,
  text: string,
  replyTo?: number,
  replies: Array&lt;...&gt;
}&gt;
</code></pre>
<h3>Example</h3>
<pre><code>
Input:
[
  { id: 1, text: "This is a post 1" },
  { id: 2, replyTo: 1, text: "This is a comment, child to post 1" },
  { id: 3, replyTo: 2, text: "This is a comment, child to comment 2" },
  { id: 4, replyTo: 1, text: "This is a comment, child to post 1" },
  { id: 5, text: "This is a post 2" }
]

Output (tree structure):
[
  {
    id: 1,
    text: "This is a post 1",
    replies: [
      {
        id: 2,
        replyTo: 1,
        text: "This is a comment, child to post 1",
        replies: [
          {
            id: 3,
            replyTo: 2,
            text: "This is a comment, child to comment 2",
            replies: []
          }
        ]
      },
      {
        id: 4,
        replyTo: 1,
        text: "This is a comment, child to post 1",
        replies: []
      }
    ]
  },
  {
    id: 5,
    text: "This is a post 2",
    replies: []
  }
]

Explanation:
- Posts and comments are arranged in a tree structure, where each comment is nested under its parent based on the <code>replyTo</code> field. - Comments can be nested to any depth. - Only items without a <code>replyTo</code> field appear at the top level of the result. </code></pre>

---
# Nested Comments System - Interview Implementation

## Quick Start

```bash
npm install
npm run dev
```

## System Design Interview - 1 Hour Coding Round

This implementation demonstrates **core system design concepts** for a 1-hour machine coding interview:

### 1. **Data Structure Choice** ⭐
- **Normalized state with hash map** for O(1) lookups
- Avoids deep nesting performance issues
- Scales to thousands of comments

### 2. **State Management** ⭐
- `useReducer` for predictable state transitions
- Centralized business logic in reducer
- Easy to test and debug

### 3. **Full CRUD Operations** ⭐
- Create (root comments + replies)
- Read (display nested structure)
- Update (edit with history tracking)
- Delete (cascade delete children)
- Vote (upvote/downvote)

### 4. **Performance Considerations** ⭐
- Component splitting to minimize re-renders
- Depth limiting (max 6 levels)
- Efficient recursive rendering

### 5. **Interview-Appropriate Scope** ⭐
- No over-engineering (no API layer, localStorage, etc.)
- Focus on data structures and algorithms
- Clean, readable code
- Demonstrates system thinking

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    UI Layer                              │
│  NestedCommentsAdvanced.jsx                             │
│    - Comment Component (recursive)                      │
│    - Main Container Component                           │
└────────────────┬────────────────────────────────────────┘
                 │
                 │ dispatch(action)
                 │
┌────────────────▼────────────────────────────────────────┐
│              State Management Layer                      │
│  CommentsReducer.jsx (Pure Reducer Functions)           │
│    - ADD, REPLY, EDIT, DELETE, VOTE                     │
│    - TOGGLE_EDIT, TOGGLE_REPLY                          │
└─────────────────────────────────────────────────────────┘
```

**Simple 2-layer architecture for interview:**
- UI handles rendering and user interactions
- Reducer handles all state mutations

## File Structure

```
src/
├── NestedCommentsAdvanced.jsx    # Main UI component (Comment + Container)
└── CommentsReducer.jsx            # State management (reducer)

SYSTEM_DESIGN.md                  # Design decisions & trade-offs
README_IMPLEMENTATION.md          # This file
```

## Key Features Demonstrated

### ✅ Normalized State Pattern
```javascript
// Instead of nested objects:
{
  comments: [
    { id: 1, text: "...", replies: [
      { id: 2, text: "...", replies: [...] }
    ]}
  ]
}

// Use flat hash map:
{
  comments: {
    "1": { id: "1", text: "...", childIds: ["2"] },
    "2": { id: "2", text: "...", childIds: [], parentId: "1" }
  },
  rootIds: ["1"]
}
```

**Benefits:**
- O(1) lookup by ID
- Efficient updates (no deep cloning)
- Better performance with large datasets

### ✅ Reducer Pattern
```javascript
dispatch({ type: 'ADD', payload: { text: 'Hello' } });
dispatch({ type: 'REPLY', payload: { parentId: '1', text: 'Reply' } });
dispatch({ type: 'VOTE', payload: { commentId: '1', delta: 1 } });
```

**Benefits:**
- Predictable state changes
- Easy to debug (action logs)
- Testable (pure functions)

### ✅ Recursive Rendering
```javascript
const Comment = ({ commentId, comments, dispatch, depth }) => {
  const comment = comments[commentId];
  
  return (
    <div style={{ marginLeft: depth > 0 ? 20 : 0 }}>
      {/* Comment content */}
      
      {/* Recursively render children */}
      {comment.childIds?.map(childId => (
        <Comment 
          key={childId}
          commentId={childId}
          comments={comments}
          dispatch={dispatch}
          depth={depth + 1}
        />
      ))}
    </div>
  );
};
```

**Benefits:**
- Clean, intuitive code
- Handles arbitrary nesting depth
- Easy to understand in interview setting

## Interview Discussion Points

### 1. **Scalability Questions**

**Q: How would you handle 10,000+ comments?**
- Implement pagination (load 20 at a time)
- Virtual scrolling for visible comments only
- Lazy load nested replies on demand
- Server-side rendering for initial load

**Q: How would you handle real-time updates?**
- WebSocket connection for live updates
- Optimistic UI updates
- Conflict resolution strategy
- Event sourcing for audit trail

### 2. **Database Design**

```sql
CREATE TABLE comments (
  id UUID PRIMARY KEY,
  post_id UUID NOT NULL,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  text TEXT NOT NULL,
  votes INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  edited_at TIMESTAMP,
  
  INDEX idx_post_parent (post_id, parent_id),
  INDEX idx_created_at (created_at DESC)
);
```

**Key Points:**
- Cascade delete for child comments
- Composite index for tree queries
- Soft deletes for audit trail (optional)

### 3. **Caching Strategy** (Discussion Points)

- **Client:** Browser memory (current implementation)
- **CDN:** Static assets (JS, CSS)
- **Redis:** Hot comment threads (TTL: 5 min)
- **Database:** Query result cache with invalidation

*Note: For interview, focus on discussing these concepts rather than implementing them*

### 4. **API Design**

```
GET    /api/posts/:postId/comments?page=1&limit=20&sort=newest
POST   /api/posts/:postId/comments
PUT    /api/posts/:postId/comments/:commentId
DELETE /api/posts/:postId/comments/:commentId
POST   /api/posts/:postId/comments/:commentId/vote
GET    /api/posts/:postId/comments/:commentId/replies?cursor=abc123
```

**Design Choices:**
- RESTful endpoints
- Pagination with cursor-based approach
- Nested routes for clarity
- Separate vote endpoint (idempotent)

### 5. **Trade-offs**

| Approach | Pros | Cons | When to Use |
|----------|------|------|-------------|
| Normalized State | Fast lookups, efficient updates | More complex code | Large datasets |
| Nested Objects | Simple, intuitive | Slow updates, deep cloning | Small datasets |
| Pagination | Scalable, fast initial load | More API calls | 100+ comments |
| Virtual Scrolling | Constant memory | Complex implementation | 1000+ comments |
| WebSockets | Real-time updates | Server overhead | Active discussions |
| Polling | Simple, reliable | Wasteful, delayed | Low-traffic sites |

## Testing Strategy

### Unit Tests
```javascript
// Reducer tests
test('ADD creates new root comment', () => {
  const state = reducer(initialState, {
    type: 'ADD',
    payload: { text: 'Test' }
  });
  expect(Object.keys(state.comments)).toHaveLength(1);
});

// Helper function tests
test('sortComments by votes', () => {
  const sorted = sortComments(comments, ids, 'votes');
  expect(sorted[0]).toBe('highest-voted-id');
});
```

### Integration Tests
```javascript
test('User can add and reply to comment', async () => {
  render(<NestedCommentsAdvanced />);
  
  // Add root comment
  await userEvent.type(screen.getByPlaceholder('What are your thoughts?'), 'Root');
  await userEvent.click(screen.getByText('Post Comment'));
  
  // Add reply
  await userEvent.click(screen.getByText('Reply'));
  await userEvent.type(screen.getByPlaceholder('Write a reply...'), 'Reply');
  await userEvent.click(screen.getByText('Reply'));
  
  expect(screen.getByText('1 reply')).toBeInTheDocument();
});
```

## What's NOT Included (Intentionally)

For a 1-hour interview, these are **out of scope**:

- ❌ API integration / Backend calls
- ❌ localStorage persistence
- ❌ Authentication / Authorization
- ❌ Sorting/filtering UI
- ❌ Pagination
- ❌ Rich text editing
- ❌ Real-time updates (WebSockets)
- ❌ Advanced error handling
- ❌ Loading states / Spinners
- ❌ Optimistic updates with rollback

**Why?** Focus on demonstrating:
1. Data structure understanding
2. State management patterns
3. Core algorithm implementation
4. Clean, readable code

## Interview Time Management

**Recommended 1-hour breakdown:**

- **0-10 min:** Clarify requirements, discuss data structure choice
- **10-30 min:** Implement reducer (ADD, REPLY, DELETE)
- **30-45 min:** Build UI components (Comment, Container)
- **45-55 min:** Add EDIT and VOTE functionality
- **55-60 min:** Test, discuss trade-offs and scalability

## Extensions to Discuss (If Time Permits)

If you finish early, discuss these with the interviewer:

1. **Pagination Strategy** - How would you load comments in chunks?
2. **Real-time Updates** - WebSocket vs Polling trade-offs
3. **Caching** - Where and what to cache?
4. **Database Schema** - Table structure and indexes
5. **Security** - XSS prevention, rate limiting

## Common Interview Questions & Answers

### Q1: Why normalized state instead of nested objects?

**Answer:**
```javascript
// ❌ Nested: O(n) to find and update
const findComment = (comments, id) => {
  for (let comment of comments) {
    if (comment.id === id) return comment;
    if (comment.replies) {
      const found = findComment(comment.replies, id);
      if (found) return found;
    }
  }
};

// ✅ Normalized: O(1) to find and update
const comment = state.comments[id];
```

**Benefits:**
- O(1) lookups vs O(n) tree traversal
- Efficient updates (no deep cloning)
- Scales to thousands of comments

### Q2: Why useReducer instead of useState?

**Answer:**
- **Complex state** - Multiple related pieces (comments, rootIds)
- **Predictable** - All mutations go through reducer
- **Testable** - Pure functions, easy to unit test
- **Debuggable** - Action logs show exact state changes
- **Scalable** - Easy to add new actions (VOTE, EDIT, etc.)

### Q3: How does DELETE handle nested children?

**Answer:**
```javascript
case "DELETE": {
  // 1. Remove from parent's childIds
  // 2. Recursively delete all children
  const deleteRecursive = (id) => {
    const comment = updatedComments[id];
    if (comment?.childIds) {
      comment.childIds.forEach(deleteRecursive);
    }
    delete updatedComments[id];
  };
  
  deleteRecursive(commentId);
}
```

**Cascade delete** ensures no orphaned comments remain.

### Q4: How would you handle 10,000+ comments?

**Answer:**
1. **Pagination** - Load 20 root comments at a time
2. **Lazy loading** - Load replies on-demand ("Show more replies")
3. **Virtual scrolling** - Only render visible comments
4. **Backend filtering** - Server-side pagination with cursors

```javascript
// API design
GET /api/comments?postId=123&limit=20&cursor=abc123
GET /api/comments/:id/replies?limit=10&cursor=xyz789
```

### Q5: How would you add real-time updates?

**Answer:**

**Option 1: WebSockets** (Better for active discussions)
```javascript
useEffect(() => {
  const ws = new WebSocket('ws://api/comments');
  ws.onmessage = (event) => {
    const action = JSON.parse(event.data);
    dispatch(action); // ADD, EDIT, DELETE from other users
  };
}, []);
```

**Option 2: Polling** (Simpler, good for low-traffic)
```javascript
useEffect(() => {
  const interval = setInterval(() => {
    fetchNewComments().then(comments => {
      dispatch({ type: 'LOAD_COMMENTS', payload: comments });
    });
  }, 5000); // Poll every 5 seconds
}, []);
```

**Trade-offs:**
- WebSockets: Real-time, but server overhead
- Polling: Simple, but wasteful and delayed

### Q6: How do you prevent XSS attacks?

**Answer:**
1. **React auto-escapes** - JSX automatically escapes text
2. **Backend sanitization** - Clean HTML on server
3. **CSP headers** - Content Security Policy
4. **Never use** `dangerouslySetInnerHTML` without DOMPurify

```javascript
// ✅ Safe - React escapes automatically
<p>{comment.text}</p>

// ❌ Dangerous
<div dangerouslySetInnerHTML={{ __html: comment.text }} />
```

## Key Takeaways for Interviewers

When presenting this solution, emphasize:

1. **Data Structure Choice** 
   - Normalized state with O(1) lookups
   - Explain why nested objects don't scale

2. **State Management**
   - useReducer for complex, related state
   - Centralized business logic

3. **Algorithm Complexity**
   - ADD: O(1)
   - REPLY: O(1)
   - DELETE: O(n) where n = number of descendants
   - VOTE/EDIT: O(1)

4. **Scalability Thinking**
   - Discuss pagination for large datasets
   - Mention virtual scrolling for 1000+ comments
   - Talk about caching strategies

5. **Trade-offs**
   - Normalized vs nested structures
   - Client-side vs server-side rendering
   - WebSockets vs polling for real-time

## Resources

- [System Design Primer](https://github.com/donnemartin/system-design-primer)
- [React Patterns](https://react.dev/learn)
- [Database Indexing](https://use-the-index-luke.com/)

---

**Built for 1-hour system design machine coding interviews** ⏱️
