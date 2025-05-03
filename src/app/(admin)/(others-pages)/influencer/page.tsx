import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import InfluencerPage from "@/components/influencer/Influencer";

export default function page() {
    return (
        <div>
            <PageBreadcrumb pageTitle="Influencer" />
            <InfluencerPage/>
        </div>
    );
}
