import { useEffect, useState } from "react";

const SearchInput = () => {

    const [searchText, setSearchText] = useState('');
    const [loading, setLoading] = useState(false);
    const [suggestors, setSuggestors] = useState([]);
    const [debounceInput, setDebouncedInput] = useState('');
    const [showResults, setShowResults] = useState(false);
    const [cache, setCache] = useState({});

    useEffect(() => {
        // denounce input to rate limit the number of api calls
        const timer = setTimeout(() => {
            setSearchText(debounceInput);
        }, 200);

        // clean up that runs before execution of side effect. resets the timer each time.
        return () => clearTimeout(timer);

    }, [debounceInput])

    useEffect(() => {
        // make api call
        if (searchText.trim().length > 0){
                getAutoSuggetions();
        }
            
        else
            setSuggestors([]);

    }, [searchText]);

    const getAutoSuggetions = async () => {
        try {

            // if cache hit return else hit api call
            if (searchText.trim() in cache) {
                setSuggestors(cache[searchText.trim()]);
            } else {
                const data = await fetch(`https://www.google.com/complete/search?client=firefox&q=${searchText.trim()}`);
                const res = await data.json();

                let suggesitons = res[1].map((title, idx) => ({ id: idx + 1, title: title }));
                setSuggestors(suggesitons);
                setCache({
                    ...cache,
                    [searchText.trim()]: suggesitons
                })
            }


        } catch (err) {
            console.log(err);
        } finally {

            setLoading(false);
        }
    }


    return (
        <div style={{ textAlign: 'center' }}>
            <h3>Search Bar</h3>

            <input style={{ lineHeight: 2, borderRadius: '0.5rem', width: '25rem', fontSize: '1rem', padding: '0.25rem', border: '1px solid blue', marginBottom: '1rem' }}
                placeholder="Start typing to get suggestions..."
                value={debounceInput}
                onChange={(e) => setDebouncedInput(e.target.value)}
                onFocus={e => setShowResults(true)}
                onBlur={e => setShowResults(false)}
            />

            {!loading && suggestors.length > 0 && showResults && (
                <ul style={{ width: '25rem', textAlign: 'left', listStyle: "none", margin: 'auto', border: "1px solid #666", borderRadius: "0.5rem", fontSize: '1.2rem', padding: 0 }}>
                    {
                        suggestors.map(product => (
                            <li key={product.id} style={{ padding: '0.25rem 0.25rem', cursor: 'pointer' }} 
                            onMouseDown={() => {
                                // using onClick won't work becuase blur gets called first and hides list so onclick will never get called
                                // to make it work with onclick wrap blur in setTimeout to delay the hiding of list
                                setDebouncedInput(product.title);
                                setShowResults(false);
                            }}
                            onMouseEnter={e => e.target.style.backgroundColor = '#e3f2fd'}
                            onMouseLeave={e => e.target.style.backgroundColor = 'transparent'}>
                                {product.title}
                            </li>
                        ))
                    }

                </ul>
            )}

            {loading && <div>Fetching products ...</div>}


        </div>
    )
}


export default SearchInput;