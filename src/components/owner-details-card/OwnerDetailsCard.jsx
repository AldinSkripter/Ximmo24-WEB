import { useEffect, useState } from "react";
import { BadgeSvg, VerifiedAgentBadge, VerifiedUserBadge } from "@/utils/helperFunction";
import { BiLike, BiMessageSquareDetail, BiPhone } from "react-icons/bi";
import { IoLocationOutline } from "react-icons/io5";
import { IoMdThumbsUp } from "react-icons/io";
import { FiArrowRight } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import { useTranslation } from "../context/TranslationContext";
import ImageWithPlaceholder from "../image-with-placeholder/ImageWithPlaceholder";
import Link from "next/link";
import { useRouter } from "next/router";
import { MdEmail } from "react-icons/md";
import { useSelector, useDispatch } from "react-redux";
import { getStoriesApi } from "@/api/apiRoutes";
import { setStoriesData, setActiveAgentId } from "@/redux/slices/storiesSlice";
import StoryViewer from "@/components/stories/StoryViewer";
import LoginModal from "@/components/modal/LoginModal";
import { trackEvent } from "@/utils/analytics";

const OwnerDetailsCard = ({
  ownerData,
  showChat = true,
  interested = false,
  isReported = false,
  handleInterested,
  handleNotInterested,
  isMessagingSupported = true,
  notificationPermissionGranted = true,
  handleChat,
  userCurrentId,
  handleReportProperty,
  placeholderImage,
  handleCheckPremiumUserAgent,
  isProject = false,
  isAgent = false,
  setShowAppointmentModal
}) => {
  const t = useTranslation();
  const router = useRouter();
  const webSettings = useSelector((state) => state?.WebSetting?.data);
  const { lang } = router?.query;
  const [showLoginModal, setShowLoginModal] = useState(false);
  const isAgentOwner = ownerData?.role_context === "agent";
  const agentProfile = ownerData?.agent_profile;
  const isAdmin = ownerData?.is_admin;

  // Project owner shape: computed once and reused for both the display fields
  // below and the story agent_id resolution further down, instead of each
  // re-deriving it independently.
  const isAdminProject = isProject && Boolean(ownerData?.is_admin_listing || ownerData?.customer?.is_admin);
  const customerIsAgent = isProject && Boolean(ownerData?.customer?.is_agent);
  const customerAgentProfile = isProject ? ownerData?.customer?.agent_profile : null;

  let {
    profile,
    customer_name,
    is_verified,
    email,
    mobile,
    client_address,
    added_by,
    facebook_id,
    instagram_id,
    twitter_id,
    youtube_id,
    customer_total_properties: total_properties = 0,
    customer_total_projects: total_projects = 0,
    customer_slug_id,
    is_admin_listing = false,
    is_appointment_available = false,
  } = ownerData || {};

  if (isAgentOwner) {
    customer_name = agentProfile?.agent_name;
    profile = agentProfile?.agent_profile_photo || ownerData?.profile;
    email = agentProfile?.agent_email;
    mobile =
      agentProfile?.agent_mobile && agentProfile?.agent_mobile !== "null" && agentProfile?.agent_country_code
        ? `+${agentProfile?.agent_country_code} ${agentProfile?.agent_mobile}`
        : null;
    client_address = agentProfile?.agent_address;
    is_verified = ownerData?.is_agent_verified;
    facebook_id = agentProfile?.facebook_id;
    instagram_id = agentProfile?.instagram_id;
    twitter_id = agentProfile?.twitter_id;
    youtube_id = agentProfile?.youtube_id;
  } else {
    is_verified = ownerData?.is_user_verified;
  }

  if (isProject) {
    if (isAdminProject) {
      customer_name = ownerData?.customer?.name;
      profile = ownerData?.customer?.profile;
      email = ownerData?.customer?.email;
      mobile =
        ownerData?.customer?.mobile && ownerData?.customer?.mobile !== "null"
          ? ownerData?.customer?.mobile
          : null;
      client_address = ownerData?.customer?.address;
      facebook_id = null;
      instagram_id = null;
      twitter_id = null;
      youtube_id = null;
      is_verified = true;
    } else if (customerIsAgent && customerAgentProfile && isAgentOwner) {
      customer_name = customerAgentProfile?.agent_name;
      profile = customerAgentProfile?.agent_profile_photo;
      email = customerAgentProfile?.agent_email;
      mobile =
        customerAgentProfile?.agent_mobile && customerAgentProfile?.agent_mobile !== "null" && customerAgentProfile?.agent_country_code
          ? `+${customerAgentProfile?.agent_country_code} ${customerAgentProfile?.agent_mobile}`
          : null;
      client_address = customerAgentProfile?.agent_address;
      facebook_id = customerAgentProfile?.facebook_id;
      instagram_id = customerAgentProfile?.instagram_id;
      twitter_id = customerAgentProfile?.twitter_id;
      youtube_id = customerAgentProfile?.youtube_id;
      is_verified = ownerData?.customer?.is_agent_verified;
    } else {
      customer_name = ownerData?.customer?.name;
      profile = ownerData?.customer?.profile;
      email = ownerData?.customer?.email;
      mobile =
        ownerData?.customer?.mobile && ownerData?.customer?.mobile !== "null"
          ? ownerData?.customer?.mobile
          : null;
      client_address = ownerData?.customer?.address;
      facebook_id = null;
      instagram_id = null;
      twitter_id = null;
      youtube_id = null;
      is_verified = ownerData?.customer?.is_user_verified;
    }
    added_by = ownerData?.added_by;
    customer_slug_id = ownerData?.customer?.slug_id;
    total_projects = ownerData?.customer?.total_projects ?? ownerData?.customer?.projects_count;
    total_properties = ownerData?.customer?.total_properties ?? ownerData?.customer?.property_count;
  }
  if (isAgent) {
    customer_name = ownerData?.name;
    profile = ownerData?.profile;
    email = ownerData?.email;
    mobile =
      ownerData?.mobile && ownerData?.mobile !== "null"
        ? ownerData?.mobile
        : null;
    client_address = ownerData?.address;
    added_by = ownerData?.added_by;
    is_verified = ownerData?.is_agent_verified;
    facebook_id = ownerData?.facebook_id;
    instagram_id = ownerData?.instagram_id;
    twitter_id = ownerData?.twitter_id;
    youtube_id = ownerData?.youtube_id;
  }

  if (isAdmin) {
    customer_name = ownerData?.customer_name;
    profile = ownerData?.profile;
    email = ownerData?.email;
    mobile =
      ownerData?.mobile && ownerData?.mobile !== "null"
        ? ownerData?.mobile
        : null;
    client_address = ownerData?.client_address;
    added_by = ownerData?.added_by;
  }

  const showWhatsappButton = webSettings?.show_whatsapp_button === true;
  const whatsappNumber = mobile && mobile !== "null" ? mobile.replace(/[^0-9]/g, "") : "";

  const dispatch = useDispatch();
  const { agentsStories, viewedOverrides, activeAgentId } = useSelector((state) => state.stories);

  // The story module is agent-and-admin-only, so only resolve an id (and fetch stories)
  // for branches where the owner being shown is actually an agent or the admin. Mirrors
  // the same sequential-override precedence as the field assignments above (isAgentOwner,
  // then isProject specifics, then isAgent prop, then isAdmin last/highest priority).
  // Admin listings always use agent_id 0 directly — the fixed sentinel the stories API
  // itself reports for admin-uploaded stories — rather than reading it off `added_by`,
  // so `null` (not 0) is the "not applicable" sentinel throughout: every check below
  // must use `!== null`, never a truthy check, or admin-listed stories would be skipped.
  let agentIdForStories = null;

  if (isAgentOwner) {
    agentIdForStories = ownerData?.added_by ?? null;
  }

  if (isProject) {
    if (isAdminProject) {
      agentIdForStories = 0;
    } else if (customerIsAgent && customerAgentProfile && isAgentOwner) {
      agentIdForStories = ownerData?.customer?.id ?? null;
    } else {
      // Regular (non-agent, non-admin) user owner — not story-eligible.
      agentIdForStories = null;
    }
  }

  if (isAgent) {
    agentIdForStories = ownerData?.id ?? null;
  }

  if (isAdmin) {
    agentIdForStories = 0;
  }

  useEffect(() => {
    if (agentIdForStories === null) return;

    const fetchOwnerStories = async () => {
      try {
        const res = await getStoriesApi({ agent_id: agentIdForStories });
        if (!res.error) {
          dispatch(setStoriesData(res.data));
        }
      } catch (error) {
        console.error("Error fetching owner stories:", error);
      }
    };

    fetchOwnerStories();
  }, [agentIdForStories, dispatch]);

  const ownerStoryGroup = agentsStories?.find((a) => a.agent_id === agentIdForStories);
  const ownerAllStories = ownerStoryGroup
    ? [...(ownerStoryGroup.non_premium_stories || []), ...(ownerStoryGroup.premium_stories || [])]
    : [];
  const hasStories = agentIdForStories !== null && ownerAllStories.length > 0;
  const hasUnseenStory = ownerAllStories.some(
    (story) => !story.is_seen && !viewedOverrides[story.story_id]
  );

  const handleStoryRingClick = () => {
    if (hasStories) {
      dispatch(setActiveAgentId(agentIdForStories));
    }
  };

  return (
    <div className="cardBg newBorder mb-7 overflow-hidden rounded-2xl">
      {/* Header with verified badge */}
      <div className="primaryBg relative p-6 h-16">
        {isAdmin ? (
          <div className="absolute ltr:right-3 top-4 rtl:left-3">
            <div className="flex items-center gap-1 rounded-md bg-white px-2 py-1">
              <VerifiedAgentBadge color={webSettings?.system_color} />
              <span className="leadColor text-sm font-medium">
                {t("verified")}
              </span>
            </div>
          </div>) : null}
        {is_verified && (
          <div className="absolute ltr:right-3 top-4 rtl:left-3">
            <div className="flex items-center gap-1 rounded-md bg-white px-2 py-1">
              {isAgentOwner || isAdmin ? (
                <VerifiedAgentBadge color={webSettings?.system_color} />
              ) : (
                <VerifiedUserBadge color={webSettings?.system_color} />
              )}
              <span className="leadColor text-sm font-medium">
                {t("verified")}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="relative -mt-10 p-2 md:p-3   md:-mt-8 lg:-mt-8 lg:p-5">
        {/* Profile section */}
        <div className="mb-3 flex flex-wrap items-center gap-2 md:gap-4 md:mb-6 xl:flex-row xl:flex-nowrap w-full border-b newBorderColor pb-4">
          <div
            onClick={handleStoryRingClick}
            className={`h-[90px] w-[90px] flex-shrink-0 rounded-full bg-white shadow-lg md:h-[100px] md:w-[100px] xl:h-[120px] xl:w-[120px] ${
              hasStories
                ? `p-[3px] border-[3px] ${hasUnseenStory ? "primaryBorderColor" : "border-gray-200"} cursor-pointer`
                : "border-4 border-white"
            }`}
          >
            <div className="relative h-full w-full overflow-hidden rounded-full">
              <ImageWithPlaceholder
                src={profile || placeholderImage}
                className="h-full w-full object-cover"
                alt="PropertyOwner"
              />
            </div>
          </div>

          <div className="flex flex-col flex-grow justify-center md:justify-normal gap-2 sm:gap-6 w-full">
            <div className="self-center md:self-end">
            </div>
            <div className="flex justify-between md:flex-row  w-full">
              <div className="flex flex-col gap-2">
                <h3 className="blackTextColor flex w-full flex-grow cursor-pointer justify-between text-xl font-bold">
                  {customer_name}
                </h3>
                {email && (
                  <Link
                    href={`mailto:${email}`}
                    className="leadColor flex items-center flex-shrink-0 text-sm"
                  >
                    <MdEmail className="mr-1 flex-shrink-0" />
                    <span className="break-all text-sm">{email}</span>
                  </Link>
                )}
              </div>
              {showChat &&
                userCurrentId !== added_by &&
                // isMessagingSupported &&
                // notificationPermissionGranted && 
                (
                  <button
                    type="button"
                    onClick={handleChat}
                    className="brandBg primaryTextColor flex h-7 w-7 items-center justify-center rounded-lg md:h-8 md:w-8 shrink-0"
                  >
                    <BiMessageSquareDetail className="text-white" />
                  </button>
                )}
            </div>
          </div>
        </div>

        {/* Address section */}
        {client_address && (
          <div
            className={`mb-2 flex items-center gap-2 border-b pb-3 ${mobile && mobile !== "null" ? "border-b-0 pb-0" : ""
              }`}
          >
            <div className="primaryBgLight flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg">
              <IoLocationOutline className="primaryColor h-5 w-5" />
            </div>
            <div className="flex flex-col gap-1">
              <span className="blackTextColor text-sm font-semibold">
                {t("address")}
              </span>
              <p className="leadColor text-sm">{client_address}</p>
            </div>
          </div>
        )}

        {/* Call section */}
        {mobile && mobile !== "null" && (
          <div
            className={`mb-2 flex items-center gap-2 border-b pb-3 newBorderColor ${client_address && client_address !== "null"
              ? "border-b-0 pb-0"
              : ""
              }`}
          >
            <div className="primaryBgLight flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg">
              <BiPhone className="primaryColor h-5 w-5" />
            </div>
            <div className="flex flex-col gap-1">
              <span className="blackTextColor text-sm font-semibold">
                {t("call")}
              </span>
              <Link
                href={`tel:${mobile}`}
                className="leadColor text-sm"
                onClick={() =>
                  trackEvent(
                    'generate_lead',
                    { lead_source: 'tel', item_id: ownerData?.id },
                    { clarity: true }
                  )
                }
              >
                {mobile}
              </Link>
            </div>
          </div>
        )}

        {/* WhatsApp section */}
        {showWhatsappButton && whatsappNumber && (
          <div className="mb-2 flex items-center gap-2 border-b pb-3 newBorderColor">
            <div className="primaryBgLight flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg">
              <FaWhatsapp className="primaryColor h-5 w-5" />
            </div>
            <div className="flex flex-col gap-1">
              <span className="blackTextColor text-sm font-semibold">
                {t("whatsapp")}
              </span>
              <Link
                href={`https://wa.me/${whatsappNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="leadColor text-sm"
              >
                {mobile}
              </Link>
            </div>
          </div>
        )}

        {/* Properties and Projects count */}
        {(total_properties > 0 ||
          total_projects > 0) && (
            <div className="w-full primaryBackgroundBg justify-self-center mb-6 flex flex-wrap sm:w-full items-center justify-center xl:gap-2 xl:w-full rounded-lg ">
              <div className="text-center px-2 py-2 md:py-4">
                <div className="leadColor text-base text-nowrap">
                  {t("properties")} :{" "}
                  <span className="blackTextColor font-semibold">
                    {total_properties}
                  </span>
                </div>
              </div>
              <div className="w-full h-[0.5px] sm:h-6 sm:w-2 border-b sm:border-l-2 sm:border-b-0 newBorderColor"></div>
              <div className="text-center px-2 py-2 md:py-4">
                <div className="leadColor text-base text-nowrap">
                  {t("projects")} :{" "}
                  <span className="blackTextColor font-semibold">
                    {total_projects}
                  </span>
                </div>
              </div>
            </div>
          )}

        {/* Action buttons */}
        {userCurrentId !== added_by && (
          <div className="flex justify-center gap-3">
            {/* Interest button */}
            {!isProject ? (
              interested ? (
                <button
                  className="blackBgColor w-full flex lg:flex-1 items-center justify-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-white xl:px-3 xl:py-2"
                  onClick={handleNotInterested}
                >
                  <IoMdThumbsUp size={20} />
                  {t("interested")}
                </button>
              ) : (
                <button
                  className="blackBgColor w-full flex lg:flex-1 items-center justify-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-white xl:px-3 xl:py-2"
                  onClick={handleInterested}
                >
                  <BiLike size={20} />
                  {t("interest")}
                </button>
              )
            ) : null}

            {/* View Listing button */}
            {isAgentOwner ? (<button
              className="blackTextColor w-full flex lg:flex-1 items-center justify-center gap-2 rounded-lg border border-gray-300 px-2 py-2 text-sm font-medium"
              onClick={(e) =>
                router.push(`/agent-details/${customer_slug_id}/${(isProject && is_admin_listing === true) || added_by === 0 ? `?is_admin=true&lang=${lang}` : `?lang=${lang}`}`)
              }
            >
              {t("viewListing")}
              <FiArrowRight size={16} className="rtl:rotate-180" />
            </button>) : null}
          </div>
        )}
        {((userCurrentId && userCurrentId !== added_by && isAgentOwner && is_appointment_available) || (isAdmin)) && (
          <button
            className="py-2 px-3 rounded-lg primaryBg text-white w-full mt-4 font-medium text-lg text-center"
            aria-label={t("scheduleAnAppointment")}
            onClick={() => setShowAppointmentModal(true)}
          >
            {t("scheduleAnAppointment")}
          </button>
        )}

      </div>

      {hasStories && activeAgentId === agentIdForStories && (
        <StoryViewer onRequireLogin={() => setShowLoginModal(true)} />
      )}

      {showLoginModal && (
        <LoginModal showLogin={showLoginModal} setShowLogin={setShowLoginModal} />
      )}
    </div>
  );
};

export default OwnerDetailsCard;
