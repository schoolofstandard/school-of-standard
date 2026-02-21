import { createClient } from '@supabase/supabase-js';
import { BookOptions, BookOutline, ChapterContent, GeneratedBook } from '../types';

// Supabase Configuration
const SUPABASE_URL = 'https://pnomqeqyefiivklbrxim.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_pnyEvMyn60G4hkU8Ru3u1w_3WwjJ76v';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- Database Types ---

export interface DBBook {
  id: string;
  title?: string;
  subtitle?: string;
  description?: string;
  back_cover_copy?: string;
  topic: string;
  target_audience: string;
  english_style: string;
  page_count: string;
  target_chapter_count: number;
  tone: string;
  author_name: string;
  objective: string;
  user_book_description: string;
  extras: string[]; // Stored as JSONB
  status: 'draft' | 'generating' | 'completed' | 'error';
  created_at: string;
  updated_at: string;
}

export interface DBChapter {
  id: string;
  book_id: string;
  title: string;
  description: string;
  content: string;
  order_index: number;
  created_at: string;
}

// --- Service Functions ---

/**
 * Creates a new book entry in the database.
 */
export const createBook = async (options: BookOptions): Promise<string | null> => {
  const { data, error } = await supabase
    .from('books')
    .insert({
      topic: options.topic,
      target_audience: options.targetAudience,
      english_style: options.englishStyle,
      page_count: options.pageCount,
      target_chapter_count: options.targetChapterCount,
      tone: options.tone,
      author_name: options.authorName,
      objective: options.objective,
      user_book_description: options.bookDescription,
      extras: options.extras,
      status: 'draft'
    })
    .select('id')
    .single();

  if (error) {
    console.error('Error creating book:', error);
    return null;
  }
  return data.id;
};

/**
 * Updates the book with the generated outline.
 */
export const updateBookWithOutline = async (bookId: string, outline: BookOutline) => {
  const { error } = await supabase
    .from('books')
    .update({
      title: outline.title,
      subtitle: outline.subtitle,
      description: outline.description,
      back_cover_copy: outline.backCoverCopy,
      status: 'generating'
    })
    .eq('id', bookId);

  if (error) {
    console.error('Error updating book outline:', error);
  }
};

/**
 * Saves a generated chapter to the database.
 */
export const saveChapter = async (bookId: string, chapter: ChapterContent, index: number, description: string) => {
  const { error } = await supabase
    .from('chapters')
    .insert({
      book_id: bookId,
      title: chapter.title,
      content: chapter.content,
      description: description,
      order_index: index
    });

  if (error) {
    console.error('Error saving chapter:', error);
  }
};

/**
 * Marks the book as completed.
 */
export const completeBook = async (bookId: string) => {
  const { error } = await supabase
    .from('books')
    .update({ status: 'completed', updated_at: new Date().toISOString() })
    .eq('id', bookId);

  if (error) {
    console.error('Error completing book:', error);
  }
};

/**
 * Fetches a book and its chapters by ID.
 */
export const getBook = async (bookId: string): Promise<GeneratedBook | null> => {
  // Fetch book details
  const { data: book, error: bookError } = await supabase
    .from('books')
    .select('*')
    .eq('id', bookId)
    .single();

  if (bookError || !book) {
    console.error('Error fetching book:', bookError);
    return null;
  }

  // Fetch chapters
  const { data: chapters, error: chaptersError } = await supabase
    .from('chapters')
    .select('*')
    .eq('book_id', bookId)
    .order('order_index', { ascending: true });

  if (chaptersError) {
    console.error('Error fetching chapters:', chaptersError);
    return null;
  }

  // Map to App Types
  const generatedBook: GeneratedBook = {
    title: book.title || 'Untitled',
    subtitle: book.subtitle || '',
    description: book.description || '',
    backCoverCopy: book.back_cover_copy || '',
    chapters: chapters.map(c => ({
      title: c.title,
      description: c.description
    })),
    fullChapters: chapters.map(c => ({
      title: c.title,
      content: c.content
    }))
  };

  return generatedBook;
};
