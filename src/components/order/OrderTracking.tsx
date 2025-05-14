import React from "react";
import Image from "next/image";

interface TrackingStep {
  label: string;
  desc: string;
  date: string; // ISO string
  completed: boolean;
}

interface OrderTrackingProps {
  steps: TrackingStep[];
  influencer?: { name: string; avatar: string };
}

export default function OrderTracking({ steps, influencer }: OrderTrackingProps) {
    console.log(influencer)
  // Find the index of the first incomplete step (active)
  const activeIdx = steps.findIndex((s) => !s.completed);
  return (
    <div className="py-4">
      <div className="font-semibold text-lg mb-4 flex items-center gap-3">
        <span className="dark:text-white">Tracking</span>
        {influencer && (
          <span className="flex items-center gap-2 ml-4 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/40">
            <span className="relative w-7 h-7 rounded-full overflow-hidden border-2 border-blue-200 dark:border-blue-700 shadow">
              <Image src={influencer.avatar} alt={influencer.name} fill className="object-cover" />
            </span>
            <span className="font-medium text-blue-700 dark:text-blue-300 text-sm">{influencer.name}</span>
          </span>
        )}
      </div>
      <div className="bg-white dark:bg-slate-900/80 rounded-2xl shadow-theme-xl border border-gray-200 dark:border-slate-800 p-6">
        <ol className="relative ml-6">
          {steps.map((step, idx) => {
            const isActive = idx === activeIdx;
            const isCompleted = step.completed;
            const isLast = idx === steps.length - 1;
            // Line color logic
            const lineColor = isCompleted || isActive ? "bg-blue-500" : "bg-gray-300 dark:bg-gray-700";
            return (
              <li key={idx} className="flex items-start relative min-h-[56px]">
                {/* Vertical line */}
                {!isLast && (
                  <span
                    className={`absolute left-3 top-8 w-1 h-[calc(100%-2rem)] rounded-full ${steps[idx + 1].completed || isActive ? "bg-blue-500" : "bg-gray-300 dark:bg-gray-700"}`}
                    aria-hidden="true"
                  />
                )}
                {/* Step icon */}
                <span
                  className={`flex items-center justify-center w-8 h-8 rounded-full border-2 z-10 shadow-sm
                    ${isCompleted ? "bg-blue-600 border-blue-600 text-white" :
                      isActive ? "bg-white border-blue-500 text-blue-600 ring-2 ring-blue-200 dark:ring-blue-900" :
                        "bg-gray-100 border-gray-300 text-gray-400 dark:bg-slate-800 dark:border-gray-700"}
                    transition-all duration-200
                  `}
                  style={{ position: "absolute", left: 0, top: 0 }}
                >
                  {isCompleted ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  ) : isActive ? (
                    <span className="w-3 h-3 bg-blue-500 rounded-full block animate-pulse"></span>
                  ) : (
                    <span className="w-3 h-3 bg-gray-300 dark:bg-gray-700 rounded-full block"></span>
                  )}
                </span>
                {/* Step content */}
                <div className="flex flex-col gap-0.5 ml-12 pb-6 w-full">
                  <span className={`font-semibold text-base leading-tight ${isCompleted ? 'text-gray-900 dark:text-gray-100' : isActive ? 'text-blue-600' : 'text-gray-400 dark:text-gray-500'}`}>{step.label}</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400 leading-snug">{step.desc}</span>
                  <span className="text-xs text-gray-400 mt-0.5">{new Date(step.date).toLocaleString(undefined, { weekday: 'short', hour: '2-digit', minute: '2-digit', year: 'numeric', month: 'short', day: 'numeric' })}</span>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
} 