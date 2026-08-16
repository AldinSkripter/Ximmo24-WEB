"use client";
import { useTranslation } from "@/components/context/TranslationContext";
import { IoMdArrowBack } from "react-icons/io";
import { motion } from "framer-motion";
import { useRouter } from "next/router";
import { useSelector } from "react-redux";
import dynamic from "next/dynamic";

const NotFound404Placeholder = dynamic(
  () => import("@/components/reusable-components/icons/NotFound404Placeholder"),
  { loading: () => <div style={{ width: 500, height: 500 }} />, ssr: false }
);

const Index = () => {
  const t = useTranslation();
  const router = useRouter();
  const webSettings = useSelector((state) => state.WebSetting?.data);

  return (
    <div className="flex h-screen flex-col items-center justify-center">
      <div className="text-center">
        <div>
          <NotFound404Placeholder
            color={webSettings?.system_color}
            width="500"
            height="500" />
        </div>
        <div className="flex flex-col items-center justify-center">
          <h3 className="primaryColor text-3xl font-semibold">404</h3>
          <span>{t("pageNotFound")}</span>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="primaryBg primaryTextColor mt-4 flex items-center justify-center gap-2 rounded-md px-4 py-2"
            onClick={() => router.push(`/`)}
          >
            <IoMdArrowBack size={18} /> {t("backToHome")}
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default Index;
