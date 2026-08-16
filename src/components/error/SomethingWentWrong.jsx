import { useSelector } from 'react-redux';
import { useTranslation } from '../context/TranslationContext'
import SomethingWentWrongPlaceholder from '../reusable-components/icons/SomethingWentWrongPlaceholder'

const SomethingWentWrong = () => {
  const t = useTranslation();
  const webSettings = useSelector((state) => state?.WebSetting?.data);

  return (
    <div className='flex flex-col items-center justify-center h-screen'>
      <SomethingWentWrongPlaceholder
        color={webSettings?.system_color}
        className='w-[200px] h-[200px] md:w-[300px] md:h-[300px] xl:w-[400px] xl:h-[400px]'
      />
      <h1 className='text-2xl font-bold'>{t("somethingWentWrong")}</h1>
      <p className='text-gray-500'>{t("pleaseTryAgainLater")}</p>
    </div>
  )
}

export default SomethingWentWrong