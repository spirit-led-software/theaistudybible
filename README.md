# The AI Study Bible

The AI Study Bible is a digital study Bible that uses artificial intelligence to help users explore and understand scripture in new ways.

## Features

- AI-powered insights and commentary on Bible passages
- Advanced semantic search across translations
- Personalized study suggestions and devotionals
- Multi-lingual support
- Progressive Web App for cross-platform use

## Tech Stack

- Frontend: SolidJS, SolidStart, Tailwind CSS
- Backend: Node.js, AWS Lambda, Turso (LibSQL)
- AI: OpenAI API, Upstash Vector
- Infrastructure: SST (Serverless Stack)

## Getting Started

### Prerequisites

- Node.js 18+
- AWS CLI configured with appropriate credentials

### Installation

1. Clone the repository
   ```
   git clone https://github.com/yourusername/theaistudybible.git
   cd theaistudybible
   ```

2. Install dependencies
   ```
   pnpm install
   ```

3. Set up environment variables
   ```
   cp .env.example .env
   ```
   Edit `.env` with your configuration

4. Start the development server
   ```
   pnpm run dev
   ```
