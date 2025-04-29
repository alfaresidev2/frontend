import CategoryPage from "@/components/category/Category";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";

export default function page() {
    return (
        <div>
            <PageBreadcrumb pageTitle="Category" />
            <CategoryPage/>
        </div>
    );
}
