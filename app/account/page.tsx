"use client"

import { useEffect, useState } from "react"
import { Navbar } from "@/components/layout/Navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { Calendar, Download, Calculator, CreditCard, User } from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import type { User as SupabaseUser } from "@supabase/supabase-js"

export default function AccountPage() {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = getSupabaseBrowserClient()

    const getUser = async () => {
      const { data } = await supabase.auth.getUser()
      setUser(data.user)
      setLoading(false)
    }

    getUser()
  }, [])

  // Mock data for calculations - will be replaced with real data from database
  const pastCalculations = [
    {
      id: 1,
      type: "Valuation Calculator",
      date: "2025-01-15",
      result: "$1,624,000",
      status: "Excellent",
    },
    {
      id: 2,
      type: "Valuation Calculator",
      date: "2025-01-10",
      result: "$1,450,000",
      status: "Good",
    },
    {
      id: 3,
      type: "Valuation Calculator",
      date: "2025-01-05",
      result: "$1,200,000",
      status: "Fair",
    },
  ]

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500"
      case "expired":
        return "bg-red-500"
      case "trial":
        return "bg-blue-500"
      default:
        return "bg-gray-500"
    }
  }

  const getUserInitials = () => {
    if (!user?.email) return "U"
    const email = user.email
    const parts = email.split("@")[0].split(".")
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return email.substring(0, 2).toUpperCase()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <Skeleton className="h-10 w-64 mb-2" />
            <Skeleton className="h-5 w-96" />
          </div>
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-6">
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
            <div className="lg:col-span-2">
              <Skeleton className="h-96 w-full" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">My Account</h1>
          <p className="text-muted-foreground">Manage your profile, subscription, and calculation history</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - User Info & Subscription */}
          <div className="lg:col-span-1 space-y-6">
            {/* User Profile Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="text-lg">{getUserInitials()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{user?.email?.split("@")[0] || "User"}</p>
                    <p className="text-sm text-muted-foreground">{user?.email}</p>
                  </div>
                </div>
                <Separator />
                <Button variant="outline" className="w-full bg-transparent">
                  Edit Profile
                </Button>
              </CardContent>
            </Card>

            {/* Subscription Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Subscription
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Plan</span>
                    <Badge variant="secondary">Free Trial</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${getStatusColor("trial")}`} />
                      <span className="text-sm font-medium capitalize">Trial</span>
                    </div>
                  </div>
                </div>
                <Separator />
                <div className="space-y-2">
                  <Button className="w-full">Upgrade Plan</Button>
                  <Button variant="ghost" className="w-full text-muted-foreground">
                    Billing History
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Calculations History */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Past Calculations
                </CardTitle>
                <CardDescription>View and download your previous calculation reports</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pastCalculations.map((calc) => (
                    <div
                      key={calc.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start gap-4 flex-1">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Calculator className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{calc.type}</p>
                          <div className="flex items-center gap-4 mt-1">
                            <span className="text-sm text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(calc.date)}
                            </span>
                            <Badge variant="secondary" className="text-xs">
                              {calc.status}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-lg">{calc.result}</p>
                          <p className="text-xs text-muted-foreground">Estimated Value</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="ml-4">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}

                  {pastCalculations.length === 0 && (
                    <div className="text-center py-12">
                      <Calculator className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No calculations yet</p>
                      <p className="text-sm text-muted-foreground mt-1">Start by using one of our calculators</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Download History Card */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Download History
                </CardTitle>
                <CardDescription>Recent PDF report downloads</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {pastCalculations.slice(0, 2).map((calc) => (
                    <div
                      key={`download-${calc.id}`}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-muted rounded">
                          <Download className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            {calc.type} Report - {calc.result}
                          </p>
                          <p className="text-xs text-muted-foreground">Downloaded on {formatDate(calc.date)}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        Re-download
                      </Button>
                    </div>
                  ))}

                  {pastCalculations.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-sm text-muted-foreground">No downloads yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
