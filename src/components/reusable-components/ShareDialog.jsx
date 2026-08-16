"use client";
import { toast } from "react-hot-toast";
import { useTranslation } from "../context/TranslationContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  FacebookShareButton,
  TwitterShareButton,
  WhatsappShareButton,
} from "react-share";
import { FaFacebook, FaWhatsapp } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { RiFileCopy2Line } from "react-icons/ri";
import { trackEvent } from "@/utils/analytics";

const ShareDialog = ({
  open,
  onOpenChange,
  title = "",
  subtitle = "",
  pageUrl = "",
  slug = "",
  contentType = "property"
}) => {
  const t = useTranslation();

  let updatedUrl = pageUrl?.replace(slug, encodeURI(slug))

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(pageUrl);
    toast.success(t("linkCopiedSuccessfully"));
    trackEvent('share', {
      method: 'copy_link',
      content_type: contentType,
      item_id: slug,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-[360px] sm:max-w-md rounded-2xl p-0 md:max-w-2xl !z-[10000]"
        overlayClassName="!z-[10000]"
      >
        <DialogHeader className="w-full space-y-2 p-4 md:p-6 text-center">
          <DialogTitle className="text-base font-semibold md:text-2xl">
            {title}
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            {subtitle}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 p-2 md:p-4">
          <div className="flex flex-col gap-4">
            {/* Social Sharing Options */}
            <div className="grid gap-4 md:grid-cols-3">
              <ShareButton
                type="facebook"
                url={updatedUrl}
                label={t("facebook")}
                icon={<FaFacebook size={20} />}
                contentType={contentType}
                itemId={slug}
              />
              <ShareButton
                type="twitter"
                url={updatedUrl}
                label={t("twitter")}
                icon={<FaXTwitter size={20} />}
                contentType={contentType}
                itemId={slug}
              />
              <ShareButton
                type="whatsapp"
                url={updatedUrl}
                label={t("whatsapp")}
                icon={<FaWhatsapp size={20} />}
                contentType={contentType}
                itemId={slug}
              />
            </div>

            {/* Copy Link */}
            <div className="pt-2">
              <div className="mb-2 text-sm font-medium md:text-base">
                {t("pageLink")}
              </div>
              <div className="primaryBackgroundBg cardBorder flex items-center gap-2 rounded p-2 sm:justify-between md:flex-row md:rounded-lg">
                <span className="break-all text-start text-xs md:text-sm">
                  {pageUrl}
                </span>
                <button
                  onClick={handleCopyUrl}
                  className="primaryBg flex items-center justify-center gap-2 rounded-lg p-1 px-2 py-2 text-xs font-medium text-white transition-colors hover:opacity-90 md:w-fit md:text-sm"
                >
                  <RiFileCopy2Line className="h-4 w-4 md:h-5 md:w-5" />
                  <span className="hidden md:block text-nowrap">{t("copyLink")}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Helper component for social media share buttons
const ShareButton = ({ type, url, label, icon, contentType, itemId }) => {
  const ButtonComponent =
    type === "facebook"
      ? FacebookShareButton
      : type === "twitter"
        ? TwitterShareButton
        : type === "whatsapp"
          ? WhatsappShareButton
          : ({ children, ...props }) => <button {...props}>{children}</button>;

  const handleBeforeShare = () => {
    trackEvent('share', {
      method: type,
      content_type: contentType,
      item_id: itemId,
    });
  };

  return (
    <ButtonComponent
      url={url}
      beforeOnClick={handleBeforeShare}
      className={`flex flex-shrink-0 !w-full flex-row items-center justify-center gap-2 rounded-lg border !px-4 !py-2 transition-colors md:rounded-2xl md:!py-4 ${type === "facebook" ? "!blueBgLight !blueTextColor" : type === "twitter" ? "!brandBgLight" : "!greenBgLight !greenTextColor"}`}
    >
      {icon}
      <span className="text-sm font-medium">{label}</span>
    </ButtonComponent>
  );
};

export default ShareDialog;
