export interface UserProfile {
  id: number;
  uid: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
}

export interface WebsiteItem {
  id: number;
  domain: string;
  rootUrl: string;
  title?: string;
  status: string;
  category?: string;
  address?: string;
  addressUrl?: string;
  city?: string;
  country?: string;
  description?: string;
  phone?: string;
  isProfessional?: number;
  lastAuditAt?: string;
  createdAt: string;
}

export interface AuditJob {
  id: number;
  websiteId?: number;
  userId?: number;
  targetUrl: string;
  status: 'pending' | 'crawling' | 'analyzing' | 'completed' | 'partially_completed' | 'failed';
  totalUrls: number;
  analyzedUrls: number;
  failedUrls: number;
  overallScore: number;
  seoScore: number;
  aeoScore: number;
  aioScore: number;
  geoScore: number;
  eeatScore: number;
  summary?: string;
  errorReason?: string;
  createdAt: string;
  completedAt?: string;
  recommendations?: RecommendationItem[];
  findingsCount?: number;
  criticalFindingsCount?: number;
  warningFindingsCount?: number;
}

export interface DiscoveredUrlItem {
  id: number;
  url: string;
  path: string;
  status: 'pending' | 'analyzing' | 'completed' | 'failed';
  statusCode?: number;
  depth: number;
  errorReason?: string;
  reportId?: number;
  title?: string;
  overallScore?: number;
  seoScore?: number;
  aeoScore?: number;
  aioScore?: number;
  geoScore?: number;
  eeatScore?: number;
}

export interface Finding {
  id: number;
  urlReportId?: number;
  auditId: number;
  category: 'SEO' | 'AEO' | 'AIO' | 'GEO' | 'EEAT';
  severity: 'critical' | 'warning' | 'info' | 'good';
  title: string;
  description: string;
  evidence?: string;
  recommendation?: string;
}

export interface RecommendationItem {
  id: number;
  auditId: number;
  category: string;
  priority: 'high' | 'medium' | 'low';
  title: string;
  actionableSteps?: string;
  impact?: string;
}

export interface IndividualUrlReport {
  id: number;
  urlId: number;
  auditId: number;
  url: string;
  path: string;
  title: string;
  statusCode?: number;
  overallScore: number;
  seoScore: number;
  aeoScore: number;
  aioScore: number;
  geoScore: number;
  eeatScore: number;
  metaData: {
    title?: string;
    description?: string;
    canonical?: string;
    robots?: string;
    viewport?: string;
    og?: Record<string, string>;
    twitter?: Record<string, string>;
  };
  headings: {
    h1: string[];
    h2: string[];
    h3: string[];
  };
  structuredData: any[];
  performanceData: {
    responseTimeMs: number;
    statusCode: number;
    wordCount: number;
  };
  aeoFindings: Record<string, any>;
  aioFindings: Record<string, any>;
  geoFindings: Record<string, any>;
  eeatFindings: Record<string, any>;
  findings: Finding[];
}

export interface ChatSession {
  id: number;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: number;
  chatId: number;
  role: 'user' | 'assistant' | 'system';
  content: string;
  language?: string;
  imageUrl?: string;
  createdAt: string;
}

export interface FlashcardItem {
  id: number;
  deckName: string;
  front: string;
  back: string;
  masteryLevel: number;
}

export interface StudyNoteItem {
  id: number;
  title: string;
  content: string;
  tags?: string;
  createdAt: string;
}
