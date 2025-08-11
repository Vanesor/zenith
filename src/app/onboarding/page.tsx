"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { User, Phone, Calendar, Check } from "lucide-react";
import { ZenithLogo } from "@/components/ZenithLogo";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function OnboardingPage() {
  const { data: session, status } = useSession();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    dateOfBirth: "",
    interests: [] as string[],
    agreeToTerms: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

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

  const clubInterests = [
    { id: 'ascend', name: 'Ascend (Coding)', description: 'Programming & Tech' },
    { id: 'aster', name: 'Aster (Soft Skills)', description: 'Communication & Leadership' },
    { id: 'achievers', name: 'Achievers (Higher Studies)', description: 'Graduate Prep' },
    { id: 'altogether', name: 'Altogether (Holistic Growth)', description: 'Wellness & Life Skills' },
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleInterestToggle = (interestId: string) => {
    setFormData((prev) => ({
      ...prev,
      interests: prev.interests.includes(interestId)
        ? prev.interests.filter((id) => id !== interestId)
        : [...prev.interests, interestId],
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

    try {
      const response = await fetch("/api/auth/complete-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          email: session?.user?.email,
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
        <div className="bg-zenith-card dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-zenith-border dark:border-gray-700">
          {/* Logo */}
          <div className="text-center mb-8">
            <ZenithLogo size="lg" className="justify-center mb-4" />
            <h1 className="text-2xl font-bold text-zenith-primary dark:text-white">
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
            {/* Name Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="firstName"
                  className="block text-sm font-medium text-zenith-secondary dark:text-gray-300 mb-2"
                >
                  First Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-zenith-muted dark:text-zenith-muted" />
                  </div>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                    className="block w-full pl-10 pr-3 py-3 border border-zenith-border dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-zenith-primary focus:border-transparent bg-zenith-card dark:bg-gray-700 text-zenith-primary dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    placeholder="First name"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="lastName"
                  className="block text-sm font-medium text-zenith-secondary dark:text-gray-300 mb-2"
                >
                  Last Name
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  required
                  className="block w-full px-3 py-3 border border-zenith-border dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-zenith-primary focus:border-transparent bg-zenith-card dark:bg-gray-700 text-zenith-primary dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  placeholder="Last name"
                />
              </div>
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
                    className="block w-full pl-10 pr-3 py-3 border border-zenith-border dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-zenith-primary focus:border-transparent bg-zenith-card dark:bg-gray-700 text-zenith-primary dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
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
                    className="block w-full pl-10 pr-3 py-3 border border-zenith-border dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-zenith-primary focus:border-transparent bg-zenith-card dark:bg-gray-700 text-zenith-primary dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  />
                </div>
              </div>
            </div>

            {/* Interests Section */}
            <div>
              <h3 className="text-lg font-medium text-zenith-primary dark:text-white mb-4">
                Select Your Interests
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {clubInterests.map((interest) => (
                  <div
                    key={interest.id}
                    onClick={() => handleInterestToggle(interest.id)}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      formData.interests.includes(interest.id)
                        ? "border-zenith-primary bg-blue-50 dark:bg-blue-900/20"
                        : "border-zenith-border dark:border-gray-600"
                    }`}
                  >
                    <div className="flex items-start">
                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                          formData.interests.includes(interest.id)
                            ? "border-zenith-primary bg-zenith-primary"
                            : "border-gray-400 dark:border-gray-500"
                        }`}
                      >
                        {formData.interests.includes(interest.id) && (
                          <Check className="w-3 h-3 text-white" />
                        )}
                      </div>
                      <div className="ml-3">
                        <h4 className="font-medium text-zenith-primary dark:text-white">
                          {interest.name}
                        </h4>
                        <p className="text-sm text-zenith-secondary dark:text-zenith-muted">
                          {interest.description}
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
                  className="focus:ring-zenith-primary h-4 w-4 text-zenith-primary border-zenith-border rounded"
                />
              </div>
              <label
                htmlFor="agreeToTerms"
                className="ml-2 block text-sm text-zenith-secondary dark:text-gray-300"
              >
                I agree to the{" "}
                <a
                  href="/terms"
                  className="text-zenith-primary dark:text-blue-400 hover:text-zenith-primary/90 dark:hover:text-blue-300"
                >
                  Terms and Conditions
                </a>{" "}
                and{" "}
                <a
                  href="/privacy"
                  className="text-zenith-primary dark:text-blue-400 hover:text-zenith-primary/90 dark:hover:text-blue-300"
                >
                  Privacy Policy
                </a>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              {isLoading ? "Completing Profile..." : "Complete Profile"}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
