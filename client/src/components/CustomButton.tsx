import React from "react";

interface ButtonProps {
  styles?: string;
  title: string;
  btnType: "button" | "submit" | "reset"; // Restricting to valid button types
  handleClick?: () => void;
}

const CustomButton: React.FC<ButtonProps> = ({
  btnType,
  title,
  handleClick,
  styles,
}) => {
  return (
    <button
      type={btnType}
      className={`font-epilogue font-semibold text-[16px] leading-[26px] text-white min-h-[52px] px-4 rounded-[10px] ${styles}`}
      onClick={handleClick}
    >
      {title}
    </button>
  );
};

export default CustomButton;
