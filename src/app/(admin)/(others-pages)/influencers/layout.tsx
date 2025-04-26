import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Influencers Management | Influencers Finding Admin Dashboard",
  description: "Create, edit and manage influencers in the marketplace",
};

export default function InfluencersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
} 