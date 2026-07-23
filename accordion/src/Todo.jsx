import { useReducer, useState } from "react";

const initialState = {
  todos: [],
  filter: "all", // all | active | completed
};

const ACTIONS = {
  ADD: "add",
  TOGGLE: "toggle",
  DELETE: "delete",
  EDIT: "edit",
  CLEAR_COMPLETED: "clear_completed",
  SET_FILTER: "set_filter",
};

function reducer(state, action) {
  switch (action.type) {
    case ACTIONS.ADD:
      return {
        ...state,
        todos: [
          ...state.todos,
          { id: crypto.randomUUID(), text: action.payload, completed: false },
        ],
      };

    case ACTIONS.TOGGLE:
      return {
        ...state,
        todos: state.todos.map((t) =>
          t.id === action.payload ? { ...t, completed: !t.completed } : t
        ),
      };

    case ACTIONS.EDIT:
      return {
        ...state,
        todos: state.todos.map((t) =>
          t.id === action.payload.id ? { ...t, text: action.payload.text } : t
        ),
      };

    case ACTIONS.DELETE:
      return {
        ...state,
        todos: state.todos.filter((t) => t.id !== action.payload),
      };

    case ACTIONS.CLEAR_COMPLETED:
      return {
        ...state,
        todos: state.todos.filter((t) => !t.completed),
      };

    case ACTIONS.SET_FILTER:
      return { ...state, filter: action.payload };

    default:
      return state;
  }
}

function selectVisibleTodos(todos, filter) {
  switch (filter) {
    case "active":
      return todos.filter((t) => !t.completed);
    case "completed":
      return todos.filter((t) => t.completed);
    default:
      return todos;
  }
}

const Todo = () => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [input, setInput] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState("");

  const visibleTodos = selectVisibleTodos(state.todos, state.filter);
  const remaining = state.todos.filter((t) => !t.completed).length;

  const handleAdd = (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    dispatch({ type: ACTIONS.ADD, payload: text });
    setInput("");
  };

  const startEdit = (todo) => {
    setEditingId(todo.id);
    setEditingText(todo.text);
  };

  const commitEdit = () => {
    const text = editingText.trim();
    if (text) {
      dispatch({ type: ACTIONS.EDIT, payload: { id: editingId, text } });
    } else {
      dispatch({ type: ACTIONS.DELETE, payload: editingId });
    }
    setEditingId(null);
    setEditingText("");
  };

  return (
    <div style={{ maxWidth: 480, margin: "0 auto" }}>
      <h2>Todo</h2>

      <form onSubmit={handleAdd} style={{ display: "flex", gap: 8 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="What needs to be done?"
          style={{ flex: 1 }}
        />
        <button type="submit">Add</button>
      </form>

      <div style={{ display: "flex", gap: 8, margin: "12px 0" }}>
        {["all", "active", "completed"].map((f) => (
          <button
            key={f}
            onClick={() => dispatch({ type: ACTIONS.SET_FILTER, payload: f })}
            disabled={state.filter === f}
          >
            {f}
          </button>
        ))}
      </div>

      <ul style={{ listStyle: "none", padding: 0 }}>
        {visibleTodos.map((todo) => (
          <li
            key={todo.id}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0" }}
          >
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => dispatch({ type: ACTIONS.TOGGLE, payload: todo.id })}
            />

            {editingId === todo.id ? (
              <input
                autoFocus
                value={editingText}
                onChange={(e) => setEditingText(e.target.value)}
                onBlur={commitEdit}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitEdit();
                  if (e.key === "Escape") {
                    setEditingId(null);
                    setEditingText("");
                  }
                }}
                style={{ flex: 1 }}
              />
            ) : (
              <span
                onDoubleClick={() => startEdit(todo)}
                style={{
                  flex: 1,
                  textDecoration: todo.completed ? "line-through" : "none",
                  opacity: todo.completed ? 0.6 : 1,
                }}
              >
                {todo.text}
              </span>
            )}

            <button onClick={() => dispatch({ type: ACTIONS.DELETE, payload: todo.id })}>
              Delete
            </button>
          </li>
        ))}
      </ul>

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12 }}>
        <span>{remaining} item(s) left</span>
        <button onClick={() => dispatch({ type: ACTIONS.CLEAR_COMPLETED })}>
          Clear completed
        </button>
      </div>
    </div>
  );
};

export default Todo;
