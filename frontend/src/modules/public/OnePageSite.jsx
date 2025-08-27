import React, { useEffect, useMemo, useRef, useState } from "react";
import { Helmet } from "react-helmet";
import ProductCard from "./ProductCard";
import OnePageHeader from "./OnePageHeader";
import { listPublicProducts, assetUrl } from "../../services/api";

const PLACEHOLDER = "https://via.placeholder.com/600x600?text=No+Image";
const SHOE_COLORS = ["black","white","brown","blue","red","gray","green","pink","purple","yellow"];
const SHOE_BRANDS = ["Nike","Adidas","Puma","Reebok","Vans","Converse","New Balance","MODVICE"];
const SHOE_SIZES = [5,6,7,8,9,10,11,12];

export default function OnePageSite() {
  // data
  const [all, setAll] = useState([]);

  // filters/sort
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [sortOption, setSortOption] = useState("newest");
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [priceRange, setPriceRange] = useState([0, 500]);
  const [priceMax, setPriceMax] = useState(500);

  // cart/wishlist
  const [cartItems, setCartItems] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // product modal
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);

  // section refs
  const heroRef = useRef(null);
  const newRef = useRef(null);
  const topRef = useRef(null);
  const trendRef = useRef(null);
  const seasonalRef = useRef(null);
  const catalogRef = useRef(null);
  const aboutRef = useRef(null);
  const contactRef = useRef(null);
  const testimonialsRef = useRef(null);
  const blogRef = useRef(null);
  const faqRef = useRef(null);

  const onJump = (id) => {
    const map = {
      hero: heroRef, new: newRef, top: topRef, trend: trendRef, seasonal: seasonalRef,
      catalog: catalogRef, about: aboutRef, contact: contactRef,
      testimonials: testimonialsRef, blog: blogRef, faq: faqRef
    };
    map[id]?.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // load products
  useEffect(() => {
    (async () => {
      try {
        const resp = await listPublicProducts(64);
        const data = Array.isArray(resp?.data) ? resp.data : (resp?.data?.items || []);

        const normalized = data.map((p, idx) => {
          const price = Number(p.price ?? 0);
          const tagsLower = new Set((p.tags || []).map((t) => String(t).toLowerCase()));
          const withFlag = (boolKey, fallbacks) => Boolean(p[boolKey]) || fallbacks.some((t) => tagsLower.has(t));
          return {
            ...p,
            price,
            discountedPrice: Number(p.discountedPrice ?? price),
            discount: Number(p.discount ?? 0),
            image: p.image ? assetUrl(p.image) : `https://source.unsplash.com/600x600/?shoe&sig=${idx}`,
            rating: Number(p.rating ?? (Math.random() * 2 + 3).toFixed(1)),
            reviews: Number(p.reviews ?? Math.floor(Math.random() * 100)),
            sizes: Array.isArray(p.sizes) && p.sizes.length
              ? p.sizes
              : (p.size ? String(p.size).split(",").map((s)=>parseInt(s,10)).filter((n)=>!Number.isNaN(n)) : [7,8,9]),
            type: p.type || "sneaker",
            color: p.color || "black",
            brand: p.brand || "MODVICE",
            material: p.material || "—",
            barcode: p.barcode || "",
            reorderThreshold: Number(p.reorderThreshold ?? 3),
            createdAt: p.createdAt || p.updatedAt || new Date().toISOString(),
            quantity: Number(p.quantity ?? 0),
            newArrival: withFlag("newArrival", ["new-arrival", "new"]),
            topSeller: withFlag("topSeller", ["bestseller", "best-seller", "favorite"]),
            trending: withFlag("trending", ["trending", "hot"]),
            seasonal: withFlag("seasonal", ["seasonal"]),
          };
        });

        const deduped = Object.values(
          normalized.reduce((acc, item) => {
            const key = item._id || item.barcode || `${item.name}-${item.brand}`;
            if (!acc[key]) acc[key] = item;
            return acc;
          }, {})
        );

        setAll(deduped);

        const max = Math.max(500, ...deduped.map((p) => Number(p.price) || 0));
        const rounded = Math.ceil(max / 100) * 100;
        setPriceMax(rounded);
        setPriceRange([0, rounded]);
      } catch (e) {
        console.error("Failed to load products", e);
        setAll([]);
      }
    })();
  }, []);

  // sections
  const takeTop = (arr, n) => arr.slice(0, Math.min(n, arr.length));

  const newArrivals = useMemo(() => {
    const flagged = all.filter((p) => p.newArrival);
    if (flagged.length) return takeTop(flagged.sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)), 8);
    return takeTop([...all].sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)), 8);
  }, [all]);

  const topSellers = useMemo(() => {
    const flagged = all.filter((p) => p.topSeller);
    if (flagged.length) return takeTop(flagged, 8);
    return takeTop([...all].sort((a,b)=>(b.reviews||0)-(a.reviews||0)), 8);
  }, [all]);

  const trending = useMemo(() => {
    const flagged = all.filter((p) => p.trending);
    if (flagged.length) return takeTop(flagged, 8);
    return takeTop([...all].sort((a,b)=>(b.rating||0)-(a.rating||0)), 8);
  }, [all]);

  const seasonal = useMemo(() => {
    const flagged = all.filter((p) => p.seasonal);
    if (flagged.length) return takeTop(flagged, 8);
    const palette = ["white","gray","blue","green","yellow"];
    const matches = all.filter((p) => palette.includes((p.color||"").toLowerCase()));
    const base = matches.length ? matches : all;
    return takeTop(
      [...base].sort((a,b) => ((b.rating||0)+(b.reviews||0)/50) - ((a.rating||0)+(a.reviews||0)/50)),
      8
    );
  }, [all]);

  // catalog filtering
  const catalogFiltered = useMemo(() => {
    let result = [...all];

    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      result = result.filter((p) =>
        p.name?.toLowerCase().includes(s) ||
        p.brand?.toLowerCase().includes(s) ||
        p.type?.toLowerCase().includes(s) ||
        p.color?.toLowerCase().includes(s) ||
        p.barcode?.toLowerCase().includes(s)
      );
    }

    if (filter === "in-stock") {
      result = result.filter((p) => Number(p.quantity) > Number(p.reorderThreshold ?? 3));
    } else if (filter === "low-stock") {
      result = result.filter((p) => Number(p.quantity) <= Number(p.reorderThreshold ?? 3));
    }

    if (selectedSize) result = result.filter((p) => p.sizes?.includes(Number(selectedSize)));
    if (selectedColor) result = result.filter((p) => (p.color || "").toLowerCase() === selectedColor.toLowerCase());
    if (selectedBrand) result = result.filter((p) => (p.brand || "").toLowerCase() === selectedBrand.toLowerCase());

    result = result.filter((p) => Number(p.price) >= priceRange[0] && Number(p.price) <= priceRange[1]);

    switch (sortOption) {
      case "price-low": result.sort((a, b) => Number(a.price) - Number(b.price)); break;
      case "price-high": result.sort((a, b) => Number(b.price) - Number(a.price)); break;
      case "name": result.sort((a, b) => (a.name || "").localeCompare(b.name || "")); break;
      case "rating": result.sort((a, b) => Number(b.rating) - Number(a.rating)); break;
      case "popular": result.sort((a, b) => Number(b.reviews) - Number(a.reviews)); break;
      case "newest":
      default: result.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }
    return result;
  }, [all, searchTerm, filter, sortOption, selectedSize, selectedColor, selectedBrand, priceRange]);

  // cart
  const addToCart = (product, size = null) => {
    setCartItems((prev) => {
      const existing = prev.find((i) => i._id === product._id && (!size || i.size === size));
      if (existing) {
        return prev.map((i) =>
          i._id === product._id && (!size || i.size === size) ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...product, quantity: 1, size: size || product.sizes?.[0] || null, selectedSize: size || null }];
    });
    setIsCartOpen(true);
  };
  const removeFromCart = (index) => setCartItems((prev) => prev.filter((_, i) => i !== index));
  const updateCartItemQuantity = (index, q) => { if (q > 0) setCartItems((p) => p.map((i, ix) => ix === index ? { ...i, quantity: q } : i)); };
  const toggleWishlist = (product) => setWishlist((prev) =>
    prev.some((i) => i._id === product._id) ? prev.filter((i) => i._id !== product._id) : [...prev, product]
  );

  const openProductModal = (product) => { setSelectedProduct(product); setIsProductModalOpen(true); document.body.style.overflow = "hidden"; };
  const closeProductModal = () => { setIsProductModalOpen(false); document.body.style.overflow = "auto"; };

  const clearFilters = () => {
    setSearchTerm(""); setFilter("all"); setSortOption("newest");
    setSelectedSize(""); setSelectedColor(""); setSelectedBrand("");
    setPriceRange([0, priceMax]);
  };

  const cartTotal = cartItems.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
  const cartItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const Header = ({ title, subtitle, onViewAll }) => (
    <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
      <div>
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900">{title}</h2>
        {subtitle && <p className="mt-1 text-gray-500">{subtitle}</p>}
      </div>
      <button onClick={onViewAll} className="inline-flex items-center gap-1 text-orange-600 hover:text-orange-700 font-medium">
        View all
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
      </button>
    </div>
  );

  const Grid = ({ items, dark }) =>
    !items?.length ? (
      <div className={`rounded-xl shadow-sm p-8 text-center ${dark ? "bg-gray-800" : "bg-white"}`}>
        <h3 className={`mt-2 text-sm font-medium ${dark ? "text-white" : "text-gray-900"}`}>No shoes available</h3>
        <p className={`mt-1 text-sm ${dark ? "text-gray-300" : "text-gray-500"}`}>Check back later for new arrivals.</p>
      </div>
    ) : (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {items.map((p) => (
          <ProductCard
            key={p._id || p.barcode || `${p.name}-${p.brand}`}
            p={p}
            onAddToCart={addToCart}
            onWishlistToggle={toggleWishlist}
            isInWishlist={wishlist.some((i) => i._id === p._id)}
            onProductClick={openProductModal}
            dark={dark}
          />
        ))}
      </div>
    );

  const Testimonial = ({ quote, author, rating }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm">
      <div className="flex mb-4">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg key={star} className={`h-5 w-5 ${star <= rating ? "text-yellow-400" : "text-gray-300"}`} viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z"
              clipRule="evenodd"
            />
          </svg>
        ))}
      </div>
      <blockquote className="text-gray-600 italic mb-4">"{quote}"</blockquote>
      <p className="text-gray-900 font-medium">— {author}</p>
    </div>
  );

  const BlogPost = ({ title, excerpt, image, date, readTime }) => (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      <div className="h-48 overflow-hidden">
        <img src={image} alt={title} className="w-full h-full object-cover" loading="lazy" />
      </div>
      <div className="p-6">
        <div className="flex justify-between text-sm text-gray-500 mb-2">
          <span>{date}</span>
          <span>{readTime}</span>
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600 mb-4">{excerpt}</p>
        <a href="#blog" className="text-orange-600 hover:text-orange-700 font-medium text-sm">Read more</a>
      </div>
    </div>
  );

  const FAQItem = ({ question, answer }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <button className="w-full flex justify-between items-center p-4 text-left bg-white hover:bg-gray-50" onClick={() => setIsOpen(!isOpen)}>
          <span className="font-medium text-gray-900">{question}</span>
          <svg className={`h-5 w-5 text-gray-500 transform transition-transform ${isOpen ? "rotate-180" : ""}`} viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"/>
          </svg>
        </button>
        {isOpen && <div className="p-4 bg-gray-50 text-gray-700"><p>{answer}</p></div>}
      </div>
    );
  };

  const StatItem = ({ number, label }) => (
    <div className="text-center p-3 bg-gray-50 rounded-lg">
      <p className="text-2xl font-bold text-orange-600">{number}</p>
      <p className="text-sm text-gray-600">{label}</p>
    </div>
  );

  const ContactInfoRow = ({ icon, title, value, link }) => {
    const icons = {
      mail: (<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>),
      phone: (<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>),
      location: (<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>),
      time: (<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>),
    };
    return (
      <div className="flex items-start gap-4">
        <div className="mt-1 text-orange-400">{icons[icon]}</div>
        <div>
          <h3 className="font-semibold">{title}</h3>
          {link ? (
            <a href={link} className="text-gray-300 hover:text-orange-400 transition-colors">{value}</a>
          ) : (
            <p className="text-gray-300">{value}</p>
          )}
        </div>
      </div>
    );
  };

  const FooterLink = ({ href, text }) => (
    <a
      href={href}
      className="text-gray-400 hover:text-orange-400 transition-colors text-sm"
      onClick={(e) => { e.preventDefault(); document.querySelector(href)?.scrollIntoView({ behavior: "smooth" }); }}
    >
      {text}
    </a>
  );

  const SocialIcon = ({ platform }) => {
    const icons = {
      facebook: (<svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd"/></svg>),
      instagram: (<svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M8 2h8a6 6 0 016 6v8a6 6 0 01-6 6H8a6 6 0 01-6-6V8a6 6 0 016-6zm4 4a5 5 0 100 10 5 5 0 000-10zm6-1.2a1.2 1.2 0 11-2.4 0 1.2 1.2 0 012.4 0z"/></svg>),
      twitter: (<svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"/></svg>),
      youtube: (<svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M19.812 5.418c.861.23 1.538.907 1.768 1.768C21.998 8.746 22 12 22 12s0 3.255-.418 4.814a2.504 2.504 0 0 1-1.768 1.768c-1.56.419-7.814.419-7.814.419s-6.255 0-7.814-.419a2.505 2.505 0 0 1-1.768-1.768C2 15.255 2 12 2 12s0-3.255.417-4.814a2.507 2.507 0 0 1 1.768-1.768C5.744 5 11.998 5 11.998 5s6.255 0 7.814.418ZM15.194 12 10 15V9l5.194 3Z" clipRule="evenodd"/></svg>),
    };
    return (
      <a href={`https://${platform}.com/modvice`} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-orange-400 transition-colors" aria-label={platform}>
        {icons[platform]}
      </a>
    );
  };

  function ContactForm() {
    const [form, setForm] = useState({ name: "", email: "", message: "" });
    const [submitted, setSubmitted] = useState(false);

    const submit = (e) => {
      e.preventDefault();
      setSubmitted(true);
      setTimeout(() => {
        setForm({ name: "", email: "", message: "" });
        setSubmitted(false);
      }, 3000);
    };

    return (
      <div className="bg-gray-800 rounded-2xl p-6 md:p-8 shadow-lg text-white">
        <h3 className="text-xl font-bold mb-6">Send us a message</h3>
        {submitted ? (
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 text-green-400 text-center">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <p className="mt-2 font-medium">Thank you for your message!</p>
            <p className="text-sm mt-1">We'll get back to you soon.</p>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Name</label>
              <input
                type="text"
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
              <input
                type="email"
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Message</label>
              <textarea
                rows="4"
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                required
              />
            </div>
            <button type="submit" className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium py-3 px-4 rounded-lg">
              Send Message
            </button>
          </form>
        )}
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-b from-gray-50 to-gray-100 min-h-screen">
      <Helmet>
        <title>MODVICE | Premium Footwear Collection</title>
        <meta name="description" content="Discover MODVICE's premium footwear collection — where innovation meets tradition in shoe design." />
      </Helmet>

      <OnePageHeader onJump={onJump} />

      {/* CART SIDEBAR */}
      {isCartOpen && (
        <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setIsCartOpen(false)}>
          <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Your Cart ({cartItemCount})</h2>
                <button onClick={() => setIsCartOpen(false)} className="text-gray-500 hover:text-gray-700">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>

              {cartItems.length === 0 ? (
                <div className="text-center py-12">
                  <h3 className="mt-2 text-lg font-medium text-gray-900">Your cart is empty</h3>
                  <p className="mt-1 text-gray-500">Start adding some items to your cart</p>
                  <button
                    onClick={() => { setIsCartOpen(false); onJump("catalog"); }}
                    className="mt-6 px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
                  >
                    Continue Shopping
                  </button>
                </div>
              ) : (
                <>
                  <div className="divide-y divide-gray-200">
                    {cartItems.map((item, index) => (
                      <div key={`${item._id}-${item.size || ""}`} className="py-4 flex">
                        <div className="flex-shrink-0 h-24 w-24 rounded-md overflow-hidden">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="h-full w-full object-cover"
                            onError={(e) => { e.currentTarget.src = PLACEHOLDER; }}
                          />
                        </div>
                        <div className="ml-4 flex-1 flex flex-col">
                          <div>
                            <div className="flex justify-between text-base font-medium text-gray-900">
                              <h3>{item.name}</h3>
                              <p className="ml-4">Rs. {(Number(item.price) * item.quantity).toFixed(2)}</p>
                            </div>
                            <p className="mt-1 text-sm text-gray-500">{item.brand}</p>
                            {item.size && <p className="mt-1 text-sm text-gray-500">Size: {item.size}</p>}
                          </div>
                          <div className="flex-1 flex items-end justify-between text-sm">
                            <div className="flex items-center border border-gray-300 rounded-md">
                              <button onClick={() => updateCartItemQuantity(index, item.quantity - 1)} className="px-2 py-1 text-gray-600 hover:bg-gray-100">-</button>
                              <span className="px-2 py-1">{item.quantity}</span>
                              <button onClick={() => updateCartItemQuantity(index, item.quantity + 1)} className="px-2 py-1 text-gray-600 hover:bg-gray-100">+</button>
                            </div>
                            <button onClick={() => removeFromCart(index)} className="font-medium text-orange-600 hover:text-orange-500">Remove</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-gray-200 py-6">
                    <div className="flex justify-between text-base font-medium text-gray-900">
                      <p>Subtotal</p>
                      <p>Rs. {cartTotal.toFixed(2)}</p>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">Shipping and taxes calculated at checkout.</p>
                    <div className="mt-6">
                      <button className="w-full flex justify-center items-center px-6 py-3 rounded-md text-white bg-orange-600 hover:bg-orange-700">
                        Checkout
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* PRODUCT MODAL */}
      {isProductModalOpen && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 z-50 overflow-y-auto" onClick={closeProductModal}>
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <button onClick={closeProductModal} className="absolute top-4 right-4 text-gray-500 hover:text-gray-700">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
              </button>

              <div className="grid md:grid-cols-2 gap-8 p-6">
                <div className="space-y-4">
                  <div className="bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={selectedProduct.image}
                      onError={(e) => { e.currentTarget.src = PLACEHOLDER; }}
                      alt={selectedProduct.name}
                      className="w-full h-auto object-cover"
                      loading="lazy"
                    />
                  </div>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedProduct.name}</h2>

                  <div className="mt-2 flex items-center">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg key={star} className={`h-5 w-5 ${star <= Math.floor(selectedProduct.rating || 0) ? "text-yellow-400" : "text-gray-300"}`} viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z" clipRule="evenodd"/>
                        </svg>
                      ))}
                    </div>
                    <span className="ml-2 text-sm text-gray-500">
                      {selectedProduct.rating} ({selectedProduct.reviews} reviews)
                    </span>
                  </div>

                  <div className="mt-4 flex items-end gap-2">
                    <span className="text-3xl font-bold text-orange-600">Rs. {Number(selectedProduct.price).toFixed(2)}</span>
                  </div>

                  <p className="mt-4 text-gray-600">{selectedProduct.description}</p>

                  <div className="mt-6">
                    <h3 className="text-sm font-medium text-gray-900">Size</h3>
                    <div className="mt-2 grid grid-cols-4 gap-2">
                      {selectedProduct.sizes?.map((size) => (
                        <span key={size} className="py-2 px-3 text-center border rounded-md border-gray-300">{size}</span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-8 flex gap-4">
                    <button
                      onClick={() => { addToCart(selectedProduct, selectedProduct.sizes?.[0]); closeProductModal(); }}
                      className="flex-1 bg-orange-600 py-3 px-8 rounded-md text-white hover:bg-orange-700"
                    >
                      Add to cart
                    </button>
                    <button onClick={() => toggleWishlist(selectedProduct)} className="p-3 rounded-md border border-gray-300 hover:bg-gray-50">
                      <svg className={`h-6 w-6 ${wishlist.some((i) => i._id === selectedProduct._id) ? "text-red-500 fill-current" : "text-gray-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                      </svg>
                    </button>
                  </div>

                  <div className="mt-8 border-t border-gray-200 pt-8">
                    <h3 className="text-sm font-medium text-gray-900">Details</h3>
                    <ul className="list-disc pl-5 space-y-2 text-sm text-gray-600 mt-4">
                      <li>Brand: {selectedProduct.brand}</li>
                      <li>Type: {selectedProduct.type}</li>
                      <li>Color: {selectedProduct.color}</li>
                      <li>Material: {selectedProduct.material}</li>
                      <li>SKU: {selectedProduct.barcode || "—"}</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HERO */}
      <section ref={heroRef} id="hero" className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/90 to-purple-600/90 z-0"></div>
        <div className="max-w-7xl mx-auto px-4 py-24 md:py-32 grid md:grid-cols-2 gap-8 items-center relative z-10">
          <div className="text-white">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight">
              Step into <span className="text-yellow-300">Comfort</span> & Style
            </h1>
            <p className="mt-4 text-lg text-white/90 max-w-lg">Discover MODVICE's premium footwear collection — where innovation meets tradition in shoe design.</p>
            <div className="mt-8 flex flex-wrap gap-4">
              <button onClick={() => onJump("new")} className="px-6 py-3 rounded-lg bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold shadow-lg">New Arrivals</button>
              <button onClick={() => onJump("top")} className="px-6 py-3 rounded-lg border-2 border-white hover:bg-white/20 text-white font-bold">Best Sellers</button>
              <button onClick={() => onJump("catalog")} className="px-6 py-3 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold">View Catalog</button>
            </div>
          </div>
          <div className="relative">
            <div className="bg-white/10 backdrop-blur-sm rounded-3xl overflow-hidden border border-white/20 shadow-2xl">
              <img src="https://images.unsplash.com/photo-1600269452121-4f2416e55c28?auto=format&fit=crop&w=1065&q=80" alt="MODVICE Footwear Collection" className="w-full h-auto object-cover" loading="lazy" />
            </div>
          </div>
        </div>
      </section>

      {/* BRAND LOGOS */}
      <section className="bg-white py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 items-center">
            {SHOE_BRANDS.slice(0, 5).map((brand) => (
              <div key={brand} className="flex justify-center opacity-60 hover:opacity-100 transition-opacity">
                <span className="text-2xl font-bold text-gray-700">{brand}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* NEW ARRIVALS */}
      <section ref={newRef} id="new" className="max-w-7xl mx-auto px-4 py-16">
        <Header title="New Arrivals" subtitle="Fresh styles just landed" onViewAll={() => onJump("catalog")} />
        <Grid items={newArrivals} />
      </section>

      {/* CUSTOMER FAVORITES */}
      <section ref={topRef} id="top" className="bg-gradient-to-br from-gray-50 to-orange-50 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <Header title="Customer Favorites" subtitle="Our best selling footwear" onViewAll={() => onJump("catalog")} />
          <Grid items={topSellers} />
        </div>
      </section>

      {/* TRENDING NOW */}
      <section ref={trendRef} id="trend" className="max-w-7xl mx-auto px-4 py-16">
        <Header title="Trending Now" subtitle="What's hot this season" onViewAll={() => onJump("catalog")} />
        <Grid items={trending} />
      </section>

      {/* SEASONAL PICKS */}
      <section ref={seasonalRef} id="seasonal" className="bg-gradient-to-br from-gray-900 to-gray-800 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <Header title="Seasonal Picks" subtitle="Perfect for the current weather" onViewAll={() => onJump("catalog")} />
          <Grid items={seasonal} dark />
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section ref={testimonialsRef} id="testimonials" className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">What Our Customers Say</h2>
            <p className="mt-2 text-gray-600">Trusted by thousands of happy customers</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Testimonial quote="The most comfortable shoes I've ever worn! I bought two more pairs after the first week." author="Sarah J." rating={5}/>
            <Testimonial quote="Great quality and perfect fit. MODVICE has become my go-to brand for footwear." author="Michael T." rating={4}/>
            <Testimonial quote="Excellent customer service and fast shipping. The shoes look even better in person." author="Priya K." rating={5}/>
          </div>
        </div>
      </section>

      {/* FULL CATALOG */}
      <section ref={catalogRef} id="catalog" className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Browse Full Collection</h2>
              <p className="text-gray-600">Find your perfect pair</p>
            </div>
            <div className="w-full md:w-auto">
              <button onClick={clearFilters} className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 text-sm">
                Clear All Filters
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {/* Filters */}
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h3 className="font-medium text-gray-900 mb-4">Filters</h3>
              <div className="space-y-6">
                {/* Search */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Search</h4>
                  <div className="relative">
                    <input
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
                      placeholder="Search shoes..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <svg className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>

                {/* Price */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Price range</h4>
                  <div className="px-1">
                    <input
                      type="range"
                      min="0"
                      max={priceMax}
                      step="10"
                      value={priceRange[0]}
                      onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                      className="w-full h-2 bg-gray-200 rounded-lg"
                    />
                    <input
                      type="range"
                      min="0"
                      max={priceMax}
                      step="10"
                      value={priceRange[1]}
                      onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                      className="w-full h-2 bg-gray-200 rounded-lg mt-2"
                    />
                  </div>
                  <div className="flex justify-between mt-2 text-sm text-gray-600">
                    <span>Rs. {priceRange[0]}</span>
                    <span>Rs. {priceRange[1]}</span>
                  </div>
                </div>

                {/* Size */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Size</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {SHOE_SIZES.map((size) => (
                      <button
                        key={size}
                        className={`py-1 px-2 text-center text-sm border rounded-md ${
                          selectedSize === size.toString()
                            ? "bg-orange-100 border-orange-500"
                            : "border-gray-300 hover:border-gray-400"
                        }`}
                        onClick={() => setSelectedSize(selectedSize === size.toString() ? "" : size.toString())}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Color</h4>
                  <div className="flex flex-wrap gap-2">
                    {SHOE_COLORS.map((color) => (
                      <button
                        key={color}
                        className={`w-6 h-6 rounded-full border-2 ${selectedColor === color ? "border-orange-500" : "border-transparent"}`}
                        style={{ backgroundColor: color }}
                        title={color}
                        onClick={() => setSelectedColor(selectedColor === color ? "" : color)}
                      />
                    ))}
                  </div>
                </div>

                {/* Brand */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Brand</h4>
                  <select
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
                    value={selectedBrand}
                    onChange={(e) => setSelectedBrand(e.target.value)}
                  >
                    <option value="">All Brands</option>
                    {SHOE_BRANDS.map((brand) => (
                      <option key={brand} value={brand}>{brand}</option>
                    ))}
                  </select>
                </div>

                {/* Availability */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Availability</h4>
                  <select
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                  >
                    <option value="all">All Products</option>
                    <option value="in-stock">In Stock</option>
                    <option value="low-stock">Low Stock</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Products */}
            <div className="md:col-span-3">
              <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                  <div className="text-sm text-gray-600">
                    Showing <span className="font-medium">{catalogFiltered.length}</span> results
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="text-sm text-gray-600">Sort by:</label>
                    <select
                      className="border border-gray-300 rounded-full px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
                      value={sortOption}
                      onChange={(e) => setSortOption(e.target.value)}
                    >
                      <option value="newest">Newest First</option>
                      <option value="price-low">Price: Low to High</option>
                      <option value="price-high">Price: High to Low</option>
                      <option value="name">Alphabetical</option>
                      <option value="rating">Highest Rated</option>
                      <option value="popular">Most Popular</option>
                    </select>
                  </div>
                </div>
              </div>
              <Grid items={catalogFiltered} />
              {catalogFiltered.length === 0 && (
                <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No shoes match your search</h3>
                  <p className="mt-1 text-sm text-gray-500">Try adjusting your filters or search term</p>
                  <button onClick={clearFilters} className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 text-sm">
                    Clear All Filters
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* BLOG */}
      <section ref={blogRef} id="blog" className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Latest From Our Blog</h2>
            <p className="mt-2 text-gray-600">Footwear trends, styling tips and more</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <BlogPost title="How to Choose the Perfect Running Shoe" excerpt="Finding the right running shoe can make all the difference in your performance and comfort." image="https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80" date="May 15, 2023" readTime="5 min read"/>
            <BlogPost title="The Evolution of Sneaker Culture" excerpt="From basketball courts to high fashion, sneakers have come a long way in popular culture." image="https://images.unsplash.com/photo-1600269452121-4f2416e55c28?auto=format&fit=crop&w=600&q=80" date="April 28, 2023" readTime="7 min read"/>
            <BlogPost title="Sustainable Footwear: The Future of Fashion" excerpt="How eco-friendly materials and ethical production are changing the shoe industry." image="https://images.unsplash.com/photo-1460353581641-37baddab0fa2?auto=format&fit=crop&w=600&q=80" date="April 10, 2023" readTime="4 min read"/>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section ref={faqRef} id="faq" className="bg-gray-50 py-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Frequently Asked Questions</h2>
            <p className="mt-2 text-gray-600">Find answers to common questions about our products and services</p>
          </div>
          <div className="space-y-4">
            <FAQItem question="What is your return policy?" answer="We offer a 30-day return policy for unworn items in their original packaging. Contact our customer service to initiate a return."/>
            <FAQItem question="How do I determine my shoe size?" answer="Measure your foot length and refer to our size chart. Each product page includes sizing tips to find the perfect fit."/>
            <FAQItem question="Do you offer international shipping?" answer="Yes, we ship worldwide. Shipping costs and delivery times vary by location; options are shown at checkout."/>
            <FAQItem question="What payment methods do you accept?" answer="All major cards (Visa, MasterCard, AmEx), PayPal, and selected local methods depending on your country."/>
            <FAQItem question="How can I track my order?" answer="After shipping, you'll receive a confirmation email with a tracking number and tracking link."/>
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section ref={aboutRef} id="about" className="max-w-7xl mx-auto px-4 py-20">
        <div className="bg-white rounded-3xl overflow-hidden shadow-xl">
          <div className="grid md:grid-cols-2 gap-0">
            <div className="p-8 md:p-12 lg:p-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Story</h2>
              <div className="space-y-4 text-gray-700">
                <p>MODVICE is a Sri Lankan footwear brand born from a passion for combining comfort, durability, and contemporary design.</p>
                <p>Founded in 2015, we started as a small workshop crafting custom shoes for local clients. Today, we've grown into an internationally recognized brand while maintaining our commitment to quality and craftsmanship.</p>
                <p>Our designs blend traditional craftsmanship with modern technology, creating footwear that lasts while keeping you in style.</p>
                <p className="pt-4 border-t border-gray-200 text-orange-600 font-medium">Ethically crafted • Premium materials • Designed for your lifestyle</p>
              </div>

              <div className="mt-8 grid grid-cols-2 gap-4">
                <StatItem number="50K+" label="Happy Customers" />
                <StatItem number="100+" label="Styles Available" />
                <StatItem number="5" label="Countries Served" />
                <StatItem number="24/7" label="Customer Support" />
              </div>
            </div>
            <div className="relative min-h-64 md:min-h-96">
              <img src="https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=998&q=80" alt="MODVICE Craftsmanship" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
            </div>
          </div>
        </div>
      </section>

      {/* CONTACT & FOOTER */}
      <section ref={contactRef} id="contact" className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 py-20 grid md:grid-cols-2 gap-12">
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-bold mb-6">Get In Touch</h2>
              <div className="space-y-4">
                <ContactInfoRow icon="mail" title="Email" value="info@modvice.com" link="mailto:info@modvice.com" />
                <ContactInfoRow icon="phone" title="Phone" value="+94 71 123 4567" link="tel:+94711234567" />
                <ContactInfoRow icon="location" title="Location" value="123 Fashion Street, Colombo 03, Sri Lanka" />
                <ContactInfoRow icon="time" title="Hours" value="Mon-Fri: 9AM - 6PM | Sat: 10AM - 4PM" />
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-4">Quick Links</h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  ["#hero","Home"],["#new","New Arrivals"],["#top","Top Sellers"],["#trend","Trending"],
                  ["#seasonal","Seasonal Picks"],["#catalog","Full Catalog"],["#about","About Us"],["#testimonials","Testimonials"],
                  ["#blog","Blog"],["#faq","FAQ"],["#contact","Contact"]
                ].map(([href, text]) => (
                  <FooterLink key={href} href={href} text={text} />
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-4">Follow Us</h3>
              <div className="flex space-x-4">
                <SocialIcon platform="facebook" />
                <SocialIcon platform="instagram" />
                <SocialIcon platform="twitter" />
                <SocialIcon platform="youtube" />
              </div>
            </div>
          </div>

          <ContactForm />
        </div>

        <div className="border-t border-gray-800">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-sm text-gray-400 mb-4 md:mb-0">© {new Date().getFullYear()} MODVICE Footwear. All rights reserved.</p>
              <div className="flex space-x-6">
                <a href="#privacy" className="text-sm text-gray-400 hover:text-orange-400 transition-colors">Privacy Policy</a>
                <a href="#tos" className="text-sm text-gray-400 hover:text-orange-400 transition-colors">Terms of Service</a>
                <a href="#shipping" className="text-sm text-gray-400 hover:text-orange-400 transition-colors">Shipping Policy</a>
              </div>
            </div>
            <p className="text-center text-xs text-gray-500 mt-4">Designed with ❤️ in Sri Lanka</p>
          </div>
        </div>
      </section>
    </div>
  );
}
