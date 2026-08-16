import NewBreadcrumb from '../breadcrumb/NewBreadCrumb';
import { useTranslation } from '../context/TranslationContext';
import unlockProjectsIcon from "@/assets/dashboard-icons/projectsIcon.svg";
import { BsBadgeAd } from 'react-icons/bs';
import { FaRegCalendarCheck } from 'react-icons/fa6';
import { ReactSVG } from 'react-svg';
import BecomeAgentHeroSection from './BecomeAgentHeroSection';
import BecomeAgentProcessSection from './BecomeAgentProcessSection';
import SubscriptionSwiper from '../subscription-plan/SubscriptionSwiper';

const BecomeAgent = () => {
    const t = useTranslation();

    const agentBenefitCards = [
        {
            text: t("unlockProjects"),
            icon: <ReactSVG
                src={unlockProjectsIcon?.src}
                beforeInjection={(svg) => {
                    svg.setAttribute(
                        "style",
                        `height: 100%; width: 100%;`,
                    );
                    svg.querySelectorAll("path").forEach((path) => {
                        path.setAttribute(
                            "style",
                            `fill: #fff;`,
                        );
                    });
                }}
                alt="unlockProjectsIcon"
                className='w-6 h-6'
            />
        },
        {
            text: t("adTools"),
            icon: <BsBadgeAd className='text-white w-6 h-6' />
        },
        {
            text: t("appointmentManagement"),
            icon: <FaRegCalendarCheck className='text-white w-6 h-6' />
        }
    ];

    const processSteps = [
        {
            number: "1",
            title: t("agentUpgradeStepOneTitle"),
            description: t("agentUpgradeStepOneDescription"),
        },
        {
            number: "2",
            title: t("agentUpgradeStepTwoTitle"),
            description: t("agentUpgradeStepTwoDescription"),
        },
        {
            number: "3",
            title: t("agentUpgradeStepThreeTitle"),
            description: t("agentUpgradeStepThreeDescription"),
        },
        {
            number: "4",
            title: t("agentUpgradeStepFourTitle"),
            description: t("agentUpgradeStepFourDescription"),
        },
    ];

    return (
        <div>
            <NewBreadcrumb
                title={t("becomeAgent")}
                items={[
                    { label: t("becomeAgent"), href: "/become-agent" },
                ]}
            />
            <BecomeAgentHeroSection agentBenefitCards={agentBenefitCards} />
            <BecomeAgentProcessSection processSteps={processSteps} />
            <SubscriptionSwiper isAgentSubscriptionSwiper={true} page={"become-agent"} />
        </div>
    )
}

export default BecomeAgent
