import React from "react";

interface CardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

const Card: React.FC<CardProps> = ({ title, description, children }) => {
  return (
    <section
      className="
        bg-white 
        border border-erp-border 
        rounded-lg 
        p-5 
        shadow-sm
        transition-all
        duration-200
      "
    >
      <header className="mb-4">
        <h2 className="text-sm font-semibold text-neutral-900 tracking-tight">
          {title}
        </h2>

        {description && (
          <p className="text-xs text-erp-text-secondary mt-1 leading-relaxed">
            {description}
          </p>
        )}
      </header>

      <div className="text-neutral-900">{children}</div>
    </section>
  );
};

export default Card;
