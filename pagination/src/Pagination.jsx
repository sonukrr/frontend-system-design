import React from "react";
import { useState, useEffect } from "react";
import PaginationOffset from "./PaginationOffset";
import ProductCard from "./ProductCard";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

const LIMIT = 20;

const getPageFromUrl = () => {
  const page = parseInt(new URLSearchParams(window.location.search).get("page"), 10);
  return Number.isInteger(page) && page > 0 ? page : 1;
};

const Pagination = () => {
  const [data, setData] = useState([]);
  const [page, setPage] = useState(getPageFromUrl);
  const [offset, setOffset] = useState((getPageFromUrl() - 1) * LIMIT);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const onPopState = () => {
      const p = getPageFromUrl();
      setPage(p);
      setOffset((p - 1) * LIMIT);
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `https://dummyjson.com/products?limit=${LIMIT}&skip=${offset}&select=title,price,thumbnail,description`,
          { signal: controller.signal },
        );
        const d = await res.json();

        setData(d.products);
        setTotal(d.total);
      } catch (err) {
        if (err.name !== "AbortError") throw err;
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    return () => controller.abort();
  }, [offset]);

  const setPageHandler = (d) => {
    setPage(d);
    setOffset((d - 1) * LIMIT);

    const params = new URLSearchParams(window.location.search);
    params.set("page", d);
    window.history.pushState({ page: d }, "", `?${params.toString()}`); // so the browser navogation button works
  };

  return (
    <div>


      {loading && (
        <div>
          <div className="flex flex-wrap">
            <Skeleton width={300} height={300} className="m-3"/>
            <Skeleton width={300} height={300} className="m-3"/>
            <Skeleton width={300} height={300} className="m-3"/>
            <Skeleton width={300} height={300} className="m-3"/>
          </div>
        </div>
      )}

  

      {data.length > 0 && !loading && (
        <div>
          <div className="flex items-center flex-wrap m-2 p-2">
            {data.map((product) => {
              return <ProductCard key={product.id} {...product} />;
            })}
          </div>

         <div className="me-[10rem] fixed bottom-0 bg-white right-0">
            <PaginationOffset
              loading={loading}                
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
