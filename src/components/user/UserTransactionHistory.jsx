"use client";

import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { CircleArrowDown, CircleArrowUp } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import CustomPagination from "@/components/ui/custom-pagination";
import { useTranslation } from "../context/TranslationContext";
import { downloadPaymentReceiptApi, getUserTransactionDetailsApi } from "@/api/apiRoutes";
import { getFormattedDate } from "@/utils/helperFunction";
import toast from "react-hot-toast";
import { Skeleton } from "@/components/ui/skeleton";
import UploadFileReceiptModal from "../ui/upload-recepit-modal";
import NoDataFound from "../no-data-found/NoDataFound";

const statusClasses = {
    success: "newGreenBgLight newGreenTextColor",
    approved: "blueBgLight blueTextColor",
    pending: "orangeBgLight orangeTextColor",
    rejected: "redColorLightBg redColorText",
    failed: "redColorLightBg redColorText",
};

const getPaymentTypeLabel = (paymentType, t) => {
    switch (paymentType?.toLowerCase()) {
        case "free":
            return t("free");
        case "online payment":
            return t("onlinePayment");
        case "bank transfer":
            return t("bankTransfer");
        default:
            return "-";
    }
};

const UserTransactionHistory = () => {
    const t = useTranslation();
    const [transactions, setTransactions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isPageLoading, setIsPageLoading] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const [uploadFileReceiptModal, setUploadFileReceiptModal] = useState(false);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalRecords: 0,
        limit: 10,
    });

    const activeLang = useSelector((state) => state?.LanguageSettings?.active_language);
    const currencySymbol = useSelector((state) => state?.WebSetting?.data?.currency_symbol);

    const fetchTransactions = async (page = 1) => {
        if (page === 1) {
            setIsLoading(true);
        } else {
            setIsPageLoading(true);
        }

        try {
            const offset = (page - 1) * pagination.limit;
            const response = await getUserTransactionDetailsApi({
                offset: offset.toString(),
                limit: pagination.limit.toString(),
            });

            setTransactions(response?.data || []);
            setPagination((current) => ({
                ...current,
                currentPage: page,
                totalPages: Math.ceil((response?.total || 0) / current.limit),
                totalRecords: response?.total || 0,
            }));
        } catch (error) {
            console.error("Error fetching transactions:", error);
            toast.error(t("errorFetchingTransactions"));
        } finally {
            setIsLoading(false);
            setIsPageLoading(false);
        }
    };

    const handleDownloadInvoice = async (transaction) => {
        try {
            const response = await downloadPaymentReceiptApi({
                payment_transaction_id: transaction.id,
            });

            const sanitizedHTML = (response || "").replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, "");

            const width = 800;
            const height = 600;
            const left = (window.screen.width - width) / 2;
            const top = (window.screen.height - height) / 2;

            const popup = window.open(
                "",
                "InvoicePopup",
                `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`
            );

            if (!popup) {
                alert("Popup blocked. Please enable popups for this site.");
                return;
            }

            popup.document.open();
            popup.document.write(`
                <!DOCTYPE html>
                <html>
                    <head>
                        <title>Invoice - ${transaction.id}</title>
                        <meta charset="UTF-8" />
                        <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
                    </head>
                    <body>
                        <div id="invoice-content" style="width: 794px; margin: 0 auto; padding: 0 20px 0 0; box-sizing: border-box;">
                            ${sanitizedHTML}
                        </div>
                        <script>
                            window.onload = function () {
                                const invoice = document.getElementById("invoice-content");

                                html2pdf()
                                    .set({
                                        filename: "invoice-${transaction.id}.pdf",
                                        image: { type: "jpeg", quality: 0.98 },
                                        html2canvas: { scale: 2, useCORS: true },
                                        jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
                                    })
                                    .from(invoice)
                                    .save()
                                    .then(() => setTimeout(() => window.close(), 1000));
                            };
                        </script>
                    </body>
                </html>
            `);
            popup.document.close();
        } catch (error) {
            console.error("Download invoice error:", error);
            toast.error(t("errorDownloadingInvoice"));
        }
    };

    const handleUploadReceipt = (transaction) => {
        setSelectedTransaction(transaction);
        setUploadFileReceiptModal(true);
    };

    const canUploadReceipt = (transaction) => {
        const paymentType = transaction?.payment_type?.toLowerCase();
        const paymentStatus = transaction?.payment_status?.toLowerCase();

        return paymentType === "bank transfer" && (paymentStatus === "pending" || paymentStatus === "rejected");
    };

    const handleActionClick = (transaction) => {
        if (transaction?.payment_status?.toLowerCase() === "success") {
            handleDownloadInvoice(transaction);
            return;
        }

        if (canUploadReceipt(transaction)) {
            handleUploadReceipt(transaction);
        }
    };

    useEffect(() => {
        fetchTransactions();
    }, [activeLang]);

    return (
        <div className="overflow-hidden w-full h-full rounded-2xl border cardBorder bg-white">
            <div className="border-b border-gray-200 px-4 py-4 sm:px-6">
                <h2 className="text-base font-semibold text-gray-900 md:text-xl">{t("transactionHistory")}</h2>
            </div>

            <div className="overflow-x-auto px-2 pb-2 pt-3 sm:px-4">
                <Table className="hidden lg:table" parentclassname="!border-none">
                    {transactions?.length > 0 ? (
                        <TableHeader className="bg-gray-100">
                            <TableRow className="!border-b-0 hover:bg-transparent">
                                <TableHead className="w-12 text-left text-sm font-bold brandColor rounded-l-lg">{t("id")}</TableHead>
                                <TableHead className="w-64 text-left text-sm font-bold brandColor">{t("transactionId")}</TableHead>
                                <TableHead className="w-20 text-left text-sm font-bold brandColor">{t("orderId")}</TableHead>
                                <TableHead className="w-32 text-left text-sm font-bold brandColor">{t("date")}</TableHead>
                                <TableHead className="w-20 text-left text-sm font-bold brandColor">{t("price")}</TableHead>
                                <TableHead className="w-40 text-left text-sm font-bold brandColor">{t("paymentMethod")}</TableHead>
                                <TableHead className="w-32 text-left text-sm font-bold brandColor">{t("status")}</TableHead>
                                <TableHead className="w-20 text-left text-sm font-bold brandColor rounded-r-lg">{t("action")}</TableHead>
                            </TableRow>
                        </TableHeader>
                    ) : null}

                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: 4 }).map((_, rowIndex) => (
                                <TableRow key={rowIndex} className="border-b border-gray-200 hover:bg-transparent">
                                    {Array.from({ length: 8 }).map((_, cellIndex) => (
                                        <TableCell key={cellIndex} className="py-6">
                                            <Skeleton className="h-5 w-full" />
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : transactions?.length > 0 ? (
                            transactions.map((transaction, index) => {
                                const paymentStatus = transaction?.payment_status?.toLowerCase();
                                const badgeClassName = statusClasses[paymentStatus] || "bg-gray-100 text-gray-500";

                                return (
                                    <TableRow key={transaction?.id || index} className="border-b border-gray-200 hover:bg-transparent">
                                        <TableCell className="py-6 text-left text-sm font-medium secondaryTextColor">{String(transaction?.id || index + 1).padStart(2, "0")}</TableCell>
                                        <TableCell className="py-6 text-left text-sm break-all secondaryTextColor">{transaction?.transaction_id || "-"}</TableCell>
                                        <TableCell className="py-6 text-left text-sm font-medium blueTextColor">{transaction?.order_id || "-"}</TableCell>
                                        <TableCell className="py-6 text-left text-sm secondaryTextColor">{getFormattedDate(transaction?.created_at, t)}</TableCell>
                                        <TableCell className="py-6 text-left text-sm secondaryTextColor">{currencySymbol || ""}{transaction?.amount ?? "-"}</TableCell>
                                        <TableCell className="py-6 text-left text-sm secondaryTextColor">
                                            <div className="flex flex-col gap-1">
                                                <span>{getPaymentTypeLabel(transaction?.payment_type, t)}</span>
                                                <span className="text-sm leadColor">{transaction?.payment_gateway || "-"}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-6 text-left text-sm">
                                            <span className={`inline-flex rounded-md px-4 py-2 font-medium capitalize ${badgeClassName}`}>
                                                {paymentStatus ? t(paymentStatus) : "-"}
                                            </span>
                                        </TableCell>
                                        <TableCell className="py-6 text-left text-sm">
                                            {paymentStatus === "success" ? (
                                                <button
                                                    type="button"
                                                    aria-label={t("downloadInvoice")}
                                                    title={t("downloadInvoice")}
                                                    onClick={() => handleActionClick(transaction)}
                                                    className="flex h-10 w-10 items-center justify-center rounded-md border border-gray-200 bg-gray-100 text-gray-900 transition hover:bg-gray-200"
                                                >
                                                    <CircleArrowDown className="h-5 w-5" />
                                                </button>
                                            ) : canUploadReceipt(transaction) ? (
                                                <button
                                                    type="button"
                                                    aria-label={paymentStatus === "pending" ? t("uploadReceipt") : t("reuploadReceipt")}
                                                    title={paymentStatus === "pending" ? t("uploadReceipt") : t("reuploadReceipt")}
                                                    onClick={() => handleActionClick(transaction)}
                                                    className="flex h-10 w-10 items-center justify-center rounded-md border border-gray-200 bg-gray-100 text-gray-900 transition hover:bg-gray-200"
                                                >
                                                    <CircleArrowUp className="h-5 w-5" />
                                                </button>
                                            ) : (
                                                <span className="text-gray-400">-</span>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        ) : (
                            <div className="flex mx-auto items-center justify-center gap-2 py-4">
                                <NoDataFound title={t("noTransactionHistoryTitle")} description={t("noTransactionHistoryDescription")} />
                            </div>
                        )}
                    </TableBody>
                </Table>

                <div className="flex flex-col gap-4 lg:hidden">
                    {isLoading ? (
                        Array.from({ length: 4 }).map((_, index) => (
                            <div key={index} className="rounded-xl border border-gray-200 p-4">
                                <div className="flex flex-col gap-3">
                                    {Array.from({ length: 6 }).map((_, rowIndex) => (
                                        <Skeleton key={rowIndex} className="h-5 w-full" />
                                    ))}
                                </div>
                            </div>
                        ))
                    ) : transactions?.length > 0 ? (
                        transactions.map((transaction, index) => {
                            const paymentStatus = transaction?.payment_status?.toLowerCase();
                            const badgeClassName = statusClasses[paymentStatus] || "secondaryTextColor secondaryTextBg";

                            return (
                                <div key={transaction?.id || index} className="rounded-xl border border-gray-200 p-4">
                                    <div className="flex flex-col gap-3 text-sm">
                                        <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                                            <span className="secondaryTextColor">{t("id")}</span>
                                            <span className="font-medium text-gray-900">
                                                {String(transaction?.id || index + 1).padStart(2, "0")}
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between gap-4 border-b border-gray-100 pb-2">
                                            <span className="secondaryTextColor">{t("transactionId")}</span>
                                            <span className="max-w-[65%] break-all text-right text-gray-700">{transaction?.transaction_id || "-"}</span>
                                        </div>

                                        <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                                            <span className="secondaryTextColor">{t("orderId")}</span>
                                            <span className="text-right font-medium blueTextColor">{transaction?.order_id || "-"}</span>
                                        </div>

                                        <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                                            <span className="secondaryTextColor">{t("date")}</span>
                                            <span className="text-gray-700">{getFormattedDate(transaction?.created_at, t)}</span>
                                        </div>

                                        <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                                            <span className="secondaryTextColor">{t("price")}</span>
                                            <span className="text-gray-700">{currencySymbol || ""}{transaction?.amount ?? "-"}</span>
                                        </div>

                                        <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                                            <span className="secondaryTextColor">{t("paymentMethod")}</span>
                                            <div className="flex max-w-[65%] flex-col items-end gap-1 text-right">
                                                <span className="leadColor">{getPaymentTypeLabel(transaction?.payment_type, t)}</span>
                                                <span className="secondaryTextColor">{transaction?.payment_gateway || "-"}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                                            <span className="secondaryTextColor">{t("status")}</span>
                                            <span className={`inline-flex rounded-md px-3 py-1 font-medium capitalize ${badgeClassName}`}>
                                                {paymentStatus ? t(paymentStatus) : "-"}
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <span className="secondaryTextColor">{t("action")}</span>
                                            {paymentStatus === "success" ? (
                                                <button
                                                    type="button"
                                                    aria-label={t("downloadInvoice")}
                                                    title={t("downloadInvoice")}
                                                    onClick={() => handleActionClick(transaction)}
                                                    className="flex h-10 w-10 items-center justify-center rounded-md border border-gray-200 bg-gray-100 text-gray-900 transition hover:bg-gray-200"
                                                >
                                                    <CircleArrowDown className="h-5 w-5" />
                                                </button>
                                            ) : canUploadReceipt(transaction) ? (
                                                <button
                                                    type="button"
                                                    aria-label={paymentStatus === "pending" ? t("uploadReceipt") : t("reuploadReceipt")}
                                                    title={paymentStatus === "pending" ? t("uploadReceipt") : t("reuploadReceipt")}
                                                    onClick={() => handleActionClick(transaction)}
                                                    className="flex h-10 w-10 items-center justify-center rounded-md border border-gray-200 bg-gray-100 text-gray-900 transition hover:bg-gray-200"
                                                >
                                                    <CircleArrowUp className="h-5 w-5" />
                                                </button>
                                            ) : (
                                                <span className="text-gray-400">-</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="flex mx-auto items-center justify-center gap-2 py-4">
                            <NoDataFound title={t("noTransactionHistoryTitle")} description={t("noTransactionHistoryDescription")} />
                        </div>
                    )}
                </div>
            </div>

            {!isLoading && transactions?.length > 0 && (
                <div className={`border-t mt-auto border-gray-200 px-4 ${isPageLoading ? "opacity-50" : "opacity-100"}`}>
                    <CustomPagination
                        currentPage={pagination.currentPage}
                        totalItems={pagination.totalRecords}
                        itemsPerPage={pagination.limit}
                        onPageChange={(page) => fetchTransactions(page)}
                        isLoading={isPageLoading}
                        className="!border-0 !rounded-none !px-0 !py-4"
                        translations={{
                            showing: t("showing"),
                            to: t("to"),
                            of: t("of"),
                            entries: t("entries"),
                        }}
                    />
                </div>
            )}

            <UploadFileReceiptModal
                open={uploadFileReceiptModal}
                onClose={() => setUploadFileReceiptModal(false)}
                transaction={selectedTransaction}
                onSuccess={() => fetchTransactions(pagination.currentPage)}
            />
        </div>
    );
};

export default UserTransactionHistory;