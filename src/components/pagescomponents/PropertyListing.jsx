"use client";

import React from 'react';
import { useTranslation } from '@/components/context/TranslationContext';
import PropertyHorizontalCard from '../cards/PropertyHorizontalCard';
import PropertyVerticalCard from '../cards/PropertyVerticalCard';
import NoDataFound from '../no-data-found/NoDataFound';

const PropertyListing = ({
    properties = [],
    onPropertyLike = () => { },
    totalCount = 0,
    onOpenFilters,
    hasActiveFilters,
    viewType,
    setViewType
}) => {
    const t = useTranslation();
    const gridClassName = viewType === 'grid'
        ? 'grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:gap-6'
        : properties.length > 0
            ? 'grid grid-cols-1 gap-6'
            : 'grid place-items-center grid-cols-3';

    return (
        <div className="flex flex-col gap-4">
            <div className={gridClassName}>
                {properties.length > 0 ? (
                    properties.map((property) => (
                        <div key={`property-${property.id}`} className='w-full min-w-0'>
                            {viewType === 'list' ? (
                                <PropertyHorizontalCard
                                    property={property}
                                    handlePropertyLike={onPropertyLike}
                                />
                            ) : (
                                <PropertyVerticalCard
                                    property={property}
                                    handlePropertyLike={onPropertyLike}
                                />
                            )}
                        </div>
                    ))
                ) : (
                    <div className="text-center flex items-center py-16 col-span-full">
                        <NoDataFound title={t('noPropertiesFound')} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default PropertyListing;
