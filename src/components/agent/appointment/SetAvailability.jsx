"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { IoTimeOutline } from "react-icons/io5";
import { postAgentTimeScheduleApi, getAgentTimeScheduleApi } from '@/api/apiRoutes';
import toast from 'react-hot-toast';
import { useEffect } from 'react';
import DaySchedule from './DaySchedule';
import DateScheduleCard from './DateScheduleCard';
import { aggregateSchedulesByDay, formatTimeToAMPM, parseTimeToMinutes, formatMinutesToTime } from '@/utils/appointmentHelper';
import { useTranslation } from '@/components/context/TranslationContext';
import ViewAllSchedules from './modals/ViewAllSchedules';

// Skeleton component for loading state
const SetAvailabilitySkeleton = () => {
    return (
        <div className="space-y-6">
            {/* Business Hours and Date Schedule - 2 Column Layout */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Business Hours Skeleton - Left Column */}
                <div className="newBorder rounded-2xl">
                    <div className="newBorderColor border-b p-6">
                        <div className="flex items-center gap-3">
                            <Skeleton className="h-12 w-12 rounded-lg" />
                            <div className="space-y-2">
                                <Skeleton className="h-5 w-40" />
                                <Skeleton className="h-4 w-72" />
                            </div>
                        </div>
                    </div>
                    <div className="p-6 space-y-6">
                        {/* Column Headers */}
                        <div className="grid grid-cols-[auto_1fr_auto] gap-4">
                            <div className="w-[180px]" />
                            <div className="grid grid-cols-2 gap-4">
                                <Skeleton className="h-5 w-20" />
                                <Skeleton className="h-5 w-24" />
                            </div>
                            <div className="w-12" />
                        </div>
                        {/* Days Grid */}
                        <div className="space-y-6">
                            {Array.from({ length: 7 }, (_, i) => (
                                <div key={i} className="grid grid-cols-[auto_1fr_auto] items-center gap-4">
                                    <div className="flex items-center gap-4 w-[180px]">
                                        <Skeleton className="h-8 w-16 rounded-2xl" />
                                        <Skeleton className="h-5 w-20" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <Skeleton className="h-12 w-full" />
                                        <Skeleton className="h-12 w-full" />
                                    </div>
                                    <Skeleton className="h-12 w-12" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Date Schedule Skeleton - Right Column */}
                <div className="newBorder rounded-xl">
                    <div className="primaryBackgroundBg newBorderColor border-b rounded-t-xl p-4">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-4 w-96 mt-3" />
                    </div>
                    <div className="p-6">
                        <div className="grid grid-cols-1 gap-8">
                            {Array.from({ length: 6 }, (_, i) => (
                                <div key={i} className="space-y-2">
                                    <Skeleton className="h-4 w-32" />
                                    <div className="primaryBackgroundBg newBorder rounded-xl p-3">
                                        <div className="flex items-center gap-3 mb-3">
                                            <Skeleton className="h-5 w-5 rounded-full" />
                                            <Skeleton className="h-4 w-40" />
                                        </div>
                                        <Skeleton className="h-10 w-full" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const SetAvailability = ({ loading = false, onSave, preferencesData }) => {

    const t = useTranslation();
    const [saving, setSaving] = useState(false);
    const [loadingSchedule, setLoadingSchedule] = useState(true);
    const [deletedSlotIds, setDeletedSlotIds] = useState([]);
    const [viewAllTimeSlot, setViewAllTimeSlot] = useState(false);
    const [viewAllDate, setViewAllDate] = useState(null); // Obj containing date, month and year

    // Get booking preferences from Redux
    // const agentBookingPreferences = useSelector((state) => state.cacheData.agentBookingPreferences);
    const meetingDurationMinutes = preferencesData?.meeting_duration_minutes;
    const bufferTimeMinutes = preferencesData?.buffer_time_minutes;

    const daysOfWeek = [
        'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
    ];


    const [schedule, setSchedule] = useState({
        Monday: {
            isEnabled: true,
            timeSlots: []
        },
        Tuesday: {
            isEnabled: true,
            timeSlots: []
        },
        Wednesday: {
            isEnabled: true,
            timeSlots: []
        },
        Thursday: {
            isEnabled: true,
            timeSlots: []
        },
        Friday: {
            isEnabled: true,
            timeSlots: []
        },
        Saturday: {
            isEnabled: false,
            timeSlots: []
        },
        Sunday: {
            isEnabled: false,
            timeSlots: []
        }
    });

    const [extraSlots, setExtraSlots] = useState([]);
    const [initialSchedule, setInitialSchedule] = useState(null); // Track initial state for comparison

    // Load existing schedule data on component mount
    useEffect(() => {
        const loadScheduleData = async () => {
            try {
                setLoadingSchedule(true);
                const response = await getAgentTimeScheduleApi();

                if (response?.error === false && response?.data) {
                    // Use new aggregation function to maintain data structure consistency
                    const rawSchedules = response.data?.time_schedules || [];
                    // Aggregate schedules by day without expansion - maintains original time ranges
                    const schedulesByDay = aggregateSchedulesByDay(rawSchedules);

                    const transformedSchedule = daysOfWeek.reduce((acc, day) => {
                        const key = day.toLowerCase();
                        const daySlots = schedulesByDay[key] || [];

                        acc[day] = {
                            isEnabled: daySlots.length > 0,
                            timeSlots: daySlots
                        };
                        return acc;
                    }, {});

                    setSchedule(transformedSchedule);
                    setInitialSchedule(transformedSchedule); // Store initial state for comparison
                    const transformedExtraSlots = transformDateScheduleTime(response.data?.extra_slots) || [];
                    setExtraSlots(transformedExtraSlots);
                } else {
                    // No existing schedule data - we'll set initial schedule after default slots are added
                    // This is handled in a separate useEffect after the default slots are generated
                }
            } catch (error) {
                console.error("Error loading schedule data:", error);
                // Initial schedule will be set after default slots are generated
            } finally {
                setLoadingSchedule(false);
            }
        };

        loadScheduleData();
    }, [meetingDurationMinutes, bufferTimeMinutes]);

    // Set initial schedule after default time slots are added (for new users)
    useEffect(() => {
        if (meetingDurationMinutes && !loadingSchedule && !initialSchedule) {
            // Only set initial schedule if we haven't loaded data from API
            // This timeout ensures the schedule state has been updated with default slots
            const timer = setTimeout(() => {
                setInitialSchedule(prev => {
                    if (!prev) {
                        // Create empty initial schedule that matches the default empty schedule
                        return daysOfWeek.reduce((acc, day) => {
                            acc[day] = {
                                isEnabled: day !== 'Saturday' && day !== 'Sunday',
                                timeSlots: []
                            };
                            return acc;
                        }, {});
                    }
                    return prev;
                });
            }, 0);

            return () => clearTimeout(timer);
        }
    }, [meetingDurationMinutes, loadingSchedule, initialSchedule]);

    const handleToggleDay = (day, isEnabled) => {
        setSchedule(prev => {
            const currentDaySchedule = prev[day];
            const daySchedule = { ...currentDaySchedule, isEnabled };

            // If disabling the day, collect IDs of existing time slots for deletion
            if (!isEnabled && currentDaySchedule.isEnabled) {
                const existingSlotIds = currentDaySchedule.timeSlots
                    .filter(slot => slot.id !== null && slot.id !== undefined)
                    .map(slot => slot.id);

                if (existingSlotIds.length > 0) {
                    setDeletedSlotIds(prevDeleted => [...prevDeleted, ...existingSlotIds]);
                }
            }

            // If enabling the day and no time slots exist, create a default editable slot
            if (isEnabled && daySchedule.timeSlots.length === 0) {
                const startMinutes = parseTimeToMinutes('09:00');
                const duration = meetingDurationMinutes || 60; // Default to 60 minutes if not set
                const endMinutes = startMinutes + duration;

                daySchedule.timeSlots = [{
                    id: null, // No ID means it's a new editable slot
                    start: '09:00',
                    end: formatMinutesToTime(endMinutes)
                }];
            }

            // If disabling the day, keep existing slots (user might want to re-enable later)
            // but they will be marked for deletion on the backend

            return {
                ...prev,
                [day]: daySchedule
            };
        });
    };

    // NEW SIMPLIFIED HANDLERS - No auto adjustment logic, all slots editable
    const handleTimeSlotChange = (day, slotIndex, field, value) => {
        setSchedule(prev => {
            const currentSlots = prev[day].timeSlots;

            // Simple update without any auto-adjustment - all slots are now editable
            const updatedSlots = [...currentSlots];
            updatedSlots[slotIndex] = {
                ...updatedSlots[slotIndex],
                [field]: value
            };
            return {
                ...prev,
                [day]: {
                    ...prev[day],
                    timeSlots: updatedSlots
                }
            };
        });
    };

    const handleAddTimeSlot = (day) => {
        setSchedule(prev => {
            const currentSlots = prev[day].timeSlots;

            let newStartTime = "09:00"; // Default start time

            if (currentSlots.length > 0 && bufferTimeMinutes && meetingDurationMinutes) {
                // Find the slot with the latest end time
                const sortedSlots = [...currentSlots].sort(
                    (a, b) => parseTimeToMinutes(b.end) - parseTimeToMinutes(a.end)
                );
                const latestSlot = sortedSlots[0];
                const latestEndMinutes = parseTimeToMinutes(latestSlot.end);

                // Calculate new start time
                const newStartMinutes = latestEndMinutes + bufferTimeMinutes;
                const newEndMinutes = newStartMinutes + meetingDurationMinutes;

                if (newEndMinutes < 24 * 60) {
                    newStartTime = formatMinutesToTime(newStartMinutes);
                } else {
                    toast.error(t("cannotAddSlotWouldExceedDay"));
                    return prev; // prevent adding
                }
            }

            const startMinutes = parseTimeToMinutes(newStartTime);
            const duration = meetingDurationMinutes;
            const endMinutes = startMinutes + duration;
            const newEndTime = formatMinutesToTime(endMinutes);

            const newSlot = { start: newStartTime, end: newEndTime };

            // 🔑 Prevent duplicate/overlapping slot
            const isDuplicate = currentSlots.some(
                slot =>
                    parseTimeToMinutes(slot.start) === startMinutes &&
                    parseTimeToMinutes(slot.end) === endMinutes
            );

            if (isDuplicate) {
                toast.error(t("slotAlreadyExists"));
                return prev; // do not add
            }

            return {
                ...prev,
                [day]: {
                    ...prev[day],
                    timeSlots: [...currentSlots, newSlot]
                }
            };
        });

    };

    // Function to check if there are unsaved changes
    const hasUnsavedChanges = () => {
        // If there are deleted slots, there are changes
        if (deletedSlotIds.length > 0) {
            return true;
        }

        // If initial schedule is not loaded yet, consider no changes
        if (!initialSchedule) {
            return false;
        }

        // Check each day for changes
        for (const day of daysOfWeek) {
            const currentDay = schedule[day];
            const initialDay = initialSchedule[day];

            // Check if day enable/disable status changed
            if (currentDay.isEnabled !== initialDay.isEnabled) {
                return true;
            }

            // Check for new time slots (slots without id)
            const hasNewSlots = currentDay.timeSlots.some(slot =>
                slot.id === null || slot.id === undefined
            );
            if (hasNewSlots) {
                return true;
            }

            // Check if number of slots changed
            if (currentDay.timeSlots.length !== initialDay.timeSlots.length) {
                return true;
            }

            // Check for modifications to existing slots
            for (let i = 0; i < currentDay.timeSlots.length; i++) {
                const currentSlot = currentDay.timeSlots[i];
                const initialSlot = initialDay.timeSlots[i];

                if (!initialSlot) {
                    // This is a new slot
                    return true;
                }

                // Check if slot times changed (only for slots with same id)
                if (currentSlot.id === initialSlot.id &&
                    (currentSlot.start !== initialSlot.start ||
                        currentSlot.end !== initialSlot.end)) {
                    return true;
                }
            }
        }

        return false;
    };

    const handleRemoveTimeSlot = (day, slotIndex) => {
        // Get the slot ID before removing it from state
        const slotToRemove = schedule[day].timeSlots[slotIndex];
        const slotId = slotToRemove?.id;

        // Only add to deletedSlotIds if the slot has an ID (existing slot)
        if (slotId !== null && slotId !== undefined) {
            setDeletedSlotIds(prev => [...prev, slotId]);
        }

        // Remove the slot from the schedule
        setSchedule(prev => ({
            ...prev,
            [day]: {
                ...prev[day],
                timeSlots: prev[day].timeSlots.filter((_, index) => index !== slotIndex),
                ...(prev[day].timeSlots.length === 1 ? { isEnabled: false } : {}) // Auto-disable day if last slot is removed
            }
        }));
    };

    const validateSchedule = () => {
        const errors = [];

        Object.entries(schedule).forEach(([day, daySchedule]) => {
            if (daySchedule.isEnabled) {
                if (daySchedule.timeSlots.length === 0) {
                    errors.push(`${day} ${t('isEnabledButNoTimeSlots')}`);
                }

                // Check for overlapping slots
                const sortedSlots = [...daySchedule.timeSlots].sort((a, b) =>
                    parseTimeToMinutes(a.start) - parseTimeToMinutes(b.start)
                );

                for (let i = 0; i < sortedSlots.length - 1; i++) {
                    const currentEnd = parseTimeToMinutes(sortedSlots[i].end);
                    const nextStart = parseTimeToMinutes(sortedSlots[i + 1].start);

                    if (currentEnd > nextStart) {
                        errors.push(`${day} ${t('hasOverlappingTimeSlots')}`);
                        break;
                    }
                }

                // Check slot durations
                daySchedule.timeSlots.forEach((slot, index) => {
                    const duration = parseTimeToMinutes(slot.end) - parseTimeToMinutes(slot.start);
                    if (duration <= 0) {
                        errors.push(`${day} ${t('has')} ${index + 1} ${t('hasInvalidDuration')}`);
                    }
                });
            }
        });

        return errors;
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Validate schedule first
            const validationErrors = validateSchedule();
            if (validationErrors.length > 0) {
                toast.error(`${t("pleaseFixFollowingIssues")}\n${validationErrors.join('\n')}`);
                return;
            }

            // Convert schedule to individual slots format (no compression)
            const individualSlots = [];
            let scheduleIndex = 0;

            Object.entries(schedule).forEach(([dayName, daySchedule]) => {
                if (!daySchedule.isEnabled || daySchedule.timeSlots.length === 0) {
                    return; // Skip disabled days or days with no slots
                }

                const dayKey = dayName.toLowerCase();

                // Sort slots by start time
                const sortedSlots = [...daySchedule.timeSlots].sort((a, b) =>
                    parseTimeToMinutes(a.start) - parseTimeToMinutes(b.start)
                );

                // Add each slot individually without compression
                sortedSlots.forEach(slot => {
                    individualSlots.push({
                        id: slot.id || null,
                        day: dayKey,
                        start_time: slot.start,
                        end_time: slot.end,
                        index: scheduleIndex++
                    });
                });
            });

            // Transform to the expected API format
            const formattedSchedule = individualSlots.reduce((acc, slot) => {
                const index = slot.index;
                acc[index] = {
                    id: slot.id || '', // Empty string for new slots, existing ID for updates
                    day: slot.day,
                    start_time: slot.start_time,
                    end_time: slot.end_time
                };
                return acc;
            }, {});

            // Call the API to save the schedule
            const response = await postAgentTimeScheduleApi({ schedule: formattedSchedule, deletedSlots: deletedSlotIds });

            if (response?.error === false) {
                toast.success(response?.message);
                // Reset the initial schedule and deleted slots to reflect the current saved state
                setInitialSchedule(JSON.parse(JSON.stringify(schedule))); // Deep copy
                setDeletedSlotIds([]); // Clear deleted slots as they're now processed

                if (onSave) {
                    await onSave("all-schedule");
                }
            } else {
                toast.error(response?.message);
                console.error('Error saving schedule:', response);
            }
        } catch (error) {
            toast.error(t("errorOccurredWhileSavingSchedule"));
            console.error('Error saving schedule:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleViewSchedule = (dateObj) => {
        const date = dateObj.getDate();
        const month = dateObj.getMonth() + 1; // Months are zero-indexed
        const year = dateObj.getFullYear();
        setViewAllDate({ date, month, year });
        setViewAllTimeSlot(true);
        // Add navigation or modal logic here
    };

    // Group and transform extra slots by date
    const transformDateScheduleTime = ((extraSlots) => {
        // Group slots by date
        const slotsByDate = new Map();

        (extraSlots).forEach((slot) => {
            if (!slot?.date) return;
            if (!slotsByDate.has(slot.date)) {
                slotsByDate.set(slot.date, []);
            }
            slotsByDate.get(slot.date).push(slot);
        });

        return Array.from(slotsByDate.entries())
            // Sort by date
            .sort(([d1], [d2]) => d1.localeCompare(d2))
            .map(([date, slots]) => {
                const [y, m, d] = (date || '').split('-').map(Number);
                const dateObj = new Date(y, (m || 1) - 1, d || 1);
                const formattedDate = dateObj.toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                });

                // Sort slots by start time
                const sortedSlots = slots.sort((a, b) => {
                    const aStart = a.start_time || '00:00:00';
                    const bStart = b.start_time || '00:00:00';
                    return aStart.localeCompare(bStart);
                });

                // Format first slot for display
                const firstSlot = sortedSlots[0];
                const startHHmm = (firstSlot.start_time || '').slice(0, 5);
                const endHHmm = (firstSlot.end_time || '').slice(0, 5);
                const startFormatted = formatTimeToAMPM(startHHmm);
                const endFormatted = formatTimeToAMPM(endHHmm);

                return {
                    date: formattedDate,
                    dateObj,
                    timeSlot: `${startFormatted} to ${endFormatted}`,
                    totalSlots: sortedSlots.length,
                    firstTimeSlot: `${startFormatted} to ${endFormatted}`,
                };
            });
    });

    if (loading || loadingSchedule) {
        return <SetAvailabilitySkeleton />;
    }

    return (
        <div className="space-y-6">
            {/* Main Container - Business Hours with Date Schedule inside */}
            <div className="newBorder rounded-lg sm:rounded-2xl">
                {/* Header */}
                <div className="newBorderColor border-b p-3 sm:p-6">
                    <div className="flex items-start sm:items-center gap-2 sm:gap-2.5">
                        <div className="flex items-center justify-center w-8 h-8 sm:w-12 sm:h-12 primaryBgLight08 rounded-lg shrink-0">
                            <IoTimeOutline className="w-4 h-4 sm:w-6 sm:h-6 brandColor" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="text-sm sm:text-base font-bold brandColor truncate">
                                {t("setBusinessHours")}
                            </h3>
                            <p className="text-xs sm:text-sm font-medium brandColor leading-tight mt-0.5 sm:mt-1">
                                {t("specifyYourOperatingHours")}
                            </p>
                            {/* Meeting preferences info */}
                            <div className="flex flex-wrap gap-2 sm:gap-4 mt-1.5 sm:mt-2 text-[10px] sm:text-xs font-medium opacity-75">
                                <span className="brandColor whitespace-nowrap">
                                    {t("meetingDuration")}: {meetingDurationMinutes} {t("min")}
                                </span>
                                <span className="brandColor whitespace-nowrap">
                                    {t("bufferTime")}: {bufferTimeMinutes} {t("min")}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Container with Business Hours and Date Schedule */}
                <div className="flex flex-col xl:flex-row gap-4 sm:gap-6 xl:gap-4 p-3 sm:p-6">
                    {/* Business Hours Section */}
                    <div className="w-full xl:w-3/5">
                        {/* Column Headers */}
                        <div className="hidden md:grid grid-cols-[auto_1fr_auto] gap-2 sm:gap-4 mb-4 sm:mb-6 ">
                            {/* Spacer for toggle + day name */}
                            <div className="w-[140px] sm:w-[180px]" /> 
                            <div className="grid grid-cols-2 gap-2 sm:gap-4 lg:gap-10">
                                <span className="text-xs sm:text-base font-bold leadColor text-center">
                                    {t("openHour")}
                                </span>
                                <span className="text-xs sm:text-base font-bold leadColor text-center">
                                    {t("closedHour")}
                                </span>
                            </div>
                            {/* Spacer for action button */}
                            <div className="w-8 sm:w-12" /> 

                        </div>

                        {/* Days Grid */}
                        <div className="space-y-4 sm:space-y-6">
                            {daysOfWeek.map((day) => (
                                <DaySchedule
                                    key={day}
                                    day={day}
                                    schedule={schedule[day]}
                                    onToggle={handleToggleDay}
                                    onTimeSlotChange={(slotIndex, field, value) =>
                                        handleTimeSlotChange(day, slotIndex, field, value)
                                    }
                                    onAddTimeSlot={() => handleAddTimeSlot(day)}
                                    onRemoveTimeSlot={(slotIndex) => handleRemoveTimeSlot(day, slotIndex)}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Divider */}
                    {extraSlots?.length > 0 && <div className="hidden xl:block w-px bg-gray-200 mx-2"></div>}

                    {/* Date Schedule Section */}
                    {extraSlots?.length > 0 && (
                        <div className="w-full xl:w-2/5 mt-4 sm:mt-6 xl:mt-0">
                            <div className="newBorder rounded-lg sm:rounded-xl">
                                <div className="primaryBackgroundBg newBorderColor border-b rounded-t-lg sm:rounded-t-xl p-3 sm:p-4">
                                    <h3 className="text-sm sm:text-base font-bold brandColor">
                                        {t("dateSchedule")}
                                    </h3>
                                    <p className="text-[10px] sm:text-sm font-medium brandColor mt-1.5 sm:mt-3 leading-tight">
                                        {t("viewAllYourAppointmentsDesc")}
                                    </p>
                                </div>
                                <div className="p-3 sm:p-6 overflow-y-auto max-h-[400px] sm:max-h-[700px]">
                                    <div className="space-y-3 sm:space-y-6">
                                        {extraSlots.map((item, index) => (
                                            <DateScheduleCard
                                                key={index}
                                                date={item.date}
                                                timeSlot={item.timeSlot}
                                                firstTimeSlot={item.firstTimeSlot}
                                                totalSlots={item.totalSlots}
                                                onViewSchedule={() => handleViewSchedule(item.dateObj)}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-center sm:justify-end px-4 sm:px-0">
                <Button
                    onClick={handleSave}
                    disabled={saving || !hasUnsavedChanges()}
                    className="w-full sm:w-auto primaryBg primaryTextColor hover:bg-opacity-90 px-6 sm:px-8 py-2.5 sm:py-3 text-sm sm:text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {saving ? t("saving") : t("saveChanges")}
                </Button>
            </div>

            <ViewAllSchedules
                isOpen={viewAllTimeSlot}
                onClose={() => setViewAllTimeSlot(false)}
                viewAllDate={viewAllDate}
                showDefaultTimeSchedules={false}
                showExtraTimeSlots={true}
            />
        </div>
    );
};

export default SetAvailability;
