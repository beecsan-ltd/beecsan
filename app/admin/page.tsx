'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Package, Users, FileText, ImageIcon, TrendingUp } from 'lucide-react'
import {
  onProductsUpdate,
  onUsersUpdate,
  onReportsUpdate,
  onBannersUpdate,
} from '@/lib/firebase-admin'

interface DashboardStats {
  totalProducts: number
  totalUsers: number
  totalReports: number
  totalBanners: number
  revenue: number
  totalFollowUps: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalUsers: 0,
    totalReports: 0,
    totalBanners: 0,
    revenue: 0,
    totalFollowUps: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribeProducts = onProductsUpdate((snapshot: any) => {
      setStats((prev) => ({ ...prev, totalProducts: snapshot.size }))
    })

    const unsubscribeUsers = onUsersUpdate((snapshot: any) => {
      setStats((prev) => ({ ...prev, totalUsers: snapshot.size }))
    })

    const unsubscribeReports = onReportsUpdate((snapshot: any) => {
      setStats((prev) => ({ ...prev, totalReports: snapshot.size }))
    })

    const unsubscribeBanners = onBannersUpdate((snapshot: any) => {
      setStats((prev) => ({ ...prev, totalBanners: snapshot.size }))
      setLoading(false)
    })

    return () => {
      unsubscribeProducts()
      unsubscribeUsers()
      unsubscribeReports()
      unsubscribeBanners()
    }
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-foreground">Loading dashboard...</p>
      </div>
    )
  }

  const statCards = [
    {
      title: 'Total Products',
      value: stats.totalProducts,
      icon: Package,
      color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    },
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      color: 'bg-green-500/10 text-green-600 dark:text-green-400',
    },
    {
      title: 'Reports',
      value: stats.totalReports,
      icon: FileText,
      color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
    },
    {
      title: 'Active Banners',
      value: stats.totalBanners,
      icon: ImageIcon,
      color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
    },
    {
      title: 'follow up',
      value: stats.totalFollowUps,
      icon: TrendingUp,
      color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
    },
    
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Welcome back! Here's your platform overview.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map(({ title, value, icon: Icon, color }) => (
          <Card key={title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-foreground">{title}</CardTitle>
              <div className={`p-2 rounded-lg ${color}`}>
                <Icon size={20} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {title === 'Total Products' && 'All active listings'}
                {title === 'Total Users' && 'Registered members'}
                {title === 'Reports' && 'Pending review'}
                {title === 'Active Banners' && 'Currently active'}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-foreground">Total Revenue</CardTitle>
              <CardDescription>This month's earnings</CardDescription>
            </div>
            <TrendingUp className="text-green-500" size={24} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-foreground">{stats.revenue}</div>
          <p className="text-muted-foreground text-sm mt-2">
            Updated in real-time from your Firestore database
          </p>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-foreground">Quick Actions</CardTitle>
          <CardDescription>Access management tools</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Manage Products', href: '/admin/products' },
              { label: 'Manage Users', href: '/admin/users' },
              { label: 'View Reports', href: '/admin/reports' },
              { label: 'Manage Banners', href: '/admin/banners' },
              { label: 'Product analyze', href: '/admin/sellers' },
            ].map(({ label, href }) => (
              <a
                key={href}
                href={href}
                className="p-4 border border-border rounded-lg hover:bg-muted transition-colors text-center font-medium text-foreground"
              >
                {label}
              </a>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
