import React, { useState, useEffect } from "react";
import {
  ArrowDown2,
  HambergerMenu,
  Menu,
  Box,
  Setting2,
  Calculator,
  RefreshCircle,
  ReceiptText,
  ArrowDown,
  ArrowUp,
  Home2,
  Box1,
  ClipboardText,
  AddCircle,
  User,
  Weight,
} from "iconsax-react";
import { useAuth } from "../context/AuthContext";
import { MenuIcon } from "lucide-react";

interface SidebarSubItem {
  id: string;
  label: string;
  icon: React.ElementType;
}

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ElementType;
  adminOnly?: boolean;
  children?: SidebarSubItem[];
}

const allItems: SidebarItem[] = [
  { id: "dashboard", label: "Dashboard", icon: Home2 },
  { id: "user", label: "User", icon: User },
  {
    id: "products",
    label: "Products",
    icon: Box1,
    children: [
      { id: "products-all", label: "All Products", icon: ClipboardText },
      { id: "products-add", label: "Add Product", icon: AddCircle },
    ],
  },
  {
    id: "stock",
    label: "Stock",
    icon: Box,
    adminOnly: true,
    children: [
      { id: "stock-in", label: "Stock In", icon: ArrowDown },
      { id: "stock-out", label: "Stock Out", icon: ArrowUp },
    ],
  },
  { id: "weight", label: "Weight Entry", icon: Weight },
  { id: "weight-history", label: "Weight History", icon: ClipboardText },
  {
    id: "tally",
    label: "Tally",
    icon: Calculator,
    adminOnly: true,
    children: [
      { id: "tally-sync", label: "Sync Data", icon: RefreshCircle },
      { id: "tally-vouchers", label: "Vouchers", icon: ReceiptText },
      { id: "tally-settings", label: "Settings", icon: Setting2 },
    ],
  },
];

interface SidebarProps {
  currentPage: string;
  onChangePage: (page: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentPage, onChangePage }) => {
  const { user, isAdmin } = useAuth();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});

  const items = allItems.filter((item) => !item.adminOnly || isAdmin);

  useEffect(() => {
    const newOpenMenus: Record<string, boolean> = {};
    items.forEach((item) => {
      if (item.children) {
        const hasActiveChild = item.children.some(
          (child) => currentPage === child.id
        );
        if (hasActiveChild) {
          newOpenMenus[item.id] = true;
        }
      }
    });
    setOpenMenus((prev) => {
      const updated = { ...prev, ...newOpenMenus };
      return updated;
    });
  }, [currentPage]);

  const toggleMenu = (id: string) => {
    const item = items.find((i) => i.id === id);
    const hasActiveChild = item?.children?.some(
      (child) => currentPage === child.id
    );

    if (hasActiveChild && openMenus[id]) {
      return;
    }

    setOpenMenus((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isMobileOpen) {
        setIsMobileOpen(false);
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isMobileOpen]);

  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileOpen]);

  const handlePageChange = (page: string) => {
    onChangePage(page);
    setIsMobileOpen(false);
  };

  return (
    <>
      <div
        className={`fixed inset-0 z-30 bg-neutral-900/10 backdrop-blur-sm transition-opacity duration-150 lg:hidden ${isMobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
        onClick={() => setIsMobileOpen(false)}
      />

      <aside
        className={`
            fixed top-0 left-0 z-40 flex h-full flex-col border-r border-neutral-200 bg-neutral-50 transition-all duration-300 ease-out lg:relative
            ${isMobileOpen
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0"
          }
            ${isCollapsed ? "lg:w-[64px]" : "w-[260px] lg:w-[260px]"}
          `}
      >
        <div className="flex h-[64px] items-center justify-between border-b border-neutral-200 bg-neutral-50 px-4">
          <div
            className={`flex items-center gap-3 transition-all ${isCollapsed ? "lg:w-full lg:justify-center" : ""
              }`}
          >
            <div
              className={`min-w-0 transition-all ${isCollapsed ? "lg:hidden lg:w-0 lg:opacity-0" : "opacity-100"
                }`}
            >
              <h1 className="text-[15px] font-semibold tracking-tight text-neutral-900">
                Rvl Polytech
              </h1>
              <p className="mt-0.5 text-[11px] text-neutral-600 font-medium">
                Inventory System
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsCollapsed((prev) => !prev)}
            className="hidden h-8 w-8 items-center justify-center rounded-lg transition-all hover:bg-neutral-100 active:scale-95 lg:flex"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <MenuIcon size={17} className="text-neutral-600" />
          </button>

          <button
            type="button"
            onClick={() => setIsMobileOpen(false)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 bg-neutral-50 backdrop-blur-sm transition-all hover:bg-neutral-100 active:scale-95 lg:hidden"
            aria-label="Close sidebar"
          >
            <Menu size={18} className="text-neutral-900" />
          </button>
        </div>

        <div
          className={`flex h-[72px] items-center border-b border-neutral-200 px-4 transition-all ${isCollapsed ? "lg:px-2" : ""
            }`}
        >
          {isCollapsed ? (
            <div className="hidden w-full justify-center lg:flex">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-100 border border-neutral-200">
                <span className="text-sm font-semibold text-neutral-900">
                  {user?.username?.charAt(0)?.toUpperCase() ?? "A"}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 px-1 w-full">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-100 border border-neutral-200">
                <span className="text-sm font-semibold text-neutral-900">
                  {user?.username?.charAt(0)?.toUpperCase() ?? "A"}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold text-neutral-900">
                  {user?.username ?? "User"}
                </p>
                <p className="text-[11px] text-neutral-600 font-medium">
                  {isAdmin ? "Administrator" : "User"}
                </p>
              </div>
            </div>
          )}
        </div>

        <nav
          className={`flex-1 space-y-1 overflow-y-auto py-4 transition-all scrollbar-thin scrollbar-thumb-neutral-200 scrollbar-track-transparent ${isCollapsed ? "lg:px-2" : "px-3"
            }`}
        >
          {items.map((item) => {
            const Icon = item.icon;
            const hasActiveChild = item.children?.some(
              (child) => currentPage === child.id
            );
            const isActive = currentPage === item.id || hasActiveChild;
            const isOpen =
              openMenus[item.id] !== undefined
                ? openMenus[item.id]
                : hasActiveChild;

            return (
              <div key={item.id} className="space-y-1">
                <button
                  type="button"
                  onClick={() =>
                    item.children
                      ? toggleMenu(item.id)
                      : handlePageChange(item.id)
                  }
                  className={`
            group flex w-full items-center gap-3 rounded-lg px-3 py-2
            text-[13px] font-medium transition-all duration-150
            ${isActive && !hasActiveChild
                      ? "bg-neutral-100 text-neutral-900 border border-neutral-300"
                      : isActive && hasActiveChild
                        ? "text-neutral-900 font-semibold"
                        : "text-neutral-600 hover:bg-neutral-200/60 hover:text-neutral-900"
                    }
                ${isCollapsed ? "lg:justify-center lg:px-2" : ""}
          `}
                >
                  <div
                    className={`
              flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-150
              ${isActive && !hasActiveChild
                        ? " text-neutral-900 border-none  border-neutral-200"
                        : isActive && hasActiveChild
                          ? "bg-neutral-100  border-none text-neutral-900"
                          : "group-hover:bg-neutral-100 text-neutral-600"
                      }
            `}
                  >
                    <Icon size={18} />
                  </div>

                  {!isCollapsed && (
                    <>
                      <span className="flex-1 text-left">{item.label}</span>

                      {item.children && (
                        <ArrowDown2
                          size={14}
                          className={`transition-transform duration-150 ${isOpen ? "rotate-180" : ""
                            }`}
                        />
                      )}
                    </>
                  )}
                </button>

                {!isCollapsed && item.children && isOpen && (
                  <div className="ml-6 space-y-1 pt-1 pb-2 border-l border-neutral-200 pl-3">
                    {item.children.map((sub) => {
                      const SubIcon = sub.icon;
                      const subActive = currentPage === sub.id;

                      return (
                        <button
                          key={sub.id}
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handlePageChange(sub.id);
                          }}
                          className={`
                    group flex w-full items-center gap-2.5 rounded-lg px-2 py-2
                    text-[12.5px] font-medium transition-all duration-150
                    ${subActive
                              ? "bg-neutral-100 text-neutral-900 border border-neutral-300"
                              : "text-neutral-600 hover:bg-neutral-200/60 hover:text-neutral-900"
                            }
                  `}
                        >
                          <div
                            className={`
                              flex h-7 w-7 items-center justify-center rounded-md transition-all duration-150

                            `}
                          >
                            <SubIcon size={16} />
                          </div>
                          <span className="flex-1 text-left">{sub.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div
          className={`flex h-[68px] items-center border-t border-neutral-200 px-4 transition ${isCollapsed ? "lg:px-2" : ""
            }`}
        >
          {isCollapsed ? (
            <div className="hidden w-full flex-col items-center gap-2 lg:flex">
              <div className="h-2 w-2 rounded-full bg-neutral-400" />
            </div>
          ) : (
            <div className="space-y-1 text-[11px] w-full">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-neutral-400" />
                <span className="font-medium text-neutral-600">
                  System Online
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-neutral-300" />
                <span className="text-neutral-600 font-medium">
                  Database Connected
                </span>
              </div>
            </div>
          )}
        </div>
      </aside>

      {!isMobileOpen && (
        <button
          type="button"
          onClick={() => setIsMobileOpen(true)}
          className="fixed left-4 top-4 z-50 flex h-11 w-11 items-center justify-center rounded-lg border border-neutral-200 bg-neutral-50 backdrop-blur-sm transition-all duration-150 hover:bg-neutral-100 active:scale-95 lg:hidden"
          aria-label="Open sidebar"
        >
          <HambergerMenu size={20} className="text-neutral-900" />
        </button>
      )}
    </>
  );
};

export default Sidebar;
