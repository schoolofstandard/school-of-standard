import React from 'react';
import { BookOutline } from '../types';
import { Loader2, CheckCircle2, Circle } from 'lucide-react';

interface BookGeneratorProps {
  outline: BookOutline;
  currentChapterIndex: number;
  completedChapters: number;
}

export const BookGenerator: React.FC<BookGeneratorProps> = ({ outline, currentChapterIndex, completedChapters }) => {
  const totalChapters = outline.chapters.length;
  const progress = Math.round((completedChapters / totalChapters) * 100);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="p-10 text-center border-b border-slate-100 bg-slate-50">
          <div className="w-20 h-20 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
            <Loader2 className="w-10 h-10 animate-spin" />
          </div>
          <h2 className="text-3xl font-black text-slate-900 mb-2 uppercase tracking-tight">Writing Your Masterpiece</h2>
          <p className="text-slate-500 font-medium">The School of Standard engine is generating your eBook.<br/>Please do not close this tab.</p>
        </div>

        <div className="p-8 bg-white">
          {/* Progress Bar */}
          <div className="mb-10">
            <div className="flex justify-between text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">
              <span>Overall Progress</span>
              <span className="text-orange-600">{progress}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden shadow-inner">
              <div 
                className="bg-gradient-to-r from-orange-500 to-red-600 h-full rounded-full transition-all duration-500 ease-out relative" 
                style={{ width: `${progress}%` }}
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
              </div>
            </div>
          </div>

          {/* Current Action */}
          <div className="space-y-3">
             <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-100 pb-2">Generation Queue</div>
             
             {outline.chapters.map((chapter, idx) => {
               let statusIcon;
               let statusClass = "text-slate-400";
               
               if (idx < currentChapterIndex) {
                 statusIcon = <CheckCircle2 className="w-5 h-5 text-green-500" />;
                 statusClass = "text-green-700 font-medium opacity-60";
               } else if (idx === currentChapterIndex) {
                 statusIcon = <Loader2 className="w-5 h-5 text-orange-600 animate-spin" />;
                 statusClass = "text-slate-900 font-bold bg-orange-50/50 shadow-sm ring-1 ring-orange-200 rounded-lg";
               } else {
                 statusIcon = <Circle className="w-5 h-5 text-slate-200" />;
                 statusClass = "text-slate-400";
               }

               return (
                 <div key={idx} className={`flex items-center gap-4 p-3 transition-all ${statusClass}`}>
                   {statusIcon}
                   <span className="truncate text-sm">
                     <span className="opacity-70 mr-2">Chapter {idx + 1}:</span> 
                     {chapter.title}
                   </span>
                 </div>
               );
             })}
          </div>
        </div>
      </div>
    </div>
  );
};