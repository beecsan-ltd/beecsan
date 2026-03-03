'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { LayoutDashboard, Package, Users, BarChart3, Images, LogOut, Menu, X, Loader2, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth-context' // ✅ Isticmaal useAuth halkii localStorage
import { Analytics } from '@vercel/analytics/next'

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/reports', label: 'Reports', icon: BarChart3 },
  { href: '/admin/banners', label: 'Banners', icon: Images },
  { href: '/admin/sellers', label: 'Sellers', icon: TrendingUp },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const { user, loading, logout } = useAuth() // ✅ Xogta rasmiga ah ee Firebase
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // 🛡️ Admin Guard: Kaliya tuur haddii auth-ku dhamaado oo qofka la aqoonsan waayo
    if (!loading) {
      if (!user || user.role !== 'admin') {
        console.log("Layout Guard: Not an admin, redirecting...");
        router.push('/auth/login')
      }
    }
  }, [user, loading, router])

  // 🔄 Muuji Loading inta laga xaqiijinayo auth-ka
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white">
        <Loader2 className="w-12 h-12 border-primary animate-spin text-[#4d1d80] mb-4" />
        <p className="text-slate-600 font-bold">Amniga Dashboard-ka la xaqiijinayaa...</p>
      </div>
    )
  }

  // Haddii uusan ahayn admin, ha muujin wax koodh ah
  if (!user || user.role !== 'admin') return null

  const handleLogout = async () => {
    await logout()
    router.push('/auth/login')
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-50 lg:hidden bg-[#4d1d80] text-white p-3 rounded-lg shadow-lg"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full w-64 bg-white border-r transform transition-transform duration-200 ease-in-out z-40 lg:relative lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full p-6">
          <div className="mb-8">
            <h1 className="text-2xl font-black text-[#4d1d80]">Admin Panel</h1>
            <p className="text-slate-400 text-xs mt-1 uppercase tracking-widest font-bold">Beecsan Control</p>
          </div>

          <nav className="flex-1 space-y-2">
            {navItems.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href || (href !== '/admin' && pathname.startsWith(href))
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${
                    isActive
                      ? 'bg-[#4d1d80] text-white shadow-md'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Icon size={18} />
                  <span>{label}</span>
                </Link>
              )
            })}
          </nav>

          <div className="pt-4 border-t border-slate-100">
            <div className="mb-4 px-4 py-3 bg-slate-50 rounded-xl">
               <p className="text-[10px] font-bold text-slate-400 uppercase">Logged in as</p>
               <p className="text-sm font-bold text-slate-700 truncate">{user.email}</p>
            </div>
            <Button
              onClick={handleLogout}
              variant="ghost"
              className="w-full justify-start gap-3 text-red-600 hover:bg-red-50 hover:text-red-700 font-bold rounded-xl"
            >
              <LogOut size={18} />
              <span>Sign Out</span>
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-[#FAFBFC]">
        <div className="p-4 md:p-10 max-w-7xl mx-auto">{children}</div>
      </main>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}