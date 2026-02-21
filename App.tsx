import React, { useState, useCallback, useEffect } from 'react';
import { AppStep, BookOptions, BookOutline, GeneratedBook, ChapterContent } from './types';
import { generateBookOutline, generateChapterContent } from './services/ai';
import { createBook, updateBookWithOutline, saveChapter, completeBook } from './services/supabase';
import { InputWizard } from './components/InputWizard';
import { OutlineReview } from './components/OutlineReview';
import { BookGenerator } from './components/BookGenerator';
import { BookReader } from './components/BookReader';
import { AlertCircle } from 'lucide-react';

const STORAGE_KEY = 'sos_ai_book_generator_state';

export default function App() {
  const [step, setStep] = useState<AppStep>(AppStep.INPUT);
  const [options, setOptions] = useState<BookOptions | null>(null);
  const [outline, setOutline] = useState<BookOutline | null>(null);
  const [generatedBook, setGeneratedBook] = useState<GeneratedBook | null>(null);
  const [generatedChapters, setGeneratedChapters] = useState<ChapterContent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [shouldResume, setShouldResume] = useState(false);
  const [currentBookId, setCurrentBookId] = useState<string | null>(null);

  // Load state from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.step) setStep(parsed.step);
        if (parsed.options) setOptions(parsed.options);
        if (parsed.outline) setOutline(parsed.outline);
        if (parsed.generatedBook) setGeneratedBook(parsed.generatedBook);
        if (parsed.generatedChapters) setGeneratedChapters(parsed.generatedChapters);
        if (parsed.currentBookId) setCurrentBookId(parsed.currentBookId);
        
        // If we were generating, trigger resume
        if (parsed.step === AppStep.GENERATING) {
           setShouldResume(true);
        }
      } catch (e) {
        console.error("Failed to load saved state", e);
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  // Save state to localStorage on change
  useEffect(() => {
    const state = { step, options, outline, generatedBook, generatedChapters, currentBookId };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [step, options, outline, generatedBook, generatedChapters, currentBookId]);

  // Resume generation if needed
  useEffect(() => {
    if (shouldResume && outline && options) {
      handleStartGeneration(true);
      setShouldResume(false);
    }
  }, [shouldResume, outline, options]); // handleStartGeneration is in dependency via closure if not added, but better to add it or omit if stable

  // Handlers
  const handleWizardSubmit = async (formData: BookOptions) => {
    setOptions(formData);
    setStep(AppStep.OUTLINE_LOADING);
    setError(null);
    
    try {
      // 1. Create initial book record in Supabase
      const bookId = await createBook(formData);
      if (bookId) {
        setCurrentBookId(bookId);
      } else {
        console.warn("Failed to create book in Supabase, continuing locally...");
      }

      // 2. Generate Outline
      const result = await generateBookOutline(formData);
      if (!result || !result.chapters || result.chapters.length === 0) {
        throw new Error("Generated outline was empty or invalid.");
      }
      setOutline(result);
      
      // 3. Update Supabase with outline
      if (bookId) {
        await updateBookWithOutline(bookId, result);
      }
      
      setStep(AppStep.OUTLINE_REVIEW);
    } catch (err: any) {
      console.error(err);
      setError("Failed to generate outline. The AI service may be busy or out of credits. " + (err.message || ""));
      setStep(AppStep.INPUT);
    }
  };

  const handleStartGeneration = useCallback(async (resume = false) => {
    if (!outline || !options) return;
    
    setStep(AppStep.GENERATING);
    
    // If not resuming, clear previous chapters
    if (!resume) {
      setGeneratedChapters([]);
    }
    
    const startIndex = resume ? generatedChapters.length : 0;
    const chapters: ChapterContent[] = resume ? [...generatedChapters] : [];
    
    setError(null);

    try {
      for (let i = startIndex; i < outline.chapters.length; i++) {
        const chapterMeta = outline.chapters[i];
        
        // Generate content for this chapter
        const content = await generateChapterContent(
          options,
          { title: outline.title, subtitle: outline.subtitle },
          chapterMeta,
          i,
          outline.chapters.length
        );

        const newChapter: ChapterContent = {
          title: chapterMeta.title,
          content: content
        };

        chapters.push(newChapter);
        setGeneratedChapters(prev => [...prev, newChapter]);
        
        // Save chapter to Supabase
        if (currentBookId) {
          await saveChapter(currentBookId, newChapter, i, chapterMeta.description);
        }
        
        // Small delay to be gentle on rate limits
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      setGeneratedBook({
        ...outline,
        fullChapters: chapters
      });
      
      // Mark as completed in Supabase
      if (currentBookId) {
        await completeBook(currentBookId);
      }
      
      setStep(AppStep.COMPLETED);

    } catch (err: any) {
      console.error(err);
      setError("An error occurred during book generation. Partial progress may be lost.");
      setStep(AppStep.ERROR);
    }
  }, [outline, options, generatedChapters, currentBookId]);

  const handleReset = () => {
    localStorage.removeItem(STORAGE_KEY);
    setStep(AppStep.INPUT);
    setOptions(null);
    setOutline(null);
    setGeneratedBook(null);
    setGeneratedChapters([]);
    setCurrentBookId(null);
    setError(null);
  };

  // Render Logic
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      
      {/* Global Error Toast */}
      {error && (
        <div className="fixed top-4 right-4 max-w-md bg-red-100 border border-red-300 text-red-800 px-4 py-3 rounded-lg shadow-lg flex items-start gap-3 z-50 animate-bounce-in">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-sm">Error</p>
            <p className="text-sm">{error}</p>
            <button 
              onClick={() => setError(null)} 
              className="text-xs underline mt-1 hover:text-red-900"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="w-full h-full">
        
        {step === AppStep.INPUT && (
          <div className="container mx-auto px-4 py-12">
            <InputWizard onSubmit={handleWizardSubmit} isSubmitting={false} initialValues={options} />
          </div>
        )}

        {step === AppStep.OUTLINE_LOADING && (
          <div className="flex flex-col items-center justify-center min-h-screen">
             <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin mb-4"></div>
             <p className="text-xl font-medium text-slate-600 animate-pulse">
               Consulting Publishing Intelligence...
             </p>
             <p className="text-xs text-slate-400 mt-2">Checking OpenAI, DeepSeek, and Gemini</p>
          </div>
        )}

        {step === AppStep.OUTLINE_REVIEW && outline && (
          <div className="container mx-auto px-4 py-12">
            <OutlineReview 
              outline={outline} 
              onApprove={() => handleStartGeneration(false)} 
              onCancel={handleReset} 
            />
          </div>
        )}

        {step === AppStep.GENERATING && outline && (
           <div className="container mx-auto px-4 py-12 min-h-screen flex items-center justify-center">
             <div className="w-full">
               <BookGenerator 
                  outline={outline}
                  currentChapterIndex={generatedChapters.length}
                  completedChapters={generatedChapters.length}
               />
             </div>
           </div>
        )}

        {step === AppStep.COMPLETED && generatedBook && options && (
          <BookReader 
            book={generatedBook} 
            authorName={options.authorName}
            onReset={handleReset}
          />
        )}
        
        {step === AppStep.ERROR && (
           <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
              <div className="bg-white p-8 rounded-xl shadow-lg max-w-md">
                <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Generation Interrupted</h2>
                <p className="text-slate-600 mb-6">Something went wrong while writing your book.</p>
                <div className="flex gap-4 justify-center">
                  <button 
                    onClick={handleReset}
                    className="px-6 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition"
                  >
                    Start Over
                  </button>
                  {outline && generatedChapters.length > 0 && (
                     <button 
                       onClick={() => handleStartGeneration(true)}
                       className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
                     >
                       Retry Generation
                     </button>
                  )}
                </div>
              </div>
           </div>
        )}

      </main>
    </div>
  );
}