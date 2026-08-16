import { useTranslation } from '../context/TranslationContext';
import SubscriptionSwiper from '../subscription-plan/SubscriptionSwiper';

const AgentPackages = () => {
    const t = useTranslation();
    return (
        <div>
            <div className="mb-4 sm:mb-6">
                <h2 className="text-xl sm:text-2xl font-bold">
                    {t("packages")}
                </h2>
            </div>
            <SubscriptionSwiper isAgentSubscriptionSwiper={true} page="agent-packages" />
        </div>
    )
}

export default AgentPackages