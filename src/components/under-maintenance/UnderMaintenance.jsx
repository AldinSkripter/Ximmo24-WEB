import { useTranslation } from '../context/TranslationContext';
import UnderMaintenancePlaceholder from '../reusable-components/icons/UnderMaintenancePlaceholder';
import { useSelector } from 'react-redux';

const UnderMaintenance = () => {
    const t = useTranslation();
    const webSettings = useSelector((state) => state.WebSetting?.data);
    return (
        <div className="flex flex-col items-center justify-center h-screen">
            <div className="flex flex-col gap-4 text-center items-center justify-center">
                <div>
                    <UnderMaintenancePlaceholder
                        color={webSettings?.system_color}
                        className={"w-[250px] h-[250px] md:w-[400px] md:h-[400px] lg:w-[500px] lg:h-[500px]"}
                    />
                </div>
                <div className="flex flex-col items-center justify-center">
                    <h3 className='primaryColor'>{t("underMaintenance")}</h3>
                    <span className='secondryTextColor'>{t("pleaseTryAgain")}</span>
                </div>
            </div>
        </div>
    );
};

export default UnderMaintenance;