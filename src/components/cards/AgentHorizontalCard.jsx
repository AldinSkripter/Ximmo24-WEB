import ImageWithPlaceholder from "../image-with-placeholder/ImageWithPlaceholder";
import { useTranslation } from "../context/TranslationContext";
import {
  FaFacebookF,
  FaInstagram, FaYoutube,
  FaEnvelope,
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaWhatsapp
} from "react-icons/fa";
import { VerifiedAgentBadge } from "@/utils/helperFunction";
import Link from "next/link";
import { FaXTwitter, FaLinkedin } from "react-icons/fa6";
import { RiUserVoiceLine } from "react-icons/ri";
import { useSelector, useDispatch } from "react-redux";
import { FiShare2 } from "react-icons/fi";
import { setActiveAgentId } from "@/redux/slices/storiesSlice";
import StoryViewer from "@/components/stories/StoryViewer";
import LoginModal from "@/components/modal/LoginModal";
import { useState } from "react";

const AgentHorizontalCard = ({ agentDetails, isFeatureAvailable = false, setShowAppointmentModule, setIsShareModalOpen }) => {
  const t = useTranslation();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const userData = useSelector(state => state.User?.data);
  const webSettings = useSelector(state => state?.WebSetting?.data);

  // Extract data from agentDetails prop
  let {
    id,
    name,
    profile: imgSrc,
    mobile: phone,
    email,
    address,
    facebook_id,
    twitter_id,
    youtube_id,
    instagram_id,
    linkedin_id,
    is_agent_verified: isVerified,
    is_appointment_available: isAppointmentAvailable,
    country_code = "",
  } = agentDetails || {};

  if (agentDetails?.is_admin === false) {
    address = agentDetails?.agent_profile?.agent_address;
    facebook_id = agentDetails?.agent_profile?.facebook_id;
    twitter_id = agentDetails?.agent_profile?.twitter_id;
    youtube_id = agentDetails?.agent_profile?.youtube_id;
    instagram_id = agentDetails?.agent_profile?.instagram_id;
    linkedin_id = agentDetails?.agent_profile?.linkedin_id;
    country_code = agentDetails?.agent_profile?.agent_country_code;
    email = agentDetails?.agent_profile?.agent_email
  }

  if (country_code && phone && !phone.startsWith("+")) {
    phone = `+${country_code}${phone}`;
  } else {
    phone = phone || null;
  }

  const showWhatsappButton = webSettings?.show_whatsapp_button === true;
  const whatsappNumber = phone && phone !== "null" ? phone.replace(/[^0-9]/g, "") : "";

  const dispatch = useDispatch();
  const { agentsStories, viewedOverrides, activeAgentId } = useSelector((state) => state.stories);

  const agentStoryGroup = agentsStories?.find((a) => a.agent_id === id);
  const agentAllStories = agentStoryGroup
    ? [...(agentStoryGroup.non_premium_stories || []), ...(agentStoryGroup.premium_stories || [])]
    : [];
  const hasStories = agentAllStories.length > 0;
  const hasUnseenStory = agentAllStories.some(
    (story) => !story.is_seen && !viewedOverrides[story.story_id]
  );

  const handleStoryRingClick = () => {
    if (hasStories) {
      dispatch(setActiveAgentId(id));
    }
  };

  // Create social links object from the API data
  const socialLinks = [
    {
      icon: <FaFacebookF className="h-4 w-4" />,
      link: facebook_id && facebook_id !== "null" ? facebook_id : null,
    },
    {
      icon: <FaXTwitter className="h-4 w-4" />,
      link: twitter_id && twitter_id !== "null" ? twitter_id : null,
    },
    {
      icon: <FaYoutube className="h-4 w-4" />,
      link: youtube_id && youtube_id !== "null" ? youtube_id : null,
    },
    {
      icon: <FaInstagram className="h-4 w-4" />,
      link: instagram_id && instagram_id !== "null" ? instagram_id : null,
    },
    {
      icon: <FaLinkedin className="h-4 w-4" />,
      link: linkedin_id && linkedin_id !== "null" ? linkedin_id : null,
    },
  ];

  const renderSocialLinks = () => {
    if (socialLinks.length === 0) return null;
    return (
      <div className="flex items-center gap-3">
        {socialLinks.map((link, index) => {
          if (!link.link) return null;
          return (
            <Link
              href={link.link}
              key={index}
              target="_blank"
              className="bg-gray-100 text-gray-600 flex h-9 w-9 items-center justify-center rounded-full transition-all duration-200 hover:bg-gray-200 hover:text-gray-900 hover:cursor-pointer"
            >
              {link.icon}
            </Link>
          );
        })}
      </div>
    );
  };

  return (
    <div className="w-full rounded-2xl border border-gray-200 bg-white p-4 sm:p-6">
      <div className="flex flex-col gap-6 md:flex-row md:items-stretch">
        {/* Agent Image Section */}
        <div
          onClick={handleStoryRingClick}
          className={`h-full w-full md:max-h-[304px] md:max-w-[304px] rounded-2xl flex-shrink-0 relative ${
            hasStories
              ? `p-[3px] border-[3px] bg-white ${hasUnseenStory ? "primaryBorderColor" : "border-gray-200"} cursor-pointer`
              : ""
          }`}
        >
          <div className="relative w-full h-full overflow-hidden rounded-xl">
            <ImageWithPlaceholder
              src={imgSrc}
              alt={`${name} - Real Estate Agent`}
              className="w-full h-full md:aspect-square object-cover"
              loading="lazy"
            />
          </div>
        </div>

        {/* Agent Details Section */}
        <div className="flex w-full flex-1 flex-col justify-between">
          <div className="w-full">
            {/* Header Section: Name and Share Button */}
            <div className="flex items-center justify-between gap-4 w-full pb-3">
              <h2 className="brandColor text-xl sm:text-2xl font-bold flex items-center gap-2">
                {name}
                {isVerified && <VerifiedAgentBadge width={22} height={22} color={webSettings?.system_color} />}
              </h2>

              <button
                onClick={() => setIsShareModalOpen && setIsShareModalOpen(true)}
                className="flex items-center gap-2 border border-gray-200 hover:bg-gray-50 px-3 py-1.5 rounded-lg text-sm leadColor transition-colors duration-200"
              >
                <FiShare2 className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium">{t("share")}</span>
              </button>
            </div>

            {/* Separator */}
            <div className="w-full border-b border-gray-100 mb-4" />

            {/* Contact Information Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
              {/* Email */}
              {email && (
                <div className="flex items-center gap-3 min-w-0">
                  <div className="primaryBgLight flex h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0 items-center justify-center rounded-lg">
                    <FaEnvelope className="primaryColor h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="brandColor font-bold text-xs sm:text-sm">{t("email")}</span>
                    <Link
                      href={`mailto:${email}`}
                      className="leadColor text-xs sm:text-sm font-medium hover:underline truncate"
                    >
                      {email}
                    </Link>
                  </div>
                </div>
              )}

              {/* Phone */}
              {phone && phone !== "null" && (
                <div className="flex items-center gap-3 min-w-0">
                  <div className="primaryBgLight flex h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0 items-center justify-center rounded-lg">
                    <FaPhoneAlt className="primaryColor h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="brandColor font-bold text-xs sm:text-sm">{t("call")}</span>
                    <Link
                      href={`tel:${phone}`}
                      className="leadColor text-xs sm:text-sm font-medium hover:underline truncate"
                    >
                      {phone}
                    </Link>
                  </div>
                </div>
              )}

              {/* WhatsApp */}
              {showWhatsappButton && whatsappNumber && (
                <div className="flex items-center gap-3 min-w-0">
                  <div className="primaryBgLight flex h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0 items-center justify-center rounded-lg">
                    <FaWhatsapp className="primaryColor h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="brandColor font-bold text-xs sm:text-sm">{t("whatsapp")}</span>
                    <Link
                      href={`https://wa.me/${whatsappNumber}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="leadColor text-xs sm:text-sm font-medium hover:underline truncate"
                    >
                      {phone}
                    </Link>
                  </div>
                </div>
              )}

              {/* Address */}
              {address && (
                <div className="flex items-center gap-3 min-w-0">
                  <div className="primaryBgLight flex h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0 items-center justify-center rounded-lg">
                    <FaMapMarkerAlt className="primaryColor h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="brandColor font-bold text-xs sm:text-sm">{t("address")}</span>
                    <span className="leadColor text-xs sm:text-sm font-medium truncate" title={address}>
                      {address}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer Section */}
          <div className={`flex flex-wrap items-center w-full gap-4 mt-6 border-t pt-4 ${socialLinks.some((link) => link.link) ? "justify-center sm:justify-between" : "justify-end"}`}>
            {/* Social Media Links */}
            {socialLinks.some((link) => link.link) ? (
              <div className="flex items-center gap-3">
                {renderSocialLinks()}
              </div>
            ) : <div />}

            {userData?.id !== id && isAppointmentAvailable ? (
              <button
                onClick={() => setShowAppointmentModule(true)}
                className="flex primaryBg hover:opacity-95 text-white px-5 py-2.5 rounded-lg items-center gap-2 transition-all duration-200 flex-shrink-0 w-full sm:w-auto justify-center"
              >
                <RiUserVoiceLine className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="font-semibold text-sm sm:text-base">{t("scheduleAnAppointment")}</span>
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {activeAgentId === id && (
        <StoryViewer onRequireLogin={() => setShowLoginModal(true)} />
      )}

      {showLoginModal && (
        <LoginModal showLogin={showLoginModal} setShowLogin={setShowLoginModal} />
      )}
    </div>
  );
};

export default AgentHorizontalCard;
