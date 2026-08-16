import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

export default [
    ...nextCoreWebVitals,
    {
        rules: {
            "react-hooks/exhaustive-deps": "off",
        },
    },
];