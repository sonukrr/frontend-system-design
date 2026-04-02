import { useEffect, useState, useRef } from "react";

const InfiniteScroller = () => {

    const [searchInput, setSearchInput] = useState('');
    const [debouncedInput, setDebouncedInput] = useState('');

    const [products, setProducts] = useState([]);
    const [offset, setOffset] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [hasMoreData, setHasMoreData] = useState(true);

    // We use useRef here because we need to persist the throttle timer across renders without causing re-renders.
    const throttleTimer = useRef(null);


    useEffect(() => {
        const timer = setTimeout(() => {
            setSearchInput(debouncedInput);
        }, 200);

        // clean up function that gets called each time first when component unmounts or here in this case dependency change
        // change in deps first triggers cleanup function that clear old timer and then sets a new timer
        return () => clearTimeout(timer);

    }, [debouncedInput])



    useEffect(() => {
        if (isLoading || !hasMoreData) return; // Prevent duplicate requests and stop when no more data
        
        const fetchProducts = async () => {
            setIsLoading(true);
            try {
                const response = await fetch(`https://api.escuelajs.co/api/v1/products?offset=${offset}&limit=10&title=${searchInput}`);
                const data = await response.json();

                const products = data.map(({ id, title }) => ({
                    id,
                    title
                }));

                // Check if we have more data
                const hasMore = products.length > 0;
                setHasMoreData(hasMore);

                if (offset === 0) {
                    // New search - replace products
                    setProducts(products);
                } else {
                    // Scrolling - append products
                    setProducts(prev => [...prev, ...products]);
                }
            } catch (error) {
                console.error('Failed to fetch products:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProducts();

    }, [searchInput, offset, isLoading, hasMoreData])


    const searchHanler = (value) => {
        setOffset(0);
        setHasMoreData(true); // Reset end-of-data state on new search
        setDebouncedInput(value);
    }

    const scrollHandler = (event) => {
        if (throttleTimer.current || isLoading || !hasMoreData) {
            return;
        }

        // wait then executes - trailing-edge throttling
        // we also have leading edge throttling - execute first, then wait
        throttleTimer.current = setTimeout(() => {
            throttleTimer.current = null;

            if(event.target.scrollHeight - event.target.scrollTop <= event.target.clientHeight + 5){
                setOffset(prev => prev + 1);
            }
        }, 200);
    }

    return (
        <div style={{ textAlign: "center", fontSize: 25 }}>
            <h2>Infinite Scroller</h2>

            <div>
                <input type="text" style={{ width: 500, height: 40, borderRadius: 5, fontSize: 20, margin: 20 }}
                    placeholder="Search products..."
                    value={debouncedInput}
                    onChange={e => searchHanler(e.target.value)}
                />
            </div>

            <div style={{ height: 150, overflow: "scroll" , border: "2px solid grey", textAlign: "left"}} onScroll={e => scrollHandler(e)}>
                {products.length > 0 &&
                    products.map(product => {
                        return (
                            <div key={product.id} style={{fontSize: 18, padding: 2}}>
                                {product.title}
                                <div />
                            </div>
                        )
                    })
                }

                {isLoading && (
                    <div style={{ textAlign: "center", padding: 10, color: "#666" }}>
                        Loading...
                    </div>
                )}

                {!hasMoreData && products.length > 0 && (
                    <div style={{ textAlign: "center", padding: 10, color: "#999", fontStyle: "italic" }}>
                        No more products to load
                    </div>
                )}
            </div>

        </div>
    )
}


export default InfiniteScroller;