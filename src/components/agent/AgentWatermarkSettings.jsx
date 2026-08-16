import { useEffect, useRef, useState } from 'react';
import { CloudUpload } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/router';
import { useDropzone } from 'react-dropzone';
import {
    getAgentWatermarkSettingsApi,
    checkPackageLimitApi,
    updateAgentWatermarkSettingsApi,
} from '@/api/apiRoutes';
import { useTranslation } from '../context/TranslationContext';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import ImageWithPlaceholder from '@/components/image-with-placeholder/ImageWithPlaceholder';
import { PackageTypes } from '@/utils/checkPackages/packageTypes';
import { premiumIcon as PremiumIcon } from '@/assets/svg';
import { FaPencil } from 'react-icons/fa6';

const defaultWatermarkState = {
    enabled: true,
    image: null,
    imagePreview: null,
    opacity: [53],
    size: [86],
    style: 'Single',
    position: 'Center',
    rotation: [0],
};

const mapApiStyleToUi = (value) => {
    const normalizedValue = String(value || '').toLowerCase();
    return normalizedValue === 'tile' || normalizedValue === 'repeated' ? 'Repeated' : 'Single';
};

const mapApiPositionToUi = (value) => {
    const normalizedValue = String(value || '').toLowerCase();

    switch (normalizedValue) {
        case 'top-left':
            return 'Top Left';
        case 'top-right':
            return 'Top Right';
        case 'bottom-left':
            return 'Bottom Left';
        case 'bottom-right':
            return 'Bottom Right';
        case 'center':
        default:
            return 'Center';
    }
};

const mapUiStyleToApi = (value) => (value === 'Repeated' ? 'tile' : 'single');

const mapUiPositionToApi = (value) => {
    switch (value) {
        case 'Top Left':
            return 'top-left';
        case 'Top Right':
            return 'top-right';
        case 'Bottom Left':
            return 'bottom-left';
        case 'Bottom Right':
            return 'bottom-right';
        case 'Center':
        default:
            return 'center';
    }
};

const getWatermarkConfig = (response) => {
    const payload = response?.data ?? response?.result ?? response ?? {};

    if (payload?.watermark_enabled !== undefined || payload?.watermark_opacity !== undefined) {
        return payload;
    }

    if (payload?.data && !Array.isArray(payload.data)) {
        return payload.data;
    }

    if (Array.isArray(payload?.data) && payload.data.length > 0) {
        return payload.data[0];
    }

    return payload?.settings ?? payload?.watermark ?? payload;
};

const AgentWatermarkSettings = () => {
    const t = useTranslation();
    const router = useRouter();
    const blobPreviewRef = useRef(null);

    const [enabled, setEnabled] = useState(defaultWatermarkState.enabled);
    const [image, setImage] = useState(defaultWatermarkState.image);
    const [imagePreview, setImagePreview] = useState(defaultWatermarkState.imagePreview);
    const [opacity, setOpacity] = useState(defaultWatermarkState.opacity);
    const [size, setSize] = useState(defaultWatermarkState.size);
    const [style, setStyle] = useState(defaultWatermarkState.style);
    const [position, setPosition] = useState(defaultWatermarkState.position);
    const [rotation, setRotation] = useState(defaultWatermarkState.rotation);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [hasWatermarkFeature, setHasWatermarkFeature] = useState(null);
    const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);
    const originalSettings = useRef({});

    const applySettings = (settings) => {
        const watermarkImage = settings?.watermark_image || settings?.watermark_image_url || settings?.image || null;

        if (blobPreviewRef.current) {
            URL.revokeObjectURL(blobPreviewRef.current);
            blobPreviewRef.current = null;
        }

        const watermarkEnabled = Boolean(Number(settings?.watermark_enabled ?? settings?.enabled ?? 1));
        const watermarkOpacity = [Number(settings?.watermark_opacity ?? settings?.opacity ?? 53) || 53];
        const watermarkSize = [Number(settings?.watermark_size ?? settings?.size ?? 86) || 86];
        const watermarkStyle = mapApiStyleToUi(settings?.watermark_style ?? settings?.style);
        const watermarkPosition = mapApiPositionToUi(settings?.watermark_position ?? settings?.position);
        const watermarkRotation = [Number(settings?.watermark_rotation ?? settings?.rotation ?? 0) || 0];

        setEnabled(watermarkEnabled);
        setImage(null);
        setImagePreview(watermarkImage || null);
        setOpacity(watermarkOpacity);
        setSize(watermarkSize);
        setStyle(watermarkStyle);
        setPosition(watermarkPosition);
        setRotation(watermarkRotation);

        originalSettings.current = {
            enabled: watermarkEnabled,
            imagePreview: watermarkImage || null,
            opacity: watermarkOpacity[0],
            size: watermarkSize[0],
            style: watermarkStyle,
            position: watermarkPosition,
            rotation: watermarkRotation[0],
        };
    };

    const hasChanges = () => {
        if (image !== null) return true;
        const orig = originalSettings.current;
        return enabled !== orig.enabled || opacity[0] !== orig.opacity || size[0] !== orig.size || style !== orig.style || position !== orig.position || rotation[0] !== orig.rotation || imagePreview !== orig.imagePreview;
    };

    useEffect(() => {
        let isActive = true;

        const fetchWatermarkSettings = async () => {
            try {
                setLoading(true);
                const response = await getAgentWatermarkSettingsApi({});
                if (!isActive) return;

                const settings = getWatermarkConfig(response);
                applySettings(settings);
            } catch {
                if (!isActive) return;
                toast.error(t('failedToLoadConfigData'));
            } finally {
                if (isActive) {
                    setLoading(false);
                }
            }
        };

        fetchWatermarkSettings();

        return () => {
            isActive = false;

            if (blobPreviewRef.current) {
                URL.revokeObjectURL(blobPreviewRef.current);
            }
        };
    }, [t]);

    const onDrop = (acceptedFiles) => {
        if (acceptedFiles && acceptedFiles.length > 0) {
            const file = acceptedFiles[0];
            if (blobPreviewRef.current) {
                URL.revokeObjectURL(blobPreviewRef.current);
            }

            const nextPreview = URL.createObjectURL(file);
            blobPreviewRef.current = nextPreview;

            setImage(file);
            setImagePreview(nextPreview);
            setEnabled(true);
        }
    };

    const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
        onDrop,
        accept: {
            'image/png': ['.png'],
            'image/jpeg': ['.jpg', '.jpeg'],
            'image/webp': ['.webp'],
        },
        maxFiles: 1,
        maxSize: 3 * 1024 * 1024, // 3MB
    });

    const handleEditImage = () => {
        if (loading || saving) return;
        open();
    };

    const handleSave = async () => {
        try {
            setSaving(true);

            const featureResponse = await checkPackageLimitApi({ type: PackageTypes.AGENT_WATERMARK });
            const featureAvailable = Boolean(featureResponse?.data?.feature_available);

            if (!featureAvailable) {
                setHasWatermarkFeature(false);
                setPurchaseDialogOpen(true);
                return;
            }

            setHasWatermarkFeature(true);

            const watermarkImage = image || undefined;

            const response = await updateAgentWatermarkSettingsApi({
                watermark_enabled: enabled,
                watermark_opacity: opacity[0],
                watermark_image: watermarkImage,
                watermark_size: size[0],
                watermark_style: mapUiStyleToApi(style),
                watermark_position: mapUiPositionToApi(position),
                watermark_rotation: rotation[0],
            });

            toast.success(response?.message);

            const settings = getWatermarkConfig(response);
            if (settings && (settings.watermark_image || settings.watermark_image_url || settings.image)) {
                applySettings(settings);
            } else {
                originalSettings.current = {
                    enabled,
                    imagePreview,
                    opacity: opacity[0],
                    size: size[0],
                    style,
                    position,
                    rotation: rotation[0],
                };
                setImage(null);
            }
        } catch (error) {
            toast.error(error?.message);
        } finally {
            setSaving(false);
        }
    };

    const getWatermarkStyle = () => {
        if (!enabled) return { display: 'none' };

        let customStyle = {
            opacity: opacity[0] / 100,
            width: `${size[0]}%`,
            transform: `rotate(${rotation[0]}deg)`,
            position: 'absolute',
        };

        switch (position) {
            case 'Center':
                customStyle = {
                    ...customStyle,
                    top: '50%',
                    left: '50%',
                    transform: `translate(-50%, -50%) rotate(${rotation[0]}deg)`,
                };
                break;
            case 'Top Left':
                customStyle = { ...customStyle, top: '20px', left: '20px' };
                break;
            case 'Top Right':
                customStyle = { ...customStyle, top: '20px', right: '20px' };
                break;
            case 'Bottom Left':
                customStyle = { ...customStyle, bottom: '20px', left: '20px' };
                break;
            case 'Bottom Right':
                customStyle = { ...customStyle, bottom: '20px', right: '20px' };
                break;
            default:
                customStyle = {
                    ...customStyle,
                    top: '50%',
                    left: '50%',
                    transform: `translate(-50%, -50%) rotate(${rotation[0]}deg)`,
                };
        }

        return customStyle;
    };

    const isPreviewLoading = loading && !imagePreview;

    return (
        <div className="space-y-6 pt-4 pb-8">
            <h1 className="mb-6 text-2xl font-semibold">{t('watermarkSettings')}</h1>

            <div className="flex flex-col lg:flex-row gap-6">

                <div className="w-full lg:w-1/2 bg-white rounded-lg border border-gray-200 p-6 shadow-sm flex flex-col">
                    <div className="flex items-center justify-between mb-6">
                        <div className="h-px bg-gray-200 flex-1"></div>
                        <span className="px-4 text-sm font-medium leadColor">{t('preview')}</span>
                        <div className="h-px bg-gray-200 flex-1"></div>
                    </div>

                    <div className="flex-1 flex flex-col justify-center items-center h-full min-h-[400px] w-full">
                        <div
                            className={`w-full max-w-md ${imagePreview ? 'hidden' : ''}`}
                            {...getRootProps()}
                        >
                            <div
                                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${isDragActive ? 'border-primary-color bg-primary-category-background' : 'border-gray-300 hover:border-gray-400 bg-gray-50'
                                    } ${loading || saving ? 'pointer-events-none opacity-60' : ''}`}
                            >
                                <input {...getInputProps()} />
                                <CloudUpload className="mx-auto h-10 w-10 text-gray-400 mb-2" />
                                <p className="text-sm leadColor">
                                    {t('dragAndDropWatermarkFiles')} <span className="font-medium text-primary-color hover:underline">{t('browse')}</span>
                                </p>
                            </div>
                            <p className="text-xs leadColor mt-2 text-center">
                                {t('uploadCustomWatermarkDescription')}
                            </p>
                            <p className="mt-2 text-xs leadColor text-center">
                                {image ? t('selectedWatermarkFile') : t('noWatermarkFileSelected')}
                            </p>
                        </div>

                        {imagePreview && (
                            <div className="relative w-full max-w-md aspect-video bg-gray-200 rounded-md overflow-hidden bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+PGVjdCB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIGZpbGw9IiNmMmYyZjIiPjwvcmVjdD48cGF0aCBkPSJNMCAwbDEwIDEwSDB6IiBmaWxsPSIjZTllOWU5Ij48L3BhdGg+PC9zdmc+')]">
                                {enabled && (
                                    <div className="absolute top-1 right-1 z-20 flex flex-row items-center justify-center gap-2">
                                        <button
                                            type="button"
                                            onClick={handleEditImage}
                                            disabled={loading || saving}
                                            className="rounded-full bg-white p-2 primaryColor transition-colors hover:primaryBgLight12 disabled:cursor-not-allowed disabled:opacity-60"
                                            aria-label={t('edit')}
                                        >
                                            <FaPencil />
                                        </button>
                                    </div>
                                )}
                                {/* <div className="absolute inset-0 flex items-center justify-center z-0"> */}
                                {/* {!isPreviewLoading && (
                                        <span className="text-lg font-medium leadColor ">{t('sampleImage')}</span>
                                    )}
                                    {isPreviewLoading && (
                                        <span className="text-sm leadColor">{t('loading')}</span>
                                    )} */}
                                {/* </div> */}

                                {!enabled && !isPreviewLoading && (
                                    <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
                                        <span className="bg-black/50 text-white text-sm font-semibold px-4 py-2 rounded-md">
                                            {t('watermarkOff')}
                                        </span>
                                    </div>
                                )}

                                {enabled && !isPreviewLoading && (
                                    <>
                                        {style === "Repeated" ? (
                                            <div
                                                className="absolute inset-0 z-10 pointer-events-none"
                                                style={{
                                                    opacity: opacity[0] / 100,
                                                    transform: `rotate(${rotation[0]}deg)`,
                                                    backgroundImage: imagePreview ? `url(${imagePreview})` : 'none',
                                                    backgroundSize: `${size[0]}%`,
                                                    backgroundRepeat: 'repeat',
                                                    backgroundPosition: 'center',
                                                }}
                                            />
                                        ) : (
                                            <div className="z-10 flex justify-center items-center pointer-events-none" style={getWatermarkStyle()}>
                                                <ImageWithPlaceholder
                                                    src={imagePreview}
                                                    alt="Watermark"
                                                    width={396}
                                                    height={250}
                                                    className="w-full h-full object-contain"
                                                    priority={false}
                                                />
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        )}
                        {imagePreview && <div className='flex flex-col gap-3 text-xs mt-4 text-center'>
                            <p className="text-gray-600">
                                {t('watermarkPreviewNote')}
                            </p>
                            <span className='leadColor'>
                                {t('uploadCustomWatermarkDescription')}
                            </span>
                        </div>
                        }
                    </div>
                </div>

                <div className="w-full lg:w-1/2 bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <div className="h-px bg-gray-200 flex-1"></div>
                        <span className="px-4 text-sm font-medium leadColor">{t('watermarkConfiguration')}</span>
                        <div className="h-px bg-gray-200 flex-1"></div>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium leadColor">{t('enableWatermark')}</label>
                                <Switch className="data-[state=checked]:!primaryBg [&>span]:data-[state=unchecked]:!translate-x-0 rtl:[&>span]:data-[state=checked]:-translate-x-4" checked={enabled} onCheckedChange={setEnabled} disabled={loading || saving} />
                            </div>
                            <p className="text-xs leadColor mt-1">
                                {t('enableWatermarkDescription')}
                            </p>
                        </div>


                        <div>
                            <div className="flex justify-between mb-2">
                                <label className="text-sm font-medium leadColor">{t('opacity')} <span dir="ltr">({opacity[0]}%)</span></label>
                            </div>
                            <Slider
                                value={opacity}
                                onValueChange={setOpacity}
                                max={100}
                                step={1}
                                className="w-full"
                                disabled={!enabled || loading || saving}
                            />
                            <div className="flex justify-between mt-1 text-xs leadColor">
                                <span>{t('minimumPercent')}</span>
                                <span>{t('maximumPercent')}</span>
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between mb-2">
                                <label className="text-sm font-medium leadColor">{t('size')} <span dir="ltr">({size[0]}%)</span></label>
                            </div>
                            <Slider
                                value={size}
                                onValueChange={setSize}
                                min={1}
                                max={100}
                                step={1}
                                className="w-full"
                                disabled={!enabled || loading || saving}
                            />
                            <div className="flex justify-between mt-1 text-xs leadColor">
                                <span>{t('minimumSizePercent')}</span>
                                <span>{t('maximumSizePercent')}</span>
                            </div>
                        </div>

                        <div>
                            <label className="block mb-2 text-sm font-medium leadColor">{t('style')}</label>
                            <Select value={style} onValueChange={setStyle} disabled={!enabled || loading || saving}>
                                <SelectTrigger className="w-full bg-gray-50">
                                    <SelectValue placeholder={t('selectStyle')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Single">{t('singleWatermark')}</SelectItem>
                                    <SelectItem value="Repeated">{t('repeatedWatermark')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <label className="block mb-2 text-sm font-medium leadColor">{t('position')}</label>
                            <Select value={position} onValueChange={setPosition} disabled={!enabled || style === "Repeated" || loading || saving}>
                                <SelectTrigger className="w-full bg-gray-50">
                                    <SelectValue placeholder={t('selectPosition')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Center">{t('center')}</SelectItem>
                                    <SelectItem value="Top Left">{t('topLeft')}</SelectItem>
                                    <SelectItem value="Top Right">{t('topRight')}</SelectItem>
                                    <SelectItem value="Bottom Left">{t('bottomLeft')}</SelectItem>
                                    <SelectItem value="Bottom Right">{t('bottomRight')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <div className="flex justify-between mb-2">
                                <label className="text-sm font-medium leadColor">{t('rotation')} <span dir="ltr">({rotation[0]}°)</span></label>
                            </div>
                            <Slider
                                value={rotation}
                                onValueChange={setRotation}
                                max={360}
                                step={1}
                                className="w-full"
                                disabled={!enabled || loading || saving}
                            />
                            <div className="flex justify-between mt-1 text-xs leadColor">
                                <span>{t('minimumRotation')}</span>
                                <span>{t('maximumRotation')}</span>
                            </div>
                        </div>

                        <div className="flex justify-end pt-4">
                            <button
                                onClick={handleSave}
                                disabled={loading || saving || !hasChanges()}
                                className="px-6 py-2 primaryBg text-white text-sm font-medium rounded-md hover:bg-opacity-90 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {saving ? t('saving') : t('saveSettings')}
                            </button>
                        </div>
                    </div>
                </div>


            </div>

            <Dialog open={purchaseDialogOpen} onOpenChange={setPurchaseDialogOpen}>
                <DialogContent className="sm:max-w-sm p-4">
                    <DialogHeader>
                        <DialogTitle>{t('subscribeNow')}</DialogTitle>
                        <DialogDescription className="sr-only">{t('pleasePurchasePackageToProceed')}</DialogDescription>
                    </DialogHeader>

                    <div className="rounded-lg my-2 md:my-4 p-4 brandColor">
                        <div className="flex items-start gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
                                <PremiumIcon />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-base font-semibold">{t('upgradeRequired')}</h3>
                                <p className="text-sm">{t('agentWatermarkFeatureNotAvailable')}</p>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <button
                            type="button"
                            onClick={() => router.push('/agent/packages')}
                            className="rounded-md primaryBg px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-opacity-90"
                        >
                            {t('viewPlans')}
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AgentWatermarkSettings;
