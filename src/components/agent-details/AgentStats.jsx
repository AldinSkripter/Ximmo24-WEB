
import { useTranslation } from "../context/TranslationContext";
import { ReactSVG } from "react-svg";
import SoldSVG from "@/assets/dashboard-icons/soldIcon.svg";
import RentSVG from "@/assets/dashboard-icons/rentPropertiesIcon.svg";
import PropertyIcon from "@/assets/dashboard-icons/propertiesIcon.svg";
import ProjectIcon from "@/assets/dashboard-icons/projectsIcon.svg";
import { useSelector } from "react-redux";

const AgentStats = ({ agentDetails, projectsCount = 0, propertiesCount = 0 }) => {
  const t = useTranslation();

  const webSettings = useSelector((state) => state?.WebSetting?.data);

  const propertiesSold = agentDetails?.properties_sold_count || 0;
  const propertiesRented = agentDetails?.properties_rented_count || 0;
  const totalProperties = propertiesCount || agentDetails?.property_count || agentDetails?.properties_count || 0;
  const projects = projectsCount || agentDetails?.projects_count || 0;

  const stats = [
    {
      value: propertiesSold,
      label: t("soldProperties"),
      icon: <ReactSVG
        src={SoldSVG.src}
        beforeInjection={(svg) => {
          svg.setAttribute(
            "style",
            `height: 100%; width: 100%;`,
          );
          svg.querySelectorAll("path").forEach((path) => {
            path.setAttribute(
              "style",
              `fill: var(--new-green-color)`,
            );
          });
        }}
        className="w-6 h-6"
      />,
      bgColor: "newGreenBgLight",
    },
    {
      value: propertiesRented,
      label: t("rentedProperties"),
      icon: <ReactSVG
        src={RentSVG.src}
        beforeInjection={(svg) => {
          svg.setAttribute(
            "style",
            `height: 100%; width: 100%;`,
          );
          svg.querySelectorAll("path").forEach((path) => {
            path.setAttribute(
              "style",
              `fill: var(--orange-color-light)`,
            );
          });
        }}
        className="w-6 h-6"
      />,
      bgColor: "orangeBgLight10",
    },
    {
      value: totalProperties,
      label: t("properties"),
      icon: <ReactSVG src={PropertyIcon.src}
        beforeInjection={(svg) => {
          svg.setAttribute(
            "style",
            `height: 100%; width: 100%;`,
          );
          svg.querySelectorAll("path").forEach((path) => {
            path.setAttribute(
              "style",
              `fill: ${webSettings?.system_color}`,
            );
          });
        }}
        className="w-6 h-6" />,
      bgColor: "primaryBgLight12",
    },
    {
      value: projects,
      label: t("projects"),
      icon: <ReactSVG
        src={ProjectIcon.src}
        beforeInjection={(svg) => {
          svg.setAttribute(
            "style",
            `height: 100%; width: 100%;`,
          );
          svg.querySelectorAll("path").forEach((path) => {
            path.setAttribute(
              "style",
              `fill: var(--primary-sell)`,
            );
          });
        }}
        className="w-6 h-6"
      />,
      bgColor: "primarySellBgLight12",
    },
  ];

  return (
    <div className="w-full rounded-2xl newBorder bg-white overflow-hidden">
      {/* Header */}
      <div className="border-b border-gray-100 p-4 sm:p-5">
        <h3 className="text-lg font-bold brandColor">
          {t("overview")}
        </h3>
      </div>

      {/* Grid */}
      <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 bg-white"
          >
            {/* Icon Wrapper */}
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${stat.bgColor}`}>
              {stat.icon}
            </div>

            {/* Content */}
            <div className="flex flex-col">
              <span className="text-base md:text-2xl font-bold brandColor">
                {stat.value}
              </span>
              <span className="text-sm text-gray-500 font-medium">
                {stat.label}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AgentStats;
