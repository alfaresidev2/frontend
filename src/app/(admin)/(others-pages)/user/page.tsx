import PageBreadcrumb from "@/components/common/PageBreadCrumb"
import UserPage from "@/components/user/User"

export default function Page() {
  return (
    <div>
      <PageBreadcrumb pageTitle="User" />
      <UserPage />
    </div>
  )
} 