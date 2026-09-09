"use client"
import React from 'react'
import { Skeleton } from "@/components/ui/skeleton"

const SubscriptionSkeletonCard = () => {
    return (
        <article className="flex min-h-[38rem] w-full flex-col justify-between rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_18px_55px_rgba(15,23,42,.08)] sm:gap-7">
            {/* Header */}
            <header className="mx-5 mt-[30px]">
                <Skeleton className="mb-3 self-start rounded-lg px-3 py-1.5 text-sm font-normal capitalize sm:px-4 sm:py-2 w-28 h-8" />
                <Skeleton className="mt-4 w-48 h-12 text-3xl font-extrabold sm:text-4xl md:text-5xl" />
            </header>

            {/* Features section */}
            <section className="flex h-[380px] flex-col justify-start gap-4">
                {/* Validity feature */}
                <div className="flex items-start gap-2 text-sm font-medium sm:items-center sm:gap-3 sm:text-base md:gap-5">
                    <Skeleton className="w-4 h-4 rounded-full mt-0.5 flex-shrink-0 sm:mt-0" />
                    <Skeleton className="w-3/4 h-5" />
                </div>

                {/* Other features skeleton */}
                {[...Array(6)].map((_, index) => (
                    <div key={index} className="flex items-start gap-2 text-sm font-medium sm:items-center sm:gap-3 sm:text-base md:gap-5">
                        <Skeleton className="w-4 h-4 rounded-full mt-0.5 flex-shrink-0 sm:mt-0" />
                        <Skeleton className="w-full h-5" />
                    </div>
                ))}
            </section>

            {/* Button skeleton */}
            <div className="mt-6 mb-6">
                <Skeleton className="w-full h-10 rounded py-2.5" />
            </div>
        </article>
    )
}

export default SubscriptionSkeletonCard 
