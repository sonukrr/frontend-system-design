export const initialState = {
  comments: {},
  rootIds: [],
};

export function CommentsReducer(state = initialState, action) {
  switch (action.type) {
    
    case "ADD": {
      const id = `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const newComment = {
        id,
        text: action.payload.text,
        childIds: [],
        createdAt: new Date().toISOString(),
        votes: 0,
        isEditing: false,
      };

      return {
        ...state,
        comments: {
          ...state.comments,
          [id]: newComment,
        },
        rootIds: [...state.rootIds, id],
      };
    }

    case "REPLY": {
      const { parentId, text } = action.payload;
      const id = `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const newComment = {
        id,
        text,
        childIds: [],
        createdAt: new Date().toISOString(),
        votes: 0,
        isEditing: false,
        parentId,
      };

      const parentComment = state.comments[parentId];
      if (!parentComment) {
        return state;
      }

      return {
        ...state,
        comments: {
          ...state.comments,
          [id]: newComment,
          [parentId]: {
            ...parentComment,
            childIds: [...(parentComment.childIds || []), id],
          },
        },
      };
    }

    case "EDIT": {
      const { commentId, text } = action.payload;
      return {
        ...state,
        comments: {
          ...state.comments,
          [commentId]: {
            ...state.comments[commentId],
            text,
            editedAt: new Date().toISOString(),
            isEditing: false,
          },
        },
      };
    }

    case "DELETE": {
      const { commentId } = action.payload;
      const updatedComments = { ...state.comments };
      let updatedRootIds = [...state.rootIds];
      
      if (updatedRootIds.includes(commentId)) {
        updatedRootIds = updatedRootIds.filter(id => id !== commentId);
      }
      
      Object.keys(updatedComments).forEach(id => {
        if (updatedComments[id].childIds?.includes(commentId)) {
          updatedComments[id] = {
            ...updatedComments[id],
            childIds: updatedComments[id].childIds.filter(cid => cid !== commentId)
          };
        }
      });
      
      const deleteRecursive = (id) => {
        const comment = updatedComments[id];
        if (comment?.childIds) {
          comment.childIds.forEach(deleteRecursive);
        }
        delete updatedComments[id];
      };
      
      deleteRecursive(commentId);
      
      return {
        comments: updatedComments,
        rootIds: updatedRootIds,
      };
    }

    case "VOTE": {
      const { commentId, delta } = action.payload;
      return {
        ...state,
        comments: {
          ...state.comments,
          [commentId]: {
            ...state.comments[commentId],
            votes: (state.comments[commentId].votes || 0) + delta,
          },
        },
      };
    }

    case "TOGGLE_EDIT": {
      const { commentId } = action.payload;
      return {
        ...state,
        comments: {
          ...state.comments,
          [commentId]: {
            ...state.comments[commentId],
            isEditing: !state.comments[commentId].isEditing,
          },
        },
      };
    }

    case "TOGGLE_REPLY": {
      const { commentId } = action.payload;
      return {
        ...state,
        comments: {
          ...state.comments,
          [commentId]: {
            ...state.comments[commentId],
            showReplyBox: !state.comments[commentId].showReplyBox,
          },
        },
      };
    }

    default:
      return state;
  }
}
