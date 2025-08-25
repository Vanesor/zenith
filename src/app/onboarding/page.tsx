"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { User, Phone, Calendar, Check, Users, Star } from "lucide-react";
import { ZenithLogo } from "@/components/ZenithLogo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { unstable_noStore as noStore } from 'next/cache';

export const dynamic = 'force-dynamic';

interface Club {
  id: string;
  name: string;
  description: string;
  member_count: number;
  leadership_count: number;
}

export default function OnboardingPage() {
  noStore(); // Prevent static generation
  const sessionData = useSession();
  const { data: session, status } = sessionData || { data: null, status: 'loading' };
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    dateOfBirth: "",
    selectedClub: "",
    agreeToTerms: false,
  });
  const [clubs, setClubs] = useState<Club[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  // Load clubs data
  useEffect(() => {
    const fetchClubs = async () => {
      try {
        const response = await fetch('/api/clubs');
        if (response.ok) {
          const data = await response.json();
          // Handle the API response structure
          const clubData = data.clubs || data;
          setClubs(clubData.map((club: any) => ({
            id: club.id,
            name: club.name,
            description: club.description,
            member_count: club.memberCount || club.member_count || 0,
            leadership_count: club.leadership?.length || 0,
          })));
        }
      } catch (error) {
        console.error('Failed to fetch clubs:', error);
      }
    };
    
    fetchClubs();
  }, []);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Pre-fill name if available from OAuth
  useEffect(() => {
    if (session?.user?.name) {
      const nameParts = session.user.name.split(" ");
      setFormData((prev) => ({
        ...prev,
        firstName: nameParts[0] || "",
        lastName: nameParts.slice(1).join(" ") || "",
      }));
    }
  }, [session]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Validation
    if (!formData.agreeToTerms) {
      setError("Please agree to the terms and conditions");
      setIsLoading(false);
      return;
    }

    if (!formData.selectedClub) {
      setError("Please select a club or choose 'No club affiliation'");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/complete-onboarding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          selectedClub: formData.selectedClub,
          phone: formData.phone,
          dateOfBirth: formData.dateOfBirth,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Profile completed successfully
        router.push("/dashboard");
      } else {
        setError(data.error || "Failed to complete profile");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-zenith-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-blue-900 flex items-center justify-center p-4 transition-colors duration-300">
      <ThemeToggle />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-2xl"
      >
        {/* Onboarding Card */}
        <div className="bg-card rounded-2xl shadow-xl p-8 border border-custom dark:border-gray-700">
          {/* Logo */}
          <div className="text-center mb-8">
            <ZenithLogo size="lg" className="justify-center mb-4" />
            <h1 className="text-2xl font-bold text-primary">
              Complete Your Profile
            </h1>
            <p className="text-zenith-secondary dark:text-zenith-muted mt-2">
              Just a few more details to get you started
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {/* Onboarding Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Welcome Message */}
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-zenith-secondary dark:text-zenith-muted">
                Welcome, {session?.user?.name}! 
                <br />
                <span className="text-sm">Complete your profile to join Zenith</span>
              </p>
            </div>

            {/* Phone & DOB Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-zenith-secondary dark:text-gray-300 mb-2"
                >
                  Phone Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-zenith-muted dark:text-zenith-muted" />
                  </div>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-3 py-3 border border-custom dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-zenith-primary focus:border-transparent bg-card dark:bg-gray-700 text-primary placeholder-gray-500 dark:placeholder-gray-400"
                    placeholder="Your phone number"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="dateOfBirth"
                  className="block text-sm font-medium text-zenith-secondary dark:text-gray-300 mb-2"
                >
                  Date of Birth
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-zenith-muted dark:text-zenith-muted" />
                  </div>
                  <input
                    id="dateOfBirth"
                    name="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-3 py-3 border border-custom dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-zenith-primary focus:border-transparent bg-card dark:bg-gray-700 text-primary placeholder-gray-500 dark:placeholder-gray-400"
                  />
                </div>
              </div>
            </div>

            {/* Club Selection Section */}
            <div>
              <h3 className="text-lg font-medium text-primary mb-4 flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Select Your Club Affiliation
              </h3>
              <div className="space-y-3">
                {/* No Club Option */}
                <div
                  onClick={() => setFormData(prev => ({ ...prev, selectedClub: 'none' }))}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    formData.selectedClub === 'none'
                      ? "border-zenith-primary bg-blue-50 dark:bg-blue-900/20"
                      : "border-custom dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                  }`}
                >
                  <div className="flex items-center">
                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                        formData.selectedClub === 'none'
                          ? "border-zenith-primary bg-zenith-primary"
                          : "border-gray-400 dark:border-gray-500"
                      }`}
                    >
                      {formData.selectedClub === 'none' && (
                        <Check className="w-3 h-3 text-white" />
                      )}
                    </div>
                    <div className="ml-3">
                      <h4 className="font-medium text-primary">
                        No Club Affiliation
                      </h4>
                      <p className="text-sm text-zenith-secondary dark:text-zenith-muted">
                        Join the platform without a specific club
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Club Options */}
                {clubs.map((club) => (
                  <div
                    key={club.id}
                    onClick={() => setFormData(prev => ({ ...prev, selectedClub: club.id }))}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      formData.selectedClub === club.id
                        ? "border-zenith-primary bg-blue-50 dark:bg-blue-900/20"
                        : "border-custom dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                    }`}
                  >
                    <div className="flex items-start">
                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          formData.selectedClub === club.id
                            ? "border-zenith-primary bg-zenith-primary"
                            : "border-gray-400 dark:border-gray-500"
                        }`}
                      >
                        {formData.selectedClub === club.id && (
                          <Check className="w-3 h-3 text-white" />
                        )}
                      </div>
                      <div className="ml-3 flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-primary">
                            {club.name}
                          </h4>
                          <div className="flex items-center text-sm text-zenith-secondary dark:text-zenith-muted">
                            <Users className="h-4 w-4 mr-1" />
                            {club.member_count} members
                            {club.leadership_count > 0 && (
                              <>
                                <Star className="h-4 w-4 ml-2 mr-1" />
                                {club.leadership_count} leaders
                              </>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-zenith-secondary dark:text-zenith-muted mt-1">
                          {club.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Terms and Conditions */}
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="agreeToTerms"
                  name="agreeToTerms"
                  type="checkbox"
                  checked={formData.agreeToTerms}
                  onChange={handleInputChange}
                  className="focus:ring-zenith-primary h-4 w-4 text-primary border-custom rounded"
                />
              </div>
              <label
                htmlFor="agreeToTerms"
                className="ml-2 block text-sm text-zenith-secondary dark:text-gray-300"
              >
                I agree to the{" "}
                <a
                  href="/terms"
                  className="text-primary dark:text-blue-400 hover:text-primary/90 dark:hover:text-blue-300"
                >
                  Terms and Conditions
                </a>{" "}
                and{" "}
                <a
                  href="/privacy"
                  className="text-primary dark:text-blue-400 hover:text-primary/90 dark:hover:text-blue-300"
                >
                  Privacy Policy
                </a>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-primary py-3 px-4 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              {isLoading ? "Completing Profile..." : "Complete Profile"}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
