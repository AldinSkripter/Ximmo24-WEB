import { IoHomeOutline } from "react-icons/io5";

const Ximmo24Brand = ({ className = "" }) => (
  <span
    className={`inline-flex select-none items-center gap-2 whitespace-nowrap ${className}`}
    aria-label="Ximmo24"
  >
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-[3px] border-[#13c9db] bg-white text-[#172033]">
      <IoHomeOutline className="h-6 w-6" aria-hidden="true" />
    </span>
    <span className="text-[28px] font-semibold leading-none tracking-[-0.04em] text-[#172033]">
      Ximmo<span className="text-[#13c9db]">24</span>
    </span>
  </span>
);

export default Ximmo24Brand;
