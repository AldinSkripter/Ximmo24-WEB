import { useEffect, useState } from 'react'
import { useTranslation } from '@/components/context/TranslationContext'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import Map from '@/components/google-maps/GoogleMap'
import CustomLocationAutocomplete from '@/components/location-search/CustomLocationAutocomplete'
import toast from 'react-hot-toast'
import { IoCheckmarkCircle, IoLocationOutline } from 'react-icons/io5'
import { isWithinBW, BW_OUTSIDE_KEY, BW_OUTSIDE_TEXT_DE } from '@/utils/bwRegion'

const BW_STATE = 'Baden-Württemberg'
const BW_COUNTRY = 'Deutschland'

const LocationComponent = ({
    selectedLocationAddress,
    setSelectedLocationAddress,
    handleLocationSelect,
    handleCheckRequiredFields,
    isEditing = false,
    isProperty = true
}) => {
    const t = useTranslation()
    const [isCityInBW, setIsCityInBW] = useState(false)

    const bwMessage = () => {
        const message = t(BW_OUTSIDE_KEY)
        return message && message !== BW_OUTSIDE_KEY ? message : BW_OUTSIDE_TEXT_DE
    }

    useEffect(() => {
        setSelectedLocationAddress((previous) => ({ ...previous, state: BW_STATE, country: BW_COUNTRY }))
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        let active = true
        const latitude = selectedLocationAddress?.latitude ?? selectedLocationAddress?.lat
        const longitude = selectedLocationAddress?.longitude ?? selectedLocationAddress?.lng
        if (!Number(latitude) || !Number(longitude)) {
            setIsCityInBW(false)
            return
        }
        isWithinBW(Number(latitude), Number(longitude)).then((inside) => {
            if (active) setIsCityInBW(Boolean(inside))
        })
        return () => { active = false }
    }, [selectedLocationAddress?.latitude, selectedLocationAddress?.longitude, selectedLocationAddress?.lat, selectedLocationAddress?.lng])

    const handleAddressInputChange = (event) => {
        setSelectedLocationAddress((previous) => ({
            ...previous,
            formattedAddress: event.target.value,
            city: '',
            postalCode: '',
            placeId: '',
            isAddressVerified: false,
        }))
    }

    const handleCustomLocationSelect = async (placeData, placeDetails) => {
        try {
            if (!placeData?.latitude || !placeData?.longitude) return
            const inside = await isWithinBW(placeData.latitude, placeData.longitude)
            if (!inside) {
                toast.error(bwMessage())
                setIsCityInBW(false)
                return
            }

            const components = placeData.address_components || placeDetails?.address_components || []
            const getComponent = (...types) => {
                for (const type of types) {
                    const component = components.find((item) => item.types?.includes(type))
                    if (component) return component.long_name || ''
                }
                return ''
            }

            const street = getComponent('route')
            const houseNumber = getComponent('street_number')
            const postalCode = getComponent('postal_code')
            const city = getComponent('locality', 'postal_town', 'administrative_area_level_3')
            const formattedAddress = placeDetails?.formatted_address || placeData.formatted_address || ''

            if (!street || !houseNumber || !/^\d{5}$/.test(postalCode) || !city) {
                toast.error('Bitte wählen Sie eine vollständige Straßenadresse mit Hausnummer und PLZ aus.')
                return
            }

            const updatedLocation = {
                city,
                state: BW_STATE,
                country: BW_COUNTRY,
                postalCode,
                formattedAddress,
                latitude: placeData.latitude,
                longitude: placeData.longitude,
                lat: placeData.latitude,
                lng: placeData.longitude,
                placeId: placeData.place_id || '',
                isAddressVerified: true,
            }

            setSelectedLocationAddress((previous) => ({ ...previous, ...updatedLocation }))
            setIsCityInBW(true)
            handleLocationSelect?.(updatedLocation)
        } catch (error) {
            console.error('Error processing property address:', error)
            toast.error('Die Adresse konnte nicht geprüft werden.')
        }
    }

    const handleMapLocationSelect = (location) => {
        const updatedLocation = { ...location, isAddressVerified: false, placeId: '' }
        setSelectedLocationAddress((previous) => ({ ...previous, ...updatedLocation }))
        handleLocationSelect?.(updatedLocation)
        toast.error('Bitte wählen Sie nach dem Verschieben der Karte die genaue Adresse erneut aus.')
    }

    const handleNext = () => {
        if (!isCityInBW) {
            toast.error(bwMessage())
            return
        }
        if (!selectedLocationAddress?.isAddressVerified) {
            toast.error('Bitte wählen Sie die genaue Adresse aus den Suchergebnissen aus.')
            return
        }
        handleCheckRequiredFields('location', isProperty ? 'seoSettings' : 'floorDetails')
    }

    const isVerified = isCityInBW
        && selectedLocationAddress?.isAddressVerified
        && /^\d{5}$/.test(selectedLocationAddress?.postalCode || '')

    return (
        <div className="flex flex-col gap-7">
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5">
                <div className="flex items-start gap-3">
                    <span className="primaryBgLight12 primaryColor flex h-11 w-11 shrink-0 items-center justify-center rounded-xl">
                        <IoLocationOutline className="h-6 w-6" />
                    </span>
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">Genaue Immobilienadresse</h2>
                        <p className="mt-1 text-sm leading-6 text-gray-600">
                            Suchen Sie Straße und Hausnummer und wählen Sie den passenden Eintrag in Baden-Württemberg aus. Stadt, PLZ und Kartenposition werden automatisch übernommen.
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-7 xl:grid-cols-[minmax(0,0.85fr)_minmax(420px,1.15fr)]">
                <div className="space-y-5">
                    <div>
                        <Label htmlFor="property-address-search" className="font-semibold text-gray-800">
                            Straße und Hausnummer <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative mt-2" data-testid="property-address-autocomplete">
                            <CustomLocationAutocomplete
                                value={selectedLocationAddress.formattedAddress || ''}
                                onChange={handleAddressInputChange}
                                onPlaceSelect={handleCustomLocationSelect}
                                placeholder="z. B. Omerskopfstraße 60, 77855 Achern"
                                className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 pr-10 focus:border-[var(--primary-color)] focus:outline-none"
                                debounceMs={500}
                                maxResults={10}
                                isPropertyOrProjectOperation={false}
                                inputProps={{ id: 'property-address-search', 'aria-required': true }}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <Label htmlFor="postal-code" className="font-semibold text-gray-800">{t('zipCode')} <span className="text-red-500">*</span></Label>
                            <Input id="postal-code" value={selectedLocationAddress.postalCode || ''} readOnly className="mt-2 h-12 rounded-xl bg-gray-50" placeholder="PLZ" />
                        </div>
                        <div>
                            <Label htmlFor="city" className="font-semibold text-gray-800">{t('city')} <span className="text-red-500">*</span></Label>
                            <Input id="city" value={selectedLocationAddress.city || ''} readOnly className="mt-2 h-12 rounded-xl bg-gray-50" />
                        </div>
                        <div>
                            <Label htmlFor="state" className="font-semibold text-gray-800">{t('state')}</Label>
                            <Input id="state" value={BW_STATE} readOnly className="mt-2 h-12 rounded-xl bg-gray-50" />
                        </div>
                        <div>
                            <Label htmlFor="country" className="font-semibold text-gray-800">{t('country')}</Label>
                            <Input id="country" value={BW_COUNTRY} readOnly className="mt-2 h-12 rounded-xl bg-gray-50" />
                        </div>
                    </div>

                    {isVerified ? (
                        <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
                            <IoCheckmarkCircle className="h-5 w-5" />
                            Adresse und PLZ wurden erfolgreich geprüft.
                        </div>
                    ) : (
                        <p className="text-sm text-amber-700">Wählen Sie eine vollständige Adresse aus der Ergebnisliste aus.</p>
                    )}
                </div>

                <div className="h-[380px] w-full overflow-hidden rounded-2xl border border-gray-200 bg-gray-100 shadow-sm">
                    <Map
                        latitude={selectedLocationAddress.latitude || 0}
                        longitude={selectedLocationAddress.longitude || 0}
                        showLabel={true}
                        onSelectLocation={handleMapLocationSelect}
                    />
                </div>
            </div>

            <div className="flex flex-col items-end gap-2 border-t border-gray-100 pt-5">
                {!isCityInBW && selectedLocationAddress?.formattedAddress && (
                    <p className="text-sm text-red-500" data-testid="bw-restriction-hint">{bwMessage()}</p>
                )}
                <Button onClick={handleNext} disabled={!isVerified} data-testid="location-next-button" className="h-12 rounded-xl px-10 disabled:cursor-not-allowed disabled:opacity-50">
                    {isEditing ? t('save') : t('next')}
                </Button>
            </div>
        </div>
    )
}

export default LocationComponent
