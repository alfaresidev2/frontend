"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import api from "@/utils/axios";
import Button from "@/components/ui/button/Button";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { ChevronLeftIcon } from "@/icons";

interface Influencer {
    _id: string;
    name: string;
    profileImage?: string;
}

interface Collaboration {
    _id: string;
    users: string[];
    usersData: Influencer[];
    imageUrl: string;
    title: string;
    description: string;
    createdAt: string;
    updatedAt: string;
}

export default function CollaborationDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const [collaboration, setCollaboration] = useState<Collaboration | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchCollaboration = async () => {
            try {
                const response = await api.get(`/collaboration/${params.id}`);
                setCollaboration(response.data.data);
            } catch (error) {
                console.error("Error fetching collaboration:", error);
                alert("Failed to fetch collaboration details");
            } finally {
                setIsLoading(false);
            }
        };

        if (params.id) {
            fetchCollaboration();
        }
    }, [params.id]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!collaboration) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)]">
                <p className="text-gray-600 dark:text-gray-400 mb-4">Collaboration not found</p>
                <Button onClick={() => router.back()}>Go Back</Button>
            </div>
        );
    }

    return (
        <>
            <PageBreadcrumb pageTitle="Collaboration Details" />
            <div className="container mx-auto px-4 py-4">
                            <Button variant="outline" onClick={() => router.back()} className="flex items-center gap-1">
                                <ChevronLeftIcon className="w-4 h-4" />
                                Back to List
                            </Button>
                        </div>


            <div className=" flex items-center justify-center bg-gray-50 dark:bg-slate-900  px-2">
                <div className="w-full max-w-6xl bg-white dark:bg-slate-900 rounded-3xl shadow-md border-2 border-[#455eff]/20 dark:border-blue-900/40 p-0 md:p-0 flex flex-col md:flex-row overflow-hidden">

                    <div className="md:w-2/3 flex flex-col gap-6 p-6 bg-white dark:bg-slate-900 max-h-[80vh] overflow-y-auto">

                        <div className="bg-gray-50 dark:bg-slate-800 rounded-2xl shadow border border-blue-100 dark:border-blue-900/40 p-6">
                            {/* <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Collaboration Details</h3> */}
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">{collaboration.title}</h1>
                            <p className="text-gray-600 dark:text-gray-400 whitespace-pre-line leading-relaxed">{collaboration.description}</p>
                        </div>

                        <div className="bg-gray-50 dark:bg-slate-800 rounded-2xl shadow border border-blue-100 dark:border-blue-900/40 p-6">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Influencers</h3>
                            <div className="flex flex-wrap gap-4">
                                {collaboration.usersData.map((influencer) => (
                                    <div key={influencer._id} className="flex items-center gap-3 bg-gray-100 dark:bg-slate-700 rounded-full p-2 pr-4 shadow-sm">
                                        <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-white dark:border-slate-900">
                                            <Image
                                                src={influencer.profileImage || "/placeholder.svg"}
                                                alt={influencer.name}
                                                fill
                                                className="object-cover"
                                            />
                                        </div>
                                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{influencer.name}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-gray-50 dark:bg-slate-800 rounded-2xl shadow border border-blue-100 dark:border-blue-900/40 p-6">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Metadata</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700 dark:text-gray-300">
                                <div>
                                    <span className="font-medium text-gray-900 dark:text-gray-100">Created At:</span> {new Date(collaboration.createdAt).toLocaleString()}
                                </div>
                                <div>
                                    <span className="font-medium text-gray-900 dark:text-gray-100">Updated At:</span> {new Date(collaboration.updatedAt).toLocaleString()}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="md:w-1/3 flex-shrink-0 bg-gradient-to-b from-[#455eff]/10 to-white dark:from-slate-900 dark:to-slate-800 p-8 flex flex-col items-center justify-start border-l border-blue-100 dark:border-slate-800">
                        {collaboration.imageUrl && (
                            <div className="relative w-full aspect-square rounded-lg overflow-hidden shadow-md border border-gray-200 dark:border-slate-700">
                                <Image
                                    src={collaboration.imageUrl}
                                    alt={collaboration.title}
                                    fill
                                    className="object-cover"
                                />
                            </div>
                        )}
                      
                    </div>

                </div>
            </div>
        </>
    );
} 