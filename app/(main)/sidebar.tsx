"use client";

import { useState } from "react";
import { usePathname, useRouter } from 'next/navigation';
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";
import { createClient } from "@supabase/supabase-js";

const navItems = [
    { label: "Dashboard", href: "/simulator" },
    { label: "Clients", href: "/simulator/clients" },
    { label: "Surveys", href: "/simulator/surveys" },
    { label: "Reports", href: "/simulator/reports" },
    { label: "Panel", href: "/admin/panel" },
    { label: "Admin", href: "/admin/users" },
];

export default function Sidebar({ user }) {
    const [menuOpen, setMenuOpen] = useState(false);
    const pathname = usePathname();
    const router = useRouter();
    const permissions = user?.app_metadata?.permissions ?? [];

    const handleLogout = async () => {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        await supabase.auth.signOut();
        router.push("/login");
    };

    const NavLinks = () => (
        <ul className="space-y-4">
            {navItems
                .filter(item => permissions.includes(item.href))
                .map(item => {
                    const isActive = pathname.startsWith(item.href);
                    return (
                        <li key={item.href}>
                            <Link
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-2 rounded-full transition-all hover:bg-white/10",
                                    isActive ? "bg-white/20 font-bold" : ""
                                )}
                                onClick={() => setMenuOpen(false)}
                            >
                                {item.label}
                            </Link>
                        </li>
                    );
                })}
            {/* Logout Button */}
            <li>
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2 rounded-full transition-all hover:bg-white/10 text-left w-full"
                >
                    Logout
                </button>
            </li>
        </ul>
    );

    return (
        <>
            {/* Desktop Sidebar */}
            <aside className="hidden md:block w-64 min-h-screen bg-gradient-to-br from-blue-600 to-purple-600 p-6 text-white shadow-lg rounded-r-2xl">
                <h2 className="font-bold text-2xl mb-8 tracking-wide">Simulator</h2>
                <NavLinks />
            </aside>

            {/* Mobile Menu Button */}
            <div className="md:hidden fixed top-4 right-4 z-50">
                <button onClick={() => setMenuOpen(!menuOpen)} className="p-2 bg-gray-800 text-white rounded-full">
                    {menuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Mobile Sidebar (Overlay) */}
            {menuOpen && (
                <div className="md:hidden fixed inset-0 z-40">
                    <div className="absolute inset-0 bg-black opacity-50" onClick={() => setMenuOpen(false)}></div>
                    <aside className="absolute top-0 left-0 w-64 h-full bg-gradient-to-br from-blue-600 to-purple-600 p-6 text-white shadow-lg">
                        <h2 className="font-bold text-2xl mb-8 tracking-wide">Simulator</h2>
                        <NavLinks />
                    </aside>
                </div>
            )}
        </>
    );
}