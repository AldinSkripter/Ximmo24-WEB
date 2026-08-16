
const AuthButton = ({ onClick, text, icon }) => {
    return (
        <button
            type="button"
            className="btnBorder flex w-full items-center justify-center gap-2 rounded-lg p-2 text-sm transition-all sm:gap-[10px] sm:p-[10px] sm:text-base md:text-base"
            onClick={onClick}
        >
            <span className="flex-shrink-0">{icon}</span>
            <span className="truncate">{text}</span>
        </button>
    );
};

export default AuthButton