/* ============================================================
   PRODUCTS — palitan ng sarili mong mga produkto.
   id: unique, walang space. images: URL ng litrato (o "images/file.jpg" sa folder mo).
   options: opsyonal na variants (size/color). stock: ilan ang available.
   ============================================================ */
const u = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&q=70`;
window.CATEGORIES = ["Electronics", "Fashion", "Accessories", "Beauty", "Home"];
window.PRODUCTS = [
  { id: "aero-headphones", name: "Aero Wireless Headphones", category: "Electronics", price: 89, compareAt: 129, stock: 24, rating: 4.7, sold: 312, featured: true,
    images: [u("photo-1505740420928-5e560c06d30e")], options: { label: "Color", values: ["Black", "Silver"] },
    desc: "Active noise cancelling, 40-hour battery, and plush memory-foam cushions for all-day comfort." },
  { id: "tactile-keyboard", name: "Tactile 75% Mechanical Keyboard", category: "Electronics", price: 74, compareAt: null, stock: 18, rating: 4.6, sold: 187, featured: true,
    images: [u("photo-1587829741301-dc798b83add3")], options: { label: "Switch", values: ["Red", "Brown", "Blue"] },
    desc: "Hot-swappable switches, PBT keycaps, and a gasket-mounted board for a deep, satisfying sound." },
  { id: "chrono-watch", name: "Chrono Steel Smartwatch", category: "Accessories", price: 119, compareAt: 159, stock: 12, rating: 4.5, sold: 96, featured: true,
    images: [u("photo-1523275335684-37898b6baf30")], options: { label: "Strap", values: ["Steel", "Leather", "Silicone"] },
    desc: "Heart-rate, sleep tracking, GPS and a 7-day battery in a slim stainless-steel case." },
  { id: "everyday-tee", name: "Everyday Heavyweight Tee", category: "Fashion", price: 24, compareAt: 32, stock: 80, rating: 4.8, sold: 540, featured: false,
    images: [u("photo-1521572163474-6864f9cf17ab")], options: { label: "Size", values: ["S", "M", "L", "XL"] },
    desc: "240gsm combed cotton with a relaxed fit that keeps its shape wash after wash." },
  { id: "denim-jacket", name: "Classic Denim Jacket", category: "Fashion", price: 62, compareAt: null, stock: 30, rating: 4.4, sold: 143, featured: true,
    images: [u("photo-1551028719-00167b16eac5")], options: { label: "Size", values: ["S", "M", "L", "XL"] },
    desc: "A timeless unisex denim jacket in durable, softly washed rigid denim." },
  { id: "canvas-backpack", name: "Minimal Canvas Backpack", category: "Accessories", price: 49, compareAt: 65, stock: 40, rating: 4.6, sold: 221, featured: false,
    images: [u("photo-1553062407-98eeb64c6a62")], options: null,
    desc: "Water-resistant canvas, padded 15-inch laptop sleeve and hidden anti-theft pocket." },
  { id: "hydra-serum", name: "Hydra Glow Face Serum 30ml", category: "Beauty", price: 28, compareAt: 36, stock: 60, rating: 4.7, sold: 402, featured: true,
    images: [u("photo-1556228720-195a672e8a03")], options: null,
    desc: "Hyaluronic acid and vitamin B5 for lightweight, long-lasting hydration." },
  { id: "pour-over-set", name: "Ceramic Pour-Over Coffee Set", category: "Home", price: 39, compareAt: null, stock: 22, rating: 4.9, sold: 118, featured: false,
    images: [u("photo-1495474472287-4d71bcdd2085")], options: null,
    desc: "Hand-finished ceramic dripper and server — slow mornings, better coffee." },
  { id: "street-sneakers", name: "Street Runner Sneakers", category: "Fashion", price: 79, compareAt: 99, stock: 35, rating: 4.5, sold: 260, featured: true,
    images: [u("photo-1542291026-7eec264c27ff")], options: { label: "Size (US)", values: ["7", "8", "9", "10", "11"] },
    desc: "Lightweight cushioning and a breathable knit upper built for the daily commute." },
  { id: "aviator-shades", name: "Polarized Aviator Sunglasses", category: "Accessories", price: 34, compareAt: 45, stock: 50, rating: 4.3, sold: 175, featured: false,
    images: [u("photo-1572635196237-14b3f281503f")], options: null,
    desc: "UV400 polarized lenses in a featherweight metal frame." }
];
