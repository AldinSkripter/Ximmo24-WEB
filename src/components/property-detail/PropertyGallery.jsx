import ImageWithPlaceholder from "../image-with-placeholder/ImageWithPlaceholder";
import { useState, useEffect } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";
import { useTranslation } from "../context/TranslationContext";
import { FaArrowRight } from "react-icons/fa";
import { isRTL } from "@/utils/helperFunction";
import { useIsMobile } from "@/hooks/use-mobile";
import ReactPlayer from "react-player";

const PropertyGallery = ({
  galleryPhotos,
  titleImage,
  PlaceholderImage,
  isProject = false,
  onImageClick,
  blurDataURL,
  videoLink,
  videoType,
}) => {
  const t = useTranslation()
  const isRtl = isRTL()
  const isMobile = useIsMobile()
  // Determine if a video exists
  const hasVideo = Boolean(videoLink);
  // Video offset: 1 if video exists (video is slide 0), 0 otherwise
  const videoOffset = hasVideo ? 1 : 0;

  const [activeImage, setActiveImage] = useState(
    titleImage ||
    (galleryPhotos?.[0]
      ? !isProject
        ? galleryPhotos[0]?.image_url
        : galleryPhotos[0]?.name
      : PlaceholderImage),
  );
  // Track whether the active slide is the video
  const [isVideoActive, setIsVideoActive] = useState(hasVideo);

  // Reference to carousel API
  const [api, setApi] = useState(null);

  // Prepare all images for carousel (images only, no video)
  const allImages = [titleImage || PlaceholderImage]
    .concat(
      galleryPhotos?.map((photo) =>
        !isProject ? photo?.image_url : photo?.name,
      ) || [],
    )
    .filter(Boolean);

  // Total slide count includes the video slide if present
  const totalSlides = allImages.length + videoOffset;
  // Calculate total image count (including title image)
  const totalImages = allImages.length;
  const handleLightboxClick = (index) => {
    onImageClick && onImageClick(index);
  };
  // Determine how many thumbnails to show based on total images
  const getThumbnailCount = () => {
    if (totalImages <= 1) return 0;
    if (totalImages === 2) return 1;
    if (totalImages === 3) return 2;
    if (totalImages === 4) return 3;
    return 4; // For 5+ images, show 4 thumbnails
  };

  const thumbnailCount = getThumbnailCount();

  // Handle thumbnail click
  const handleThumbnailClick = (image) => {
    setActiveImage(image);
    setIsVideoActive(false);
    const newIndex = allImages.indexOf(image);
    if (newIndex !== -1 && api) {
      // Offset by videoOffset since video is slide 0 when present
      api.scrollTo(newIndex + videoOffset);
    }
  };

  // Set up selection handler when api changes
  useEffect(() => {
    if (!api) return;

    // Update active image when carousel changes
    const onSelect = () => {
      const selectedIndex = api.selectedScrollSnap();
      if (hasVideo && selectedIndex === 0) {
        // Video slide is active
        setIsVideoActive(true);
      } else {
        setIsVideoActive(false);
        const imageIndex = selectedIndex - videoOffset;
        if (allImages[imageIndex]) {
          setActiveImage(allImages[imageIndex]);
        }
      }
    };

    // Call once to set initial state
    onSelect();

    // Subscribe to select event
    api.on("select", onSelect);

    // Cleanup
    return () => {
      api.off("select", onSelect);
    };
  }, [api, allImages, hasVideo, videoOffset]);

  return (
    <div className="w-full">
      {/* Main image container with Carousel */}
      <div className="relative mb-4 w-full rounded-2xl overflow-hidden">
        <Carousel
          className=""
          setApi={setApi}
          opts={{
            loop: totalSlides > 1 ? true : false,
            direction: isRtl ? "rtl" : "ltr",
            align: "center",
            slidesToScroll: "auto",
          }}
        >
          <CarouselContent className={`w-full -ml-2`}>
            {/* Video slide (first) */}
            {hasVideo && (
              <CarouselItem className={`basis-full ${isMobile ? "flex items-center" : ""}`}>
                <div className="h-full w-full rounded-2xl overflow-hidden">
                  <ReactPlayer
                    url={videoLink}
                    playing={isVideoActive}
                    muted={true}
                    loop={true}
                    controls={true}
                    width="100%"
                    height="100%"
                    className="!w-full !h-[176px] sm:!h-[400px] lg:!h-[800px] rounded-2xl"
                  />
                </div>
              </CarouselItem>
            )}
            {/* Image slides */}
            {allImages.map((image, index) => (
              <CarouselItem key={index} className={`basis-full ${isMobile ? "flex items-center" : ""}`}>
                <div
                  className="h-full w-full cursor-pointer rounded-2xl"
                  onClick={() => handleLightboxClick(index)}
                >
                  <ImageWithPlaceholder
                    src={image}
                    blurDataURL={blurDataURL}
                    className="w-full h-[176px] sm:h-[400px] lg:h-[800px] rounded-2xl object-cover"
                    alt={`Property view ${index}`}
                    loading="lazy"
                  />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          {totalSlides > 1 ? (
            <>
              <CarouselPrevious className="left-2 z-10 h-12 w-8 rounded-none bg-white/80 hover:bg-white sm:h-16 sm:w-10" />
              <CarouselNext className="right-2 z-10 h-12 w-8 rounded-none bg-white/80 hover:bg-white sm:h-16 sm:w-10" />
            </>
          ) : null}
        </Carousel>
      </div>

      {/* Thumbnails row - Desktop only */}
      {!isMobile && thumbnailCount > 0 && (
        <div className="no-scrollbar relative bottom-14 md:bottom-[60px] left-0 right-0 z-10 mx-auto justify-center gap-4 flex">
          {/* Title image thumbnail */}
          <div
            className={`h-[60px] md:h-[100px] md:min-w-[110px] lg:min-w-[150px] cursor-pointer rounded-xl ring-4 ring-white ring-offset-2 transition-all ${activeImage === titleImage && !isVideoActive ? "ring-4 ring-white ring-offset-2" : ""}`}
            onClick={() => {
              handleLightboxClick(0);
            }}
          >
            <ImageWithPlaceholder
              src={titleImage || PlaceholderImage}
              className="w-[150px] rounded-xl object-cover h-[60px] md:h-[100px] md:w-[110px] lg:min-w-[150px]"
              alt="Property view"
              loading="lazy"
            />
          </div>

          {/* Gallery images thumbnails */}
          {allImages.slice(1, thumbnailCount + 1).map((image, index) => {
            const actualIndex = index + 1;
            const isLastThumbnail = thumbnailCount === 4 && index === 3 && totalImages > 5;

            return (
              <div
                key={actualIndex}
                className={`h-[60px] w-[150px] md:h-[100px] md:w-[110px] lg:w-[150px] cursor-pointer rounded-xl ring-4 ring-white ring-offset-2 transition-all relative ${activeImage === image ? "ring-4 ring-white ring-offset-2" : ""}`}
                onClick={() => {
                  if (isLastThumbnail) {
                    handleLightboxClick(totalImages - 1); // Open lightbox to last image
                  } else {
                    handleLightboxClick(actualIndex);
                  }
                }}
              >
                <ImageWithPlaceholder
                  src={image}
                  className="w-[150px] rounded-xl object-cover h-[60px] md:h-[100px] md:w-[110px] lg:w-[150px]"
                  alt={`Property view ${actualIndex + 1}`}
                  loading="lazy"
                />

                {isLastThumbnail && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-xl">
                    <span className="brandColor rounded-lg py-2 px-4 bg-white font-medium flex items-center gap-2">
                      <span className="hidden md:block">{t("seeAll")}</span>
                      <FaArrowRight className={`${isRtl ? "rotate-180" : ""}`} />
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Mobile thumbnails - Hidden in mobile view */}
      {/* Thumbnails are now hidden in mobile view as requested */}
    </div>
  );
};

export default PropertyGallery;
