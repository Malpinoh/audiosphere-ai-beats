
import React from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, Music, TrendingUp, Shield, Clock } from "lucide-react";

const ServiceInfoPage = () => {
  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            How MAUDIO Works
          </h1>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            Discover how our music streaming platform operates and what makes your listening experience special.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <Card className="maudio-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-400" />
                Monthly Listeners
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-purple-400" />
                  <span className="text-sm text-gray-300">Updates every 28th of the month</span>
                </div>
                <p className="text-gray-300 text-sm">
                  Artist monthly listener counts are automatically calculated based on unique listeners 
                  from the past 30 days. This metric updates precisely at 2:00 AM UTC on the 28th of every month.
                </p>
                <Badge variant="outline" className="text-purple-400 border-purple-400">
                  Automated System
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="maudio-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-pink-400" />
                Play Count Tracking
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-pink-400" />
                  <span className="text-sm text-gray-300">Real-time updates</span>
                </div>
                <p className="text-gray-300 text-sm">
                  Every play is tracked instantly to provide accurate statistics for artists and listeners. 
                  Play counts update in real-time across the platform.
                </p>
                <Badge variant="outline" className="text-pink-400 border-pink-400">
                  Live Data
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 mb-8">
          <Card className="maudio-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Music className="h-5 w-5 text-blue-400" />
                Music Discovery & Charts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-gray-300">
                  Our platform features both global and regional music charts that help you discover trending tracks:
                </p>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="p-3 rounded-lg bg-slate-800/50">
                    <h4 className="font-semibold text-blue-400 mb-1">Global Charts</h4>
                    <p className="text-sm text-gray-300">
                      Worldwide trending tracks based on total play counts across all regions.
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-800/50">
                    <h4 className="font-semibold text-blue-400 mb-1">Regional Charts</h4>
                    <p className="text-sm text-gray-300">
                      Location-specific trending music showing what's popular in your area.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="maudio-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-400" />
                Artist Verification
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-gray-300">
                  Artists can earn verified status through our automated and manual verification systems:
                </p>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-green-400 mt-2 flex-shrink-0"></div>
                    <div>
                      <h4 className="font-semibold text-green-400">Automatic Verification</h4>
                      <p className="text-sm text-gray-300">
                        Artists with 1,000+ followers are automatically verified
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-green-400 mt-2 flex-shrink-0"></div>
                    <div>
                      <h4 className="font-semibold text-green-400">Manual Verification</h4>
                      <p className="text-sm text-gray-300">
                        Submit verification requests through your account settings
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="maudio-card">
          <CardHeader>
            <CardTitle>Platform Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center p-4">
                <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-3">
                  <Music className="h-6 w-6 text-purple-400" />
                </div>
                <h4 className="font-semibold mb-2">Music Streaming</h4>
                <p className="text-sm text-gray-300">
                  High-quality audio streaming with instant playback
                </p>
              </div>
              <div className="text-center p-4">
                <div className="w-12 h-12 rounded-full bg-pink-500/20 flex items-center justify-center mx-auto mb-3">
                  <Users className="h-6 w-6 text-pink-400" />
                </div>
                <h4 className="font-semibold mb-2">Artist Profiles</h4>
                <p className="text-sm text-gray-300">
                  Complete artist pages with tracks, followers, and stats
                </p>
              </div>
              <div className="text-center p-4">
                <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-3">
                  <TrendingUp className="h-6 w-6 text-blue-400" />
                </div>
                <h4 className="font-semibold mb-2">Analytics</h4>
                <p className="text-sm text-gray-300">
                  Real-time statistics and performance metrics
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <p className="text-gray-400 text-sm">
            Last updated: {new Date().toLocaleDateString()} | 
            Monthly listener updates: Every 28th at 2:00 AM UTC
          </p>
        </div>
      </div>
    </MainLayout>
  );
};

export default ServiceInfoPage;
