"use client";

import React from 'react';
import { FiGrid, FiList } from 'react-icons/fi';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from '@/components/context/TranslationContext';
import { Button } from '@/components/ui/button';
import { IoFilterSharp } from 'react-icons/io5';

const FilterTopBar = ({
    itemCount = 0,
    totalItems = 0,
    viewType = 'grid',
    setViewType,
    sortBy = 'newest',
    setSortBy,
    onOpenFilters,
    showFilterButton = true,
    showItemCount = true,
    showSortBy = true,
    showViewToggle = true,
    isLoading = false,
}) => {
    const t = useTranslation();

    return (
        <div className="mb-5 flex w-full flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
            {showItemCount && (
                <div className="min-w-0 text-sm font-medium text-slate-700" aria-live="polite">
                    {isLoading ? t('loadingMore') : itemCount > 0
                        ? `${t('showing')} 1–${itemCount} ${t('of')} ${totalItems} ${t('results')}`
                        : t('noResultsFound')}
                </div>
            )}
            <div className="flex w-full flex-wrap items-center gap-2 sm:ml-auto sm:w-auto sm:justify-end">
                {showFilterButton && onOpenFilters && (
                    <Button variant="outline" onClick={onOpenFilters} className="gap-2 rounded-xl xl:hidden" aria-label={t('filterProperties')}>
                        <IoFilterSharp className="h-4 w-4" />{t('filter')}
                    </Button>
                )}
                {showSortBy && (
                    <div className="flex min-w-0 flex-1 items-center gap-2 sm:flex-none">
                        <span className="hidden whitespace-nowrap text-sm text-slate-600 md:inline">{t('sortBy')}</span>
                        <Select value={sortBy} onValueChange={setSortBy}>
                            <SelectTrigger aria-label={t('sortBy')} className="min-w-[145px] flex-1 rounded-xl bg-white focus:ring-0 sm:w-[175px] sm:flex-none">
                                <SelectValue placeholder={t('sortBy')} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="newest">{t('newest')}</SelectItem>
                                <SelectItem value="oldest">{t('oldest')}</SelectItem>
                                <SelectItem value="price_high">{t('priceHighToLow')}</SelectItem>
                                <SelectItem value="price_low">{t('priceLowToHigh')}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                )}
                {showViewToggle && (
                    <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 p-1" role="group" aria-label={t('gridView')}>
                        <button type="button" aria-label={t('gridView')} aria-pressed={viewType === 'grid'}
                            className={`rounded-lg p-2 transition ${viewType === 'grid' ? 'primaryBg text-white shadow-sm' : 'text-slate-500 hover:bg-white'}`}
                            onClick={() => setViewType('grid')}><FiGrid className="h-4 w-4" /></button>
                        <button type="button" aria-label={t('listView')} aria-pressed={viewType === 'list'}
                            className={`rounded-lg p-2 transition ${viewType === 'list' ? 'primaryBg text-white shadow-sm' : 'text-slate-500 hover:bg-white'}`}
                            onClick={() => setViewType('list')}><FiList className="h-4 w-4" /></button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FilterTopBar;
