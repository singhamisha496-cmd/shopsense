"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const API = "http://127.0.0.1:8000";

const categories = [
  "All",
  "Electronics",
  "Fashion",
  "Home",
  "Accessories",
  "Other",
];

export default function CustomerPage() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
const [cartMessage, setCartMessage] = useState("");
const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("featured");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadProducts = useCallback(async (token) => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API}/products/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });

      if (response.status === 401) {
        localStorage.removeItem("shopsense_token");
        localStorage.removeItem("shopsense_user");
        router.replace("/login");
        return;
      }

      if (!response.ok) {
        throw new Error(
          response.status === 403
            ? "You do not have permission to view these products."
            : "Products could not be loaded. Please try again."
        );
      }

      const data = await response.json();
      console.log("Order API response:", data);

      const list = Array.isArray(data)
        ? data
        : Array.isArray(data.products)
          ? data.products
          : [];

      setProducts(list);
    } catch (err) {
      setError(err.message || "Unable to connect to ShopSense.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const token = localStorage.getItem("shopsense_token");
    const savedUser = localStorage.getItem("shopsense_user");

    if (!token || !savedUser) {
      router.replace("/login");
      return;
    }

    try {
      const parsedUser = JSON.parse(savedUser);

      if (parsedUser.role !== "customer") {
        if (parsedUser.role === "admin") {
          router.replace("/");
        } else if (parsedUser.role === "vendor") {
          router.replace("/vendor");
        } else {
          router.replace("/login");
        }
        return;
      }

      setUser(parsedUser);
      loadProducts(token);
    } catch {
      localStorage.removeItem("shopsense_token");
      localStorage.removeItem("shopsense_user");
      router.replace("/login");
    }
  }, [router, loadProducts]);

  const visibleProducts = useMemo(() => {
    let result = products.filter((product) => {
      const name = String(product.name || product.title || "");
      const description = String(product.description || "");
      const productCategory = String(product.category || "");

      const matchesSearch = `${name} ${description} ${productCategory}`
        .toLowerCase()
        .includes(search.trim().toLowerCase());

      const matchesCategory =
        category === "All" ||
        (category === "Other"
          ? !categories.slice(1, -1).some(
              (item) => item.toLowerCase() === productCategory.toLowerCase()
            )
          : productCategory.toLowerCase() === category.toLowerCase());

      const active = product.is_active ?? product.active ?? true;

      return matchesSearch && matchesCategory && active;
    });

    if (sort === "price-low") {
      result.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
    } else if (sort === "price-high") {
      result.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
    } else if (sort === "name") {
      result.sort((a, b) =>
        String(a.name || a.title || "").localeCompare(
          String(b.name || b.title || "")
        )
      );
    }

    return result;
  }, [products, search, category, sort]);

  function formatPrice(value) {
    const amount = Number(value);

    if (!Number.isFinite(amount)) return "Price unavailable";

    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(amount);
  }

  function getStock(product) {
    return Number(product.stock_quantity ?? product.stock ?? 0);
  }

  function getProductImage(product) {
    return (
      product.image_url ||
      product.imageUrl ||
      product.image ||
      product.images?.[0] ||
      ""
    );
  }

function addToCart(product) {
  const productId = product.id || product._id;

  if (!productId) {
    setCartMessage("Product ID is missing.");
    return;
  }

  if (getStock(product) <= 0) {
    setCartMessage("This product is out of stock.");
    return;
  }

  setCart((currentCart) => {
    const existing = currentCart.find(
      (item) => item.productId === productId
    );

    if (existing) {
      if (existing.quantity >= getStock(product)) {
        setCartMessage("You cannot add more than the available stock.");
        return currentCart;
      }

      return currentCart.map((item) =>
        item.productId === productId
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
    }

    return [
      ...currentCart,
      {
        productId,
        name: product.name || product.title || "Product",
        price: Number(product.price),
        quantity: 1,
        stock: getStock(product),
      },
    ];
  });

  setCartMessage(`${product.name || product.title || "Product"} added to cart.`);
}

function updateCartQuantity(productId, change) {
  setCart((currentCart) =>
    currentCart
      .map((item) => {
        if (item.productId !== productId) return item;

        const quantity = item.quantity + change;

        if (quantity > item.stock) return item;

        return { ...item, quantity };
      })
      .filter((item) => item.quantity > 0)
  );
}

function removeFromCart(productId) {
  setCart((currentCart) =>
    currentCart.filter((item) => item.productId !== productId)
  );
}

const cartCount = cart.reduce(
  (total, item) => total + item.quantity,
  0
);

const cartTotal = cart.reduce(
  (total, item) => total + item.price * item.quantity,
  0
);

async function handleCheckout() {
  const token = localStorage.getItem("shopsense_token");

  if (!token) {
    setCartMessage("Please log in again to place your order.");
    return;
  }

  if (cart.length === 0) {
    setCartMessage("Your cart is empty.");
    return;
  }

  setCheckoutLoading(true);
  setCartMessage("");

  try {
    const response = await fetch("http://127.0.0.1:8000/orders/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        items: cart.map((item) => ({
          product_id: item.productId,
          quantity: item.quantity,
        })),
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.detail || "Unable to place your order."
      );
    }

    setCart([]);
    setCartMessage(
      `Order placed successfully! Order ID: ${data.id || data._id || "Created"}`
    );
  } catch (error) {
    setCartMessage(error.message || "Something went wrong.");
  } finally {
    setCheckoutLoading(false);
  }
}

  function handleLogout() {
    localStorage.removeItem("shopsense_token");
    localStorage.removeItem("shopsense_user");
    router.replace("/login");
  }

  return (
    <main className="shop-page">
      <header className="topbar">
        <button
          className="brand"
          onClick={() => {
            setSearch("");
            setCategory("All");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          aria-label="ShopSense home"
        >
          <span className="brand-mark">S</span>
          <span>Shop<span className="brand-accent">Sense</span></span>
        </button>

        <form
          className="searchbar"
          onSubmit={(event) => {
            event.preventDefault();
            document.getElementById("catalog")?.scrollIntoView({
              behavior: "smooth",
            });
          }}
        >
          <span className="search-icon">⌕</span>
          <input
            aria-label="Search products"
            placeholder="Search for products, brands and more"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          {search && (
            <button
              type="button"
              className="clear-search"
              onClick={() => setSearch("")}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
          <button className="search-button" type="submit">Search</button>
        </form>

        <div className="account-area">
          <div className="account-avatar">
            {(user?.name || "C").charAt(0).toUpperCase()}
          </div>
          <div className="account-copy">
            <span className="welcome">Welcome back</span>
            <strong>{user?.name || "Customer"}</strong>
          </div>
          <button
  className="logout-button"
  onClick={() =>
    document.getElementById("shopping-cart")?.scrollIntoView({
      behavior: "smooth",
    })
  }
>
  Cart ({cartCount})
</button>
          <button className="logout-button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <nav className="category-nav" aria-label="Product categories">
        {categories.map((item) => (
          <button
            key={item}
            className={`category-link ${category === item ? "selected" : ""}`}
            onClick={() => {
              setCategory(item);
              document.getElementById("catalog")?.scrollIntoView({
                behavior: "smooth",
                block: "start",
              });
            }}
          >
            {item === "All" ? "All Products" : item}
          </button>
        ))}
      </nav>

      <section className="hero">
        <div className="hero-content">
          <span className="hero-eyebrow">YOUR EVERYDAY SHOPPING DESTINATION</span>
          <h1>
            Great finds.
            <br />
            <span>Better choices.</span>
          </h1>
          <p>
            Discover products you love, compare prices and find your next
            favourite — all in one place.
          </p>
          <button
            className="hero-button"
            onClick={() =>
              document.getElementById("catalog")?.scrollIntoView({
                behavior: "smooth",
              })
            }
          >
            Explore products <span>→</span>
          </button>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="art-orbit orbit-one" />
          <div className="art-orbit orbit-two" />
          <div className="art-circle">
            <span className="art-bag">S</span>
            <span className="art-spark spark-one">✦</span>
            <span className="art-spark spark-two">✧</span>
          </div>
          <div className="floating-card float-top">
            <span>✦</span>
            <div><strong>Discover</strong><small>Something new</small></div>
          </div>
          <div className="floating-card float-bottom">
            <span>✓</span>
            <div><strong>Shop smarter</strong><small>Every single day</small></div>
          </div>
        </div>
      </section>

      <section className="benefits">
        <div className="benefit">
          <span className="benefit-icon">↗</span>
          <div><strong>Easy discovery</strong><small>Find what you need</small></div>
        </div>
        <div className="benefit">
          <span className="benefit-icon">₹</span>
          <div><strong>Clear pricing</strong><small>Know what you pay</small></div>
        </div>
        <div className="benefit">
          <span className="benefit-icon">▣</span>
          <div><strong>Stock visibility</strong><small>Check availability</small></div>
        </div>
        <div className="benefit">
          <span className="benefit-icon">♡</span>
          <div><strong>Made for you</strong><small>A simpler way to shop</small></div>
        </div>
      </section>

      <section className="catalog-section" id="catalog">
        <div className="catalog-heading">
          <div>
            <span className="section-eyebrow">THE SHOP SENSE COLLECTION</span>
            <h2>Explore products</h2>
            <p>Find something you will love.</p>
          </div>
          <button
            className="refresh-button"
            onClick={() => {
              const token = localStorage.getItem("shopsense_token");
              if (token) loadProducts(token);
            }}
            disabled={loading}
          >
            <span>↻</span> {loading ? "Loading..." : "Refresh"}
          </button>
        </div>

        <div className="catalog-toolbar">
          <div className="result-count">
            {loading ? "Loading your catalog..." : `${visibleProducts.length} products`}
          </div>
          <label className="sort-control">
            <span>Sort by</span>
            <select value={sort} onChange={(event) => setSort(event.target.value)}>
              <option value="featured">Featured</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="name">Name: A to Z</option>
            </select>
          </label>
        </div>

        {error && (
          <div className="error-box" role="alert">
            <div>
              <strong>We could not load the catalog.</strong>
              <p>{error}</p>
            </div>
            <button
              className="refresh-button"
              onClick={() => {
                const token = localStorage.getItem("shopsense_token");
                if (token) loadProducts(token);
              }}
            >
              Try again
            </button>
          </div>
        )}

        {loading && (
          <div className="product-grid">
            {[1, 2, 3, 4].map((item) => (
              <div className="skeleton-card" key={item}>
                <div className="skeleton-image" />
                <div className="skeleton-line" />
                <div className="skeleton-line short" />
                <div className="skeleton-line price-line" />
              </div>
            ))}
          </div>
        )}

        {!loading && !error && visibleProducts.length === 0 && (
          <div className="empty-state">
            <span>⌕</span>
            <h3>{search ? "No matching products" : "No products to show"}</h3>
            <p>
              {search
                ? "Try another search term or change your category."
                : "Products will appear here when they are available."}
            </p>
            <button
              className="hero-button"
              onClick={() => {
                setSearch("");
                setCategory("All");
              }}
            >
              Show all products
            </button>
          </div>
        )}

        {!loading && !error && visibleProducts.length > 0 && (
          <div className="product-grid">
            {visibleProducts.map((product, index) => {
              const name = product.name || product.title || "Unnamed product";
              const image = getProductImage(product);
              const stock = getStock(product);
              const inStock = stock > 0;

              return (
                <article
                  className="product-card"
                  key={product.id || product._id || index}
                >
                  <div className="product-image-wrap">
                    {image ? (
                      // Product images are optional in the current API.
                      // eslint-disable-next-line @next/next/no-img-element
                      <img className="product-image" src={image} alt={name} />
                    ) : (
                      <div className="product-placeholder">
                        <span>✧</span>
                        <small>{product.category || "SHOP SENSE"}</small>
                      </div>
                    )}
                    <span className={`stock-badge ${inStock ? "available" : "unavailable"}`}>
                      {inStock ? "In stock" : "Out of stock"}
                    </span>
                  </div>

                  <div className="product-details">
                    <span className="product-category">
                      {product.category || "General"}
                    </span>
                    <h3 title={name}>{name}</h3>
                    <p className="product-description">
                      {product.description || "Discover more about this product."}
                    </p>
                    <div className="product-bottom">
                      <div>
                      <button
  className="hero-button"
  disabled={!inStock}
  onClick={() => addToCart(product)}
>
  {inStock ? "Add to Cart" : "Out of Stock"}
</button>
                        <strong className="product-price">
                          {formatPrice(product.price)}
                        </strong>
                        <small className="stock-text">
                          {inStock ? `${stock} available` : "Currently unavailable"}
                        </small>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

<section
  id="shopping-cart"
  className="catalog-section"
  style={{ paddingTop: "10px" }}
>
  <div className="catalog-heading">
    <div>
      <span className="section-eyebrow">YOUR SELECTION</span>
      <h2>Shopping Cart ({cartCount})</h2>
      <p>Review your items before checkout.</p>
    </div>
  </div>

  {cartMessage && (
    <p role="status" style={{ marginTop: "16px" }}>
      {cartMessage}
    </p>
  )}

  {cart.length === 0 ? (
    <div className="empty-state">
      <h3>Your cart is empty</h3>
      <p>Add products from the collection above to get started.</p>
    </div>
  ) : (
    <>
      {cart.map((item) => (
        <div
          key={item.productId}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px",
            padding: "16px",
            marginTop: "12px",
            background: "white",
            border: "1px solid #e8ebf2",
            borderRadius: "10px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <strong>{item.name}</strong>
            <p>{formatPrice(item.price)} each</p>
            <strong>{formatPrice(item.price * item.quantity)}</strong>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button
              className="refresh-button"
              onClick={() => updateCartQuantity(item.productId, -1)}
              aria-label={`Decrease ${item.name} quantity`}
            >
              −
            </button>

            <strong>{item.quantity}</strong>

            <button
              className="refresh-button"
              disabled={item.quantity >= item.stock}
              onClick={() => updateCartQuantity(item.productId, 1)}
              aria-label={`Increase ${item.name} quantity`}
            >
              +
            </button>

            <button
              className="logout-button"
              onClick={() => removeFromCart(item.productId)}
            >
              Remove
            </button>
          </div>
        </div>
      ))}

      <div style={{ marginTop: "24px", textAlign: "right" }}>
        <h3>Total: {formatPrice(cartTotal)}</h3>
        <p>Final prices and stock will be checked by the server.</p>

<button
  className="hero-button"
  onClick={handleCheckout}
  disabled={checkoutLoading || cart.length === 0}
>
  {checkoutLoading ? "Placing Order..." : "Place Order"}
</button>

      </div>
    </>
  )}
</section>

      <footer className="footer">
        <div className="footer-brand">Shop<span>Sense</span></div>
        <p>A simpler way to discover what you need.</p>
        <small>© {new Date().getFullYear()} ShopSense. Built for smarter shopping.</small>
      </footer>

      <style jsx>{`
        .shop-page {
          --brand: #4f46e5;
          --brand-dark: #3730a3;
          --ink: #172033;
          --muted: #68738a;
          --line: #e8ebf2;
          min-height: 100vh;
          background: #f7f8fc;
          color: var(--ink);
          font-family: Arial, Helvetica, sans-serif;
        }

        button, input, select { font: inherit; }
        button { cursor: pointer; }
        button:focus-visible, input:focus-visible, select:focus-visible {
          outline: 3px solid #a5b4fc;
          outline-offset: 3px;
        }

        .topbar {
          display: grid;
          grid-template-columns: auto minmax(220px, 1fr) auto;
          align-items: center;
          gap: 28px;
          padding: 18px clamp(18px, 5vw, 76px);
          background: #fff;
          border-bottom: 1px solid var(--line);
        }

        .brand {
          display: flex; align-items: center; gap: 10px;
          border: 0; background: none; color: var(--ink);
          font-size: 25px; font-weight: 800; letter-spacing: -1px;
          white-space: nowrap;
        }
        .brand-mark {
          display: grid; place-items: center;
          width: 36px; height: 36px; border-radius: 11px;
          color: white; background: var(--brand);
          font-size: 22px; letter-spacing: 0;
        }
        .brand-accent, .footer-brand span { color: var(--brand); }

        .searchbar {
          display: flex; align-items: center; min-width: 0;
          height: 46px; border: 1px solid #e1e5ef;
          background: #f6f7fb; border-radius: 9px; overflow: hidden;
        }
        .search-icon { padding-left: 14px; font-size: 24px; color: #7b8499; }
        .searchbar input {
          width: 100%; min-width: 0; border: 0; outline: 0;
          background: transparent; color: var(--ink); padding: 10px 12px;
          font-size: 14px;
        }
        .search-button {
          height: 100%; border: 0; padding: 0 19px;
          color: white; background: var(--brand); font-weight: 700;
        }
        .search-button:hover, .hero-button:hover { background: var(--brand-dark); }
        .clear-search { border: 0; background: transparent; color: var(--muted); font-size: 23px; }

        .account-area { display: flex; align-items: center; gap: 10px; }
        .account-avatar {
          display: grid; place-items: center; width: 38px; height: 38px;
          border-radius: 50%; background: #eeedff; color: var(--brand);
          font-weight: 800;
        }
        .account-copy { display: flex; flex-direction: column; gap: 3px; }
        .account-copy .welcome { color: var(--muted); font-size: 11px; }
        .account-copy strong { font-size: 13px; max-width: 100px; overflow-wrap: anywhere; }
        .logout-button {
          margin-left: 5px; border: 1px solid var(--line); background: #fff;
          color: #46516a; border-radius: 8px; padding: 9px 12px; font-size: 12px;
        }
        .logout-button:hover, .refresh-button:hover { border-color: var(--brand); color: var(--brand); }

        .category-nav {
          display: flex; justify-content: center; gap: clamp(18px, 4vw, 54px);
          padding: 0 20px; background: #fff; border-bottom: 1px solid var(--line);
          overflow-x: auto;
        }
        .category-link {
          flex: 0 0 auto; padding: 16px 2px 14px; border: 0;
          border-bottom: 3px solid transparent; background: transparent;
          color: #59647a; font-size: 13px; font-weight: 600;
        }
        .category-link:hover, .category-link.selected {
          color: var(--brand); border-bottom-color: var(--brand);
        }

        .hero {
          position: relative; display: flex; justify-content: space-between;
          align-items: center; overflow: hidden; isolation: isolate;
          margin: 30px clamp(18px, 5vw, 76px) 22px;
          min-height: 300px; border-radius: 18px; padding: 36px clamp(24px, 5vw, 62px);
          color: #fff;
          background: linear-gradient(115deg, #24245f 0%, #4338a8 58%, #6d63ec 100%);
        }
        .hero::after {
          content: ""; position: absolute; z-index: -1; width: 480px; height: 480px;
          border-radius: 50%; right: 4%; top: -240px;
          border: 1px solid rgba(255,255,255,.12);
          box-shadow: 0 0 0 42px rgba(255,255,255,.035), 0 0 0 84px rgba(255,255,255,.025);
        }
        .hero-content { max-width: 560px; position: relative; z-index: 1; }
        .hero-eyebrow { color: #c9c7ff; font-size: 10px; font-weight: 800; letter-spacing: 2px; }
        .hero h1 { margin: 17px 0 13px; font-size: clamp(35px, 4.5vw, 54px); line-height: 1.08; letter-spacing: -1.8px; }
        .hero h1 span { color: #c8c5ff; }
        .hero p { max-width: 430px; color: #e1e2ff; font-size: 14px; line-height: 1.8; }
        .hero-button {
          display: inline-flex; align-items: center; gap: 18px;
          margin-top: 14px; padding: 13px 18px; border: 0; border-radius: 8px;
          color: var(--brand-dark); background: white; font-weight: 700; font-size: 13px;
        }
        .hero-button:hover { color: white; }
        .hero-art { position: relative; width: 280px; height: 245px; flex: 0 0 280px; margin-left: 25px; }
        .art-orbit { position: absolute; border: 1px solid rgba(255,255,255,.22); border-radius: 50%; }
        .orbit-one { inset: 8px 12px; transform: rotate(-25deg); }
        .orbit-two { inset: 28px 0; transform: rotate(35deg); }
        .art-circle {
          position: absolute; width: 150px; height: 150px; top: 48px; left: 65px;
          display: grid; place-items: center; border-radius: 42px; transform: rotate(-8deg);
          background: linear-gradient(145deg, #dcd9ff, #a6a0ff);
          box-shadow: 0 20px 45px rgba(13, 10, 70, .3);
        }
        .art-bag {
          display: grid; place-items: center; width: 75px; height: 85px;
          border: 3px solid #4b43c4; border-radius: 13px;
          color: #4b43c4; font-size: 42px; font-weight: 800;
          transform: rotate(8deg);
        }
        .art-spark { position: absolute; color: white; }
        .spark-one { right: 13px; top: 8px; font-size: 27px; }
        .spark-two { left: 5px; bottom: 25px; font-size: 32px; }
        .floating-card {
          position: absolute; display: flex; align-items: center; gap: 10px;
          padding: 11px 13px; border: 1px solid rgba(255,255,255,.3);
          border-radius: 11px; background: rgba(255,255,255,.96); color: var(--ink);
          box-shadow: 0 10px 30px rgba(12, 10, 70, .18);
        }
        .floating-card > span {
          display: grid; place-items: center; width: 29px; height: 29px;
          border-radius: 8px; background: #eeedff; color: var(--brand); font-weight: 800;
        }
        .floating-card div { display: flex; flex-direction: column; gap: 3px; }
        .floating-card strong { font-size: 11px; }
        .floating-card small { font-size: 10px; color: var(--muted); }
        .float-top { top: 16px; right: -1px; }
        .float-bottom { bottom: 14px; left: -6px; }

        .benefits {
          display: grid; grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px; margin: 0 clamp(18px, 5vw, 76px);
        }
        .benefit {
          display: flex; align-items: center; gap: 12px; padding: 17px;
          background: #fff; border: 1px solid var(--line); border-radius: 11px;
        }
        .benefit-icon {
          display: grid; place-items: center; flex: 0 0 38px; height: 38px;
          border-radius: 10px; background: #f0efff; color: var(--brand);
          font-size: 20px; font-weight: 800;
        }
        .benefit div { display: flex; flex-direction: column; gap: 5px; min-width: 0; }
        .benefit strong { font-size: 12px; }
        .benefit small { color: var(--muted); font-size: 10px; }

        .catalog-section { padding: 52px clamp(18px, 5vw, 76px) 65px; scroll-margin-top: 20px; }
        .catalog-heading { display: flex; align-items: end; justify-content: space-between; gap: 16px; }
        .section-eyebrow { color: var(--brand); font-size: 10px; font-weight: 800; letter-spacing: 1.7px; }
        .catalog-heading h2 { margin: 8px 0; font-size: clamp(26px, 3vw, 34px); letter-spacing: -1px; }
        .catalog-heading p { margin: 0; color: var(--muted); font-size: 13px; }
        .refresh-button {
          flex: 0 0 auto; display: inline-flex; align-items: center; gap: 8px;
          border: 1px solid #dce0ec; background: white; border-radius: 8px;
          padding: 10px 14px; color: #4b556b; font-size: 12px; font-weight: 700;
        }
        .refresh-button:disabled { opacity: .6; cursor: wait; }
        .refresh-button span { font-size: 17px; }

        .catalog-toolbar {
          display: flex; justify-content: space-between; align-items: center; gap: 14px;
          margin: 25px 0 17px; padding: 12px 0; border-top: 1px solid var(--line);
          border-bottom: 1px solid var(--line);
        }
        .result-count { color: var(--muted); font-size: 12px; }
        .sort-control { display: flex; align-items: center; gap: 10px; color: var(--muted); font-size: 12px; }
        .sort-control select {
          max-width: 190px; border: 1px solid #e0e4ed; background: white;
          color: var(--ink); border-radius: 7px; padding: 9px 10px; font-size: 12px;
        }

        .product-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 19px; }
        .product-card {
          min-width: 0; overflow: hidden; background: white;
          border: 1px solid #e8ebf2; border-radius: 12px;
          transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease;
        }
        .product-card:hover { transform: translateY(-4px); border-color: #d4d2ff; box-shadow: 0 12px 28px rgba(32, 35, 82, .09); }
        .product-image-wrap {
          position: relative; display: grid; place-items: center;
          height: 190px; overflow: hidden; background: #f2f4fb;
        }
        .product-image { width: 100%; height: 100%; object-fit: contain; padding: 16px; box-sizing: border-box; }
        .product-placeholder {
          display: flex; align-items: center; justify-content: center; flex-direction: column;
          gap: 7px; width: 100%; height: 100%;
          background: linear-gradient(135deg, #f2f0ff, #f6f7fb);
          color: #8c85e9;
        }
        .product-placeholder span { font-size: 54px; }
        .product-placeholder small { color: #777c99; font-size: 9px; font-weight: 800; letter-spacing: 2px; }
        .stock-badge {
          position: absolute; left: 10px; top: 10px; padding: 6px 8px;
          border-radius: 5px; font-size: 9px; font-weight: 700;
        }
        .stock-badge.available { background: #e3f8ed; color: #147847; }
        .stock-badge.unavailable { background: #fff0f0; color: #b42332; }
        .product-details { padding: 15px; }
        .product-category { color: var(--brand); font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: .8px; }
        .product-details h3 {
          margin: 8px 0; font-size: 15px; line-height: 1.45; font-weight: 700;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .product-description {
          min-height: 35px; margin: 0; color: var(--muted); font-size: 11px;
          line-height: 1.6; display: -webkit-box; -webkit-line-clamp: 2;
          -webkit-box-orient: vertical; overflow: hidden;
        }
        .product-bottom { margin-top: 15px; padding-top: 12px; border-top: 1px solid #eff0f5; }
        .product-bottom > div { display: flex; flex-direction: column; gap: 6px; }
        .product-price { color: #28215e; font-size: 19px; letter-spacing: -.5px; }
        .stock-text { color: var(--muted); font-size: 10px; }

        .empty-state {
          display: flex; align-items: center; flex-direction: column; text-align: center;
          padding: 55px 20px; background: white; border: 1px solid var(--line); border-radius: 14px;
        }
        .empty-state > span { font-size: 40px; color: var(--brand); }
        .empty-state h3 { margin-bottom: 5px; }
        .empty-state p { color: var(--muted); font-size: 13px; }
        .empty-state .hero-button { color: white; background: var(--brand); }
        .error-box {
          display: flex; align-items: center; justify-content: space-between; gap: 15px;
          margin-bottom: 20px; padding: 18px; border: 1px solid #fecaca;
          border-radius: 10px; background: #fff5f5; color: #991b1b;
        }
        .error-box p { margin-bottom: 0; font-size: 12px; }
        .skeleton-card { padding: 12px; border: 1px solid var(--line); background: white; border-radius: 12px; }
        .skeleton-image, .skeleton-line { background: #eceef5; border-radius: 6px; animation: pulse 1.3s ease-in-out infinite alternate; }
        .skeleton-image { height: 160px; margin-bottom: 16px; }
        .skeleton-line { height: 12px; margin: 12px 0; }
        .skeleton-line.short { width: 60%; }
        .skeleton-line.price-line { width: 45%; height: 19px; margin-top: 20px; }
        @keyframes pulse { from { opacity: .55; } to { opacity: 1; } }

        .footer { padding: 32px 18px; text-align: center; background: white; border-top: 1px solid var(--line); }
        .footer-brand { font-size: 21px; font-weight: 800; }
        .footer p { color: var(--muted); font-size: 12px; }
        .footer small { color: #9299a9; font-size: 10px; }

        @media (max-width: 1050px) {
          .topbar { grid-template-columns: auto minmax(180px, 1fr); gap: 16px; }
          .account-area { grid-column: 1 / -1; justify-self: end; }
          .product-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
          .benefits { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .hero-art { transform: scale(.85); transform-origin: center right; margin-left: 0; }
        }
        @media (max-width: 680px) {
          .topbar { grid-template-columns: 1fr auto; padding: 14px 16px; gap: 13px; }
          .brand { font-size: 21px; }
          .brand-mark { width: 32px; height: 32px; }
          .searchbar { grid-column: 1 / -1; grid-row: 2; }
          .account-area { grid-column: 2; grid-row: 1; gap: 7px; }
          .account-copy { display: none; }
          .logout-button { padding: 8px 9px; }
          .category-nav { justify-content: flex-start; gap: 24px; padding: 0 16px; }
          .hero { margin: 18px 12px; min-height: 260px; padding: 28px 23px; }
          .hero-content { max-width: 100%; }
          .hero h1 { font-size: 37px; }
          .hero p { max-width: 310px; font-size: 12px; }
          .hero-art { display: none; }
          .benefits { margin: 0 12px; gap: 8px; }
          .benefit { padding: 12px 9px; gap: 8px; }
          .benefit-icon { flex-basis: 31px; height: 31px; font-size: 16px; }
          .benefit strong { font-size: 10px; }
          .benefit small { font-size: 9px; }
          .catalog-section { padding: 40px 12px; }
          .catalog-heading { align-items: flex-start; }
          .catalog-heading h2 { font-size: 26px; }
          .refresh-button { padding: 9px 10px; }
          .catalog-toolbar { align-items: flex-start; }
          .sort-control { align-items: flex-start; flex-direction: column; gap: 5px; }
          .product-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
          .product-image-wrap { height: 145px; }
          .product-details { padding: 11px; }
          .product-details h3 { font-size: 13px; }
          .product-price { font-size: 16px; }
          .product-description { font-size: 10px; }
          .stock-badge { left: 6px; top: 6px; padding: 5px 6px; font-size: 8px; }
          .error-box { align-items: flex-start; flex-direction: column; }
        }
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { animation-duration: .01ms !important; transition-duration: .01ms !important; scroll-behavior: auto !important; }
        }
      `}</style>
    </main>
  );
}
