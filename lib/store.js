const storeKey = "__ttVenturesMemoryStore";

if (!globalThis[storeKey]) {
  globalThis[storeKey] = {
    users: [],
    orders: [],
    sessions: new Map(),
    rateLimits: new Map(),
  };
}

export const store = globalThis[storeKey];

export const products = [
  { id: 1, name: "Essential Black Tee", category: "Men's Clothing", price: 12000 },
  { id: 2, name: "Relaxed Fit Shirt", category: "Men's Clothing", price: 15000 },
  { id: 3, name: "Streetwear Hoodie", category: "Men's Clothing", price: 28000 },
  { id: 4, name: "Urban Jacket", category: "Men's Clothing", price: 38000 },
  { id: 5, name: "Classic Sneakers", category: "Shoes & Sneakers", price: 45000 },
  { id: 6, name: "Daily Sneakers", category: "Shoes & Sneakers", price: 52000 },
  { id: 7, name: "Everyday Cap", category: "Bags & Accessories", price: 9000 },
  { id: 8, name: "Crossbody Bag", category: "Bags & Accessories", price: 18000 },
  { id: 9, name: "Designer Comfort Sleeper", category: "Designer Sleepers", price: 14000 },
  { id: 10, name: "Premium Slide Sleeper", category: "Designer Sleepers", price: 18000 },
];
