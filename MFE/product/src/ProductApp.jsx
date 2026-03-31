import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

// Tell the shell to navigate — Product MF never owns cross-MF routing
function requestNavigate(path) {
  window.dispatchEvent(new CustomEvent('mfe:navigate', { detail: path }));
}

async function postAddToCart(product) {
  // POST to backend (fakestoreapi as placeholder)
  const res = await fetch('https://fakestoreapi.com/carts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: 1,
      date: new Date().toISOString().split('T')[0],
      products: [{ productId: product.id, quantity: 1 }],
    }),
  });
  if (!res.ok) throw new Error('Failed to add to cart');
  return res.json();
}

export default function ProductApp() {
  const { product } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    setData(null);
    setLoading(true);

    const url = product
      ? `https://fakestoreapi.com/products/${product}`
      : 'https://fakestoreapi.com/products?limit=6';

    fetch(url)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); });
  }, [product]);

  const handleAddToCart = async (item) => {
    setAdding(true);
    try {
      await postAddToCart(item);
      // POST succeeded — ask shell to route to /cart
      requestNavigate('/cart');
    } catch (err) {
      alert('Could not add to cart: ' + err.message);
    } finally {
      setAdding(false);
    }
  };

  if (loading || !data) return <p>Loading...</p>;

  if (product) {
    const item = data;
    return (
      <div>
        <button onClick={() => requestNavigate('/products')} style={{ marginBottom: 16, cursor: 'pointer' }}>← Back</button>
        <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 24, display: 'flex', gap: 24 }}>
          <img src={item.image} alt={item.title} style={{ width: 160, objectFit: 'contain' }} />
          <div>
            <span style={{ fontSize: 12, color: '#888', textTransform: 'uppercase' }}>{item.category}</span>
            <h2 style={{ margin: '8px 0' }}>{item.title}</h2>
            <p style={{ color: '#666', fontSize: 14 }}>{item.description}</p>
            <strong style={{ fontSize: 24 }}>${item.price}</strong>
            <br />
            <button
              onClick={() => handleAddToCart(item)}
              disabled={adding}
              style={{ marginTop: 16, background: '#222', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: 4, cursor: 'pointer', opacity: adding ? 0.6 : 1 }}
            >
              {adding ? 'Adding...' : 'Add to Cart'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2>Products</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {data.length > 0 && data.map((p) => (
          <div key={p.id} style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16 }}>
            <img
              src={p.image} alt={p.title}
              onClick={() => requestNavigate(`/products/${p.id}`)}
              style={{ width: '100%', height: 120, objectFit: 'contain', cursor: 'pointer' }}
            />
            <p style={{ fontSize: 13, fontWeight: 600, margin: '8px 0 4px' }}>{p.title.slice(0, 40)}...</p>
            <strong>${p.price}</strong>
            <br />
            <button
              onClick={() => handleAddToCart(p)}
              disabled={adding}
              style={{ marginTop: 8, width: '100%', background: '#222', color: '#fff', border: 'none', padding: '6px', borderRadius: 4, cursor: 'pointer', opacity: adding ? 0.6 : 1 }}
            >
              {adding ? 'Adding...' : 'Add to Cart'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
