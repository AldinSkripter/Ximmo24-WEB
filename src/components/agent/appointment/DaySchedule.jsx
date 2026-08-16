import { Switch } from "@/components/ui/switch";
import { FiMinus, FiPlus } from 'react-icons/fi';
import { Button } from '@/components/ui/button';
import TimePicker from '@/components/reusable-components/TimePicker';
import { useTranslation } from "@/components/context/TranslationContext";

const formatTimeToAMPM = (timeString) => {
    const [hours, minutes] = timeString.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
};

// Convert 12-hour format (e.g., "09:00 AM") to 24-hour format (e.g., "09:00")
const convertTo24Hour = (timeString) => {
    if (!timeString) return '';

    const timeMatch = timeString.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!timeMatch) return timeString; // Return as-is if it doesn't match expected format

    const [, hours, minutes, period] = timeMatch;
    let hour24 = parseInt(hours, 10);

    if (period.toUpperCase() === 'AM' && hour24 === 12) {
        hour24 = 0;
    } else if (period.toUpperCase() === 'PM' && hour24 !== 12) {
        hour24 += 12;
    }

    return `${hour24.toString().padStart(2, '0')}:${minutes}`;
};

// Convert 24-hour format (e.g., "09:00") to 12-hour format (e.g., "09:00 AM")
const convertTo12Hour = (timeString) => {
    if (!timeString) return '';
    return formatTimeToAMPM(timeString);
};

const DaySchedule = ({
    day,
    schedule,
    onToggle,
    onTimeSlotChange,
    onAddTimeSlot,
    onRemoveTimeSlot,
}) => {
    const t = useTranslation();
    const { isEnabled, timeSlots } = schedule;

    return (
        <div className="flex flex-col sm:flex-row items-start gap-2 sm:gap-4">
            {/* Day Name and Toggle */}
            <div className="flex items-center w-full sm:w-[140px] md:w-[180px] order-1">
                <div className="flex items-center gap-2 sm:gap-3 w-full">
                    <Switch
                        checked={isEnabled}
                        onCheckedChange={(checked) => onToggle(day, checked)}
                        className="data-[state=checked]:primaryBg data-[state=unchecked]:bg-[#E7E7E7] h-[22px] w-[42px] sm:h-[26px] sm:w-[46px] [&>span]:data-[state=checked]:!translate-x-[22px] [&>span]:data-[state=unchecked]:!translate-x-0.5"
                    />
                    <div className="flex items-center gap-1">
                        <span className="text-sm sm:text-base font-semibold brandColor">
                            {t(day?.toLowerCase())}
                        </span>
                        <span className="text-sm sm:text-base font-semibold brandColor">:</span>
                    </div>
                </div>
            </div>

            {/* Time Fields */}
            <div className="flex-1 order-2 w-full">
                {isEnabled ? (
                    <div className="space-y-2">
                        {timeSlots.map((slot, index) => (
                            <div key={index} className="flex items-center gap-2">
                                {/* Time Pickers */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 flex-1">
                                    {/* Start Time */}
                                    <div className="relative">

                                        <TimePicker
                                            value={convertTo12Hour(slot.start)}
                                            onChange={(newTime) => {
                                                const newTime24Hour = convertTo24Hour(newTime);
                                                onTimeSlotChange(index, "start", newTime24Hour);
                                            }}
                                            placeholder="Select start time"
                                            className="primaryBackgroundBg h-11 rounded text-xs"
                                            aria-label={`Select start time for ${day}`}
                                            format12Hour={true}
                                        />
                                    </div>

                                    {/* End Time */}
                                    <div className="relative">

                                        <TimePicker
                                            value={convertTo12Hour(slot.end)}
                                            onChange={(newTime) => {
                                                const newTime24Hour = convertTo24Hour(newTime);
                                                onTimeSlotChange(index, "end", newTime24Hour);
                                            }}
                                            placeholder="Select end time"
                                            className="primaryBackgroundBg h-11 rounded text-xs"
                                            aria-label={`Select end time for ${day}`}
                                            format12Hour={true}
                                        />
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex items-center gap-1.5">
                                    {/* Remove Button */}
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => onRemoveTimeSlot(index)}
                                        className="h-11 w-11 p-0 border-[1.5px] redColor border-red-200 hover:redBgLight12 hover:text-red-700 rounded"
                                        aria-label={`Remove time slot ${index + 1} for ${day}`}
                                    >
                                        <FiMinus className="h-5 w-5" />
                                    </Button>

                                    {/* Add Button - Only on first slot */}
                                    {index === 0 && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="icon"
                                            onClick={onAddTimeSlot}
                                            className="h-11 w-11 border-[1.5px] primaryBorderColor primaryColor hover:primaryBg hover:text-white rounded"
                                            aria-label={`Add new time slot for ${day}`}
                                        >
                                            <FiPlus className="h-5 w-5" />
                                        </Button>
                                    )}
                                    {index > 0 && <div className="w-11" aria-hidden="true" />}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="w-full">
                        <div className="h-11 w-full primaryBackgroundBg newBorderColor border-[1.5px] rounded px-3 flex items-center">
                            <span className="leadColor font-medium text-xs">{t("closed")}</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default DaySchedule;