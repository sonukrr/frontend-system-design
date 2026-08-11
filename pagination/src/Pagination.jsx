import React from "react";
import { useState, useEffect } from "react";
import PaginationOffset from "./PaginationOffset";
import ProductCard from "./ProductCard";

const LIMIT = 20;

const Pagination = () => {
  const [data, setData] = useState([]);
  const [offset, setOffset] = useState(0);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchData();
  }, [offset]);

  const fetchData = async () => {
    // make api call
    const res = await fetch(
      `https://dummyjson.com/products?limit=${LIMIT}&skip=${offset}&select=title,price,thumbnail,description`,
    );
    const d = await res.json();

    setData(d.products);
    setTotal(d.total);
  };

  const setPageHandler = (d) => {
    setPage(d);
    setOffset((d - 1) * LIMIT);

    console.log(d);
    console.log(offset);
  };

  return (
    <div>
      {data.length == 0 && <div>Loading...</div>}

      {data.length > 0 && (
        <div>
          <div className="flex items-center flex-wrap m-2 p-2">
            {data.map((product) => {
              return <ProductCard key={product.id} {...product} />;
            })}
          </div>
          
          <div className="me-[10rem]">
            <PaginationOffset
              page={page}
              pageSize={LIMIT}
              setPage={(d) => setPageHandler(d)}
              total={total}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Pagination;
