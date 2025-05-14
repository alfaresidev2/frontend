"use client";
import { useRouter } from "next/navigation";
import OrderList from "@/components/order/OrderList";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";

export default function OrderPage() {
  const router = useRouter();
  return (
    <div>
       <PageBreadcrumb pageTitle="Order Management" />
      <OrderList onView={order => router.push(`/order/${order.id}`)} />
    </div>
  );
} 