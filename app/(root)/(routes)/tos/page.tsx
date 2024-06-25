import React from 'react';
import {Card, CardHeader, CardContent, CardDescription, CardTitle} from '@/components/ui/card';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './markdown.css'; // Import the CSS file

const termsOfService = `
# Terms of Service

**Effective Date: May 26, 2024**

Welcome to PostUs, a social media management Software as a Service (SaaS) tool provided by PostUs ("Company", "we", "us", or "our"). By accessing or using our service, you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, you may not use our service.

## 1. Acceptance of Terms

By accessing or using PostUs, you agree to comply with and be bound by these Terms and all applicable laws and regulations. These Terms apply to all users of the service, including without limitation users who are browsers, vendors, customers, merchants, and/or contributors of content.

## 2. Description of Service

PostUs provides tools to manage social media accounts, including but not limited to scheduling posts, analyzing performance, and engaging with followers. The service may include access to third-party APIs, including but not limited to YouTube and TikTok.

## 3. User Accounts

To use certain features of PostUs, you must create an account. You agree to provide accurate, current, and complete information during the registration process and to update such information to keep it accurate, current, and complete. You are responsible for safeguarding your password and for any activities or actions under your account. You agree not to disclose your password to any third party.

## 4. Use of the Service

You agree to use PostUs in compliance with all applicable laws, regulations, and the terms of service and privacy policies of third-party services integrated with PostUs, including but not limited to YouTube and TikTok. You agree not to use PostUs for any unlawful or prohibited purpose, including but not limited to:

- Violating any applicable laws or regulations.
- Infringing the intellectual property rights of others.
- Posting or transmitting any content that is unlawful, harmful, threatening, abusive, harassing, defamatory, vulgar, obscene, libelous, or otherwise objectionable.
- Interfering with or disrupting the service or servers or networks connected to the service.

## 5. Intellectual Property

The service and its original content, features, and functionality are and will remain the exclusive property of PostUs and its licensors. The service is protected by copyright, trademark, and other laws of both the United States and foreign countries. Our trademarks and trade dress may not be used in connection with any product or service without the prior written consent of PostUs.

## 6. Termination

We may terminate or suspend your account and bar access to the service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms. Upon termination, your right to use the service will immediately cease.

## 7. Limitation of Liability

In no event shall PostUs, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from (i) your access to or use of or inability to access or use the service; (ii) any conduct or content of any third party on the service; (iii) any content obtained from the service; and (iv) unauthorized access, use, or alteration of your transmissions or content, whether based on warranty, contract, tort (including negligence), or any other legal theory, whether or not we have been informed of the possibility of such damage.

## 8. Governing Law

These Terms shall be governed and construed in accordance with the laws of the State of Texas, without regard to its conflict of law provisions.

## 9. Changes to the Terms

We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.

## 10. Contact Us

If you have any questions about these Terms, please contact us at [sparklinefyi@gmail.com](mailto:sparklinefyi@gmail.com)
`;

export default function Page() {
  return (
    <div className={"max-w-6xl mx-auto px-6 py-4"}>
        <CardContent style={{paddingLeft: 30, paddingRight: 30}}>
          <CardDescription>
            <div className="markdown">
              <ReactMarkdown remarkPlugins={[remarkGfm]} children={termsOfService}/>
            </div>
          </CardDescription>
        </CardContent>
    </div>
  );
}
