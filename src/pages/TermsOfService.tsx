
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

export default function TermsOfService() {
  return (
    <MainLayout>
      <div className="container py-8 max-w-4xl">
        <Button 
          variant="ghost" 
          className="flex items-center mb-4"
          asChild
        >
          <Link to="/account-settings">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Settings
          </Link>
        </Button>
        
        <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
        
        <div className="prose prose-sm sm:prose-base dark:prose-invert">
          <p className="lead">Last updated: April 9, 2025</p>
          
          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing and using MAUDIO ("the Service"), you agree to be bound by these Terms of Service. If you disagree with any part of the terms, then you may not access the Service.
          </p>
          
          <h2>2. Use of the Service</h2>
          <p>
            MAUDIO provides a platform for users to stream, upload, and share music under the following conditions:
          </p>
          <ul>
            <li>You are responsible for all activities that occur under your account.</li>
            <li>You must not transmit any worms, viruses, or any code of a destructive nature.</li>
            <li>You must not use the Service for any illegal or unauthorized purpose.</li>
            <li>You must not violate any laws in your jurisdiction (including but not limited to copyright laws).</li>
          </ul>
          
          <h2>3. Content and Copyright</h2>
          <p>
            By uploading content to the Service, you represent and warrant that:
          </p>
          <ul>
            <li>You own or have the necessary licenses, rights, consents, and permissions to use and authorize MAUDIO to use all intellectual property rights in and to any content you upload.</li>
            <li>The content does not and will not infringe or violate the rights of any third party, including without limitation any intellectual property rights, publicity rights or rights of privacy.</li>
          </ul>
          
          <h2>4. Accounts</h2>
          <p>
            When you create an account with us, you must provide accurate, complete, and current information. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account.
          </p>
          <p>
            You are responsible for safeguarding the password you use to access the Service and for any activities or actions under your password.
          </p>
          
          <h2>5. Termination</h2>
          <p>
            We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
          </p>
          
          <h2>6. Limitation of Liability</h2>
          <p>
            In no event shall MAUDIO, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.
          </p>
          
          <h2>7. Changes</h2>
          <p>
            We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material we will try to provide at least 30 days' notice prior to any new terms taking effect.
          </p>
          
          <h2>8. Contact Us</h2>
          <p>
            If you have any questions about these Terms, please contact us at:
          </p>
          <p>
            Email: terms@maudio.com<br />
            Or visit our Contact page: <Link to="/contact-us">Contact Us</Link>
          </p>
        </div>
      </div>
    </MainLayout>
  );
}
