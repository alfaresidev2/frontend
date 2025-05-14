import React, { useState } from "react";
import Button from "@/components/ui/button/Button";
import Image from "next/image";

interface Order {
  id: string;
  customer: string;
  influencer: {
    name: string;
    avatar: string;
  };
  date: string;
  status: string;
}

const dummyOrders: Order[] = [
  {
    id: "ORD-001",
    customer: "John Doe",
    influencer: { name: "Alice Influencer", avatar: "/images/grid-image/image-01.png" },
    date: "2024-06-01",
    status: "Ready to Publish",
  },
  {
    id: "ORD-002",
    customer: "Jane Smith",
    influencer: { name: "Bob Creator", avatar: "/images/grid-image/image-02.png" },
    date: "2024-06-02",
    status: "Paid",
  },
  {
    id: "ORD-003",
    customer: "Alice Brown",
    influencer: { name: "Charlie Star", avatar: "/images/grid-image/image-03.png" },
    date: "2024-06-03",
    status: "Pending Approval",
  },
  {
    id: "ORD-004",
    customer: "Bob Lee",
    influencer: { name: "Daisy Shine", avatar: "/images/grid-image/image-04.png" },
    date: "2024-06-04",
    status: "Published",
  },
  {
    id: "ORD-005",
    customer: "Charlie Green",
    influencer: { name: "Eve Trend", avatar: "/images/grid-image/image-05.png" },
    date: "2024-06-05",
    status: "Content & Script Ready",
  },
];

const statusColors: Record<string, string> = {
  "Ready to Publish": "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  "Paid": "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400",
  "Pending Approval": "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400",
  "Published": "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  "Content & Script Ready": "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
};

export default function OrderList({ onView }: { onView: (order: Order) => void }) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);

  const filteredOrders = dummyOrders.filter(order =>
    order.id.toLowerCase().includes(search.toLowerCase()) ||
    order.customer.toLowerCase().includes(search.toLowerCase()) ||
    order.influencer.name.toLowerCase().includes(search.toLowerCase())
  );

  const paginatedOrders = filteredOrders.slice((page - 1) * limit, page * limit);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
        <input
          type="text"
          placeholder="Search by Order ID, Customer, or Influencer"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          className="w-full md:w-80 px-3 py-2 text-gray-900 dark:text-gray-200 bg-gray-50 border border-gray-200 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:border-gray-700 shadow-sm"
        />
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">Rows per page:</span>
          <select
            value={limit}
            onChange={e => { setLimit(Number(e.target.value)); setPage(1); }}
            className="px-2 py-1 border border-gray-200 rounded-lg dark:bg-slate-800 dark:border-gray-700 text-gray-900 dark:text-gray-200"
          >
            {[5, 10, 25, 50].map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="p-0 md:p-6 bg-white dark:bg-slate-900/80 rounded-[20px] border border-gray-200 dark:border-slate-800 shadow-theme-md overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-600 dark:text-gray-400">
          <thead className="text-xs uppercase bg-gray-50 dark:bg-slate-800/90 text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-slate-700/50">
            <tr>
              <th className="px-6 py-4">Order ID</th>
              <th className="px-6 py-4">Customer</th>
              <th className="px-6 py-4">Influencer</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedOrders.map(order => (
              <tr
                key={order.id}
                className="border-b border-gray-200 dark:border-slate-700/50 hover:bg-blue-50/40 dark:hover:bg-blue-900/10 transition-colors cursor-pointer group"
              >
                <td className="px-6 py-4 font-semibold text-gray-900 dark:text-gray-100 tracking-wide">{order.id}</td>
                <td className="px-6 py-4">{order.customer}</td>
                <td className="px-6 py-4 flex items-center gap-3">
                  <div className="relative w-8 h-8 rounded-full overflow-hidden border-2 border-blue-200 dark:border-blue-700 shadow">
                    <Image src={order.influencer.avatar} alt={order.influencer.name} fill className="object-cover" />
                  </div>
                  <span className="font-medium text-gray-900 dark:text-gray-200">{order.influencer.name}</span>
                </td>
                <td className="px-6 py-4">{order.date}</td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full shadow-sm ${statusColors[order.status] || "bg-gray-100 text-gray-600 dark:bg-gray-800/40 dark:text-gray-300"}`}>
                    {order.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <Button
                    size="sm"
                    variant="primary"
                    className="!px-4 !py-1.5 rounded-lg font-semibold shadow-sm group-hover:scale-105 transition-transform"
                    onClick={() => onView(order)}
                  >
                    View / Track
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {/* Pagination Controls */}
        {filteredOrders.length > 0 && (
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mt-4 px-4 pb-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Showing {Math.min((page - 1) * limit + 1, filteredOrders.length)}-
              {Math.min(page * limit, filteredOrders.length)} of {filteredOrders.length}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="px-3 py-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 disabled:opacity-50 hover:bg-blue-50 dark:hover:bg-blue-900/10"
              >
                Prev
              </button>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Page {page} of {Math.max(1, Math.ceil(filteredOrders.length / limit))}
              </span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page * limit >= filteredOrders.length}
                className="px-3 py-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 disabled:opacity-50 hover:bg-blue-50 dark:hover:bg-blue-900/10"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 