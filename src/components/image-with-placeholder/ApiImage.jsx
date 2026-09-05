import { ReactSVG } from "react-svg";

/**
 * Renders API-managed images without assuming their file format.
 * Administrators may upload SVG, PNG, WebP or JPEG assets.
 */
const ApiImage = ({ src, alt = "", className = "", beforeInjection, ...props }) => {
  if (!src) return null;

  const cleanPath = src.split("?")[0].split("#")[0].toLowerCase();
  if (cleanPath.endsWith(".svg")) {
    return (
      <ReactSVG
        src={src}
        beforeInjection={beforeInjection}
        className={className}
        {...props}
      />
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={`h-full w-full object-contain ${className}`}
      loading="lazy"
      {...props}
    />
  );
};

export default ApiImage;
