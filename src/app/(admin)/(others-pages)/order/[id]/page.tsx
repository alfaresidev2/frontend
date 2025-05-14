"use client";
import { useParams, useRouter } from "next/navigation";
import OrderTracking from "@/components/order/OrderTracking";
import Button from "@/components/ui/button/Button";
import Image from "next/image";

const dummyOrders = [
  {
    id: "ORD-001",
    customer: "John Doe",
    influencer: { name: "Alice Influencer", avatar: "/images/grid-image/image-01.png" },
    date: "2024-06-01",
    status: "Ready to Publish",
    tracking: [
      { label: "Pending Approval", desc: "Waiting for initial approval.", date: "2024-05-30T11:29:00", completed: true },
      { label: "Sign and Agree", desc: "The contract has been signed and approved.", date: "2024-05-31T11:29:00", completed: true },
      { label: "Paid", desc: "Payment has been received.", date: "2024-06-01T11:29:00", completed: true },
      { label: "Content & Script Ready", desc: "Content and script are ready.", date: "2024-06-02T15:20:00", completed: true },
      { label: "Script Approved by You", desc: "The script has been approved by you.", date: "2024-06-03T14:12:00", completed: true },
      { label: "Ready to Publish on 06 March 2025", desc: "Ready to be published on 06 March 2025.", date: "2025-03-06T14:12:00", completed: false },
      { label: "Published", desc: "Content has been published.", date: "2025-03-06T16:00:00", completed: false },
    ]
  },
  // ...other dummy orders
];

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const order = dummyOrders.find(o => o.id === params.id);

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-gray-600 dark:text-gray-400 mb-4">Order not found</p>
        <Button onClick={() => router.back()}>Back to Orders</Button>
      </div>
    );
  }

  return (
    <div>
      <Button variant="outline" onClick={() => router.back()} className="mb-6">Back to Orders</Button>
      <div className="bg-white dark:bg-slate-900/80 rounded-2xl shadow-theme-md border border-gray-200 dark:border-slate-800 p-6 mb-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-blue-200 dark:border-blue-700 shadow">
            <Image src={order.influencer.avatar} alt={order.influencer.name} fill className="object-cover" />
          </div>
          <div>
            <div className="text-lg font-bold text-gray-900 dark:text-gray-100">Order {order.id}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Influencer: <span className="font-medium text-blue-700 dark:text-blue-300">{order.influencer.name}</span></div>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-2">
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Customer</div>
            <div className="font-medium text-gray-900 dark:text-gray-100">{order.customer}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Date</div>
            <div className="font-medium text-gray-900 dark:text-gray-100">{order.date}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Status</div>
            <div className="font-medium text-gray-900 dark:text-gray-100">{order.status}</div>
          </div>
        </div>
      </div>
      <OrderTracking steps={order.tracking} influencer={order.influencer} />
    </div>
  );
} 