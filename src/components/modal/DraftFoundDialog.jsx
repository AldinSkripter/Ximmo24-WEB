"use client";
import { useTranslation } from "@/components/context/TranslationContext";

const DraftFoundDialog = ({ isOpen, onDiscard, onResume, isProject = false }) => {
    const t = useTranslation();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div
                className="relative w-full max-w-md rounded-2xl bg-white shadow-xl p-6"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="text-xl font-bold text-gray-900 mb-3">
                    {t("draftFound")}
                </h2>
                <p className="text-gray-600 mb-6">
                    {isProject ? t("unfinishedProjectDraft") : t("unfinishedPropertyDraft")}
                </p>
                <div className="flex gap-3">
                    <button
                        onClick={onDiscard}
                        className="flex-1 rounded-xl border border-gray-300 py-2.5 px-4 text-base font-semibold primaryTextColor brandBg"
                    >
                        {t("discard")}
                    </button>
                    <button
                        onClick={onResume}
                        className="flex-1 rounded-xl primaryBg py-2.5 px-4 text-base font-semibold text-white transition-all hover:opacity-90"
                    >
                        {t("resume")}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DraftFoundDialog;
