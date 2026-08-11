import React from "react";

const PaginationOffset = ({ page, loading, total, pageSize, setPage }) => {
  const pageCount = Math.ceil(total / pageSize);
  const pages = Array.from({ length: pageCount }, (_, i) => i + 1);

  return (
    <nav aria-label="Pagination" className="flex justify-end w-full">
      <span className="sr-only" role="status" aria-live="polite">
        Page {page} of {pageCount}
      </span>

      {page > 1 && (
        <button
            disabled={loading}
          onClick={() => setPage(page - 1)}
          aria-label="Go to previous page"
          className="focus-visible:outline-2 focus-visible:outline-amber-700"
        >
          {" "}
          &lt; Prev{" "}
        </button>
      )}

      {pages.map((curr) => {
        return (
          <button
            disabled={loading}
            onClick={() => setPage(curr)}
            aria-label={`Go to page ${curr}`}
            aria-current={curr == page ? "page" : undefined}
            className={
              (curr == page
                ? "border-2 bg-amber-700 p-1 m-1 rounded-sm"
                : "border-2 p-1 m-1 rounded-sm") +
              " focus-visible:outline-2 focus-visible:outline-amber-700"
            }
            key={curr}
          >
            {curr}
          </button>
        );
      })}

      {page < pageCount && (
        <button
        disabled={loading}
          onClick={() => setPage(page + 1)}
          aria-label="Go to next page"
          className="focus-visible:outline-2 focus-visible:outline-amber-700"
        >
          {" "}
          Next &gt;
        </button>
      )}
    </nav>
  );
};

export default PaginationOffset;
