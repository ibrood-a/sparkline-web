import React from 'react';
import {Card, CardHeader, CardContent, CardDescription, CardTitle} from '@/components/ui/card';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './markdown.css'; // Import the CSS file

const privacyPolicy = `# Privacy Policy

**Effective Date: May 26, 2024**

PostUs ("Company", "we", "us", or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our social media management SaaS tool. By using the service, you agree to the collection and use of information in accordance with this policy.

## 1. Information We Collect

We may collect and process the following types of information:

- **Personal Information:** When you register for an account, we may collect personal information such as your name, email address, and payment information.
- **Usage Data:** We may collect information on how the service is accessed and used. This usage data may include information such as your computer's IP address, browser type, browser version, the pages of our service that you visit, the time and date of your visit, the time spent on those pages, and other diagnostic data.
- **Cookies and Tracking Technologies:** We use cookies and similar tracking technologies to track the activity on our service and hold certain information. Cookies are files with a small amount of data which may include an anonymous unique identifier.

## 2. How We Use Your Information

We may use the information we collect for various purposes, including:

- To provide, operate, and maintain our service.
- To improve, personalize, and expand our service.
- To understand and analyze how you use our service.
- To develop new products, services, features, and functionality.
- To communicate with you, either directly or through one of our partners, including for customer service, to provide you with updates and other information relating to the service, and for marketing and promotional purposes.
- To process your transactions and manage your orders.
- To find and prevent fraud.
- To comply with legal obligations.

## 3. Sharing Your Information

We may share your information in the following situations:

- **With Service Providers:** We may share your information with third-party service providers to perform tasks on our behalf and to assist us in providing the service.
- **For Business Transfers:** We may share or transfer your information in connection with, or during negotiations of, any merger, sale of company assets, financing, or acquisition of all or a portion of our business to another company.
- **With Affiliates:** We may share your information with our affiliates, in which case we will require those affiliates to honor this Privacy Policy.
- **With Business Partners:** We may share your information with our business partners to offer you certain products, services, or promotions.
- **With Your Consent:** We may disclose your personal information for any other purpose with your consent.
- **As Required by Law:** We may disclose your information where we are legally required to do so in order to comply with applicable law, governmental requests, a judicial proceeding, court order, or legal process.

## 4. Security of Your Information

We use administrative, technical, and physical security measures to help protect your personal information. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that despite our efforts, no security measures are perfect or impenetrable, and no method of data transmission can be guaranteed against any interception or other type of misuse.

## 5. Your Data Protection Rights

Depending on your location, you may have the following rights regarding your personal data:

- The right to access – You have the right to request copies of your personal data.
- The right to rectification – You have the right to request that we correct any information you believe is inaccurate or complete information you believe is incomplete.
- The right to erasure – You have the right to request that we erase your personal data, under certain conditions.
- The right to restrict processing – You have the right to request that we restrict the processing of your personal data, under certain conditions.
- The right to object to processing – You have the right to object to our processing of your personal data, under certain conditions.
- The right to data portability – You have the right to request that we transfer the data that we have collected to another organization, or directly to you, under certain conditions.

If you make a request, we have one month to respond to you. If you would like to exercise any of these rights, please contact us at our provided contact information.

## 6. Third-Party Services

Our service may contain links to other websites or services that are not operated by us. If you click on a third-party link, you will be directed to that third party's site. We strongly advise you to review the Privacy Policy of every site you visit. We have no control over and assume no responsibility for the content, privacy policies, or practices of any third-party sites or services.

## 7. Children's Privacy

Our service does not address anyone under the age of 13. We do not knowingly collect personally identifiable information from children under 13. If you are a parent or guardian and you are aware that your child has provided us with personal information, please contact us. If we become aware that we have collected personal information from children under age 13 without verification of parental consent, we take steps to remove that information from our servers.

## 8. Changes to This Privacy Policy

We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Effective Date" at the top of this Privacy Policy. You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy are effective when they are posted on this page.

## 9. Contact Us

If you have any questions about this Privacy Policy, please contact us:

- By email: [sparklinefyi@gmail.com](mailto:sparklinefyi@gmail.com)
- By visiting this page on our website: [sparkline.fyi/contact](https://sparkline.fyi/contact)
`

export default function Page() {
  return (
    <div className={"max-w-6xl mx-auto px-6 py-4"}>
        <CardContent style={{paddingLeft: 30, paddingRight: 30}}>
          <CardDescription>
            <div className="markdown">
              <ReactMarkdown remarkPlugins={[remarkGfm]} children={privacyPolicy}/>
            </div>
          </CardDescription>
        </CardContent>
    </div>
  );
}
