# Sparkline - Social Media Scheduling Tool

Sparkline is a social media scheduling platform designed to streamline and automate the posting process for TikTok, YouTube, Instagram, and Facebook. It allows users to upload content, schedule posts, and manage social media accounts from a single dashboard.

## Features

- **Multi-Platform Support**: Schedule posts for TikTok, YouTube, Instagram, and Facebook.
- **Post Scheduling**: Plan posts in advance with the built-in calendar tool.
- **Multi-Media Upload**: Upload and manage video content for multiple platforms.
- **Automated Posting**: Sparkline automatically posts your content based on the schedule you set.
- **Platform Integration**: Seamlessly connect your social media accounts for a centralized experience.

## Demo

Check out a live demo of Sparkline [here](https://post-us-web-panel.vercel.app/).

## Installation

To run Sparkline locally, follow these steps:

### Prerequisites

- Node.js (version 16 or above)
- MongoDB (or any other database compatible with Prisma)
- NPM or Yarn package manager

### Steps

1. Clone the repository:

    ```bash
    git clone https://github.com/ibrood-a/sparkline-web.git
    ```

2. Navigate into the project directory:

    ```bash
    cd sparkline-web
    ```

3. Install dependencies:

    ```bash
    npm install
    ```

4. Create a `.env` file in the root directory with the following variables:

    ```
    DATABASE_URL=<your-database-url>
    AUTH0_DOMAIN=<your-auth0-domain>
    AUTH0_CLIENT_ID=<your-auth0-client-id>
    AUTH0_CLIENT_SECRET=<your-auth0-client-secret>
    ```

5. Run the development server:

    ```bash
    npm run dev
    ```

6. Access the app at `http://localhost:3000`.

## Usage

Once installed, you can:

1. **Link your accounts**: Log in and connect your social media platforms.
2. **Upload content**: Use the media uploader to add videos for future posts.
3. **Schedule posts**: Open the calendar view, select a date, and schedule posts across all platforms.
4. **View analytics**: Check the analytics dashboard for post performance across platforms (coming soon).

## Contributing

Contributions are welcome! To contribute:

1. Fork the repository.
2. Create a new branch (`git checkout -b feature/your-feature`).
3. Make your changes.
4. Push to the branch (`git push origin feature/your-feature`).
5. Open a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Contact

If you have any questions, feel free to reach out:

- Email: j.kennedy092420@gmail.com
- GitHub: [ibrood-a](https://github.com/ibrood-a)

---

### Suggestions for improvement:
1. Add a usage section with screenshots or GIFs showing the interface.
2. Include instructions for deploying on Heroku (if applicable).
3. Create an issue template for bug reports or feature requests.
