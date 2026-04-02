import { useEffect, useState } from "react";

const InfiniteScroller = () => {

    const [searchInput, setSearchInput] = useState('');
    const [debouncedInput, setDebouncedInput] = useState('');

    const [products, setProducts] = useState([]);
    const [offset, setOffset] = useState(0);


    useEffect(() => {
        const timer = setTimeout(() => {
            setSearchInput(debouncedInput);
        }, 200);

        // clean up function that gets called each time first when component unmounts or here in this case dependency change
        // change in deps first triggers cleanup function that clear old timer and then sets a new timer
        return () => clearTimeout(timer);

    }, [debouncedInput])



    useEffect(() => {
        
            

            const fetchProducts = async () => {
                const response = await fetch(`https://api.escuelajs.co/api/v1/products?offset=${offset}&limit=10&title=${searchInput}`);
                const data = await response.json();

                return data.map(({ id, title }) => ({
                    id,
                    title
                }));
            }

            fetchProducts().then(res => {
                if (offset === 0) {
                    // New search - replace products
                    setProducts(res);
                } else {
                    // Scrolling - append products
                    setProducts([
                        ...products,
                        ...res
                    ]);
                }
            });

    }, [searchInput, offset])


    const searchHanler = (value) => {
        setDebouncedInput(value);
    }

    const scrollHandler = (event) => {
        console.log(event);
        

        if(event.target.scrollHeight - event.target.scrollTop <= event.target.clientHeight + 5){
            setOffset(offset + 1);
        }



        
        
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

            </div>

        </div>
    )
}


export default InfiniteScroller;