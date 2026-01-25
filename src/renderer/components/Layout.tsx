import React from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";


interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onChangePage: (page: string) => void;
}

const Layout: React.FC<LayoutProps> = ({
  children,
  currentPage,
  onChangePage,
}) => {
  return (
    <div className="flex text-neutral-900 h-screen bg-erp-bg">
      <Sidebar currentPage={currentPage} onChangePage={onChangePage} />
      <div className="flex-1 flex flex-col border-l border-erp-border bg-erp-surface shadow-sm">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6 bg-erp-bg">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
