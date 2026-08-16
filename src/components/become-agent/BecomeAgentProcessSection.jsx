import React from 'react'
import { useTranslation } from '../context/TranslationContext';

const BecomeAgentProcessSection = ({ processSteps = [] }) => {
    const t = useTranslation();
    return (
        <section className='bg-white py-16 md:py-20 lg:py-[60px]'>
            <div className='container mx-auto flex flex-col gap-6 sm:gap-8 md:gap-12 px-4'>
                <div className='mx-auto max-w-4xl flex flex-col items-center gap-6 text-center'>
                    <span className='flex items-center justify-center rounded-full border primaryBorderColor p-4 primaryBgLight08 text-sm md:text-base font-medium primaryColor'>
                        {t("agentUpgradeProcessLabel")}
                    </span>
                    <div className="flex flex-col mx-auto gap-4">
                        <h2 className='text-xl font-bold brandColor md:text-3xl lg:text-[32px]'>
                            {t("agentUpgradeProcessTitle")}
                        </h2>
                        <p className='text-base leadColor'>
                            {t("agentUpgradeProcessDescription")}
                        </p>
                    </div>
                </div>

                <div className='grid gap-6 sm:grid-cols-2 xl:grid-cols-4'>
                    {processSteps.map((step) => (
                        <div key={step.number} className='flex h-full gap-2 sm:gap-4 md:gap-6 flex-col items-center rounded-3xl border border-gray-200 bg-white px-4 py-5 md:px-6 md:py-10 text-center group hover:cursor-pointer'>
                            <div className='flex w-10 h-10 sm:w-12 sm:h-12 md:h-16 md:w-16 items-center justify-center rounded-full primaryBg text-xl font-semibold text-white group-hover:shadow-[0px_6.67px_30px_0px_#087C7C3D]'>
                                {step.number}
                            </div>
                            <div className="flex flex-col gap-1 sm:gap-2 md:gap-4">
                                <h3 className='text-base md:text-xl font-semibold text-gray-900 line-clamp-2'>
                                    {step.title}
                                </h3>
                                <p className='max-w-xs text-sm md:text-base brandColor opacity-[66%] line-clamp-3'>
                                    {step.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}

export default BecomeAgentProcessSection
