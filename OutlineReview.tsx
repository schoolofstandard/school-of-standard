import React from 'react';
import { BookOutline } from '../types';
import { ArrowRight, CheckCircle, Flame } from 'lucide-react';

interface OutlineReviewProps {
  outline: BookOutline;
  onApprove: () => void;
  onCancel: () => void;
}

export const OutlineReview: React.FC<OutlineReviewProps> = ({ outline, onApprove, onCancel }) => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="bg-slate-950 text-white p-10 text-center border-b-4 border-orange-500 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-orange-600 opacity-10 blur-[100px] rounded-full pointer-events-none"></div>
          
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-900/50 border border-orange-500/30 text-orange-400 text-xs font-bold uppercase tracking-widest mb-4">
               <Flame className="w-3 h-3" /> Proposed Structure
            </div>
            <h1 className="text-3xl md:text-5xl font-serif font-bold mb-4 leading-tight">{outline.title}</h1>
            <h2 className="text-xl text-slate-300 italic font-light">{outline.subtitle}</h2>
          </div>
        </div>

        <div className="p-8">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
             <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2 uppercase tracking-wide">
               <CheckCircle className="w-6 h-6 text-green-500" />
               Table of Contents
             </h3>
             <span className="text-sm font-bold text-orange-700 bg-orange-50 px-4 py-2 rounded-lg border border-orange-100">
               {outline.chapters.length} Chapters
             </span>
          </div>

          <div className="space-y-4">
            {outline.chapters.map((chapter, idx) => (
              <div key={idx} className="flex gap-5 p-5 rounded-xl bg-slate-50 border border-slate-200 hover:border-orange-300 hover:shadow-md transition group">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-lg shadow-sm group-hover:bg-orange-600 transition-colors">
                  {idx + 1}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-lg mb-1">{chapter.title}</h4>
                  <p className="text-slate-600 text-sm leading-relaxed">{chapter.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4 justify-end">
          <button 
            onClick={onCancel}
            className="px-6 py-3 rounded-lg font-bold text-slate-600 hover:bg-slate-200 transition uppercase text-sm tracking-wide"
          >
            Cancel & Edit
          </button>
          <button 
            onClick={onApprove}
            className="px-8 py-3 rounded-lg font-black text-white bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 shadow-lg hover:shadow-orange-500/30 flex items-center gap-2 transition uppercase text-sm tracking-widest"
          >
            Start Writing eBook <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};