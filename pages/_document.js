import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="de" web-version={process.env.NEXT_PUBLIC_WEB_VERSION} seo={process.env.NEXT_PUBLIC_SEO}>
      <Head>
        <link rel="icon" href="/favicon.ico" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=JSON.parse(localStorage.getItem("ximmo24-theme")||"{}");var s=document.documentElement.style;var m={"--primary-color":t.primary,"--primary-category-background":t.category,"--primary-sell":t.sell,"--primary-rent":t.rent,"--primary-sell-bg":t.sellBg,"--primary-rent-bg":t.rentBg};Object.keys(m).forEach(function(k){if(typeof m[k]==="string"&&m[k])s.setProperty(k,m[k])})}catch(e){}})();`,
          }}
        />
      </Head>
      <body className="!pointer-events-auto antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
