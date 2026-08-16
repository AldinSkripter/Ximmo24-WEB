"use client"
import React from 'react'
import { useTranslation } from '../context/TranslationContext'
import { useSelector } from 'react-redux'
import NoDataFoundPlaceholder from '../reusable-components/icons/NoDataFoundPlaceholder'

const NoDataFound = ({ title, description }) => {
    const t = useTranslation()
    const webSettings = useSelector((state) => state.WebSetting?.data);
    return (
        <div className="flex flex-col items-center justify-center my-[100px] gap-4 h-[60vh]">
            <NoDataFoundPlaceholder color={webSettings?.system_color} width={200} height={200} />
            <div className="flex flex-col items-center justify-center">
                <h3 className="primaryColor text-base md:text-2xl font-medium">{title || t("noDataFound")}</h3>
                <span className='text-center text-sm md:text-base font-normal secondryTextColor'>{description || t("noDataFoundMessage")}</span>
            </div>
        </div>
    )
}

export default NoDataFound