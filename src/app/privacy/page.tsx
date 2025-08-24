'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { UnifiedHeader } from '@/components/UnifiedHeader';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-main transition-colors duration-300">
      {/* <UnifiedHeader showNavigation={true} /> */}
      
      <div className="pt-40 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Back Link */}
          <Link
            href="/register"
            className="inline-flex items-center text-secondary hover:text-primary mb-8 transition-colors duration-200"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Registration
          </Link>

          {/* Privacy Content */}
          <div className="bg-card rounded-2xl shadow-xl p-8 border border-custom transition-colors duration-200">
            <div className="prose prose-gray dark:prose-invert max-w-none">
              <h1 className="text-3xl font-bold text-primary mb-6 transition-colors duration-200">
                Privacy Policy
              </h1>
              
              <p className="text-secondary mb-6 transition-colors duration-200">
                <strong>Last updated:</strong> August 13, 2025
              </p>

              <p className="text-secondary mb-6 transition-colors duration-200">
                This Privacy Policy describes how St. Vincent Pallotti College of Engineering & Technology ("we", "our", or "us") collects, uses, and shares your personal information when you use the Zenith platform.
              </p>

              <h2 className="text-2xl font-semibold text-primary mt-8 mb-4 transition-colors duration-200">
                1. Information We Collect
              </h2>
              
              <h3 className="text-xl font-medium text-primary mt-6 mb-3 transition-colors duration-200">
                Information You Provide
              </h3>
              <p className="text-zenith-secondary dark:text-gray-300 mb-4 transition-colors duration-200">
                We collect information you provide directly to us, such as when you:
              </p>
              <ul className="list-disc list-inside text-zenith-secondary dark:text-gray-300 mb-4 ml-4 transition-colors duration-200">
                <li>Create an account (name, email, phone number)</li>
                <li>Update your profile information</li>
                <li>Submit assignments or code</li>
                <li>Participate in club activities</li>
                <li>Send us messages or feedback</li>
              </ul>

              <h3 className="text-xl font-medium text-primary mt-6 mb-3 transition-colors duration-200">
                Information We Collect Automatically
              </h3>
              <p className="text-zenith-secondary dark:text-gray-300 mb-4 transition-colors duration-200">
                When you use our platform, we automatically collect certain information, including:
              </p>
              <ul className="list-disc list-inside text-zenith-secondary dark:text-gray-300 mb-4 ml-4 transition-colors duration-200">
                <li>Login times and session duration</li>
                <li>Pages visited and features used</li>
                <li>Code execution logs and performance metrics</li>
                <li>Device information and IP address</li>
                <li>Browser type and version</li>
              </ul>

              <h2 className="text-2xl font-semibold text-primary mt-8 mb-4 transition-colors duration-200">
                2. How We Use Your Information
              </h2>
              <p className="text-zenith-secondary dark:text-gray-300 mb-4 transition-colors duration-200">
                We use the information we collect to:
              </p>
              <ul className="list-disc list-inside text-zenith-secondary dark:text-gray-300 mb-4 ml-4 transition-colors duration-200">
                <li>Provide, maintain, and improve our platform</li>
                <li>Process and evaluate assignments</li>
                <li>Manage club memberships and activities</li>
                <li>Send you technical notices and updates</li>
                <li>Respond to your comments and questions</li>
                <li>Monitor and analyze usage patterns</li>
                <li>Ensure platform security and prevent fraud</li>
              </ul>

              <h2 className="text-2xl font-semibold text-primary mt-8 mb-4 transition-colors duration-200">
                3. Information Sharing and Disclosure
              </h2>
              
              <h3 className="text-xl font-medium text-primary mt-6 mb-3 transition-colors duration-200">
                We Do Not Sell Your Information
              </h3>
              <p className="text-zenith-secondary dark:text-gray-300 mb-4 transition-colors duration-200">
                We do not sell, rent, or trade your personal information to third parties.
              </p>

              <h3 className="text-xl font-medium text-primary mt-6 mb-3 transition-colors duration-200">
                We May Share Information:
              </h3>
              <ul className="list-disc list-inside text-zenith-secondary dark:text-gray-300 mb-4 ml-4 transition-colors duration-200">
                <li><strong>With Faculty:</strong> Academic performance and participation data with relevant faculty members</li>
                <li><strong>With Club Coordinators:</strong> Club membership and activity information</li>
                <li><strong>For Legal Reasons:</strong> When required by law or to protect our rights</li>
                <li><strong>In Emergencies:</strong> To protect the safety of users or the public</li>
              </ul>

              <h2 className="text-2xl font-semibold text-primary mt-8 mb-4 transition-colors duration-200">
                4. Data Security
              </h2>
              <p className="text-zenith-secondary dark:text-gray-300 mb-4 transition-colors duration-200">
                We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. These include:
              </p>
              <ul className="list-disc list-inside text-zenith-secondary dark:text-gray-300 mb-4 ml-4 transition-colors duration-200">
                <li>Encryption of sensitive data in transit and at rest</li>
                <li>Regular security audits and monitoring</li>
                <li>Secure code execution environments</li>
                <li>Access controls and authentication measures</li>
              </ul>

              <h2 className="text-2xl font-semibold text-primary mt-8 mb-4 transition-colors duration-200">
                5. Data Retention
              </h2>
              <p className="text-zenith-secondary dark:text-gray-300 mb-4 transition-colors duration-200">
                We retain your personal information for as long as necessary to provide our services and fulfill the purposes outlined in this policy. Specifically:
              </p>
              <ul className="list-disc list-inside text-zenith-secondary dark:text-gray-300 mb-4 ml-4 transition-colors duration-200">
                <li><strong>Account Information:</strong> Until you delete your account</li>
                <li><strong>Academic Records:</strong> As per college policy (typically 7 years)</li>
                <li><strong>Code Submissions:</strong> For the duration of your enrollment</li>
                <li><strong>Usage Logs:</strong> Up to 2 years for security purposes</li>
              </ul>

              <h2 className="text-2xl font-semibold text-primary mt-8 mb-4 transition-colors duration-200">
                6. Your Rights and Choices
              </h2>
              <p className="text-zenith-secondary dark:text-gray-300 mb-4 transition-colors duration-200">
                You have the following rights regarding your personal information:
              </p>
              <ul className="list-disc list-inside text-zenith-secondary dark:text-gray-300 mb-4 ml-4 transition-colors duration-200">
                <li><strong>Access:</strong> Request a copy of your personal information</li>
                <li><strong>Update:</strong> Correct or update your profile information</li>
                <li><strong>Delete:</strong> Request deletion of your account and associated data</li>
                <li><strong>Opt-out:</strong> Unsubscribe from non-essential notifications</li>
              </ul>

              <h2 className="text-2xl font-semibold text-primary mt-8 mb-4 transition-colors duration-200">
                7. Cookies and Tracking
              </h2>
              <p className="text-zenith-secondary dark:text-gray-300 mb-4 transition-colors duration-200">
                We use cookies and similar tracking technologies to enhance your experience on our platform. These help us:
              </p>
              <ul className="list-disc list-inside text-zenith-secondary dark:text-gray-300 mb-4 ml-4 transition-colors duration-200">
                <li>Remember your login status and preferences</li>
                <li>Understand how you use our platform</li>
                <li>Improve platform performance and user experience</li>
              </ul>

              <h2 className="text-2xl font-semibold text-primary mt-8 mb-4 transition-colors duration-200">
                8. Third-Party Services
              </h2>
              <p className="text-zenith-secondary dark:text-gray-300 mb-4 transition-colors duration-200">
                Our platform may integrate with third-party services (like Google for authentication). These services have their own privacy policies, and we encourage you to review them.
              </p>

              <h2 className="text-2xl font-semibold text-primary mt-8 mb-4 transition-colors duration-200">
                9. Children's Privacy
              </h2>
              <p className="text-zenith-secondary dark:text-gray-300 mb-4 transition-colors duration-200">
                Our platform is designed for college students (18+ years). We do not knowingly collect personal information from children under 18. If we become aware of such collection, we will delete the information immediately.
              </p>

              <h2 className="text-2xl font-semibold text-primary mt-8 mb-4 transition-colors duration-200">
                10. Changes to This Policy
              </h2>
              <p className="text-zenith-secondary dark:text-gray-300 mb-4 transition-colors duration-200">
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last updated" date.
              </p>

              <h2 className="text-2xl font-semibold text-primary mt-8 mb-4 transition-colors duration-200">
                11. Contact Us
              </h2>
              <p className="text-zenith-secondary dark:text-gray-300 mb-4 transition-colors duration-200">
                If you have any questions about this Privacy Policy, please contact us at:
              </p>
              <div className="bg-zenith-section dark:bg-gray-700 p-4 rounded-lg mt-4 transition-colors duration-200">
                <p className="text-primary font-medium">
                  Privacy Officer<br />
                  St. Vincent Pallotti College of Engineering & Technology<br />
                  Department of Computer Engineering<br />
                  Nagpur, Maharashtra<br />
                  Email: privacy@stvincentngp.edu.in<br />
                  Phone: +91-712-1234567
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
