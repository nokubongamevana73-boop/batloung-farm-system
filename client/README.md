# Batloung Farm — React Client

Modern, responsive **React 18** Single-Page Application (SPA) built with **Vite** and **Lucide Icons** for the Batloung Farm Distribution System (Maseru, Lesotho).

---

##  Features

- **Dashboard:** KPI summary metrics, top 5 selling fruits, highest volume vendor, recent sales, and dynamic low-stock warning banners.
- **Fruit & Stock Matrix:** Visual packaging-size breakdown for **Small**, **Medium**, and **Large** boxes for each fruit (Apples, Bananas, Oranges, Mangoes, Grapes), low stock filter, and register fruit modal.
- **South African Suppliers:** Directory with province badges and business constraint deletion verification.
- **Vendors & Credit Ledger:** Searchable directory with live outstanding balance calculations (`Total Invoiced - Total Paid`).
- **Sourcing Purchase (Stock In):** Dynamic multi-item purchase rows, automatic total cost calculation, and instant packaging-specific stock updates.
- **Distribution Sale (Stock Out):** Select registered vendor, select payment method (Cash, Mobile Money, Credit), multi-item order rows, automatic selling price calculation, and real-time out-of-stock validation check.
- **Reports & Analytics:** Dedicated views for sales revenue, top 5 selling fruits, highest volume vendor, and stock levels across small, medium, and large packaging sizes.

---

##  Tech Stack

- **React 18** (Functional components, Hooks: `useState`, `useEffect`)
- **Vite** (Next-generation lightning-fast frontend tooling)
- **Lucide React** (Clean, modern iconography)
- **CSS3** (Custom responsive design system with fresh produce aesthetic)
- **Proxy Configuration:** Automatically routes all `/api/*` calls to the Node.js/Express server on `http://localhost:3000`.

---

##  Running the React App

### Development Mode (with hot-reload):
```bash
# From the project root:
npm run client

# Or from inside the client/ folder:
cd client
npm run dev
```
Open **`http://localhost:5173/`** in your browser.

### Production Build:
```bash
npm run client:build
```
Outputs optimized static assets to `client/dist/`.