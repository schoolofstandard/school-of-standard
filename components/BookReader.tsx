import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { GeneratedBook } from '../types';
import { Printer, ArrowLeft, FileText, Smartphone, Info, Image as ImageIcon, Wand2, RefreshCcw } from 'lucide-react';
import { exportToDocx, exportToEpub } from '../services/exporter';
import { generateCoverImage, editCoverImage } from '../services/ai';

interface BookReaderProps {
  book: GeneratedBook;
  authorName: string;
  onReset: () => void;
}

export const BookReader: React.FC<BookReaderProps> = ({ book, authorName, onReset }) => {
  const [isExporting, setIsExporting] = useState(false);
  
  // Cover Art Studio State
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  // Updated prompt to include author name explicitly
  const [imagePrompt, setImagePrompt] = useState<string>(`A professional book cover titled "${book.title}" by ${authorName}. Elegant, commercial book design.`);
  const [imageSize, setImageSize] = useState<"1K" | "2K" | "4K">("1K");
  const [imageError, setImageError] = useState<string | null>(null);

  const handlePrint = () => {
    window.print();
  };

  const handleDocxExport = async () => {
    try {
      setIsExporting(true);
      await exportToDocx(book, authorName);
    } catch (e) {
      console.error(e);
      alert("Failed to export DOCX");
    } finally {
      setIsExporting(false);
    }
  };

  const handleEpubExport = async () => {
    try {
      setIsExporting(true);
      await exportToEpub(book, authorName);
    } catch (e) {
      console.error(e);
      alert("Failed to export EPUB");
    } finally {
      setIsExporting(false);
    }
  };

  const handleGenerateCover = async () => {
    if (!imagePrompt) return;
    setIsGeneratingImage(true);
    setImageError(null);
    try {
      const imageUrl = await generateCoverImage(imagePrompt, imageSize);
      setCoverImage(imageUrl);
    } catch (err) {
      console.error(err);
      setImageError("Failed to generate image. Trying fallback providers...");
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleEditCover = async () => {
    if (!coverImage || !imagePrompt) return;
    setIsGeneratingImage(true);
    setImageError(null);
    try {
      const imageUrl = await editCoverImage(coverImage, imagePrompt);
      setCoverImage(imageUrl);
    } catch (err) {
      console.error(err);
      setImageError("Failed to edit image. Ensure prompt describes the change.");
    } finally {
      setIsGeneratingImage(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-200 flex flex-col items-center py-8 px-4 no-print">
      
      {/* Toolbar */}
      <div className="sticky top-4 z-50 flex flex-wrap items-center justify-center gap-2 bg-slate-950 text-white px-6 py-4 rounded-full shadow-2xl mb-8 border border-slate-800 ring-4 ring-slate-300/50 transition-all hover:scale-[1.02]">
        <button onClick={onReset} className="p-2 hover:bg-white/10 rounded-full transition text-slate-400 hover:text-white" title="New Book">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="h-6 w-px bg-slate-700 hidden md:block mx-2"></div>
        
        <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 hover:bg-white/10 rounded-full transition font-medium">
          <Printer className="w-4 h-4 text-orange-400" />
          <span className="hidden md:inline">Print / PDF</span>
        </button>
        
        <button 
          onClick={handleDocxExport} 
          disabled={isExporting}
          className="flex items-center gap-2 px-4 py-2 hover:bg-white/10 rounded-full transition disabled:opacity-50 font-medium"
        >
          <FileText className="w-4 h-4 text-blue-400" />
          <span className="hidden md:inline">Word</span>
        </button>

        <button 
          onClick={handleEpubExport} 
          disabled={isExporting}
          className="flex items-center gap-2 px-4 py-2 hover:bg-white/10 rounded-full transition disabled:opacity-50 font-medium"
        >
          <Smartphone className="w-4 h-4 text-green-400" />
          <span className="hidden md:inline">EPUB</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-8 w-full max-w-[1600px]">
        
        {/* Left Column: Metadata & Tools */}
        <div className="space-y-8 no-print">
           
           {/* Cover Art Studio */}
           <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200 animate-fade-in">
             <div className="flex items-center gap-2 mb-4 text-orange-600 font-bold uppercase tracking-widest text-sm border-b border-orange-100 pb-2">
               <ImageIcon className="w-4 h-4" /> Cover Art Studio
             </div>
             
             <div className="space-y-4">
               <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Description / Prompt</label>
                  <textarea 
                    className="w-full mt-1 p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-orange-500 text-sm h-24"
                    value={imagePrompt}
                    onChange={(e) => setImagePrompt(e.target.value)}
                    placeholder="Describe your book cover..."
                  />
               </div>

               <div className="flex items-center gap-3">
                 <div className="flex-1">
                   <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Quality</label>
                   <select 
                      className="w-full p-2 rounded-lg border border-slate-300 text-sm font-medium"
                      value={imageSize}
                      onChange={(e) => setImageSize(e.target.value as any)}
                    >
                      <option value="1K">1K (Standard)</option>
                      <option value="2K">2K (High Res)</option>
                      <option value="4K">4K (Ultra HD)</option>
                   </select>
                 </div>
               </div>

               {imageError && (
                 <p className="text-red-500 text-xs font-bold bg-red-50 p-2 rounded">{imageError}</p>
               )}

               <div className="flex gap-2">
                  <button 
                    onClick={handleGenerateCover}
                    disabled={isGeneratingImage}
                    className="flex-1 bg-slate-900 text-white py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition disabled:opacity-50"
                  >
                    {isGeneratingImage ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                    {coverImage ? "Regenerate" : "Generate Cover"}
                  </button>
                  
                  {coverImage && (
                    <button 
                      onClick={handleEditCover}
                      disabled={isGeneratingImage}
                      className="flex-1 bg-orange-100 text-orange-700 py-2 rounded-lg text-sm font-bold hover:bg-orange-200 transition disabled:opacity-50"
                    >
                      Refine / Edit
                    </button>
                  )}
               </div>
               <p className="text-[10px] text-slate-400 text-center leading-tight">
                 AI Provider: Auto-switch (DALL-E 3 &rarr; Gemini)
               </p>
             </div>
           </div>

           {/* Book Description / Listing Copy */}
           {book.description && (
             <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-orange-500">
               <div className="flex items-center gap-2 mb-4 text-orange-600 font-bold uppercase tracking-widest text-sm">
                 <Info className="w-4 h-4" /> Book Description
               </div>
               <p className="text-slate-700 leading-relaxed whitespace-pre-line font-serif text-sm">
                 {book.description}
               </p>
             </div>
           )}
        </div>

        {/* Right Column: Preview */}
        <div className="flex justify-center">
            {/* Book Container - This part gets printed */}
            <div className="w-full max-w-[21cm] bg-white shadow-2xl min-h-[29.7cm] print:shadow-none print:w-full print:max-w-none print:m-0">
              
              {/* Title Page */}
              <div className="min-h-[29.7cm] flex flex-col justify-center items-center text-center p-16 print:p-0 page-break relative overflow-hidden bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')]">
                 
                 <div className="relative z-10 w-full flex flex-col items-center">
                   {coverImage && (
                      <div className="mb-12 shadow-2xl border-4 border-white transform rotate-0 max-w-[300px] w-full aspect-[3/4] overflow-hidden bg-slate-200">
                        <img src={coverImage} alt="Book Cover" className="w-full h-full object-cover" />
                      </div>
                   )}

                   <div className="border-[6px] border-double border-slate-900 p-12 max-w-lg w-full bg-white/90 backdrop-blur-sm">
                    <h1 className="text-5xl font-serif font-black text-slate-900 mb-8 leading-tight">{book.title}</h1>
                    <p className="text-2xl text-orange-700 font-serif italic mb-12">{book.subtitle}</p>
                    <div className="w-24 h-1 bg-slate-900 mx-auto mb-12"></div>
                    <p className="text-sm text-slate-500 uppercase tracking-[0.3em] font-bold mb-3">Written By</p>
                    <p className="text-3xl font-bold text-slate-900">{authorName}</p>
                   </div>
                 </div>

                 <div className="absolute bottom-12 text-slate-400 text-xs font-bold uppercase tracking-widest z-10">
                   Printed by School of Standard Publisher
                 </div>
              </div>

              {/* Copyright & Disclaimer (Page 2) */}
              <div className="min-h-[29.7cm] p-16 print:p-16 flex flex-col justify-end page-break">
                 <div className="text-sm text-slate-500 space-y-4 font-serif">
                   <p>© {new Date().getFullYear()} {authorName}. All rights reserved.</p>
                   <p>
                     The information provided is for educational and entertainment purposes only. 
                     The author and publisher assume no responsibility for errors, omissions, or contrary interpretation of the subject matter herein.
                   </p>
                   <p>Printed by School of Standard Publisher.</p>
                 </div>
              </div>

              {/* Table of Contents */}
              <div className="min-h-[29.7cm] p-16 print:p-16 page-break">
                <h2 className="text-3xl font-serif font-bold text-slate-900 mb-10 border-b-4 border-orange-500 pb-4 inline-block">Table of Contents</h2>
                <div className="space-y-6">
                  {book.chapters.map((chapter, idx) => (
                    <div key={idx} className="flex items-baseline justify-between border-b border-dotted border-slate-300 pb-2">
                      <span className="text-lg font-serif text-slate-800"><span className="font-sans font-bold text-orange-600 text-base mr-3">CH {idx + 1}</span>{chapter.title}</span>
                      {/* In a real PDF generator we'd have page numbers, but for HTML print, we just list structure */}
                    </div>
                  ))}
                </div>
              </div>

              {/* Chapters */}
              <div className="p-16 print:p-16">
                {book.fullChapters.map((chapter, idx) => (
                  <article key={idx} className="mb-24 page-break">
                     <div className="mb-12 text-center">
                       <p className="text-sm font-black text-orange-500 uppercase tracking-[0.2em] mb-3">Chapter {idx + 1}</p>
                       <h2 className="text-4xl font-serif font-bold text-slate-900 leading-tight">{chapter.title}</h2>
                     </div>
                     
                     <div className="prose prose-lg prose-slate max-w-none font-serif text-justify">
                       <ReactMarkdown 
                          components={{
                            h1: ({node, ...props}) => <h3 className="text-2xl font-bold mt-8 mb-4 text-slate-800" {...props} />, // Map H1 to H3 visually to keep hierarchy below Title
                            h2: ({node, ...props}) => <h4 className="text-xl font-bold mt-8 mb-4 text-slate-900 border-l-4 border-orange-500 pl-4" {...props} />,
                            h3: ({node, ...props}) => <h5 className="text-lg font-bold mt-6 mb-2 text-slate-800" {...props} />,
                            p: ({node, ...props}) => <p className="mb-4 leading-relaxed text-slate-700" {...props} />,
                            ul: ({node, ...props}) => <ul className="list-disc pl-6 mb-4 space-y-2 marker:text-orange-500" {...props} />,
                            ol: ({node, ...props}) => <ol className="list-decimal pl-6 mb-4 space-y-2 marker:text-orange-500 font-bold" {...props} />,
                            blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-orange-400 pl-4 italic text-slate-700 my-8 bg-orange-50 py-4 pr-4 rounded-r-lg shadow-sm" {...props} />,
                            strong: ({node, ...props}) => <strong className="font-bold text-slate-900" {...props} />,
                          }}
                       >
                         {chapter.content}
                       </ReactMarkdown>
                     </div>
                     
                     {/* End of chapter visual break */}
                     <div className="flex justify-center mt-16 mb-8">
                       <div className="flex gap-2">
                          <div className="w-2 h-2 rounded-full bg-orange-300"></div>
                          <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                          <div className="w-2 h-2 rounded-full bg-orange-300"></div>
                       </div>
                     </div>
                  </article>
                ))}
              </div>

              {/* Back Cover */}
              <div className="min-h-[29.7cm] flex flex-col justify-center items-center text-center p-16 bg-slate-950 text-white page-break print:bg-slate-950 print:text-white print-color-adjust-exact">
                  <h3 className="text-4xl font-serif font-bold mb-8 text-orange-500">{book.title}</h3>
                  
                  <div className="max-w-md mb-16">
                    {book.backCoverCopy ? (
                      <div className="text-slate-300 text-lg leading-relaxed whitespace-pre-line font-serif text-justify">
                         <ReactMarkdown>{book.backCoverCopy}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-slate-300 text-lg leading-relaxed">
                        Thank you for reading.<br/>
                        <span className="text-sm text-slate-500 mt-4 block">Published by School of Standard Publisher</span>
                      </p>
                    )}
                  </div>
                  
                  <div className="border-t border-slate-800 pt-8 w-1/3 mt-auto">
                       <div className="text-xs font-bold tracking-widest text-slate-600 uppercase">School of Standard Publisher</div>
                  </div>
              </div>

            </div>
        </div>
      </div>
    </div>
  );
}