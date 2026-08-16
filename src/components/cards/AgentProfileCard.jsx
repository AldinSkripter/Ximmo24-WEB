import ImageWithPlaceholder from '../image-with-placeholder/ImageWithPlaceholder';
import { useTranslation } from '../context/TranslationContext';
import { FaFacebookF, FaYoutube } from 'react-icons/fa';
import { AiFillInstagram } from 'react-icons/ai';
import { FaXTwitter, FaLinkedin } from 'react-icons/fa6';
import Link from 'next/link';
import React from 'react';
import { useRouter } from 'next/router';
import { VerifiedAgentBadge } from '@/utils/helperFunction';
import { useSelector } from 'react-redux';

const getIcon = (iconName) => {
    switch (iconName) {
        case 'facebook':  return <FaFacebookF className='w-5 h-5' />;
        case 'instagram': return <AiFillInstagram className='w-5 h-5' />;
        case 'twitter':   return <FaXTwitter className='w-5 h-5' />;
        case 'linkedin':  return <FaLinkedin className='w-5 h-5' />;
        case 'youtube':   return <FaYoutube className='w-5 h-5' />;
        default:          return "";
    }
};

const AgentProfileCard = ({ agent }) => {
    const t = useTranslation();
    const router = useRouter();
    const webSettings = useSelector((state) => state?.WebSetting?.data);

    const socialMediaLinks = [
        { name: "Facebook",  icon: "facebook",  url: agent?.agent_profile?.facebook_id },
        { name: "Instagram", icon: "instagram", url: agent?.agent_profile?.instagram_id },
        { name: "Twitter",   icon: "twitter",   url: agent?.agent_profile?.twitter_id },
        { name: "LinkedIn",  icon: "linkedin",  url: agent?.agent_profile?.linkedin_id },
        { name: "YouTube",   icon: "youtube",   url: agent?.agent_profile?.youtube_id },
    ];
    const hasAtLeastOneSocialLink = socialMediaLinks.some(link => !!link.url);
    const visibleSocialLinks = socialMediaLinks.filter(link => !!link.url);

    const handleCardClick = () => {
        router.push(`/agent-details/${agent.slug_id}${agent?.is_admin ? "?is_admin=true" : ""}`);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleCardClick();
        }
    };

    return (
        <div
            onClick={handleCardClick}
            onKeyDown={handleKeyDown}
            tabIndex={0}
            role="button"
            aria-label={`View ${agent?.name} profile`}
            className="w-full h-full cursor-pointer"
        >
            <div className="w-full md:w-full bg-white group rounded-2xl border cardBorder transition-all duration-300 hover:shadow-md will-change-transform">
                {/* Image section with social icons */}
                <div className="relative px-4 md:px-4 pt-4 w-full h-[250px] overflow-hidden rounded-t-2xl">
                    <ImageWithPlaceholder
                        src={agent?.profile}
                        alt={agent?.name || "Agent Profile"}
                        className="w-full h-full rounded-lg group-hover:brightness-[0.8] object-cover"
                        loading="lazy"
                    />

                    {/* Verified badge */}
                    {agent?.is_agent_verified && (
                        <div className="absolute top-6 left-6 rtl:right-6 bg-white text-black text-sm font-medium rounded-md px-2 py-1 flex w-fit items-center gap-1 z-10">
                            <VerifiedAgentBadge color={webSettings?.system_color} width={18} height={18} />
                            {t("verified")}
                        </div>
                    )}

                    {/* Social Media icons */}
                    {hasAtLeastOneSocialLink && (
                        <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-3 px-4 py-3 translate-y-full group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-500 ease-out z-20">
                            {visibleSocialLinks.map((link, idx) => (
                                <React.Fragment key={link.name}>
                                    <Link
                                        href={link.url}
                                        target="_blank"
                                        onClick={(e) => e.stopPropagation()}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') e.stopPropagation();
                                        }}
                                        rel="noopener noreferrer"
                                        className="text-white hover:text-gray-300 transition-colors duration-200"
                                        aria-label={`${link.name} - ${agent?.name}`}
                                    >
                                        {getIcon(link.icon)}
                                        <span className="sr-only">{link.name}</span>
                                    </Link>
                                    {visibleSocialLinks.length - 1 > idx && (
                                        <span className="w-px h-4 bg-white/40" />
                                    )}
                                </React.Fragment>
                            ))}
                        </div>
                    )}
                </div>

                {/* Agent info */}
                <div className="p-4 lg:p-3">
                    <h3 className="text-lg font-bold text-gray-800 line-clamp-1">{agent?.name}</h3>
                    <p className="mb-4 truncate text-sm text-gray-500">{agent?.email}</p>

                    <div className="flex flex-col items-center justify-evenly gap-2 border border-gray-100 rounded-lg p-3 xl:p-2 primaryBackgroundBg">
                        <div className="text-center flex items-center justify-center">
                            <p className="text-base font-medium leadColor">{t("properties")}:</p>
                            <p className="text-base font-medium leadColor ml-1">{agent?.property_count}</p>
                        </div>
                        <div className="w-full h-[0.5px] newBorder" />
                        <div className="text-center flex items-center justify-center">
                            <p className="text-base font-medium leadColor">{t("projects")}:</p>
                            <p className="text-base font-medium leadColor ml-1">{agent?.projects_count}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AgentProfileCard;
