export interface BookOptions {
  topic: string;
  targetAudience: string;
  pageCount: string; // "Short (20-30)", "Medium (30-50)", "Long (50+)"
  targetChapterCount: number;
  tone: string;
  authorName: string;
  objective: string;
  bookDescription: string;
  extras: string[];
}

export interface ChapterOutline {
  title: string;
  description: string;
}

export interface BookOutline {
  title: string;
  subtitle: string;
  description: string;
  backCoverCopy: string;
  chapters: ChapterOutline[];
}

export interface ChapterContent {
  title: string;
  content: string; // Markdown or HTML
}

export interface GeneratedBook extends BookOutline {
  fullChapters: ChapterContent[];
}

export enum AppStep {
  INPUT = 'INPUT',
  OUTLINE_LOADING = 'OUTLINE_LOADING',
  OUTLINE_REVIEW = 'OUTLINE_REVIEW',
  GENERATING = 'GENERATING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}