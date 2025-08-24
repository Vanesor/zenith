'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { UnifiedHeader } from '@/components/UnifiedHeader';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-main transition-colors duration-300">
      
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

          {/* Terms Content */}
          <div className="bg-card rounded-2xl shadow-xl p-8 border border-custom transition-colors duration-200">
            <div className="prose prose-gray dark:prose-invert max-w-none">
              <h1 className="text-3xl font-bold text-primary mb-6 transition-colors duration-200">
                Terms and Conditions
              </h1>
              
              <p className="text-zenith-secondary dark:text-gray-300 mb-6 transition-colors duration-200">
                <strong>Last updated:</strong> August 13, 2025
              </p>

              <h2 className="text-2xl font-semibold text-primary mt-8 mb-4 transition-colors duration-200">
                1. Acceptance of Terms
              </h2>
              <p className="text-zenith-secondary dark:text-gray-300 mb-4 transition-colors duration-200">
                By accessing and using the Zenith platform provided by St. Vincent Pallotti College of Engineering & Technology, you accept and agree to be bound by the terms and provision of this agreement.
              </p>

              <h2 className="text-2xl font-semibold text-primary mt-8 mb-4 transition-colors duration-200">
                2. Use License
              </h2>
              <p className="text-zenith-secondary dark:text-gray-300 mb-4 transition-colors duration-200">
                Permission is granted to temporarily use the Zenith platform for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
              </p>
              <ul className="list-disc list-inside text-zenith-secondary dark:text-gray-300 mb-4 ml-4 transition-colors duration-200">
                <li>modify or copy the materials</li>
                <li>use the materials for any commercial purpose or for any public display (commercial or non-commercial)</li>
                <li>attempt to decompile or reverse engineer any software contained on the platform</li>
                <li>remove any copyright or other proprietary notations from the materials</li>
              </ul>

              <h2 className="text-2xl font-semibold text-primary mt-8 mb-4 transition-colors duration-200">
                3. Club Membership
              </h2>
              <p className="text-zenith-secondary dark:text-gray-300 mb-4 transition-colors duration-200">
                Each student may join only <strong>one club</strong> at a time. Club membership is subject to:
              </p>
              <ul className="list-disc list-inside text-zenith-secondary dark:text-gray-300 mb-4 ml-4 transition-colors duration-200">
                <li>Approval by club coordinators</li>
                <li>Active participation in club activities</li>
                <li>Adherence to club-specific guidelines</li>
                <li>Students may switch clubs only once per academic semester</li>
              </ul>

              <h2 className="text-2xl font-semibold text-primary mt-8 mb-4 transition-colors duration-200">
                4. User Accounts
              </h2>
              <p className="text-zenith-secondary dark:text-gray-300 mb-4 transition-colors duration-200">
                When you create an account with us, you must provide information that is accurate, complete, and current at all times. You are responsible for safeguarding the password and for all activities that occur under your account.
              </p>

              <h2 className="text-2xl font-semibold text-primary mt-8 mb-4 transition-colors duration-200">
                5. Academic Integrity
              </h2>
              <p className="text-zenith-secondary dark:text-gray-300 mb-4 transition-colors duration-200">
                All code submissions, assignments, and academic work must be original. Plagiarism, cheating, or any form of academic dishonesty will result in immediate suspension from the platform and may be reported to college authorities.
              </p>

              <h2 className="text-2xl font-semibold text-primary mt-8 mb-4 transition-colors duration-200">
                6. Code Execution Policy
              </h2>
              <p className="text-zenith-secondary dark:text-gray-300 mb-4 transition-colors duration-200">
                The platform provides a secure code execution environment. Users must not attempt to:
              </p>
              <ul className="list-disc list-inside text-zenith-secondary dark:text-gray-300 mb-4 ml-4 transition-colors duration-200">
                <li>Execute malicious code or malware</li>
                <li>Access system resources beyond allocated limits</li>
                <li>Interfere with other users' code execution</li>
                <li>Bypass security measures or sandbox restrictions</li>
              </ul>

              <h2 className="text-2xl font-semibold text-primary mt-8 mb-4 transition-colors duration-200">
                7. Content Guidelines
              </h2>
              <p className="text-zenith-secondary dark:text-gray-300 mb-4 transition-colors duration-200">
                Users must not post content that is:
              </p>
              <ul className="list-disc list-inside text-zenith-secondary dark:text-gray-300 mb-4 ml-4 transition-colors duration-200">
                <li>Offensive, abusive, or harassing</li>
                <li>Violates intellectual property rights</li>
                <li>Contains personal information of others</li>
                <li>Promotes illegal activities</li>
                <li>Spam or repetitive content</li>
              </ul>

              <h2 className="text-2xl font-semibold text-primary mt-8 mb-4 transition-colors duration-200">
                8. Privacy and Data Collection
              </h2>
              <p className="text-zenith-secondary dark:text-gray-300 mb-4 transition-colors duration-200">
                We collect and use personal information as described in our Privacy Policy. By using the platform, you consent to our data practices as outlined in the Privacy Policy.
              </p>

              <h2 className="text-2xl font-semibold text-primary mt-8 mb-4 transition-colors duration-200">
                9. Termination
              </h2>
              <p className="text-zenith-secondary dark:text-gray-300 mb-4 transition-colors duration-200">
                We may terminate your access to the platform immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
              </p>

              <h2 className="text-2xl font-semibold text-primary mt-8 mb-4 transition-colors duration-200">
                10. Changes to Terms
              </h2>
              <p className="text-zenith-secondary dark:text-gray-300 mb-4 transition-colors duration-200">
                We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will try to provide at least 30 days notice prior to any new terms taking effect.
              </p>

              <h2 className="text-2xl font-semibold text-primary mt-8 mb-4 transition-colors duration-200">
                11. Contact Information
              </h2>
              <p className="text-zenith-secondary dark:text-gray-300 mb-4 transition-colors duration-200">
                If you have any questions about these Terms and Conditions, please contact us at:
              </p>
              <div className="bg-zenith-section dark:bg-gray-700 p-4 rounded-lg mt-4 transition-colors duration-200">
                <p className="text-primary font-medium">
                  St. Vincent Pallotti College of Engineering & Technology<br />
                  Department of Computer Engineering<br />
                  Nagpur, Maharashtra<br />
                  Email: zenith.forum@stvincentngp.edu.in
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
