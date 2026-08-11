import React from "react";
import { useState, useEffect } from "react";



const PaginationOffset = ({ page, total, pageSize, setPage }) => {
  const [pages, setPages] = useState([]);

  useEffect(() => {
    setPages(getAllPages());
  }, []);

  const getAllPages = () => {
    const n = Math.ceil(total / pageSize);
    const res = [];
    for (let i = 1; i <= n; i++) {
      res.push(i);
    }

    return res;
  };

  return (
    <div className="flex justify-end w-full">
    {
        page > 1 && <button onClick={() => setPage(page - 1)}> &lt; Prev </button>
    }
      
      {pages.map((curr, idx) => {
        return <button onClick={() => setPage(curr)} 
        className={idx + 1 == page ? 'border-2 bg-amber-700 p-1 m-1 rounded-sm' : 'border-2 p-1 m-1 rounded-sm'} key={curr}>{curr}</button>;
      })}
      {
        page < Math.ceil(total / pageSize) && <button onClick={() => setPage(page + 1)}> Next &gt;</button>
      }
      
    </div>
  );
};

export default PaginationOffset;
