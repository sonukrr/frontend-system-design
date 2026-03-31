import { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route, NavLink, Navigate, Outlet, useNavigate } from 'react-router-dom';
import ErrorBoundary from './ErrorBoundary';

// Lazy — loaded only when route is first visited
const ProductApp = lazy(() => import('product/ProductApp'));
const CartApp = lazy(() => import('cart/CartApp'));

// Prefetch — starts downloading the MF bundle on link hover, before the click
const prefetch = {
  product: () => import('product/ProductApp'),
  cart: () => import('cart/CartApp'),
};

function NavigationListener() {
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e) => navigate(e.detail);
    window.addEventListener('mfe:navigate', handler);
    return () => window.removeEventListener('mfe:navigate', handler);
  }, [navigate]);

  return null;
}

function MFESlot({ name, children }) {
  return (
    <ErrorBoundary name={name}>
      <Suspense fallback={<div>Loading {name}...</div>}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
}

function Layout() {
  const linkStyle = ({ isActive }) => ({
    textDecoration: 'none',
    padding: '8px 20px',
    borderRadius: 4,
    background: isActive ? '#222' : 'transparent',
    color: isActive ? '#fff' : '#222',
    fontWeight: 500,
  });

  return (
    <div style={{ fontFamily: 'sans-serif', maxWidth: 900, margin: '0 auto', padding: 24 }}>
      <h1 style={{ borderBottom: '2px solid #333', paddingBottom: 12 }}>🛒 ECommerce</h1>
      <nav style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <NavLink to="/products" style={linkStyle} onMouseEnter={prefetch.product}>Products</NavLink>
        <NavLink to="/cart" style={linkStyle} onMouseEnter={prefetch.cart}>Cart</NavLink>
      </nav>
      <Outlet />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <NavigationListener />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/products" replace />} />
          <Route path="products">
            <Route index element={<MFESlot name="Product"><ProductApp /></MFESlot>} />
            <Route path=":product" element={<MFESlot name="Product"><ProductApp /></MFESlot>} />
          </Route>
          <Route path="cart">
            <Route index element={<MFESlot name="Cart"><CartApp /></MFESlot>} />
            <Route path=":cart" element={<MFESlot name="Cart"><CartApp /></MFESlot>} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
