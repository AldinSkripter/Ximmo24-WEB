import Script from "next/script";
import { CLARITY_PROJECT_ID } from "@/utils/analytics";

const MicrosoftClarity = () => {
  if (!CLARITY_PROJECT_ID) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[MicrosoftClarity] NEXT_PUBLIC_CLARITY_PROJECT_ID is not set — Clarity will not load."
      );
    }
    return null;
  }

  return (
    <Script id="ms-clarity-init" strategy="afterInteractive">
      {`
        (function(c,l,a,r,i,t,y){
            c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
            t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
            y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
        })(window, document, "clarity", "script", "${CLARITY_PROJECT_ID}");
      `}
    </Script>
  );
};

export default MicrosoftClarity;
