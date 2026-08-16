"use client"
import { useMemo } from "react";
import { PhotoSlider } from "react-photo-view";
import { isRTL } from '@/utils/helperFunction';
import 'react-photo-view/dist/react-photo-view.css';

const LightBox = ({ photos, viewerIsOpen, currentImage, setCurrentImage, onClose, title_image, isProject = false }) => {

    const isRtl = isRTL()


    const lightboxPhotos = useMemo(() => {
        const processedPhotos = photos?.map((photo, index) => {
            if (typeof photo === "string") {
                return { key: `photo-${index}`, src: photo, alt: "Image" };
            }

            if (photo?.src) {
                return { key: photo?.id || photo?.src || `photo-${index}`, src: photo.src, alt: photo.alt || "Image" };
            }

            if (isProject) {
                return { key: photo?.id || photo?.name || `photo-${index}`, src: photo?.name, alt: photo.alt || "Project Image" };
            }

            return { key: photo?.id || photo?.image_url || `photo-${index}`, src: photo?.image_url, alt: photo.alt || "Property Image" };
        }) || [];

        const titlePhoto = title_image
            ? [{ key: "title-image", src: title_image, alt: "Title Image" }]
            : [];

        return [...titlePhoto, ...processedPhotos].filter((photo) => Boolean(photo?.src));
    }, [photos, title_image, isProject]);

    return (
        <PhotoSlider
            images={lightboxPhotos}
            index={currentImage}
            visible={viewerIsOpen}
            onClose={onClose}
            onIndexChange={setCurrentImage}
            direction={isRtl ? "rtl" : "ltr"}
            maskOpacity={0.9}
            className="z-50"
        />
    );
};

export default LightBox; 