import React, { useState, useEffect } from 'react';
import { BookOptions } from '../types';
import { BookOpen, User, FileText, CheckSquare, Sparkles, Flame } from 'lucide-react';

interface InputWizardProps {
  onSubmit: (options: BookOptions) => void;
  isSubmitting: boolean;
  initialValues?: BookOptions | null;
}

const TONES = [
  "Professional", "Conversational", "Academic", "Inspirational", "Persuasive", "Technical", "Narrative"
];

const AUDIENCES = [
  "Beginners", "Intermediate", "Advanced", "Children", "Young Adults", "Professionals", "General Public",
  "Christian Community", "Religious Groups", "Spiritual Seekers", "Church Leaders", "Faith-Based Organizations",
  "Entrepreneurs", "Small Business Owners", "Corporate Executives", "Freelancers", "Creatives",
  "Educators", "Students", "Parents", "Retirees", "Health & Wellness Enthusiasts", "Tech Industry",
  "Real Estate Professionals", "Financial Advisors", "Marketers"
];

const ENGLISH_STYLES = [
  "Standard American English",
  "Standard British English",
  "Simple & Direct (Plain English)",
  "Academic & Formal",
  "Creative & Descriptive",
  "Persuasive & Copywriting-Style",
  "Conversational & Casual",
  "Technical & Precise",
  "Softer / Empathetic Tone",
  "Old English / Archaic (Stylized)"
];

const EXTRAS = [
  "Case Studies", "Worksheets", "Action Plans", "Reflection Questions", "Checklists", "Resource Lists"
];

export const InputWizard: React.FC<InputWizardProps> = ({ onSubmit, isSubmitting, initialValues }) => {
  const [formData, setFormData] = useState<BookOptions>(initialValues || {
    topic: '',
    targetAudience: 'Beginners',
    englishStyle: 'Standard American English',
    pageCount: 'Medium (30-50 pages)',
    targetChapterCount: 10,
    tone: 'Professional',
    authorName: '',
    objective: '',
    bookDescription: '',
    extras: []
  });

  useEffect(() => {
    if (initialValues) {
      setFormData(initialValues);
    }
  }, [initialValues]);

  const handleExtraChange = (extra: string) => {
    setFormData(prev => {
      if (prev.extras.includes(extra)) {
        return { ...prev, extras: prev.extras.filter(e => e !== extra) };
      }
      return { ...prev, extras: [...prev.extras, extra] };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-2xl overflow-hidden border border-slate-200">
      
      {/* Header - Black with Orange/Gold Branding */}
      <div className="bg-slate-950 p-8 text-white text-center border-b-4 border-orange-500 relative overflow-hidden">
        {/* Abstract Glow Background */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-full bg-orange-500 opacity-20 blur-3xl rounded-full pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col items-center">
            {/* Logo Simulation */}
            <div className="flex items-center gap-2 mb-2">
                <Flame className="w-10 h-10 text-orange-500 fill-orange-500" />
                <div className="text-4xl font-black italic tracking-tighter uppercase leading-none">
                    <span className="text-white block text-xl not-italic font-bold tracking-widest mb-[-5px]">School of</span>
                    <span className="text-logo-gradient text-5xl">STANDARD</span>
                </div>
            </div>
            <p className="text-slate-400 font-medium tracking-wide text-sm mt-2 uppercase">Publishing Intelligence Suite</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-8">
        
        {/* Section 1: Core Concept */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-orange-600 font-bold border-b-2 border-orange-100 pb-2">
            <BookOpen className="w-6 h-6" />
            <h2 className="uppercase tracking-wider">Core Concept</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-1 uppercase text-xs tracking-wider">Book Topic / Niche</label>
              <input 
                required
                type="text" 
                placeholder="e.g., Personal Finance for Millennials, Urban Gardening..."
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition font-medium"
                value={formData.topic}
                onChange={e => setFormData({...formData, topic: e.target.value})}
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1 uppercase text-xs tracking-wider">Target Audience</label>
              <select 
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-orange-500 outline-none bg-white"
                value={formData.targetAudience}
                onChange={e => setFormData({...formData, targetAudience: e.target.value})}
              >
                {AUDIENCES.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1 uppercase text-xs tracking-wider">English Style</label>
              <select 
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-orange-500 outline-none bg-white"
                value={formData.englishStyle}
                onChange={e => setFormData({...formData, englishStyle: e.target.value})}
              >
                {ENGLISH_STYLES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

             <div>
              <label className="block text-sm font-bold text-slate-700 mb-1 uppercase text-xs tracking-wider">Objective</label>
              <input 
                type="text" 
                placeholder="e.g. Educate, Inspire, Sell a service..."
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-orange-500 outline-none"
                value={formData.objective}
                onChange={e => setFormData({...formData, objective: e.target.value})}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-1 uppercase text-xs tracking-wider">Book Description (Optional)</label>
              <textarea 
                placeholder="Provide a brief description or summary of what you want the book to be about..."
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-orange-500 outline-none h-24 resize-none"
                value={formData.bookDescription || ''}
                onChange={e => setFormData({...formData, bookDescription: e.target.value})}
              />
            </div>
          </div>
        </section>

        {/* Section 2: Style & Identity */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-orange-600 font-bold border-b-2 border-orange-100 pb-2">
            <User className="w-6 h-6" />
            <h2 className="uppercase tracking-wider">Style & Identity</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
             <div>
              <label className="block text-sm font-bold text-slate-700 mb-1 uppercase text-xs tracking-wider">Author Name</label>
              <input 
                required
                type="text" 
                placeholder="Name to appear on cover"
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-orange-500 outline-none"
                value={formData.authorName}
                onChange={e => setFormData({...formData, authorName: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1 uppercase text-xs tracking-wider">Tone of Voice</label>
              <select 
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-orange-500 outline-none bg-white"
                value={formData.tone}
                onChange={e => setFormData({...formData, tone: e.target.value})}
              >
                {TONES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
        </section>

        {/* Section 3: Structure */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-orange-600 font-bold border-b-2 border-orange-100 pb-2">
            <FileText className="w-6 h-6" />
            <h2 className="uppercase tracking-wider">Structure & Features</h2>
          </div>
          
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1 uppercase text-xs tracking-wider">Target Length</label>
              <select 
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-orange-500 outline-none bg-white"
                value={formData.pageCount}
                onChange={e => setFormData({...formData, pageCount: e.target.value})}
              >
                <option value="Short (20-30 pages)">Short (~20-30 pages)</option>
                <option value="Medium (30-50 pages)">Medium (~30-50 pages)</option>
                <option value="Long (50+ pages)">Long (~50+ pages)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1 uppercase text-xs tracking-wider">Target Chapters</label>
              <input 
                type="number" 
                min="3"
                max="50"
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-orange-500 outline-none"
                value={formData.targetChapterCount}
                onChange={e => setFormData({...formData, targetChapterCount: parseInt(e.target.value) || 10})}
              />
            </div>

          <div>
             <label className="block text-sm font-bold text-slate-700 mb-3 uppercase text-xs tracking-wider">Optional Features</label>
             <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
               {EXTRAS.map(extra => (
                 <label key={extra} className={`
                    flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all
                    ${formData.extras.includes(extra) 
                      ? 'border-orange-500 bg-orange-50 text-orange-800 font-bold' 
                      : 'border-slate-200 hover:border-orange-300'}
                 `}>
                   <input 
                    type="checkbox" 
                    className="hidden"
                    checked={formData.extras.includes(extra)}
                    onChange={() => handleExtraChange(extra)}
                   />
                   <CheckSquare className={`w-5 h-5 ${formData.extras.includes(extra) ? 'fill-orange-500 text-white' : 'text-slate-300'}`} />
                   <span className="text-sm">{extra}</span>
                 </label>
               ))}
             </div>
          </div>
        </section>

        <div className="pt-6 border-t border-slate-100">
          <button 
            type="submit" 
            disabled={isSubmitting}
            className={`
              w-full py-4 rounded-xl text-lg font-black uppercase tracking-widest text-white shadow-xl transition-all
              ${isSubmitting 
                ? 'bg-slate-400 cursor-not-allowed' 
                : 'bg-gradient-to-r from-orange-500 via-orange-600 to-red-600 hover:from-orange-600 hover:to-red-700 transform hover:-translate-y-1 hover:shadow-orange-500/30'}
            `}
          >
            {isSubmitting ? 'Analyzing & Generating Outline...' : 'Generate eBook Outline'}
          </button>
        </div>

      </form>
    </div>
  );
};