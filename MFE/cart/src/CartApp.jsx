import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

function requestNavigate(path) {
  window.dispatchEvent(new CustomEvent('mfe:navigate', { detail: path }));
}

export default function CartApp() {
  const { cart } = useParams();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('https://fakestoreapi.com/carts/1')
      .then((r) => r.json())
      .then(async (cartData) => {
        const products = await Promise.all(
          cartData.products.map((cp) =>
            fetch(`https://fakestoreapi.com/products/${cp.productId}`)
              .then((r) => r.json())
              .then((p) => ({ ...p, qty: cp.quantity }))
          )
        );
        setItems(products);
        setLoading(false);
      });
  }, []);

  const remove = (id) => setItems((prev) => prev.filter((i) => i.id !== id));
  const total = items.reduce((sum, i) => sum + i.price * i.qty, 0).toFixed(2);

  if (loading) return <p>Loading cart...</p>;

  if (cart) {
    const item = items.find((i) => String(i.id) === cart);
    if (!item) return (
      <div>
        <button onClick={() => requestNavigate('/cart')} style={{ marginBottom: 16, cursor: 'pointer' }}>← Back</button>
        <p>Item not found or removed.</p>
      </div>
    );
    return (
      <div>
        <button onClick={() => requestNavigate('/cart')} style={{ marginBottom: 16, cursor: 'pointer' }}>← Back</button>
        <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 24, display: 'flex', gap: 24 }}>
          <img src={item.image} alt={item.title} style={{ width: 120, objectFit: 'contain' }} />
          <div>
            <h2>{item.title}</h2>
            <p>Qty: {item.qty}</p>
            <strong style={{ fontSize: 20 }}>${(item.price * item.qty).toFixed(2)}</strong>
            <br />
            <button
              onClick={() => { remove(item.id); requestNavigate('/cart'); }}
              style={{ marginTop: 16, background: '#c00', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: 4, cursor: 'pointer' }}
            >
              Remove
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ border: '2px solid #222', borderRadius: 8, padding: 16 }}>
      <h2>🛒 Cart</h2>
      {items.length === 0 ? (
        <p style={{ color: '#999' }}>Your cart is empty.</p>
      ) : (
        items.map((item) => (
          <div
            key={item.id}
            onClick={() => requestNavigate(`/cart/${item.id}`)}
            style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, cursor: 'pointer' }}
          >
            <img src={item.image} alt={item.title} style={{ width: 40, height: 40, objectFit: 'contain' }} />
            <span style={{ flex: 1, fontSize: 13 }}>{item.title.slice(0, 30)}...</span>
            <span>${item.price} x{item.qty}</span>
            <button
              onClick={(e) => { e.stopPropagation(); remove(item.id); }}
              style={{ color: 'red', background: 'none', border: 'none', cursor: 'pointer' }}
            >✕</button>
          </div>
        ))
      )}
      <hr />
      <strong>Total: ${total}</strong>
      <br />
      <button style={{ marginTop: 12, width: '100%', background: '#222', color: '#fff', border: 'none', padding: '8px', borderRadius: 4, cursor: 'pointer' }}>
        Checkout
      </button>
    </div>
  );
}
