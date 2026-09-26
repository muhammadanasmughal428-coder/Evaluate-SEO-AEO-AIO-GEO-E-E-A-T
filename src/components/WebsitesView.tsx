import React, { useState, useEffect } from 'react';
import {
  Globe2,
  Calendar,
  ExternalLink,
  PlusCircle,
  Loader2,
  ArrowRight,
  ShieldCheck,
  MapPin,
  Search,
  Building2,
  Phone,
  Sparkles,
  Check,
  Copy,
  Trash2,
  Edit3,
  X,
  Compass,
  Star,
  CheckCircle2,
  Link2,
} from 'lucide-react';
import { WebsiteItem } from '../types/index.ts';
import { useAuth } from '../context/AuthContext.tsx';

interface WebsitesViewProps {
  onStartAuditForDomain: (url: string) => void;
}

const CATEGORIES = [
  'All Categories',
  'Technology & AI',
  'Corporate & Business',
  'Higher Education & Universities',
  'Medical & Healthcare',
  'Government & IT',
  'Research & Global Science',
];

export const WebsitesView: React.FC<WebsitesViewProps> = ({
  onStartAuditForDomain,
}) => {
  const { idToken } = useAuth();
  const [websites, setWebsites] = useState<WebsiteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedCity, setSelectedCity] = useState('All Cities');
  const [selectedTld, setSelectedTld] = useState<'all' | 'com' | 'pk' | 'other'>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSiteId, setEditingSiteId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [urlPrefix, setUrlPrefix] = useState<'https://www.' | 'http://www.' | 'https://' | 'http://' | 'www.'>('https://www.');
  const [domainCore, setDomainCore] = useState('');
  const [urlSuffix, setUrlSuffix] = useState<'.com' | '.com.pk' | '.org' | '.edu.pk' | '.gov.pk'>('.com');
  const [rootUrl, setRootUrl] = useState('');
  const [category, setCategory] = useState('Technology & AI');
  const [address, setAddress] = useState('');
  const [addressUrl, setAddressUrl] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('Pakistan');
  const [phone, setPhone] = useState('');
  const [description, setDescription] = useState('');

  // UI helpers
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteLoadingId, setDeleteLoadingId] = useState<number | null>(null);

  const fetchWebsites = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/websites');
      if (res.ok) {
        const data = await res.json();
        setWebsites(data);
      }
    } catch (err) {
      console.error('Failed to load websites:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWebsites();
  }, []);

  const openAddModal = () => {
    setEditingSiteId(null);
    setTitle('');
    setUrlPrefix('https://www.');
    setDomainCore('');
    setUrlSuffix('.com');
    setRootUrl('https://www.example.com');
    setCategory('Technology & AI');
    setAddress('');
    setAddressUrl('');
    setCity('');
    setCountry('Pakistan');
    setPhone('');
    setDescription('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (site: WebsiteItem) => {
    setEditingSiteId(site.id);
    setTitle(site.title || '');
    
    // Parse existing URL into prefix, core, suffix
    const currentUrl = site.rootUrl || '';
    let pre: 'https://www.' | 'http://www.' | 'https://' | 'http://' | 'www.' = 'https://www.';
    let core = currentUrl;
    let suf: '.com' | '.com.pk' | '.org' | '.edu.pk' | '.gov.pk' = '.com';

    if (currentUrl.startsWith('https://www.')) {
      pre = 'https://www.';
      core = currentUrl.slice('https://www.'.length);
    } else if (currentUrl.startsWith('http://www.')) {
      pre = 'http://www.';
      core = currentUrl.slice('http://www.'.length);
    } else if (currentUrl.startsWith('https://')) {
      pre = 'https://';
      core = currentUrl.slice('https://'.length);
    } else if (currentUrl.startsWith('http://')) {
      pre = 'http://';
      core = currentUrl.slice('http://'.length);
    } else if (currentUrl.startsWith('www.')) {
      pre = 'www.';
      core = currentUrl.slice('www.'.length);
    }

    // Check suffix
    if (core.endsWith('.com.pk')) {
      suf = '.com.pk';
      core = core.slice(0, core.length - 7);
    } else if (core.endsWith('.edu.pk')) {
      suf = '.edu.pk';
      core = core.slice(0, core.length - 7);
    } else if (core.endsWith('.gov.pk')) {
      suf = '.gov.pk';
      core = core.slice(0, core.length - 7);
    } else if (core.endsWith('.org')) {
      suf = '.org';
      core = core.slice(0, core.length - 4);
    } else if (core.endsWith('.com')) {
      suf = '.com';
      core = core.slice(0, core.length - 4);
    }

    setUrlPrefix(pre);
    setDomainCore(core);
    setUrlSuffix(suf);
    setRootUrl(currentUrl);

    setCategory(site.category || 'Technology & AI');
    setAddress(site.address || '');
    setAddressUrl(site.addressUrl || '');
    setCity(site.city || '');
    setCountry(site.country || 'Pakistan');
    setPhone(site.phone || '');
    setDescription(site.description || '');
    setFormError(null);
    setIsModalOpen(true);
  };

  // Sync composed URL whenever components change
  useEffect(() => {
    if (domainCore.trim()) {
      let cleanCore = domainCore.trim().toLowerCase();
      // Remove any existing http/www/slashes that user might paste in the core
      cleanCore = cleanCore.replace(/^https?:\/\//, '').replace(/^www\./, '');
      // Remove any trailing .com etc
      cleanCore = cleanCore.replace(/\.(com|com\.pk|edu\.pk|gov\.pk|org|net)$/, '');
      cleanCore = cleanCore.replace(/\/+$/, '');

      setRootUrl(`${urlPrefix}${cleanCore}${urlSuffix}`);
    }
  }, [urlPrefix, domainCore, urlSuffix]);

  const handleApplyPreset = (name: string, core: string) => {
    setTitle(name);
    setUrlPrefix('https://www.');
    setDomainCore(core);
    setUrlSuffix('.com');
  };

  const handleAutoGenerateMapUrl = () => {
    if (!address.trim()) {
      setFormError('Please enter the physical address first before generating Google Maps link.');
      return;
    }
    const query = [address.trim(), city.trim(), country.trim()].filter(Boolean).join(', ');
    const generatedUrl = `https://maps.google.com/?q=${encodeURIComponent(query)}`;
    setAddressUrl(generatedUrl);
    setFormError(null);
  };

  const handleSaveWebsite = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Compute final clean URL with start (http/https/www) and end (.com)
    let cleanUrl = rootUrl.trim();
    if (domainCore.trim()) {
      let cleanCore = domainCore.trim().toLowerCase()
        .replace(/^https?:\/\//, '')
        .replace(/^www\./, '')
        .replace(/\.(com|com\.pk|edu\.pk|gov\.pk|org|net)$/, '')
        .replace(/\/+$/, '');
      cleanUrl = `${urlPrefix}${cleanCore}${urlSuffix}`;
    }

    if (!cleanUrl || cleanUrl.includes('example.com') && !domainCore) {
      setFormError('Please enter a valid domain name (e.g. google, systemsltd).');
      return;
    }

    try {
      setSubmitting(true);
      setFormError(null);

      // Ensure protocol is present
      if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
        cleanUrl = 'https://' + cleanUrl;
      }

      let finalAddressUrl = addressUrl.trim();
      if (!finalAddressUrl && address.trim()) {
        const query = [address.trim(), city.trim(), country.trim()].filter(Boolean).join(', ');
        finalAddressUrl = `https://maps.google.com/?q=${encodeURIComponent(query)}`;
      }

      const payload = {
        title: title.trim() || undefined,
        rootUrl: cleanUrl,
        category,
        address: address.trim() || undefined,
        addressUrl: finalAddressUrl || undefined,
        city: city.trim() || undefined,
        country: country.trim() || undefined,
        phone: phone.trim() || undefined,
        description: description.trim() || undefined,
      };

      const url = editingSiteId ? `/api/websites/${editingSiteId}` : '/api/websites';
      const method = editingSiteId ? 'PUT' : 'POST';

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (idToken) {
        headers['Authorization'] = `Bearer ${idToken}`;
      }

      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to save website');
      }

      await fetchWebsites();
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteWebsite = async (id: number, siteTitle?: string) => {
    if (!confirm(`Are you sure you want to remove "${siteTitle || 'this website'}" from the directory?`)) {
      return;
    }

    try {
      setDeleteLoadingId(id);
      const headers: Record<string, string> = {};
      if (idToken) {
        headers['Authorization'] = `Bearer ${idToken}`;
      }

      const res = await fetch(`/api/websites/${id}`, {
        method: 'DELETE',
        headers,
      });

      if (res.ok) {
        setWebsites((prev) => prev.filter((s) => s.id !== id));
      }
    } catch (err) {
      console.error('Delete website error:', err);
    } finally {
      setDeleteLoadingId(null);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  // Derive unique cities
  const uniqueCities = Array.from(
    new Set(websites.map((w) => w.city).filter((c): c is string => Boolean(c)))
  );

  // Helper to test if domain is .com
  const isDotCom = (domainOrUrl?: string) => {
    if (!domainOrUrl) return false;
    const lower = domainOrUrl.toLowerCase();
    try {
      const u = lower.startsWith('http') ? new URL(lower).hostname : lower;
      return u.endsWith('.com');
    } catch {
      return lower.includes('.com');
    }
  };

  // Render a decomposed URL with start (http/www) and end (.com) highlighted
  const renderFormattedUrl = (rawUrl: string, domainName?: string) => {
    const url = rawUrl || (domainName ? `https://${domainName}` : '');
    let prefix = 'https://www.';
    let core = url;
    let suffix = '';

    if (url.startsWith('https://www.')) {
      prefix = 'https://www.';
      core = url.slice('https://www.'.length);
    } else if (url.startsWith('http://www.')) {
      prefix = 'http://www.';
      core = url.slice('http://www.'.length);
    } else if (url.startsWith('https://')) {
      prefix = 'https://';
      core = url.slice('https://'.length);
    } else if (url.startsWith('http://')) {
      prefix = 'http://';
      core = url.slice('http://'.length);
    } else if (url.startsWith('www.')) {
      prefix = 'www.';
      core = url.slice('www.'.length);
    }

    // Strip trailing slash
    core = core.replace(/\/+$/, '');

    if (core.toLowerCase().endsWith('.com')) {
      core = core.slice(0, core.length - 4);
      suffix = '.com';
    } else if (core.toLowerCase().endsWith('.com.pk')) {
      core = core.slice(0, core.length - 7);
      suffix = '.com.pk';
    } else if (core.toLowerCase().endsWith('.edu.pk')) {
      core = core.slice(0, core.length - 7);
      suffix = '.edu.pk';
    } else if (core.toLowerCase().endsWith('.gov.pk')) {
      core = core.slice(0, core.length - 7);
      suffix = '.gov.pk';
    } else if (core.toLowerCase().endsWith('.org')) {
      core = core.slice(0, core.length - 4);
      suffix = '.org';
    } else if (core.toLowerCase().endsWith('.ch')) {
      core = core.slice(0, core.length - 3);
      suffix = '.ch';
    } else if (core.toLowerCase().endsWith('.edu')) {
      core = core.slice(0, core.length - 4);
      suffix = '.edu';
    }

    return (
      <span className="font-mono text-xs inline-flex items-center flex-wrap gap-0.5">
        <span className="text-cyan-400 font-bold bg-cyan-950/60 px-1 py-0.5 rounded border border-cyan-500/30">
          {prefix}
        </span>
        <span className="text-white font-black px-1">{core}</span>
        {suffix === '.com' ? (
          <span className="text-amber-300 font-black bg-amber-500/20 px-1.5 py-0.5 rounded border border-amber-500/50 shadow-sm">
            .com
          </span>
        ) : (
          <span className="text-emerald-400 font-bold bg-emerald-950/60 px-1 py-0.5 rounded border border-emerald-500/30">
            {suffix || '.com'}
          </span>
        )}
      </span>
    );
  };

  // Filter logic
  const filteredWebsites = websites.filter((site) => {
    // TLD filter
    if (selectedTld === 'com' && !isDotCom(site.domain || site.rootUrl)) {
      return false;
    }
    if (selectedTld === 'pk' && !(site.domain || site.rootUrl || '').toLowerCase().includes('.pk')) {
      return false;
    }
    if (selectedTld === 'other' && (isDotCom(site.domain || site.rootUrl) || (site.domain || '').toLowerCase().includes('.pk'))) {
      return false;
    }

    // Category filter
    if (selectedCategory !== 'All Categories' && site.category !== selectedCategory) {
      return false;
    }

    // City filter
    if (selectedCity !== 'All Cities' && site.city !== selectedCity) {
      return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = (site.title || '').toLowerCase().includes(q);
      const matchDomain = (site.domain || '').toLowerCase().includes(q);
      const matchUrl = (site.rootUrl || '').toLowerCase().includes(q);
      const matchAddress = (site.address || '').toLowerCase().includes(q);
      const matchCity = (site.city || '').toLowerCase().includes(q);
      const matchCountry = (site.country || '').toLowerCase().includes(q);
      const matchDesc = (site.description || '').toLowerCase().includes(q);
      return matchTitle || matchDomain || matchUrl || matchAddress || matchCity || matchCountry || matchDesc;
    }
    return true;
  });

  const totalDotComCount = websites.filter((w) => isDotCom(w.domain || w.rootUrl)).length;
  const totalWithAddressLinks = websites.filter((w) => w.addressUrl || w.address).length;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-slate-400">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        <p className="text-sm font-medium">Retrieving professional websites and map links from Cloud SQL...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="rounded-3xl border border-indigo-500/30 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 p-6 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <Globe2 className="h-5 w-5" />
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Professional Websites Directory (http / www. & .com)
              </h1>
              <span className="rounded-full bg-cyan-500/20 border border-cyan-500/40 px-2.5 py-0.5 text-[11px] font-bold text-cyan-300 font-mono">
                start: http/www.
              </span>
              <span className="rounded-full bg-amber-500/20 border border-amber-500/40 px-2.5 py-0.5 text-[11px] font-bold text-amber-300 font-mono">
                end: .com
              </span>
              <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300">
                📍 مع گوگل میپس ایڈریس لنکس
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              تمام تصدیق شدہ پروفیشنل ویب سائٹس کا ڈائرکٹری پورٹل جن کے شروع میں <span className="text-cyan-300 font-bold font-mono">http:// / https://www.</span> اور آخر میں <span className="text-amber-300 font-bold font-mono">.com</span> شامل ہے۔ ہر ویب سائٹ کے ساتھ اس کا فزیکل آفس ایڈریس اور گوگل میپس نیویگیشن لنک منسلک ہے۔
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            {/* Quick Metrics */}
            <div className="flex items-center gap-3 rounded-2xl bg-slate-950/80 border border-slate-800 px-4 py-2.5 text-xs text-slate-300">
              <div className="text-center">
                <span className="block text-base font-bold text-white font-mono">{websites.length}</span>
                <span className="text-[10px] text-slate-400">Total Sites</span>
              </div>
              <span className="text-slate-700">|</span>
              <div className="text-center">
                <span className="block text-base font-bold text-amber-400 font-mono flex items-center justify-center gap-0.5">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  {totalDotComCount}
                </span>
                <span className="text-[10px] text-amber-300 font-semibold">.COM Sites</span>
              </div>
              <span className="text-slate-700">|</span>
              <div className="text-center">
                <span className="block text-base font-bold text-cyan-400 font-mono">{totalWithAddressLinks}</span>
                <span className="text-[10px] text-slate-400">With Map Links</span>
              </div>
            </div>

            <button
              onClick={openAddModal}
              className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-600 via-indigo-600 to-cyan-600 hover:opacity-95 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-600/20 transition active:scale-95"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Add (www. & .com) Website</span>
            </button>
          </div>
        </div>
      </div>

      {/* TLD Extension Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
        <span className="text-xs font-bold text-slate-400 mr-1 flex items-center gap-1">
          <Globe2 className="h-3.5 w-3.5 text-indigo-400" />
          Filter by Domain Extension:
        </span>

        <button
          onClick={() => setSelectedTld('all')}
          className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
            selectedTld === 'all'
              ? 'bg-indigo-600 text-white shadow'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <span>All Formats</span>
          <span className="rounded-full bg-slate-800 px-1.5 py-0.2 text-[10px] text-slate-300">
            {websites.length}
          </span>
        </button>

        <button
          onClick={() => setSelectedTld('com')}
          className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition border ${
            selectedTld === 'com'
              ? 'bg-amber-500 text-slate-950 font-black border-amber-400 shadow-lg shadow-amber-500/20'
              : 'bg-slate-900 border-amber-500/40 text-amber-300 hover:bg-amber-950/30'
          }`}
        >
          <Star className="h-3 w-3 fill-current" />
          <span>⭐ www._____.com Websites ({totalDotComCount})</span>
        </button>

        <button
          onClick={() => setSelectedTld('pk')}
          className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
            selectedTld === 'pk'
              ? 'bg-emerald-600 text-white shadow'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <span>🇵🇰 .PK Domains (.edu.pk, .gov.pk)</span>
          <span className="rounded-full bg-slate-800 px-1.5 py-0.2 text-[10px] text-slate-300">
            {websites.filter((w) => (w.domain || '').toLowerCase().includes('.pk')).length}
          </span>
        </button>

        <button
          onClick={() => setSelectedTld('other')}
          className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
            selectedTld === 'other'
              ? 'bg-purple-600 text-white shadow'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <span>🏛️ Academic & Science (.edu, .org, .ch)</span>
          <span className="rounded-full bg-slate-800 px-1.5 py-0.2 text-[10px] text-slate-300">
            {websites.filter((w) => !isDotCom(w.domain) && !(w.domain || '').toLowerCase().includes('.pk')).length}
          </span>
        </button>
      </div>

      {/* Search & Category Filter Controls */}
      <div className="space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search website (e.g. www.google.com, www.systemsltd.com), city, or address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-2xl border border-slate-800 bg-slate-900/90 pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500 shadow-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-3 text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* City Filter */}
          {uniqueCities.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto text-xs shrink-0 scrollbar-thin">
              <span className="text-[11px] text-slate-400 font-medium px-1 flex items-center gap-1">
                <MapPin className="h-3 w-3 text-cyan-400" />
                City:
              </span>
              <button
                onClick={() => setSelectedCity('All Cities')}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                  selectedCity === 'All Cities'
                    ? 'bg-cyan-600 text-white'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                All Cities
              </button>
              {uniqueCities.map((city) => (
                <button
                  key={city}
                  onClick={() => setSelectedCity(city)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition whitespace-nowrap ${
                    selectedCity === city
                      ? 'bg-cyan-600 text-white'
                      : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {city}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-thin">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white shadow'
                  : 'bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Directory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredWebsites.map((site) => {
          const hasDotCom = isDotCom(site.domain || site.rootUrl);
          const mapUrl =
            site.addressUrl ||
            (site.address
              ? `https://maps.google.com/?q=${encodeURIComponent(
                  [site.address, site.city, site.country].filter(Boolean).join(', ')
                )}`
              : null);

          // Full clean rootUrl
          const displayUrl = site.rootUrl || (site.domain ? `https://${site.domain}` : '');

          return (
            <div
              key={site.id}
              className={`rounded-3xl border p-5 space-y-4 transition group shadow-xl flex flex-col justify-between ${
                hasDotCom
                  ? 'border-amber-500/30 bg-slate-900/80 hover:border-amber-400/60'
                  : 'border-slate-800 bg-slate-900/70 hover:border-indigo-500/40'
              }`}
            >
              <div className="space-y-3.5">
                {/* Header: Logo, Title, Category */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-2xl border shrink-0 group-hover:scale-105 transition ${
                        hasDotCom
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                      }`}
                    >
                      <Globe2 className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white group-hover:text-amber-200 transition line-clamp-1">
                        {site.title || site.domain}
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2 py-0.2 text-[10px] font-semibold">
                          {site.category || 'Professional'}
                        </span>
                        {site.city && (
                          <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                            <MapPin className="h-2.5 w-2.5 text-cyan-400" />
                            {site.city}
                            {site.country ? `, ${site.country}` : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {hasDotCom ? (
                    <span className="rounded-full bg-amber-500/20 border border-amber-500/50 px-2.5 py-0.5 text-[10px] font-black text-amber-300 flex items-center gap-1 shrink-0 shadow-sm">
                      <Star className="h-2.5 w-2.5 fill-amber-400" />
                      www.____.com
                    </span>
                  ) : (
                    <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-400 shrink-0">
                      Verified
                    </span>
                  )}
                </div>

                {/* 1. Official Website Link Box (Starts with http/www., ends with .com) */}
                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
                      <Globe2 className="h-3.5 w-3.5 text-cyan-400" />
                      <span>Website Address (start: http/www. | end: .com):</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(displayUrl, `url-${site.id}`)}
                      className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 transition"
                    >
                      {copiedId === `url-${site.id}` ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          <span>Copy URL</span>
                        </>
                      )}
                    </button>
                  </div>

                  <a
                    href={displayUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between gap-2 rounded-xl bg-slate-900/90 border border-slate-800/90 p-2.5 hover:bg-slate-800/90 transition group/link shadow-inner"
                  >
                    {renderFormattedUrl(displayUrl, site.domain)}
                    <ExternalLink className="h-3.5 w-3.5 text-slate-400 group-hover/link:text-amber-300 shrink-0 ml-1" />
                  </a>
                </div>

                {/* 2. Physical Address & Google Maps Link Box */}
                <div className="rounded-2xl border border-cyan-500/20 bg-cyan-950/10 p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[11px] font-bold text-cyan-300 flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-cyan-400" />
                      Physical Address & Location:
                    </span>
                    {site.address && (
                      <button
                        type="button"
                        onClick={() => copyToClipboard(site.address || '', `addr-${site.id}`)}
                        className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 transition"
                      >
                        {copiedId === `addr-${site.id}` ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-400" />
                            <span className="text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>Copy Address</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {site.address ? (
                    <div className="space-y-2">
                      <p className="text-xs text-slate-200 leading-relaxed font-sans bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                        {site.address}
                      </p>

                      {mapUrl && (
                        <a
                          href={mapUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 px-3 py-2 text-xs font-bold text-white shadow-md transition group/map"
                        >
                          <Compass className="h-4 w-4 text-cyan-200 group-hover/map:rotate-45 transition-transform" />
                          <span>📍 Open in Google Maps (گوگل میپس پر لوکیشن)</span>
                          <ExternalLink className="h-3 w-3 text-white/80" />
                        </a>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-2 text-[11px] text-slate-500 bg-slate-950/40 rounded-xl border border-slate-800/50">
                      No physical address linked yet.
                    </div>
                  )}
                </div>

                {/* Description & Contact Details */}
                {(site.description || site.phone) && (
                  <div className="space-y-1.5 text-xs text-slate-400">
                    {site.description && (
                      <p className="text-[11px] text-slate-300 leading-relaxed line-clamp-2">
                        {site.description}
                      </p>
                    )}
                    {site.phone && (
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
                        <Phone className="h-3 w-3 text-slate-500" />
                        <span>{site.phone}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Bottom Action Footer */}
              <div className="border-t border-slate-800 pt-3 flex items-center justify-between gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => onStartAuditForDomain(displayUrl)}
                  className="flex items-center gap-1.5 font-bold text-indigo-400 hover:text-indigo-300 transition"
                >
                  <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
                  <span>Audit SEO & AI</span>
                  <ArrowRight className="h-3 w-3" />
                </button>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => openEditModal(site)}
                    className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition"
                    title="Edit Website or Address"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </button>

                  <button
                    type="button"
                    disabled={deleteLoadingId === site.id}
                    onClick={() => handleDeleteWebsite(site.id, site.title)}
                    className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-950/50 hover:text-rose-400 transition"
                    title="Remove Website"
                  >
                    {deleteLoadingId === site.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filteredWebsites.length === 0 && (
          <div className="col-span-full rounded-3xl border border-dashed border-slate-800 p-12 text-center text-slate-400 space-y-4">
            <ShieldCheck className="h-12 w-12 text-slate-600 mx-auto" />
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">No matching websites found</h3>
              <p className="text-xs text-slate-400">
                Try refining your search keyword or switch to another domain filter tab.
              </p>
            </div>
            <button
              onClick={openAddModal}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-500 transition"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Add www._____.com Website</span>
            </button>
          </div>
        )}
      </div>

      {/* Add / Edit Professional Website Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-2xl max-h-[90vh] rounded-3xl border border-amber-500/40 bg-slate-900 shadow-2xl flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 p-5 bg-slate-950/80">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/20 to-cyan-500/20 text-amber-400 border border-amber-500/30">
                  <Globe2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {editingSiteId ? 'Edit Website & Address' : 'Add Website (Start: http/www. & End: .com)'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Enter the organization details, website domain, and physical address with Google Maps link.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveWebsite} className="p-6 overflow-y-auto space-y-4 flex-1">
              {formError && (
                <div className="rounded-xl border border-rose-500/30 bg-rose-950/40 p-3 text-xs text-rose-300">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Title */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Organization / Company Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Systems Limited, NetSol, Apple, Zameen"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-amber-500"
                  />
                </div>

                {/* Category */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Industry / Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white outline-none focus:border-amber-500"
                  >
                    {CATEGORIES.filter((c) => c !== 'All Categories').map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* URL Builder: Prefix (http/www) + Core Name + Suffix (.com) */}
              <div className="space-y-2 rounded-2xl border border-indigo-500/30 bg-indigo-950/20 p-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Link2 className="h-3.5 w-3.5 text-cyan-400" />
                    <span>Website URL Builder (Start: http/www. | End: .com)</span>
                    <span className="text-rose-400">*</span>
                  </label>
                  <span className="text-[10px] text-cyan-300 font-medium">Automatic URL Assembly</span>
                </div>

                {/* Component Blocks */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                  {/* Start Prefix */}
                  <div className="sm:col-span-4 space-y-1">
                    <span className="text-[10px] font-semibold text-cyan-300 block">1. Start (http / www.):</span>
                    <select
                      value={urlPrefix}
                      onChange={(e) => setUrlPrefix(e.target.value as any)}
                      className="w-full rounded-xl border border-cyan-500/40 bg-slate-950 px-3 py-2 text-xs font-mono font-bold text-cyan-300 outline-none focus:border-cyan-400"
                    >
                      <option value="https://www.">https://www. (Standard)</option>
                      <option value="http://www.">http://www.</option>
                      <option value="www.">www.</option>
                      <option value="https://">https://</option>
                      <option value="http://">http://</option>
                    </select>
                  </div>

                  {/* Core Domain Name */}
                  <div className="sm:col-span-5 space-y-1">
                    <span className="text-[10px] font-semibold text-slate-300 block">2. Name:</span>
                    <input
                      type="text"
                      required
                      placeholder="e.g. google, systemsltd, apple"
                      value={domainCore}
                      onChange={(e) => setDomainCore(e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs font-mono font-bold text-white placeholder-slate-500 outline-none focus:border-indigo-400"
                    />
                  </div>

                  {/* End Suffix */}
                  <div className="sm:col-span-3 space-y-1">
                    <span className="text-[10px] font-semibold text-amber-300 block">3. End (.com):</span>
                    <select
                      value={urlSuffix}
                      onChange={(e) => setUrlSuffix(e.target.value as any)}
                      className="w-full rounded-xl border border-amber-500/40 bg-slate-950 px-3 py-2 text-xs font-mono font-bold text-amber-300 outline-none focus:border-amber-400"
                    >
                      <option value=".com">.com (Standard)</option>
                      <option value=".com.pk">.com.pk</option>
                      <option value=".edu.pk">.edu.pk</option>
                      <option value=".gov.pk">.gov.pk</option>
                      <option value=".org">.org</option>
                    </select>
                  </div>
                </div>

                {/* Assembled URL Live Preview */}
                <div className="rounded-xl bg-slate-950 p-3 border border-slate-800/80 flex items-center justify-between gap-2">
                  <div className="text-xs flex items-center gap-1.5 overflow-hidden font-mono">
                    <span className="text-[10px] text-slate-400 uppercase font-sans font-semibold shrink-0">
                      Live Preview:
                    </span>
                    <span className="text-cyan-400 font-bold">{urlPrefix}</span>
                    <span className="text-white font-black">{domainCore || 'example'}</span>
                    <span className="text-amber-400 font-black">{urlSuffix}</span>
                  </div>
                  <span className="rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 text-[10px] font-bold shrink-0">
                    Ready
                  </span>
                </div>

                {/* Quick Presets */}
                <div className="flex items-center gap-1.5 flex-wrap text-[11px] text-slate-400 pt-1">
                  <span className="text-slate-500">Quick fill:</span>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('Google', 'google')}
                    className="hover:text-amber-300 underline font-mono"
                  >
                    google.com
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('Systems Limited', 'systemsltd')}
                    className="hover:text-amber-300 underline font-mono"
                  >
                    systemsltd.com
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('NetSol Technologies', 'netsoltech')}
                    className="hover:text-amber-300 underline font-mono"
                  >
                    netsoltech.com
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('PakWheels', 'pakwheels')}
                    className="hover:text-amber-300 underline font-mono"
                  >
                    pakwheels.com
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('Zameen.com', 'zameen')}
                    className="hover:text-amber-300 underline font-mono"
                  >
                    zameen.com
                  </button>
                </div>
              </div>

              {/* Physical Office Address */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span>Physical Office / Campus Address (دفتر کا مکمل پتہ)</span>
                  <span className="text-[10px] text-cyan-400">Maps Grounded</span>
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-3 h-4 w-4 text-cyan-500" />
                  <input
                    type="text"
                    placeholder="e.g. DHA Phase 1, Lahore, Pakistan OR 1600 Amphitheatre Pkwy, Mountain View, CA"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Google Maps Address Link */}
              <div className="space-y-1.5 rounded-2xl border border-cyan-500/20 bg-cyan-950/20 p-3.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                    <Compass className="h-3.5 w-3.5 text-cyan-400" />
                    Google Maps Address Link (گوگل میپس لنک)
                  </label>
                  <button
                    type="button"
                    onClick={handleAutoGenerateMapUrl}
                    className="text-[11px] font-bold text-cyan-400 hover:text-cyan-300 underline"
                  >
                    ⚡ Auto-Generate from Address
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="https://maps.google.com/?q=..."
                  value={addressUrl}
                  onChange={(e) => setAddressUrl(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-500 font-mono"
                />
                <p className="text-[10px] text-slate-400">
                  If left empty, a Google Maps navigation link will be automatically generated from the physical address.
                </p>
              </div>

              {/* City, Country, Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">City</label>
                  <input
                    type="text"
                    placeholder="e.g. Lahore, Karachi, Redmond"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Country</label>
                  <input
                    type="text"
                    placeholder="e.g. Pakistan, United States"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Contact / Phone</label>
                  <input
                    type="text"
                    placeholder="e.g. +92 42 111 797 836"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Description / Key Functions</label>
                <textarea
                  rows={2}
                  placeholder="Brief summary of the corporation, tech services, products..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500"
                />
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-600 via-indigo-600 to-cyan-600 hover:opacity-95 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-amber-600/20 transition disabled:opacity-50"
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>{editingSiteId ? 'Update Website & Address' : 'Save Website (Start: http/www. | End: .com)'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
