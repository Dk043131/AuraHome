import React, { useState } from 'react';
import { 
  Home, 
  Cpu, 
  Zap, 
  Thermometer, 
  Sun, 
  Mic, 
  CheckCircle2, 
  LayoutGrid,
  Languages,
  ChevronDown
} from 'lucide-react';
import { languages, getTranslation } from '../i18n/translations';

export default function Navbar({ 
  env = {}, 
  activeTab = 'voice',
  onSelectTab,
  onOpenGoogleModal,
  currentLang = 'en',
  onSelectLang
}) {
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const e = env || {};

  const currentLangObj = languages.find(l => l.code === currentLang) || languages[0];

  const t = (key) => getTranslation(currentLang, key);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-emerald-100 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3 sm:gap-4">
          
          {/* Logo & Brand */}
          <div 
            onClick={() => onSelectTab('appliances')}
            className="flex items-center gap-3 cursor-pointer shrink-0"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-emerald-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 ring-4 ring-emerald-50">
              <Home className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-slate-900">
                  Aura<span className="text-emerald-600">Home</span>
                </span>
                <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 hidden xs:inline-block">
                  {t('pure_software')}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium hidden md:block">
                {t('brand_sub')}
              </p>
            </div>
          </div>

          {/* Primary Navigation Tabs */}
          <nav className="flex items-center gap-1 sm:gap-2">
            
            {/* Big Voice AI Studio Tab */}
            <button
              onClick={() => onSelectTab('voice')}
              className={`px-3 sm:px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'voice'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-2 ring-emerald-300'
                  : 'bg-emerald-50/80 hover:bg-emerald-100/70 text-emerald-800 border border-emerald-200'
              }`}
            >
              <div className="relative flex items-center justify-center">
                <Mic className="w-4 h-4" />
                {activeTab !== 'voice' && (
                  <span className="absolute -top-1 -right-1 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
                  </span>
                )}
              </div>
              <span>{t('tab_voice')}</span>
            </button>

            {/* Appliances Tab */}
            <button
              onClick={() => onSelectTab('appliances')}
              className={`px-3 sm:px-3.5 py-2 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'appliances'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white hover:bg-emerald-50/60 text-slate-600 border border-slate-200 hover:border-emerald-200'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t('tab_appliances')}</span>
            </button>

            {/* Software Hardware MCU Lab Tab */}
            <button
              onClick={() => onSelectTab('hardware')}
              className={`px-3 sm:px-3.5 py-2 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'hardware'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white hover:bg-emerald-50/60 text-slate-600 border border-slate-200 hover:border-emerald-200'
              }`}
            >
              <Cpu className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">{t('tab_virtual_mcu')}</span>
            </button>

            {/* Energy Tab */}
            <button
              onClick={() => onSelectTab('energy')}
              className={`px-3 sm:px-3.5 py-2 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'energy'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white hover:bg-emerald-50/60 text-slate-600 border border-slate-200 hover:border-emerald-200'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden md:inline">{t('tab_energy')}</span>
            </button>
          </nav>

          {/* Right Section: Language Selector Dropdown & Telemetry */}
          <div className="flex items-center gap-2 text-xs">
            
            {/* Language Selector Dropdown */}
            <div className="relative">
              <button
                onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-slate-700 font-bold shadow-2xs transition-all cursor-pointer"
                title="Change language / மொழி / भाषा"
              >
                <Languages className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-800">{currentLangObj.nativeName}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {langDropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setLangDropdownOpen(false)} 
                  />
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl border border-emerald-100 shadow-xl z-50 py-1.5 overflow-hidden animate-fade-in">
                    <div className="px-3 py-1 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-100">
                      Regional Languages
                    </div>
                    {languages.map((l) => (
                      <button
                        key={l.code}
                        onClick={() => {
                          onSelectLang(l.code);
                          setLangDropdownOpen(false);
                        }}
                        className={`w-full px-3 py-2 text-left text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                          currentLang === l.code
                            ? 'bg-emerald-50 text-emerald-800 font-bold'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-emerald-700">{l.nativeName}</span>
                          <span className="text-[10px] text-slate-400">({l.name})</span>
                        </div>
                        {currentLang === l.code && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Environment Badge */}
            <div className="hidden lg:flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-50 text-slate-700 font-semibold border border-emerald-100">
              <Thermometer className="w-3.5 h-3.5 text-emerald-600" />
              <span>{e.temp_c ?? 28.2}°C</span>
            </div>

          </div>

        </div>
      </div>
    </header>
  );
}
