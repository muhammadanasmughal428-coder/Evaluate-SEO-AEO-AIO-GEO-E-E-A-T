import React, { useState, useEffect } from 'react';
import {
  Globe,
  MapPin,
  Building2,
  ExternalLink,
  Plus,
  Search,
  Check,
  Copy,
  Trash2,
  Edit3,
  X,
  Loader2,
  Phone,
  ArrowUpRight,
  ShieldCheck,
  Compass,
} from 'lucide-react';
import { WebsiteItem } from '../types/index.ts';
import { useAuth } from '../context/AuthContext.tsx';

interface ProfessionalResourcesSectionProps {
  onStartAuditForDomain?: (url: string) => void;
  onNavigateToFullDirectory?: () => void;
}

const CATEGORY_TAGS = [
  'All',
  'Technology & AI',
  'Corporate & Business',
  'Higher Education',
  'Medical & Healthcare',
  'Government & IT',
];

export const ProfessionalResourcesSection: React.FC<ProfessionalResourcesSectionProps> = ({
  onStartAuditForDomain,
  onNavigateToFullDirectory,
}) => {
  const { idToken } = useAuth();
  const [websites, setWebsites] = useState<WebsiteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Modal State for Add / Edit
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

  // UI state
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchWebsites = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/websites');
      if (res.ok) {
        const data = await res.json();
        setWebsites(data);
      }
    } catch (err) {
      console.error('Failed to load professional websites:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWebsites();
  }, []);

  // Sync composed URL when fields change
  useEffect(() => {
    if (domainCore.trim()) {
      let cleanCore = domainCore.trim().toLowerCase();
      cleanCore = cleanCore.replace(/^https?:\/\//, '').replace(/^www\./, '');
      cleanCore = cleanCore.replace(/\.(com|com\.pk|edu\.pk|gov\.pk|org|net)$/, '');
      cleanCore = cleanCore.replace(/\/+$/, '');
      setRootUrl(`${urlPrefix}${cleanCore}${urlSuffix}`);
    }
  }, [urlPrefix, domainCore, urlSuffix]);

  const openAddModal = () => {
    setEditingSiteId(null);
    setTitle('');
    setUrlPrefix('https://www.');
    setDomainCore('');
    setUrlSuffix('.com');
    setRootUrl('');
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

    const currentUrl = site.rootUrl || `https://${site.domain}`;
    let pre: 'https://www.' | 'http://www.' | 'https://' | 'http://' | 'www.' = 'https://www.';
    let suf: '.com' | '.com.pk' | '.org' | '.edu.pk' | '.gov.pk' = '.com';
    let core = currentUrl;

    if (core.startsWith('https://www.')) {
      pre = 'https://www.';
      core = core.slice('https://www.'.length);
    } else if (core.startsWith('http://www.')) {
      pre = 'http://www.';
      core = core.slice('http://www.'.length);
    } else if (core.startsWith('https://')) {
      pre = 'https://';
      core = core.slice('https://'.length);
    } else if (core.startsWith('http://')) {
      pre = 'http://';
      core = core.slice('http://'.length);
    } else if (core.startsWith('www.')) {
      pre = 'www.';
      core = core.slice('www.'.length);
    }

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

  const handleAutoGenerateMapUrl = () => {
    if (!address.trim()) {
      setFormError('Please enter the physical business address first.');
      return;
    }
    const query = [address.trim(), city.trim(), country.trim()].filter(Boolean).join(', ');
    const generatedUrl = `https://maps.google.com/?q=${encodeURIComponent(query)}`;
    setAddressUrl(generatedUrl);
    setFormError(null);
  };

  const handleSaveWebsite = async (e: React.FormEvent) => {
    e.preventDefault();

    let cleanUrl = rootUrl.trim();
    if (domainCore.trim()) {
      const cleanCore = domainCore.trim().toLowerCase()
        .replace(/^https?:\/\//, '')
        .replace(/^www\./, '')
        .replace(/\.(com|com\.pk|edu\.pk|gov\.pk|org|net)$/, '')
        .replace(/\/+$/, '');
      cleanUrl = `${urlPrefix}${cleanCore}${urlSuffix}`;
    }

    if (!cleanUrl || (cleanUrl.includes('example.com') && !domainCore)) {
      setFormError('Please enter a valid website link / domain core.');
      return;
    }

    try {
      setSubmitting(true);
      setFormError(null);

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

      if (editingSiteId) {
        const res = await fetch(`/api/websites/${editingSiteId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
          },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'Failed to update professional resource');
        }

        const updated = await res.json();
        setWebsites((prev) => prev.map((s) => (s.id === editingSiteId ? updated : s)));
      } else {
        const res = await fetch('/api/websites', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
          },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'Failed to save professional resource');
        }

        const created = await res.json();
        setWebsites((prev) => [created, ...prev]);
      }

      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Error saving resource');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteWebsite = async (id: number) => {
    if (!confirm('Are you sure you want to remove this professional website resource?')) {
      return;
    }

    try {
      setDeletingId(id);
      const res = await fetch(`/api/websites/${id}`, {
        method: 'DELETE',
        headers: {
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        },
      });

      if (res.ok) {
        setWebsites((prev) => prev.filter((s) => s.id !== id));
      } else {
        const err = await res.json();
        alert(err.error || 'Could not delete resource');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete website resource');
    } finally {
      setDeletingId(null);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filtered resources
  const filteredWebsites = websites.filter((site) => {
    const matchesSearch =
      (site.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (site.rootUrl || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (site.domain || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (site.address || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (site.city || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === 'All' ||
      (site.category || '').toLowerCase().includes(selectedCategory.toLowerCase());

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="rounded-3xl border border-slate-800/80 bg-slate-900/60 p-6 sm:p-7 space-y-6 shadow-2xl backdrop-blur-sm">
      {/* Header & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-500 text-white shadow-lg shadow-indigo-500/25">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
                  Professional Resources
                </h2>
                <span className="rounded-full bg-indigo-500/20 px-2.5 py-0.5 text-[11px] font-semibold text-indigo-300 border border-indigo-500/30">
                  {websites.length} Verified Links
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Manage professional website URLs with verified physical & official business addresses and Google Maps directions.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {onNavigateToFullDirectory && (
            <button
              onClick={onNavigateToFullDirectory}
              className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition"
              title="Open full interactive websites directory"
            >
              <Compass className="h-3.5 w-3.5 text-cyan-400" />
              <span>Full Directory</span>
            </button>
          )}

          <button
            onClick={openAddModal}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-600 to-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-indigo-600/30 transition hover:from-indigo-600 hover:to-purple-700 active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>Add Resource</span>
          </button>
        </div>
      </div>

      {/* Search & Category Filter Pills */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search resources by name, URL, city, or physical address..."
            className="w-full rounded-xl border border-slate-800 bg-slate-950/80 pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {CATEGORY_TAGS.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-lg px-3 py-1.5 text-[11px] font-medium whitespace-nowrap transition ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Resource Cards Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-400">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
          <p className="text-xs">Loading professional links & business addresses...</p>
        </div>
      ) : filteredWebsites.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-800 p-8 text-center space-y-3">
          <Globe className="h-8 w-8 text-slate-600 mx-auto" />
          <p className="text-xs text-slate-400">
            {searchQuery
              ? 'No professional resources match your search query.'
              : 'No professional website resources found.'}
          </p>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 transition"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add First Resource</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredWebsites.slice(0, 9).map((site) => {
            const displayUrl = site.rootUrl || `https://${site.domain}`;
            const mapLink =
              site.addressUrl ||
              (site.address
                ? `https://maps.google.com/?q=${encodeURIComponent(
                    [site.address, site.city, site.country].filter(Boolean).join(', ')
                  )}`
                : null);

            return (
              <div
                key={site.id}
                className="group relative flex flex-col justify-between rounded-2xl border border-slate-800/90 bg-slate-950/70 p-4 hover:border-indigo-500/50 hover:bg-slate-900/60 transition shadow-sm hover:shadow-indigo-500/10"
              >
                {/* Top Info */}
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="flex h-2 w-2 rounded-full bg-emerald-400 shrink-0" />
                        <h3 className="text-sm font-bold text-white truncate group-hover:text-indigo-300 transition">
                          {site.title || site.domain}
                        </h3>
                      </div>
                      {site.category && (
                        <span className="inline-block text-[10px] font-semibold text-indigo-400 bg-indigo-950/60 border border-indigo-800/50 rounded px-1.5 py-0.5">
                          {site.category}
                        </span>
                      )}
                    </div>

                    {/* Quick Edit/Delete Actions */}
                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
                      <button
                        onClick={() => openEditModal(site)}
                        className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
                        title="Edit website details & address"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteWebsite(site.id)}
                        disabled={deletingId === site.id}
                        className="p-1 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition"
                        title="Remove website"
                      >
                        {deletingId === site.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-rose-400" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Website Link Badge */}
                  <div className="flex items-center justify-between gap-2 rounded-xl bg-slate-900/90 border border-slate-800 px-2.5 py-1.5 text-xs">
                    <a
                      href={displayUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-400 hover:text-indigo-300 font-mono text-[11px] truncate flex items-center gap-1.5"
                    >
                      <Globe className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      <span className="truncate">{displayUrl}</span>
                    </a>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => copyToClipboard(displayUrl, `url-${site.id}`)}
                        className="text-slate-400 hover:text-white transition p-0.5"
                        title="Copy Website Link"
                      >
                        {copiedId === `url-${site.id}` ? (
                          <Check className="h-3.5 w-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                      <a
                        href={displayUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-400 hover:text-white transition p-0.5"
                        title="Open Website"
                      >
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </div>

                  {/* Physical / Official Business Address */}
                  {site.address ? (
                    <div className="rounded-xl border border-slate-800/80 bg-slate-900/50 p-2.5 space-y-1.5 text-[11px]">
                      <div className="flex items-center justify-between text-slate-400">
                        <span className="font-semibold text-slate-300 flex items-center gap-1 text-[10px] uppercase tracking-wider">
                          <MapPin className="h-3 w-3 text-rose-400" />
                          Business Address
                        </span>
                        {mapLink && (
                          <a
                            href={mapLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 text-[10px] font-medium"
                          >
                            <span>Google Maps</span>
                            <ExternalLink className="h-2.5 w-2.5" />
                          </a>
                        )}
                      </div>
                      <p className="text-slate-300 leading-snug line-clamp-2">
                        {site.address}
                        {site.city && `, ${site.city}`}
                        {site.country && `, ${site.country}`}
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/30 p-2 text-[11px] text-slate-500 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> No physical address set
                      </span>
                      <button
                        onClick={() => openEditModal(site)}
                        className="text-indigo-400 hover:underline text-[10px] font-medium"
                      >
                        + Add Address
                      </button>
                    </div>
                  )}

                  {/* Phone & Description */}
                  {(site.phone || site.description) && (
                    <div className="space-y-1 text-[11px] text-slate-400">
                      {site.phone && (
                        <div className="flex items-center gap-1 text-slate-400">
                          <Phone className="h-3 w-3 text-emerald-400" />
                          <span className="text-slate-300">{site.phone}</span>
                        </div>
                      )}
                      {site.description && (
                        <p className="text-slate-400 line-clamp-2 leading-relaxed text-[11px]">
                          {site.description}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Bottom Audit Trigger */}
                <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500">
                    {site.city ? `${site.city} • ` : ''}
                    {site.country || 'Global'}
                  </span>
                  {onStartAuditForDomain && (
                    <button
                      onClick={() => onStartAuditForDomain(displayUrl)}
                      className="flex items-center gap-1 text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 transition"
                    >
                      <span>Run SEO Audit</span>
                      <ArrowUpRight className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer Info Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          <span>PostgreSQL Cloud SQL persistent storage for professional website credentials & addresses.</span>
        </div>
        {filteredWebsites.length > 9 && onNavigateToFullDirectory && (
          <button
            onClick={onNavigateToFullDirectory}
            className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
          >
            <span>View all {filteredWebsites.length} resources in directory</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Add / Edit Resource Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">
                  {editingSiteId ? 'Edit Professional Resource' : 'Add Professional Website & Address'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {formError && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveWebsite} className="space-y-4">
              {/* Organization / Brand Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Organization / Business Name <span className="text-indigo-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Systems Limited, Google, Zameen.com"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              {/* Website Link Builder */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Professional Website Link <span className="text-indigo-400">*</span>
                </label>
                <div className="grid grid-cols-12 gap-1.5">
                  <select
                    value={urlPrefix}
                    onChange={(e) => setUrlPrefix(e.target.value as any)}
                    className="col-span-4 rounded-xl border border-slate-800 bg-slate-950 px-2 py-2 text-xs text-slate-300 focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="https://www.">https://www.</option>
                    <option value="https://">https://</option>
                    <option value="http://www.">http://www.</option>
                    <option value="http://">http://</option>
                    <option value="www.">www.</option>
                  </select>

                  <input
                    type="text"
                    required
                    value={domainCore}
                    onChange={(e) => setDomainCore(e.target.value)}
                    placeholder="domain-name"
                    className="col-span-5 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none font-mono"
                  />

                  <select
                    value={urlSuffix}
                    onChange={(e) => setUrlSuffix(e.target.value as any)}
                    className="col-span-3 rounded-xl border border-slate-800 bg-slate-950 px-2 py-2 text-xs text-slate-300 focus:border-indigo-500 focus:outline-none font-mono"
                  >
                    <option value=".com">.com</option>
                    <option value=".com.pk">.com.pk</option>
                    <option value=".org">.org</option>
                    <option value=".edu.pk">.edu.pk</option>
                    <option value=".gov.pk">.gov.pk</option>
                  </select>
                </div>
                <p className="mt-1 text-[11px] text-slate-400 font-mono">
                  Result: <span className="text-indigo-400">{rootUrl || 'https://www.example.com'}</span>
                </p>
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-300 focus:border-indigo-500 focus:outline-none"
                >
                  <option value="Technology & AI">Technology & AI</option>
                  <option value="Corporate & Business">Corporate & Business</option>
                  <option value="Higher Education & Universities">Higher Education & Universities</option>
                  <option value="Medical & Healthcare">Medical & Healthcare</option>
                  <option value="Government & IT">Government & IT</option>
                  <option value="Research & Global Science">Research & Global Science</option>
                </select>
              </div>

              {/* Physical / Official Business Address */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Official Business / Physical Address
                  </label>
                  <button
                    type="button"
                    onClick={handleAutoGenerateMapUrl}
                    className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium"
                  >
                    <MapPin className="h-3 w-3" /> Auto-link Google Maps
                  </button>
                </div>
                <textarea
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. E-5, Central Commercial Area, DHA Phase 1, Lahore, Punjab"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              {/* City & Country */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Lahore, Islamabad, San Francisco"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Country</label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="e.g. Pakistan, United States"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Google Maps URL & Phone */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Google Maps URL
                  </label>
                  <input
                    type="url"
                    value={addressUrl}
                    onChange={(e) => setAddressUrl(e.target.value)}
                    placeholder="https://maps.google.com/?q=..."
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Official Phone / Helpline
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+92 42 111 797 836"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Description / Business Summary
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Key corporate background, services, or research specialization..."
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-slate-800 px-4 py-2 text-xs font-semibold text-slate-400 hover:bg-slate-800 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white hover:bg-indigo-500 transition disabled:opacity-50"
                >
                  {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>{editingSiteId ? 'Update Resource' : 'Save Resource'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
