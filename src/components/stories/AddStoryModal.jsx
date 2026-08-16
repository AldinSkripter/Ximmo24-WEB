"use client";

import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslation } from "../context/TranslationContext";
import { getAddedPropertiesApi, getUserProjectsApi, uploadStoryApi } from "@/api/apiRoutes";
import toast from "react-hot-toast";
import {
  IoChevronBack,
  IoClose,
  IoCamera, IoVideocam,
  IoImage, IoCameraReverse,
  IoHomeOutline,
  IoBusinessOutline,
  IoSearchOutline,
  IoAdd
} from "react-icons/io5";
import { HiSparkles } from "react-icons/hi2";
import { premiumIcon } from "@/assets/svg";
import ImageWithPlaceholder from "../image-with-placeholder/ImageWithPlaceholder";
import ButtonLoader from "../ui/loaders/ButtonLoader";
import { useSelector } from "react-redux";

const getSupportedVideoMimeType = () => {
  if (typeof window === "undefined" || !window.MediaRecorder) return null;

  const candidateTypes = [
    "video/mp4;codecs=avc1.424028,mp4a.40.2",
    "video/mp4;codecs=avc1",
    "video/mp4",
    "video/quicktime",
    "video/webm;codecs=vp9",
    "video/webm;codecs=vp8",
    "video/webm"
  ];

  for (const mimeType of candidateTypes) {
    if (MediaRecorder.isTypeSupported(mimeType)) {
      return mimeType;
    }
  }
  return null;
};

const AddStoryModal = ({ isOpen, onClose, onSuccess }) => {
  const t = useTranslation();
  const webSettings = useSelector((state) => state.WebSetting?.data);
  const maxDuration = Number(webSettings?.story_max_duration);
  const MAX_VIDEO_SIZE_MB = Number(webSettings?.story_video_max_size);
  const MAX_VIDEO_SIZE_BYTES = MAX_VIDEO_SIZE_MB * 1024 * 1024;
  const videoUploadLimitsText = t("videoUploadLimitsInfo")
    .replace("{{size}}", MAX_VIDEO_SIZE_MB)
    .replace("{{duration}}", Number.isFinite(maxDuration) && maxDuration > 0 ? maxDuration : "-");
  const [step, setStep] = useState(1); // Steps: 1 (Select Type), 2 (Select Entity), 3 (Upload/Record Options), 4 (Trimmer), 5 (Confirm Preview)
  const [entityType, setEntityType] = useState(null); // 'property' or 'project'

  // Step 2 state
  const LISTINGS_LIMIT = 10;
  const [listings, setListings] = useState([]);
  const [loadingListings, setLoadingListings] = useState(false);
  const [loadingMoreListings, setLoadingMoreListings] = useState(false);
  const [listingsOffset, setListingsOffset] = useState(0);
  const [listingsTotal, setListingsTotal] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEntity, setSelectedEntity] = useState(null);

  // Step 3 state
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState("");
  const [mediaType, setMediaType] = useState(""); // 'video' or 'image'
  const fileInputRef = useRef(null);

  // Webcam recorder state
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const webcamVideoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  const webcamStreamRef = useRef(null);
  const [facingMode, setFacingMode] = useState("user"); // 'user' (front) or 'environment' (back)
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);

  // Listing gallery picker state
  const [isGalleryPickerOpen, setIsGalleryPickerOpen] = useState(false);
  const [galleryImages, setGalleryImages] = useState([]);
  const [loadingGalleryImages, setLoadingGalleryImages] = useState(false);
  const [selectingGalleryImage, setSelectingGalleryImage] = useState(false);

  // Step 4 (Video Trimmer) state
  const trimmerVideoRef = useRef(null);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(maxDuration);
  const [videoDuration, setVideoDuration] = useState(0);
  const [timelineThumbnails, setTimelineThumbnails] = useState([]);
  const [isGeneratingThumbs, setIsGeneratingThumbs] = useState(false);

  // Custom drag handles ref & state
  const trackRef = useRef(null);
  const [isDraggingLeft, setIsDraggingLeft] = useState(false);
  const [isDraggingRight, setIsDraggingRight] = useState(false);

  // Custom Thumbnail Upload state
  const [customThumbnailFile, setCustomThumbnailFile] = useState(null);
  const [customThumbnailPreview, setCustomThumbnailPreview] = useState("");
  const thumbnailInputRef = useRef(null);

  // Step 5 Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const checkMultipleCameras = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter((device) => device.kind === "videoinput");
        setHasMultipleCameras(videoDevices.length > 1);
      }
    } catch (err) {
      console.warn("Error enumerating devices:", err);
    }
  };

  const toggleCamera = async () => {
    if (isRecording) return;
    const newFacingMode = facingMode === "user" ? "environment" : "user";
    setFacingMode(newFacingMode);

    if (webcamStreamRef.current) {
      webcamStreamRef.current.getTracks().forEach((track) => track.stop());
      webcamStreamRef.current = null;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: newFacingMode, width: 1280, height: 720 },
        audio: true,
      });
      webcamStreamRef.current = stream;
      if (webcamVideoRef.current) {
        webcamVideoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error("Error switching camera:", error);
      toast.error(t("cameraNotSupported"));
    }
  };

  // Fetch listings (Properties or Projects) when entityType is chosen
  useEffect(() => {
    if (!entityType || step !== 2) return;

    const fetchListings = async () => {
      setLoadingListings(true);
      try {
        const fetcher = entityType === "property" ? getAddedPropertiesApi : getUserProjectsApi;
        const res = await fetcher({ limit: LISTINGS_LIMIT.toString(), offset: "0", status: 1 });
        if (res && !res?.error) {
          setListings(res?.data || []);
          setListingsTotal(res?.total || 0);
          setListingsOffset(0);
        } else {
          setListings([]);
          setListingsTotal(0);
        }
      } catch (error) {
        console.error("Error fetching listings:", error);
        toast.error(t("somethingWentWrong"));
      } finally {
        setLoadingListings(false);
      }
    };

    fetchListings();
  }, [entityType, step]);

  const handleLoadMoreListings = async () => {
    const nextOffset = listingsOffset + LISTINGS_LIMIT;
    setLoadingMoreListings(true);
    try {
      const fetcher = entityType === "property" ? getAddedPropertiesApi : getUserProjectsApi;
      const res = await fetcher({ limit: LISTINGS_LIMIT.toString(), offset: nextOffset.toString(), status: 1 });
      if (res && !res?.error) {
        setListings((prev) => [...prev, ...(res?.data || [])]);
        setListingsTotal(res?.total || 0);
        setListingsOffset(nextOffset);
      }
    } catch (error) {
      console.error("Error fetching more listings:", error);
      toast.error(t("somethingWentWrong"));
    } finally {
      setLoadingMoreListings(false);
    }
  };

  // Clean up webcam stream, timers and previews
  useEffect(() => {
    return () => {
      stopWebcamStream();
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (mediaPreview) URL.revokeObjectURL(mediaPreview);
    };
  }, [mediaPreview]);

  const stopWebcamStream = () => {
    if (webcamStreamRef.current) {
      webcamStreamRef.current.getTracks().forEach((track) => track.stop());
      webcamStreamRef.current = null;
    }
    setIsWebcamActive(false);
    setIsRecording(false);
    setFacingMode("user"); // Reset facing mode
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
  };

  // Start in-app webcam capture
  const handleStartWebcam = async () => {
    const triggerNativeFallback = () => {
      if (fileInputRef.current) {
        fileInputRef.current.setAttribute("accept", "video/*");
        fileInputRef.current.setAttribute("capture", "user");
        fileInputRef.current.dataset.expectedType = "video";
        fileInputRef.current.click();
      }
    };

    if (typeof window === "undefined" || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast.error(t("cameraNotSupported"));
      triggerNativeFallback();
      return;
    }

    const preferredMime = getSupportedVideoMimeType();
    const isMp4Supported = preferredMime && (
      preferredMime.includes("mp4") || preferredMime.includes("quicktime")
    );

    const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);

    if (!isMp4Supported) {
      if (isMobile) {
        toast.error(t("browserNoMp4SwitchCamera"));
        triggerNativeFallback();
        return;
      } else {
        toast.error(t("browserNoMp4Warning"));
      }
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facingMode, width: 1280, height: 720 },
        audio: true,
      });
      webcamStreamRef.current = stream;
      setIsWebcamActive(true);
      await checkMultipleCameras();
      setTimeout(() => {
        if (webcamVideoRef.current) {
          webcamVideoRef.current.srcObject = stream;
        }
      }, 200);
    } catch (error) {
      console.warn("WebRTC webcam error:", error);
      if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
        toast.error(t("cameraPermissionDenied"));
      } else {
        toast.error(t("cameraNotSupported"));
      }
      triggerNativeFallback();
    }
  };

  // Start Recording
  const handleStartRecording = () => {
    if (!webcamStreamRef.current) return;
    recordedChunksRef.current = [];

    const mimeType = getSupportedVideoMimeType() || "video/webm";
    const options = { mimeType };

    try {
      const recorder = new MediaRecorder(webcamStreamRef.current, options);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const actualMime = recorder.mimeType || mimeType;
        const isWebM = actualMime.includes("webm");
        const isQuickTime = actualMime.includes("quicktime");

        let resolvedMime = "video/mp4";
        let extension = "mp4";

        if (isWebM) {
          resolvedMime = "video/webm";
          extension = "webm";
        } else if (isQuickTime) {
          resolvedMime = "video/quicktime";
          extension = "mov";
        }

        const blob = new Blob(recordedChunksRef.current, { type: resolvedMime });
        const file = new File([blob], `recorded-story-${Date.now()}.${extension}`, { type: resolvedMime });

        if (file.size > MAX_VIDEO_SIZE_BYTES) {
          toast.error(t("videoSizeTooLarge").replace("{{size}}", MAX_VIDEO_SIZE_MB));
          return;
        }

        setupMedia(file, "video");
      };

      recorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev >= maxDuration - 1) {
            // Stop at the configured max duration
            handleStopRecording();
            return maxDuration;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (e) {
      console.error("MediaRecorder start failed:", e);
      toast.error(t("cameraNotSupported"));
      stopWebcamStream();
    }
  };

  // Stop Recording
  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      clearInterval(recordingTimerRef.current);
      stopWebcamStream();
    }
  };

  // Fetch title image + gallery images of the selected listing
  const handleOpenGalleryPicker = () => {
    if (!selectedEntity) return;
    setIsGalleryPickerOpen(true);
    setLoadingGalleryImages(true);
    setGalleryImages([]);

    const images = [];

    if (entityType === "property") {
      if (selectedEntity?.title_image) {
        images.push({ url: selectedEntity.title_image, label: t("titleImage"), isTitleImage: true });
      }
      (selectedEntity?.gallery || []).forEach((item) => {
        if (item?.image_url) {
          images.push({ url: item.image_url, label: t("galleryImage"), isTitleImage: false });
        }
      });
    } else {
      if (selectedEntity?.image) {
        images.push({ url: selectedEntity.image, label: t("titleImage"), isTitleImage: true });
      }
      (selectedEntity?.gallary_images || []).forEach((item) => {
        const url = typeof item === "string" ? item : item?.name;
        if (url) {
          images.push({ url, label: t("galleryImage"), isTitleImage: false });
        }
      });
    }

    setGalleryImages(images);
    setLoadingGalleryImages(false);
  };

  // Convert a selected listing image URL into a File and use it as the story image
  const handleSelectGalleryImage = async (image) => {
    if (selectingGalleryImage) return;
    setSelectingGalleryImage(true);
    try {
      const response = await fetch(image.url);
      if (!response.ok) throw new Error("Failed to fetch image");
      const blob = await response.blob();
      const extFromUrl = image.url.split("?")[0].split(".").pop();
      const extension = extFromUrl && extFromUrl.length <= 5 ? extFromUrl : "jpg";
      const file = new File([blob], `story-image-${Date.now()}.${extension}`, {
        type: blob.type || "image/jpeg",
      });
      setIsGalleryPickerOpen(false);
      setGalleryImages([]);
      setupMedia(file, "image");
    } catch (error) {
      console.error("Error selecting listing image:", error);
      toast.error(t("failedToLoadImage"));
    } finally {
      setSelectingGalleryImage(false);
    }
  };

  // Handle uploaded/recorded file selection
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const type = file.type.startsWith("video/") ? "video" : "image";
    const expectedType = e.target.dataset.expectedType;

    if (expectedType && type !== expectedType) {
      toast.error(expectedType === "video" ? t("selectVideoFileOnly") : t("selectImageFileOnly"));
      e.target.value = "";
      return;
    }

    if (type === "video" && file.size > MAX_VIDEO_SIZE_BYTES) {
      toast.error(t("videoSizeTooLarge").replace("{{size}}", MAX_VIDEO_SIZE_MB));
      e.target.value = "";
      return;
    }

    setupMedia(file, type);
    e.target.value = ""; // Reset input value so selecting the same file again triggers onChange
  };

  // Handle custom thumbnail selection
  const handleThumbnailChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCustomThumbnailFile(file);
    const objectUrl = URL.createObjectURL(file);
    setCustomThumbnailPreview(objectUrl);
    e.target.value = ""; // Reset value for consecutive uploads
  };

  const setupMedia = (file, type) => {
    setMediaFile(file);
    setMediaType(type);
    const objectUrl = URL.createObjectURL(file);
    setMediaPreview(objectUrl);

    if (type === "video") {
      setStep(4); // Go to Video Trimmer
    } else {
      setStep(5); // Go to Confirm/Preview
    }
  };

  // Video Trimmer: generate timeline thumbnails in browser on offscreen video
  const generateThumbnails = async (videoUrl, duration) => {
    setIsGeneratingThumbs(true);
    const thumbs = [];
    const video = document.createElement("video");
    video.src = videoUrl;
    video.crossOrigin = "anonymous";
    video.muted = true;
    video.playsInline = true;

    await new Promise((resolve) => {
      video.onloadedmetadata = () => {
        resolve();
      };
    });

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = 160;
    canvas.height = 90;

    const count = 5;
    for (let i = 0; i < count; i++) {
      const time = (i / (count - 1)) * duration;
      video.currentTime = time;

      await new Promise((resolve) => {
        video.onseeked = () => {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          thumbs.push(canvas.toDataURL("image/jpeg"));
          resolve();
        };
      });
    }

    setTimelineThumbnails(thumbs);
    setIsGeneratingThumbs(false);
  };

  // Trimmer load metadata
  const handleTrimmerVideoLoad = (e) => {
    const duration = e.target.duration;
    setVideoDuration(duration);
    setTrimStart(0);
    setTrimEnd(Math.min(duration, maxDuration));
    generateThumbnails(mediaPreview, duration);
  };

  // Constrain video playing within loop range [trimStart, trimEnd]
  useEffect(() => {
    if (step !== 4 || !trimmerVideoRef.current) return;
    const video = trimmerVideoRef.current;

    const handleTimeUpdate = () => {
      if (video.currentTime < trimStart || video.currentTime > trimEnd) {
        video.currentTime = trimStart;
      }
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
    };
  }, [step, trimStart, trimEnd]);

  // Handle custom range handle dragging
  useEffect(() => {
    if (!isDraggingLeft && !isDraggingRight) return;

    const handleMove = (clientX) => {
      if (!trackRef.current || !videoDuration) return;
      const rect = trackRef.current.getBoundingClientRect();
      const offset = parseFloat(trackRef.current.dataset.dragOffset) || 0;
      const x = clientX - offset - rect.left;
      const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
      const time = (pct / 100) * videoDuration;

      if (isDraggingLeft) {
        if (time < trimEnd) {
          const newStart = Math.max(0, Math.min(time, trimEnd - 0.5));
          if (trimEnd - newStart > maxDuration) {
            setTrimStart(trimEnd - maxDuration);
          } else {
            setTrimStart(newStart);
          }
          if (trimmerVideoRef.current) trimmerVideoRef.current.currentTime = newStart;
        }
      } else if (isDraggingRight) {
        if (time > trimStart) {
          const newEnd = Math.min(videoDuration, Math.max(time, trimStart + 0.5));
          if (newEnd - trimStart > maxDuration) {
            setTrimEnd(trimStart + maxDuration);
          } else {
            setTrimEnd(newEnd);
          }
        }
      }
    };

    const handleMouseMove = (e) => handleMove(e.clientX);
    const handleTouchMove = (e) => {
      if (e.touches && e.touches[0]) {
        handleMove(e.touches[0].clientX);
      }
    };

    const handleEnd = () => {
      setIsDraggingLeft(false);
      setIsDraggingRight(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleEnd);
    window.addEventListener("touchmove", handleTouchMove);
    window.addEventListener("touchend", handleEnd);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleEnd);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleEnd);
    };
  }, [isDraggingLeft, isDraggingRight, videoDuration, trimStart, trimEnd, maxDuration]);



  // Perform Final Story Upload
  const handleUploadStory = async () => {
    setIsUploading(true);
    try {
      let finalMedia = mediaFile;
      let finalThumbnail = customThumbnailFile; // Use custom uploaded thumbnail if present
      const duration = mediaType === "video" ? Math.floor(trimEnd - trimStart) : 5;

      // Call Upload Story API
      const res = await uploadStoryApi({
        media: finalMedia,
        media_type: mediaType,
        entity_type: entityType,
        entity_id: selectedEntity.id || selectedEntity.property_id || selectedEntity.project_id,
        thumbnail: finalThumbnail,
        duration_seconds: duration,
      });

      if (res && !res.error) {
        toast.success(t("storyUploadedSuccess"));
        onSuccess?.();
        onClose();
      } else {
        toast.error(res?.message || t("storyUploadFailed"));
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(error?.message);
    } finally {
      setIsUploading(false);
    }
  };

  // Filter listings based on search
  const filteredListings = listings.filter((item) => {
    const title = item.title || item.name || "";
    return title.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const startPercent = videoDuration ? (trimStart / videoDuration) * 100 : 0;
  const endPercent = videoDuration ? (trimEnd / videoDuration) * 100 : 100;

  return (
    <Dialog open={isOpen} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="max-w-md w-11/12 md:w-full rounded-2xl p-0 bg-white overflow-hidden shadow-2xl flex flex-col !gap-0 max-h-[90vh] [&>button]:hidden">

        {/* Header Block */}
        <DialogHeader className="p-4 border-b flex flex-row items-center justify-between bg-gray-50 shrink-0">
          <div className="flex items-center gap-2">
            {(step > 1 || isGalleryPickerOpen) && (
              <button
                onClick={() => {
                  if (isGalleryPickerOpen) {
                    setIsGalleryPickerOpen(false);
                    setGalleryImages([]);
                  } else if (step === 5 && mediaType === "image") {
                    // Image flow skips the video trimmer step, so go back to it too
                    setStep(3);
                  } else {
                    setStep(step - 1);
                  }
                }}
                className="p-1 hover:bg-gray-200 rounded-full transition-colors"
              >
                <IoChevronBack className="w-5 h-5 text-gray-700 rtl:rotate-180" />
              </button>
            )}
            <DialogTitle className="text-lg font-bold text-gray-800">
              {step === 1 && t("addStory")}
              {step === 2 && (entityType === "property" ? t("selectProperty") : t("selectProject"))}
              {step === 3 && (isGalleryPickerOpen ? t("pickFromListingImages") : t("recordOrUploadStory"))}
              {step === 4 && t("trimStory")}
              {step === 5 && t("confirmYourUpload")}
            </DialogTitle>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-10 h-10 bg-white newBorder rounded-lg cursor-pointer hover:bg-gray-50 transition-colors shrink-0"
            aria-label="Close modal"
            type="button"
          >
            <IoClose className="w-6 h-6 text-gray-600" aria-hidden="true" />
          </button>
        </DialogHeader>

        {/* Step Body */}
        <div className={`flex-1 overflow-y-auto p-3 md:p-4 flex flex-col min-h-0 ${step === 4 ? "justify-start" : "justify-start md:justify-center"}`}>

          {/* Step 1: Select Type */}
          {step === 1 && (
            <div className="space-y-4 sm:space-y-6 text-center w-full py-2 sm:py-4 select-none">
              <div className="space-y-2">
                <HiSparkles className="w-8 h-8 sm:w-10 sm:h-10 primaryColor mx-auto animate-bounce mb-1" />
                <h3 className="text-lg sm:text-xl font-bold text-gray-800 tracking-tight">
                  {t("whatIsStoryAssociatedWith")}
                </h3>
                <p className="text-xs text-gray-400 max-w-xs mx-auto">
                  {t("selectPublishDestination")}
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:gap-4 w-full max-w-sm mx-auto py-1.5 sm:py-2">
                <button
                  onClick={() => {
                    setEntityType("property");
                    setStep(2);
                  }}
                  type="button"
                  className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-2xl bg-white border newBorderColor text-left transition-all hover:primaryBorderColor hover:primaryBgLight hover:primaryColor hover:shadow-md hover:scale-105 active:scale-95 group"
                >
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl primaryBgLight12 flex items-center justify-center text-gray-600 group-hover:primaryBg group-hover:text-white transition-all duration-300 shrink-0">
                    <IoHomeOutline className="w-5 h-5 sm:w-6 sm:h-6 transition-transform group-hover:scale-110" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-gray-800 text-xs sm:text-sm group-hover:primaryColor transition-colors">
                      {t("properties")}
                    </h4>
                    <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
                      {t("propertiesDescription")}
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setEntityType("project");
                    setStep(2);
                  }}
                  type="button"
                  className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-2xl bg-white border newBorderColor text-left transition-all hover:primaryBorderColor hover:shadow-md hover:scale-105 active:scale-95 group"
                >
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl primaryBgLight12 flex items-center justify-center text-gray-600 group-hover:primaryBg group-hover:text-white transition-all duration-300 shrink-0">
                    <IoBusinessOutline className="w-5 h-5 sm:w-6 sm:h-6 transition-transform group-hover:scale-110" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-gray-800 text-xs sm:text-sm group-hover:primaryColor transition-colors">
                      {t("projects")}
                    </h4>
                    <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
                      {t("projectsDescription")}
                    </p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Listing Picker */}
          {step === 2 && (
            <div className="space-y-3 sm:space-y-4 flex flex-col h-full w-full">
              <div className="relative shrink-0">
                <IoSearchOutline className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t("searchListing")}
                  className="pl-8 sm:pl-9 bg-gray-50 rounded-xl text-xs sm:text-sm"
                />
              </div>

              <div className="flex-1 overflow-y-auto min-h-56 max-h-80 space-y-2 pr-1">
                {loadingListings ? (
                  <div className="flex items-center justify-center py-12">
                    <ButtonLoader />
                  </div>
                ) : filteredListings.length === 0 ? (
                  <p className="text-center py-12 text-gray-400 text-xs sm:text-sm">
                    {t("noListingFound")}
                  </p>
                ) : (
                  <>
                    {filteredListings.map((item) => {
                      // Properties expose `property_type` (sell/rent); projects expose
                      // `type` (upcoming/under_construction).
                      const listingType = (entityType === "property" ? item?.property_type : item?.type)?.toLowerCase();
                      const listingTypeLabel = entityType === "property"
                        ? t(listingType)
                        : t(listingType === "under_construction" ? "underConstruction" : "upcoming");
                      // Properties use the sell/rent color split; projects (upcoming/under
                      // construction) always use the primary theme color, matching ProjectInfoBanner.
                      const listingTypeBadgeClass = entityType === "property"
                        ? (listingType === "sell" ? "primarySellBg primarySellText" : "primaryRentBg primaryRentText")
                        : "primaryBg primaryTextColor";

                      return (
                        <div
                          key={item?.id || item?.property_id || item?.project_id}
                          onClick={() => {
                            setSelectedEntity(item);
                            setIsGalleryPickerOpen(false);
                            setGalleryImages([]);
                            setStep(3);
                          }}
                          className="flex items-center gap-2 sm:gap-3 p-2 sm:p-2.5 rounded-xl border border-gray-100 hover:primaryBorderColor hover:primaryBgLight cursor-pointer transition-all"
                        >
                          <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-lg overflow-hidden shrink-0 bg-gray-100">
                            <ImageWithPlaceholder
                              src={item?.title_image || item?.image || item?.meta_title_image}
                              alt={item?.title || item?.name}
                              className="w-full h-full object-cover"
                            />
                            {item?.is_premium && (
                              <span className="absolute top-0.5 left-0.5 flex items-center justify-center rounded-full premiumBgColor p-0.5">
                                <span className="w-3 h-3 sm:w-3.5 sm:h-3.5">{premiumIcon()}</span>
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-800 text-xs sm:text-sm truncate">
                              {item?.translated_title || item?.title || item?.name}
                            </h4>
                            <p className="text-xs text-gray-400 truncate">
                              {item?.category?.category || item?.address || item?.city || "Listing"}
                            </p>
                          </div>
                          {listingType && (
                            <span
                              className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] sm:text-xs font-semibold whitespace-nowrap ${listingTypeBadgeClass}`}
                            >
                              {listingTypeLabel}
                            </span>
                          )}
                        </div>
                      );
                    })}

                    {!searchQuery && listings.length < listingsTotal && (
                      <div className="flex justify-center pt-2">
                        <button
                          type="button"
                          onClick={handleLoadMoreListings}
                          disabled={loadingMoreListings}
                          className="text-sm font-bold primaryColor hover:underline disabled:opacity-60 flex items-center gap-1.5"
                        >
                          {loadingMoreListings ? <ButtonLoader /> : t("loadMore")}
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Listing Gallery Picker */}
          {step === 3 && isGalleryPickerOpen && (
            <div className="space-y-4 w-full">
              {loadingGalleryImages ? (
                <div className="flex items-center justify-center py-16">
                  <ButtonLoader />
                </div>
              ) : galleryImages.length === 0 ? (
                <p className="text-center py-16 text-gray-400 text-xs sm:text-sm">
                  {t("noImagesFound")}
                </p>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-3 max-h-96 overflow-y-auto pr-1">
                  {galleryImages.map((image, index) => (
                    <button
                      key={`${image.url}-${index}`}
                      type="button"
                      disabled={selectingGalleryImage}
                      onClick={() => handleSelectGalleryImage(image)}
                      className="relative aspect-square rounded-xl overflow-hidden border newBorderColor hover:primaryBorderColor transition-all disabled:opacity-60"
                    >
                      <ImageWithPlaceholder
                        src={image.url}
                        alt={image.label}
                        className="w-full h-full"
                      />
                      {image.isTitleImage && (
                        <span className="absolute bottom-1 left-1 right-1 bg-black/60 text-white text-[10px] font-semibold rounded-md px-1.5 py-0.5 truncate text-center">
                          {image.label}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Record / Upload Options */}
          {step === 3 && !isGalleryPickerOpen && (
            <div className="space-y-4 sm:space-y-6 w-full flex flex-col justify-between h-full">
              {!isWebcamActive ? (
                <div className="text-center py-4 sm:py-6 space-y-3 sm:space-y-4">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full primaryBgLight12 flex items-center justify-center mx-auto primaryColor">
                    <IoVideocam className="w-8 h-8 sm:w-10 sm:h-10" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-gray-800">
                    {t("recordOrUploadStory")}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-400 max-w-xs mx-auto">
                    {t("recordOrUploadStoryDescription")}
                  </p>

                  <div className="grid grid-cols-3 gap-1.5 sm:gap-2 pt-3 sm:pt-4">
                    <button
                      onClick={handleStartWebcam}
                      className="flex flex-col items-center gap-1.5 sm:gap-2 p-2.5 sm:p-3 border rounded-xl hover:primaryBorderColor hover:primaryBgLight group"
                    >
                      <IoCamera className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500 group-hover:primaryColor" />
                      <span className="text-xs font-semibold text-gray-600">{t("record")}</span>
                    </button>
                    <button
                      onClick={() => {
                        if (fileInputRef.current) {
                          fileInputRef.current.removeAttribute("capture");
                          fileInputRef.current.setAttribute("accept", "video/*");
                          fileInputRef.current.dataset.expectedType = "video";
                          fileInputRef.current.click();
                        }
                      }}
                      className="flex flex-col items-center gap-1.5 sm:gap-2 p-2.5 sm:p-3 border rounded-xl hover:primaryBorderColor hover:primaryBgLight group"
                    >
                      <IoVideocam className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500 group-hover:primaryColor" />
                      <span className="text-xs font-semibold text-gray-600">{t("uploadVideo")}</span>
                    </button>
                    <button
                      onClick={() => {
                        if (fileInputRef.current) {
                          fileInputRef.current.removeAttribute("capture");
                          fileInputRef.current.setAttribute("accept", "image/*");
                          fileInputRef.current.dataset.expectedType = "image";
                          fileInputRef.current.click();
                        }
                      }}
                      className="flex flex-col items-center gap-1.5 sm:gap-2 p-2.5 sm:p-3 border rounded-xl hover:primaryBorderColor hover:primaryBgLight group"
                    >
                      <IoImage className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500 group-hover:primaryColor" />
                      <span className="text-xs font-semibold text-gray-600">{t("uploadImage")}</span>
                    </button>
                  </div>

                  <p className="text-xs text-gray-400 pt-2">
                    {videoUploadLimitsText}
                  </p>
                </div>
              ) : (
                /* Webcam overlay stream UI */
                <div
                  style={{ aspectRatio: "9/16" }}
                  className="relative rounded-2xl overflow-hidden bg-black w-full max-w-xs mx-auto flex flex-col items-center justify-between p-4 shadow-inner"
                >
                  <video
                    ref={webcamVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute top-4 right-4 bg-black/60 text-white text-xs px-2.5 py-1 rounded-full font-bold z-20">
                    {recordingSeconds}s / {maxDuration}s
                  </div>

                  <div className="absolute bottom-6 flex items-center justify-center gap-4 w-full z-20">
                    {hasMultipleCameras && !isRecording && (
                      <button
                        onClick={toggleCamera}
                        className="p-3 bg-white/20 text-white rounded-full hover:bg-white/40 transition-colors"
                        type="button"
                      >
                        <IoCameraReverse className="w-5 h-5" />
                      </button>
                    )}
                    {!isRecording ? (
                      <button
                        onClick={handleStartRecording}
                        className="w-16 h-16 rounded-full bg-red-600 border-4 border-white flex items-center justify-center animate-pulse"
                      />
                    ) : (
                      <button
                        onClick={handleStopRecording}
                        className="w-16 h-16 rounded-full bg-black border-4 border-white flex items-center justify-center"
                      >
                        <div className="w-6 h-6 bg-red-600 rounded-sm" />
                      </button>
                    )}
                    <button
                      onClick={stopWebcamStream}
                      className="p-3 bg-white/20 text-white rounded-full hover:bg-white/40"
                    >
                      <IoClose className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}

              {/* Selected Entity Card */}
              {selectedEntity && (
                <div className="p-2 sm:p-2.5 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-between gap-2 sm:gap-3 shrink-0 mt-4 w-full select-none">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg overflow-hidden shrink-0 bg-gray-100">
                      <ImageWithPlaceholder
                        src={selectedEntity?.title_image || selectedEntity?.image}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs primaryColor font-bold uppercase tracking-wider block leading-none mb-0.5 sm:mb-1">
                        {entityType}
                      </span>
                      <h4 className="font-semibold text-gray-800 text-xs truncate max-w-24 xs:max-w-32 sm:max-w-40">
                        {selectedEntity?.title || selectedEntity?.name}
                      </h4>
                    </div>
                  </div>
                  <button
                    onClick={handleOpenGalleryPicker}
                    className="text-xs primaryColor font-bold shrink-0 hover:underline hover:opacity-80 transition-opacity"
                  >
                    {t("selectFromListingGallery")}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Video Trimmer */}
          {step === 4 && (
            <div className="space-y-4 sm:space-y-6 w-full flex flex-col justify-center">
              <div
                style={{ aspectRatio: "9/16" }}
                className="relative rounded-2xl overflow-hidden bg-black w-full max-w-xs mx-auto shadow-lg"
              >
                <video
                  ref={trimmerVideoRef}
                  src={mediaPreview}
                  autoPlay
                  loop
                  playsInline
                  onLoadedMetadata={handleTrimmerVideoLoad}
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="space-y-3 sm:space-y-4 w-full">
                {/* Header Row: Badge showing selected clip length on left, text "Slide your track for perfect clip" on right */}
                <div className="flex items-center gap-2 sm:gap-3 px-1">
                  <div className="primaryBgLight primaryColor rounded-full px-3 py-0.5 sm:px-3.5 sm:py-1 text-xs sm:text-sm font-bold shrink-0">
                    {Math.floor(trimEnd - trimStart)} Sec
                  </div>
                  <span className="text-gray-700 text-xs sm:text-sm font-semibold">
                    {t("slideYourTrack")}
                  </span>
                </div>

                {/* Timeline thumbnails view */}
                <div
                  ref={trackRef}
                  className="relative h-12 sm:h-16 select-none mx-5 sm:mx-6"
                >
                  {/* Thumbnails container with overflow-hidden */}
                  <div className="absolute inset-0 bg-gray-100 rounded-xl overflow-hidden border border-gray-200">
                    {isGeneratingThumbs ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-white/60">
                        <ButtonLoader />
                      </div>
                    ) : (
                      <div className="flex w-full h-full">
                        {timelineThumbnails.map((url, i) => (
                          <div key={i} className="flex-1 h-full relative">
                            <ImageWithPlaceholder
                              src={url}
                              alt={`thumbnail-${i}`}
                              className="w-full h-full object-cover opacity-80 pointer-events-none"
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Left dimmed area */}
                    <div
                      className="absolute left-0 top-0 bottom-0 bg-black/60 pointer-events-none z-10"
                      style={{ width: `${startPercent}%` }}
                    />

                    {/* Right dimmed area */}
                    <div
                      className="absolute right-0 top-0 bottom-0 bg-black/60 pointer-events-none z-10"
                      style={{ left: `${endPercent}%` }}
                    />
                  </div>

                  {/* Highlighted selection window box */}
                  <div
                    className="absolute top-0 bottom-0 border-y-4 primaryBorderColor pointer-events-none z-10 shadow-[0_0_10px_rgba(0,0,0,0.1)]"
                    style={{
                      left: `${startPercent}%`,
                      width: `${endPercent - startPercent}%`,
                    }}
                  />

                  {/* Left drag handle */}
                  <div
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      if (trackRef.current) {
                        const rect = trackRef.current.getBoundingClientRect();
                        const edgeX = rect.left + (startPercent / 100) * rect.width;
                        trackRef.current.dataset.dragOffset = e.clientX - edgeX;
                      }
                      setIsDraggingLeft(true);
                    }}
                    onTouchStart={(e) => {
                      e.stopPropagation();
                      if (trackRef.current && e.touches[0]) {
                        const rect = trackRef.current.getBoundingClientRect();
                        const edgeX = rect.left + (startPercent / 100) * rect.width;
                        trackRef.current.dataset.dragOffset = e.touches[0].clientX - edgeX;
                      }
                      setIsDraggingLeft(true);
                    }}
                    className="absolute -top-1.5 -bottom-1.5 w-5 primaryBg cursor-ew-resize z-20 rounded-l-xl flex items-center justify-center shadow-[0_0_12px_rgba(0,0,0,0.3)] border-2 border-white"
                    style={{
                      left: `calc(${startPercent}% - 20px)`,
                    }}
                  >
                    <div className="flex gap-[2px]">
                      <div className="w-[2px] h-4 bg-white/90 rounded-full" />
                      <div className="w-[2px] h-4 bg-white/90 rounded-full" />
                    </div>
                  </div>

                  {/* Right drag handle */}
                  <div
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      if (trackRef.current) {
                        const rect = trackRef.current.getBoundingClientRect();
                        const edgeX = rect.left + (endPercent / 100) * rect.width;
                        trackRef.current.dataset.dragOffset = e.clientX - edgeX;
                      }
                      setIsDraggingRight(true);
                    }}
                    onTouchStart={(e) => {
                      e.stopPropagation();
                      if (trackRef.current && e.touches[0]) {
                        const rect = trackRef.current.getBoundingClientRect();
                        const edgeX = rect.left + (endPercent / 100) * rect.width;
                        trackRef.current.dataset.dragOffset = e.touches[0].clientX - edgeX;
                      }
                      setIsDraggingRight(true);
                    }}
                    className="absolute -top-1.5 -bottom-1.5 w-5 primaryBg cursor-ew-resize z-20 rounded-r-xl flex items-center justify-center shadow-[0_0_12px_rgba(0,0,0,0.3)] border-2 border-white"
                    style={{
                      left: `${endPercent}%`,
                    }}
                  >
                    <div className="flex gap-[2px]">
                      <div className="w-[2px] h-4 bg-white/90 rounded-full" />
                      <div className="w-[2px] h-4 bg-white/90 rounded-full" />
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    onClick={() => setStep(5)}
                    className="w-full primaryBg text-white py-2.5 sm:py-3.5 rounded-xl font-bold text-sm sm:text-base shadow-md transition-opacity hover:opacity-90"
                  >
                    {t("continue")}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Confirm Preview */}
          {step === 5 && (
            <div className="space-y-4 sm:space-y-6 w-full flex flex-col justify-center items-center">

              {/* Media Preview Row (scrollable/collapsible vertically on mobile) */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 w-full">

                {/* 1. Video or Image Main Media Preview */}
                <div
                  style={{ aspectRatio: "9/16" }}
                  className="relative rounded-2xl overflow-hidden bg-black w-32 xs:w-36 sm:w-40 shadow-2xl shrink-0 border border-gray-100"
                >
                  {mediaType === "video" ? (
                    <video
                      src={mediaPreview}
                      autoPlay
                      loop
                      playsInline
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <ImageWithPlaceholder
                      src={mediaPreview}
                      alt={t("preview")}
                      className="w-full h-full object-contain"
                    />
                  )}

                  {/* Floating badge for listing details indicator */}
                  {selectedEntity && (
                    <div className="absolute bottom-2 left-2 right-2 sm:bottom-3 sm:left-3 sm:right-3 bg-white rounded-xl p-1 sm:p-1.5 flex items-center gap-1.5 sm:gap-2 shadow-lg pointer-events-none border border-black/5 z-20">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg overflow-hidden shrink-0 bg-gray-100">
                        <ImageWithPlaceholder
                          src={selectedEntity?.title_image || selectedEntity?.image}
                          alt=""
                          className="w-full h-full"
                        />
                      </div>
                      <span className="text-black font-bold text-xs truncate flex-1 leading-tight">
                        {selectedEntity?.title || selectedEntity?.name}
                      </span>
                    </div>
                  )}
                </div>

                {/* 2. Custom Thumbnail Upload Box (Only shown if media is a video) */}
                {mediaType === "video" && (
                  <div
                    onClick={() => {
                      if (thumbnailInputRef.current) thumbnailInputRef.current.click();
                    }}
                    style={{ aspectRatio: "9/16" }}
                    className="relative rounded-2xl overflow-hidden bg-gray-50 border-2 border-dashed border-gray-200 hover:primaryBorderColor hover:primaryBgLight w-32 xs:w-36 sm:w-40 shadow-lg flex flex-col items-center justify-center p-2 sm:p-3 text-center cursor-pointer transition-all shrink-0 group"
                  >
                    {customThumbnailPreview ? (
                      <>
                        <ImageWithPlaceholder
                          src={customThumbnailPreview}
                          alt={t("uploadThumbnail")}
                          className="absolute inset-0 w-full h-full object-contain"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-bold gap-1 z-30">
                          <IoImage className="w-4 h-4" />
                          <span>{t("change")}</span>
                        </div>

                        {/* Floating badge for listing details indicator also overlayed on custom thumbnail preview */}
                        {selectedEntity && (
                          <div className="absolute bottom-2 left-2 right-2 sm:bottom-3 sm:left-3 sm:right-3 bg-white rounded-xl p-1 sm:p-1.5 flex items-center gap-1.5 sm:gap-2 shadow-lg pointer-events-none border border-black/5 z-20">
                            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg overflow-hidden shrink-0 bg-gray-100">
                              <ImageWithPlaceholder
                                src={selectedEntity?.title_image || selectedEntity?.image}
                                alt=""
                                className="w-full h-full"
                              />
                            </div>
                            <span className="text-black font-bold text-xs truncate flex-1 leading-tight">
                              {selectedEntity?.title || selectedEntity?.name}
                            </span>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-gray-400 group-hover:primaryColor transition-colors">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-100 flex items-center justify-center">
                          <IoAdd className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-hover:primaryColor" />
                        </div>
                        <span className="text-xs font-bold tracking-tight">{t("uploadThumbnail")}</span>
                        <span className="text-xs text-gray-400">{t("optional")}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Selected Entity Card */}
              {selectedEntity && (
                <div className="w-full max-w-xs p-2.5 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-between gap-3 shrink-0 select-none">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-gray-100">
                      <ImageWithPlaceholder
                        src={selectedEntity?.title_image || selectedEntity?.image}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs primaryColor font-bold uppercase tracking-wider block leading-none mb-1">
                        {entityType}
                      </span>
                      <h4 className="font-semibold text-gray-800 text-xs truncate max-w-28 xs:max-w-36">
                        {selectedEntity?.title || selectedEntity?.name}
                      </h4>
                    </div>
                  </div>
                </div>
              )}

              <Button
                onClick={handleUploadStory}
                disabled={isUploading}
                className="w-full max-w-xs primaryBg text-white py-2.5 sm:py-3 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2"
              >
                {isUploading ? (
                  <>
                    <ButtonLoader />
                    <span>{t("uploadingStory")}</span>
                  </>
                ) : (
                  t("confirmYourUpload")
                )}
              </Button>

              {isUploading && mediaType === "video" && (
                <p className="text-xs text-gray-400 text-center -mt-2">
                  {videoUploadLimitsText}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Hidden File Input element */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="video/*,image/*"
          className="hidden"
        />
        <input
          type="file"
          ref={thumbnailInputRef}
          onChange={handleThumbnailChange}
          accept="image/*"
          className="hidden"
        />
      </DialogContent>
    </Dialog>
  );
};

export default AddStoryModal;
