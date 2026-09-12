export type DashboardLayoutId = 'main' | 'ecommerce' | 'services' | 'bbps';

export type MainDashboardSectionKey =
  | 'header'
  | 'birthdays'
  | 'stepProgress'
  | 'investmentInsurance'
  | 'exploreModules'
  | 'moduleBanner'
  | 'rewardsOverview';

export type EcommerceDashboardSectionKey =
  | 'homeBanner'
  | 'categories'
  | 'bestSeller'
  | 'topRated'
  | 'offerHome'
  | 'newArrivals'
  | 'mostView'
  | 'recommended'
  | 'features'
  | 'recent'
  | 'productCategory';

export type DashboardSectionKey =
  | MainDashboardSectionKey
  | EcommerceDashboardSectionKey
  | string;

export type DashboardSection = {
  key: DashboardSectionKey;
  enabled: boolean;
  order: number;
  variant?: string;
  content?: Record<string, unknown>;
};

export type DashboardLayout = {
  id: DashboardLayoutId;
  version: number;
  sections: DashboardSection[];
  updatedAt?: string;
};

const section = (key: DashboardSectionKey, order: number): DashboardSection => ({
  key,
  enabled: true,
  order,
});

export const DEFAULT_DASHBOARD_LAYOUTS: Record<DashboardLayoutId, DashboardLayout> = {
  main: {
    id: 'main',
    version: 1,
    sections: [
      section('header', 10),
      section('birthdays', 20),
      section('stepProgress', 30),
      section('investmentInsurance', 35),
      section('exploreModules', 40),
      section('moduleBanner', 50),
      section('rewardsOverview', 60),
    ],
  },
  ecommerce: {
    id: 'ecommerce',
    version: 1,
    sections: [
      section('homeBanner', 10),
      section('categories', 20),
      section('bestSeller', 30),
      section('topRated', 40),
      section('offerHome', 50),
      section('newArrivals', 60),
      section('mostView', 70),
      section('recommended', 80),
      section('features', 90),
      section('recent', 100),
      section('productCategory', 110),
    ],
  },
  services: { id: 'services', version: 1, sections: [] },
  bbps: { id: 'bbps', version: 1, sections: [] },
};

export function normaliseDashboardLayout(
  value: unknown,
  id: DashboardLayoutId,
  supportedKeys: readonly string[],
): DashboardLayout {
  const fallback = DEFAULT_DASHBOARD_LAYOUTS[id];
  if (!value || typeof value !== 'object') return fallback;

  const candidate = value as Partial<DashboardLayout>;
  if (!Array.isArray(candidate.sections)) return fallback;

  const supported = new Set(supportedKeys);
  const seen = new Set<string>();
  const sections = candidate.sections
    .filter((item): item is DashboardSection => {
      if (!item || typeof item !== 'object') return false;
      const key = String((item as DashboardSection).key ?? '');
      if (!supported.has(key) || seen.has(key)) return false;
      seen.add(key);
      return (item as DashboardSection).enabled !== false;
    })
    .sort((a, b) => Number(a.order ?? 0) - Number(b.order ?? 0));

  // A cached or backend-published layout can predate a section that was
  // added to the app later (e.g. a new frontend-only card) — `seen` only
  // contains keys the candidate actually mentioned (including ones it
  // explicitly disabled), so anything supported-but-unmentioned here is
  // genuinely missing from the candidate, not intentionally hidden. Carry
  // those in from the default template at their default position instead
  // of silently dropping them.
  fallback.sections.forEach((defaultSection) => {
    const key = String(defaultSection.key);
    if (seen.has(key) || !supported.has(key)) return;
    sections.push(defaultSection);
    seen.add(key);
  });
  sections.sort((a, b) => Number(a.order ?? 0) - Number(b.order ?? 0));

  return {
    id,
    version: Number(candidate.version) || fallback.version,
    updatedAt: candidate.updatedAt,
    sections,
  };
}
