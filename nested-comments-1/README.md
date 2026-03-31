
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

## Solution Approach - Nested Comments I

### Algorithm Overview

**Problem**: Transform a flat array of posts/comments into a nested tree structure based on `replyTo` relationships.

**Solution**: Two-pass hashmap approach for O(n) time complexity.

### Implementation Strategy

#### **Step 1: Create Comment Map (First Pass)**
- Iterate through all comments
- Create a hashmap where `key = comment.id`, `value = comment object with empty replies array`
- This allows O(1) lookup of any comment by its ID

#### **Step 2: Build Relationships (Second Pass)**
- Iterate through all comments again
- If `comment.replyTo` is undefined → add to root results array (top-level post)
- If `comment.replyTo` exists → find parent in hashmap and push to parent's `replies` array
- This handles any data ordering (parents don't need to come before children)

#### **Step 3: Recursive Rendering**
- Check if input is an array → map over it and recursively render each item
- For single comment → render the comment and recursively render its replies
- Use proper React keys (`c.id`) to avoid warnings
- Apply indentation styling for visual hierarchy

### Complexity Analysis

- **Time Complexity**: O(n) - Two passes through the data
- **Space Complexity**: O(n) - Hashmap stores all comments

### Visual Mind Map

```
Flat Array Input
    ↓
┌───────────────────────────────────┐
│   PASS 1: Create Hashmap          │
│   obj[id] = {...comment, replies:[]}│
└───────────────────────────────────┘
    ↓
┌───────────────────────────────────┐
│   PASS 2: Build Relationships     │
│   - No replyTo? → root array      │
│   - Has replyTo? → parent.replies │
└───────────────────────────────────┘
    ↓
┌───────────────────────────────────┐
│   Nested Tree Structure           │
│   [Post1{replies:[...]}, Post2{}] │
└───────────────────────────────────┘
    ↓
┌───────────────────────────────────┐
│   Recursive Render                │
│   - Array? → map & recurse        │
│   - Object? → render + replies    │
└───────────────────────────────────┘
```

### Code Structure

```javascript
// TC: O(n), SC: O(n) - Hashmap for O(1) parent lookups
function transform() {
  const obj = {};      // Hashmap: id → comment
  const res = [];      // Root-level posts
  
  // Pass 1: Create all comment objects
  DATA.default.forEach(c => {
    obj[c.id] = {...c, replies: []}
  });
  
  // Pass 2: Build parent-child relationships
  DATA.default.forEach(c => {
    if(!c.replyTo){
      res.push(obj[c.id]);           // Top-level post
    } else if (obj[c.replyTo]){
      obj[c.replyTo].replies.push(obj[c.id]);  // Nested reply
    }
  });
  
  return res;
}
```

### Key Design Decisions

1. **Two-pass approach**: Handles any data ordering (children can appear before parents in input)
2. **Hashmap lookup**: O(1) parent lookup vs O(n²) tree traversal
3. **Extracted transform function**: Prevents recreation on every render
4. **Recursive rendering**: Handles arbitrary nesting depth
5. **Array.isArray check**: Flexible rendering for both arrays and single comments

### Edge Cases Handled

- ✅ Comments appearing before their parents in input array
- ✅ Orphaned comments (parent doesn't exist)
- ✅ Arbitrary nesting depth
- ✅ Empty replies arrays
- ✅ Multiple children per parent

---

## 91. Nested Comments II

- Difficulty: 🟠 Medium
- Featured Image: https://api.frontendlead.com/wp-content/uploads/2025/05/Screenshot-2025-05-26-at-1.27.23-PM.png

### Content

<p><img loading="lazy" decoding="async" class="alignnone size-full wp-image-1750" src="https://api.frontendlead.com/wp-content/uploads/2025/05/Screenshot-2025-05-26-at-1.27.23-PM.png" alt="Nested Comments II" width="304" height="99" srcset="https://api.frontendlead.com/wp-content/uploads/2025/05/Screenshot-2025-05-26-at-1.27.23-PM.png 304w, https://api.frontendlead.com/wp-content/uploads/2025/05/Screenshot-2025-05-26-at-1.27.23-PM-300x98.png 300w" sizes="(max-width: 304px) 100vw, 304px" /></p>
<h2>Problem Statement</h2>
<p>You are given a data structure representing a list of posts and their nested replies. Each post is represented as an object with the following properties:</p>
<ul>
<li><code>id</code> (number): A unique identifier for the post or comment.</li>
<li><code>text</code> (string): The content of the post or comment.</li>
<li><code>replyTo</code> (number, optional): The <code>id</code> of the post or comment this is replying to.</li>
<li><code>replies</code> (array): An array of child comments (can be empty).</li>
</ul>
<p>Your task is to write a React function that <b>flattens this nested tree</b> into a single-level list (array), including only the posts and comments up to a specified depth <code>maxLevel</code>. If <code>maxLevel = 1</code>, return the top-level posts and their direct replies. If <code>maxLevel = 2</code>, include one more level of replies, and so on. Replies deeper than <code>maxLevel</code> should not be included in the flattened result.</p>
<h3>Requirements</h3>
<ul>
<li>Write a recursive function that accepts the nested array and <code>maxLevel</code> and returns a flat array of nodes up to the required depth.</li>
<li>Render the resulting flat array as a list in React.</li>
<li>Do <b>not</b> mutate the original data.</li>
<li>The input data may have any level of nesting, and nodes may appear in any order.</li>
</ul>
<h3>Input</h3>
<pre><code>posts: Array&lt;Post&gt;
maxLevel: number
</code></pre>
<h3>Output</h3>
<pre><code>Array&lt;Post&gt; // flattened to the required depth
</code></pre>
<h3>Example</h3>
<pre><code>Input:
posts = [
  {
    "id": 1,
    "text": "This is a post 1",
    "replies": [
      {
        "id": 2,
        "replyTo": 1,
        "text": "This is a comment, child to post 1",
        "replies": [
          {
            "id": 3,
            "replyTo": 2,
            "text": "This is a comment, child to comment 2",
            "replies": []
          }
        ]
      },
      {
        "id": 4,
        "replyTo": 1,
        "text": "This is a comment, child to post 1",
        "replies": []
      }
    ]
  },
  {
    "id": 5,
    "text": "This is a post 2",
    "replies": []
  }
]
maxLevel = 1

Output:
[
  { id: 1, text: "This is a post 1" },
  { id: 2, replyTo: 1, text: "This is a comment, child to post 1" },
  { id: 4, replyTo: 1, text: "This is a comment, child to post 1" },
  { id: 5, text: "This is a post 2" }
]

Explanation:
- Level 0: Post 1 and Post 2 are included.
- Level 1: Direct replies to Post 1 (id 2, id 4) are included.
- Level 2: id 3 is a reply to id 2, but since maxLevel = 1, it is not included.
</code></pre>


---
