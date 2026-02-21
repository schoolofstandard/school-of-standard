# SOS AI - eBook Generator

SOS AI is an intelligent eBook generation platform that helps users create structured, professional-quality eBooks using AI.

## Features

- **AI-Powered Content Generation**: Uses advanced AI models (Gemini, OpenAI, DeepSeek) to generate outlines and chapter content.
- **Structured Workflow**: Step-by-step wizard for defining topic, audience, tone, and more.
- **Interactive Outline Review**: Review and approve the book structure before writing begins.
- **Real-time Generation**: Watch as chapters are written in real-time.
- **Supabase Integration**: Saves all books and chapters to a Supabase backend for persistence.
- **Resume Capability**: Automatically saves progress locally so you can resume if interrupted.

## Tech Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS
- **Backend/Database**: Supabase
- **AI Integration**: Google Generative AI SDK (Gemini), Custom fetch for others

## Setup

1.  **Clone the repository**
    ```bash
    git clone https://github.com/schoolofstandard/Sos.git
    cd Sos
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Environment Variables**
    Create a `.env` file in the root directory with the following keys:
    ```env
    # AI Keys (At least one is required)
    GEMINI_API_KEY=your_gemini_key
    OPENAI_API_KEY=your_openai_key
    DEEPSEEK_API_KEY=your_deepseek_key

    # Supabase Configuration (Required for persistence)
    # These are public/anon keys safe for client-side use
    VITE_SUPABASE_URL=https://pnomqeqyefiivklbrxim.supabase.co
    VITE_SUPABASE_ANON_KEY=sb_publishable_pnyEvMyn60G4hkU8Ru3u1w_3WwjJ76v
    ```

4.  **Run the development server**
    ```bash
    npm run dev
    ```

## Database Setup

This project uses Supabase. You need to run the SQL schema to create the necessary tables.
The schema file is located at `supabase_schema.sql`.

1.  Go to your Supabase Dashboard.
2.  Open the SQL Editor.
3.  Copy the contents of `supabase_schema.sql` and run it.

## License

[Your License Here]
