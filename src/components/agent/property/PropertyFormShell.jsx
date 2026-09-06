import React from 'react';
import { AiOutlineCheck } from 'react-icons/ai';

const PropertyFormShell = ({ title, tabItems, activeTab, onTabChange, children, showRoundedBorders = false }) => {
    const activeIndex = Math.max(0, tabItems.findIndex((tab) => tab.id === activeTab));
    const progress = tabItems.length > 1 ? (activeIndex / (tabItems.length - 1)) * 100 : 100;

    return (
        <div className="space-y-5 p-2 md:p-0">
            <div>
                <p className="primaryColor text-xs font-bold uppercase tracking-[0.18em]">Ximmo24</p>
                <h1 className="mt-1 text-2xl font-bold text-gray-900 md:text-3xl">{title}</h1>
            </div>

            <div className={`w-full overflow-hidden border border-gray-100 bg-white shadow-sm ${showRoundedBorders ? 'rounded-xl md:rounded-2xl' : 'rounded-xl'}`}>
                <div className="overflow-x-auto border-b border-gray-100 bg-gray-50/70 px-4 py-5 md:px-8 md:py-7">
                    <div className="relative min-w-[720px]">
                        <div className="absolute left-5 right-5 top-5 hidden h-1 rounded-full bg-gray-200 md:block" />
                        <div
                            className="primaryBg absolute left-5 top-5 hidden h-1 rounded-full transition-[width] duration-500 ease-out md:block"
                            style={{ width: `calc((100% - 2.5rem) * ${progress / 100})` }}
                            aria-hidden="true"
                        />
                        <div
                            className="relative grid gap-3"
                            style={{ gridTemplateColumns: `repeat(${tabItems.length}, minmax(0, 1fr))` }}
                        >
                            {tabItems.map((tab, index) => {
                                const isActive = index === activeIndex;
                                const isComplete = index < activeIndex;
                                return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => onTabChange(tab.id)}
                                className={`group flex items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors md:flex-col md:px-1 md:text-center ${isActive ? 'bg-white shadow-sm md:bg-transparent md:shadow-none' : ''}`}
                                aria-current={isActive ? 'step' : undefined}
                            >
                                <span className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold transition-all ${isActive || isComplete ? 'primaryBg primaryBorderColor text-white' : 'border-gray-300 bg-white text-gray-500 group-hover:border-gray-400'}`}>
                                    {isComplete ? <AiOutlineCheck className="h-5 w-5" /> : index + 1}
                                </span>
                                <span className={`text-sm font-semibold leading-tight ${isActive ? 'primaryColor' : isComplete ? 'text-gray-800' : 'text-gray-500'}`}>
                                    {tab.label}
                                </span>
                            </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="p-4 md:p-8">{children}</div>
            </div>
        </div>
    );
};

export default PropertyFormShell;
