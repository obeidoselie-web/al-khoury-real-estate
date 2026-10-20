import type { Locale } from '@/i18n/config';

import type { Listing, ListingImage, PropertyType } from '../types';

/*
 * PLACEHOLDER DATA. Illustrative listings with generated images (see scripts/generate-placeholders.mjs).
 * Text is stored per locale; `localizeListing` turns a record into the plain `Listing` the UI renders.
 * A real CMS would return the same shape (or one already resolved for the requested locale).
 */

type Localized<T> = Record<Locale, T>;

export interface ListingRecord
  extends Omit<Listing, 'title' | 'location' | 'summary' | 'description' | 'features' | 'images'> {
  title: Localized<string>;
  location: { area: Localized<string>; city: Localized<string> };
  summary: Localized<string>;
  description: Localized<string[]>;
  features: Localized<string[]>;
  /** First placeholder variant (1–4) for this listing's photo set. */
  photoStart: number;
}

const IMAGE_WIDTH = 1600;
const IMAGE_HEIGHT = 1067;
const VARIANTS = 4;
const PHOTOS_PER_LISTING = 3;

const SCENE_NAMES: Localized<Record<PropertyType, string>> = {
  en: { house: 'house exterior', apartment: 'apartment building', commercial: 'commercial building', land: 'landscape' },
  ar: { house: 'واجهة منزل', apartment: 'مبنى سكني', commercial: 'مبنى تجاري', land: 'منظر طبيعي' },
};

function altText(locale: Locale, title: string, type: PropertyType, n: number): string {
  const scene = SCENE_NAMES[locale][type];
  return locale === 'ar'
    ? `${title} — رسم توضيحي لـ${scene} (صورة مؤقتة ${n} من ${PHOTOS_PER_LISTING})`
    : `${title} — illustrated ${scene} (placeholder photo ${n} of ${PHOTOS_PER_LISTING})`;
}

/** Placeholder photos for a listing, rotated so neighbouring cards don't look identical. */
function photos(record: ListingRecord, locale: Locale): ListingImage[] {
  return Array.from({ length: PHOTOS_PER_LISTING }, (_, offset) => {
    const variant = ((record.photoStart + offset - 1) % VARIANTS) + 1;
    return {
      src: `/images/placeholders/${record.type}-${variant}.jpg`,
      alt: altText(locale, record.title[locale], record.type, offset + 1),
      width: IMAGE_WIDTH,
      height: IMAGE_HEIGHT,
    };
  });
}

export function localizeListing(record: ListingRecord, locale: Locale): Listing {
  const { title, location, summary, description, features, photoStart: _photoStart, ...rest } = record;
  return {
    ...rest,
    title: title[locale],
    location: { area: location.area[locale], city: location.city[locale] },
    summary: summary[locale],
    description: description[locale],
    features: features[locale],
    images: photos(record, locale),
  };
}

const place = {
  broummana: { area: { en: 'Broummana', ar: 'برمانا' }, city: { en: 'Metn', ar: 'المتن' } },
  batroun: { area: { en: 'Old Souk', ar: 'السوق القديم' }, city: { en: 'Batroun', ar: 'البترون' } },
  rabieh: { area: { en: 'Rabieh', ar: 'الرابية' }, city: { en: 'Metn', ar: 'المتن' } },
  achrafieh: { area: { en: 'Achrafieh', ar: 'الأشرفية' }, city: { en: 'Beirut', ar: 'بيروت' } },
  marMikhael: { area: { en: 'Mar Mikhael', ar: 'مار مخايل' }, city: { en: 'Beirut', ar: 'بيروت' } },
  kaslik: { area: { en: 'Kaslik', ar: 'الكسليك' }, city: { en: 'Jounieh', ar: 'جونية' } },
  hamra: { area: { en: 'Hamra', ar: 'الحمرا' }, city: { en: 'Beirut', ar: 'بيروت' } },
  downtown: { area: { en: 'Downtown', ar: 'وسط البلد' }, city: { en: 'Beirut', ar: 'بيروت' } },
  verdun: { area: { en: 'Verdun', ar: 'فردان' }, city: { en: 'Beirut', ar: 'بيروت' } },
  dbayeh: { area: { en: 'Dbayeh', ar: 'ضبيه' }, city: { en: 'Metn', ar: 'المتن' } },
  kfardebian: { area: { en: 'Kfardebian', ar: 'كفردبيان' }, city: { en: 'Keserwan', ar: 'كسروان' } },
  amioun: { area: { en: 'Amioun', ar: 'أميون' }, city: { en: 'Koura', ar: 'الكورة' } },
  zahle: { area: { en: 'Zahle', ar: 'زحلة' }, city: { en: 'Bekaa', ar: 'البقاع' } },
} satisfies Record<string, ListingRecord['location']>;

export const PLACEHOLDER_LISTINGS: ListingRecord[] = [
  {
    id: 'villa-broummana-pine-view',
    title: { en: 'Pine-view villa in Broummana', ar: 'فيلا مطلّة على الصنوبر في برمانا' },
    type: 'house',
    deal: 'sale',
    price: 1_250_000,
    location: place.broummana,
    bedrooms: 5,
    bathrooms: 4,
    areaSqm: 420,
    plotSqm: 1100,
    yearBuilt: 2019,
    summary: {
      en: 'A light-filled family villa set among mature pines, twenty minutes from Beirut.',
      ar: 'فيلا عائلية مشرقة بين أشجار الصنوبر المعمّرة، على بُعد عشرين دقيقة من بيروت.',
    },
    description: {
      en: [
        'Set on a gently sloping plot surrounded by pine forest, this five-bedroom villa is arranged over two floors with an open living level that opens fully onto a stone terrace.',
        'The upper floor holds four bedrooms with en-suite bathrooms, while a separate guest suite sits beside the garden. Floor-to-ceiling glazing frames views across the valley to the sea.',
      ],
      ar: [
        'تقع هذه الفيلا المؤلّفة من خمس غرف نوم على أرض منحدرة بلطف تحيط بها غابة صنوبر، وتمتدّ على طابقين مع طابق معيشة مفتوح يطلّ بالكامل على شرفة حجرية.',
        'يضمّ الطابق العلوي أربع غرف نوم مع حمّامات خاصة، فيما يقع جناح مستقل للضيوف بجانب الحديقة. وتؤطّر الواجهات الزجاجية الممتدّة من الأرض إلى السقف مشهد الوادي وصولًا إلى البحر.',
      ],
    },
    features: {
      en: ['Heated pool', 'Landscaped garden', 'Two-car garage', 'Solar water heating', 'Backup generator', 'Fireplace'],
      ar: ['مسبح مُدفّأ', 'حديقة منسّقة', 'مرآب لسيارتين', 'تسخين مياه بالطاقة الشمسية', 'مولّد احتياطي', 'مدفأة'],
    },
    photoStart: 1,
    featured: true,
    listedAt: '2026-09-28',
  },
  {
    id: 'stone-house-batroun-old-town',
    title: { en: 'Restored stone house, Batroun old town', ar: 'بيت حجري مرمّم في البترون القديمة' },
    type: 'house',
    deal: 'sale',
    price: 640_000,
    location: place.batroun,
    bedrooms: 3,
    bathrooms: 2,
    areaSqm: 210,
    plotSqm: 260,
    yearBuilt: 1890,
    summary: {
      en: 'A carefully restored sandstone home with arched windows, a walk from the old harbour.',
      ar: 'بيت من الحجر الرملي رُمّم بعناية بنوافذ مقنطرة، على مسافة قريبة سيرًا من المرفأ القديم.',
    },
    description: {
      en: [
        'Traditional triple-arched façade, vaulted ceilings and original tiled floors have been restored alongside a fully modernised kitchen and bathrooms.',
        'A private courtyard with a lemon tree leads to a roof terrace with sunset views over the harbour.',
      ],
      ar: [
        'رُمّمت الواجهة التقليدية ذات القناطر الثلاث والأسقف المعقودة والبلاط الأصلي، إلى جانب مطبخ وحمّامات حديثة بالكامل.',
        'تؤدّي باحة خاصة تتوسّطها شجرة ليمون إلى سطح يطلّ على غروب الشمس فوق المرفأ.',
      ],
    },
    features: {
      en: ['Courtyard', 'Roof terrace', 'Original cement tiles', 'Walk to the beach'],
      ar: ['باحة داخلية', 'سطح', 'بلاط أصلي', 'قريب من الشاطئ سيرًا'],
    },
    photoStart: 2,
    listedAt: '2026-09-15',
  },
  {
    id: 'family-home-rabieh',
    title: { en: 'Family home with garden in Rabieh', ar: 'منزل عائلي مع حديقة في الرابية' },
    type: 'house',
    deal: 'rent',
    price: 4_800,
    location: place.rabieh,
    bedrooms: 4,
    bathrooms: 3,
    areaSqm: 360,
    plotSqm: 800,
    yearBuilt: 2008,
    summary: {
      en: 'A quiet, gated home with a private garden — available furnished or unfurnished.',
      ar: 'منزل هادئ ضمن مجمّع مسيّج مع حديقة خاصة — متوفّر مفروشًا أو غير مفروش.',
    },
    description: {
      en: [
        'Located on a quiet residential street in Rabieh, the house offers generous reception rooms, a family kitchen and four bedrooms.',
        'The level garden is ideal for children, and international schools are within a ten-minute drive.',
      ],
      ar: [
        'يقع المنزل في شارع سكني هادئ في الرابية، ويضمّ صالونات واسعة ومطبخًا عائليًا وأربع غرف نوم.',
        'الحديقة المستوية مثالية للأطفال، والمدارس الدولية على بُعد عشر دقائق بالسيارة.',
      ],
    },
    features: {
      en: ['Private garden', '24/7 security', 'Covered parking for 3 cars', 'Maid’s room'],
      ar: ['حديقة خاصة', 'حراسة على مدار الساعة', 'موقف مسقوف لثلاث سيارات', 'غرفة خادمة'],
    },
    photoStart: 3,
    listedAt: '2026-10-02',
  },
  {
    id: 'sea-view-apartment-achrafieh',
    title: { en: 'Sea-view apartment in Achrafieh', ar: 'شقة مطلّة على البحر في الأشرفية' },
    type: 'apartment',
    deal: 'sale',
    price: 780_000,
    location: place.achrafieh,
    bedrooms: 3,
    bathrooms: 3,
    areaSqm: 240,
    yearBuilt: 2017,
    summary: {
      en: 'A high-floor apartment with uninterrupted views over the Mediterranean.',
      ar: 'شقة في طابق مرتفع بإطلالة مفتوحة على البحر المتوسط.',
    },
    description: {
      en: [
        'On the 14th floor of a contemporary residential tower, this apartment pairs a wide living and dining room with a wraparound balcony facing the sea.',
        'The building offers a gym, concierge and 24-hour power.',
      ],
      ar: [
        'في الطابق الرابع عشر من برج سكني حديث، تجمع هذه الشقة بين صالون وغرفة طعام واسعين وشرفة ملتفّة تطلّ على البحر.',
        'يوفّر المبنى نادياً رياضيًا وخدمة استقبال وكهرباء على مدار الساعة.',
      ],
    },
    features: {
      en: ['Sea view', 'Wraparound balcony', 'Concierge', '24-hour electricity', 'Gym', 'Two parking spaces'],
      ar: ['إطلالة بحرية', 'شرفة ملتفّة', 'خدمة استقبال', 'كهرباء 24 ساعة', 'نادٍ رياضي', 'موقفان للسيارات'],
    },
    photoStart: 1,
    featured: true,
    listedAt: '2026-10-08',
  },
  {
    id: 'loft-mar-mikhael',
    title: { en: 'Industrial loft in Mar Mikhael', ar: 'لوفت بطابع صناعي في مار مخايل' },
    type: 'apartment',
    deal: 'rent',
    price: 1_900,
    location: place.marMikhael,
    bedrooms: 1,
    bathrooms: 1,
    areaSqm: 110,
    yearBuilt: 2015,
    summary: {
      en: 'Double-height loft with exposed concrete, steps from cafés and galleries.',
      ar: 'لوفت بسقف مزدوج الارتفاع وخرسانة ظاهرة، على بُعد خطوات من المقاهي والمعارض.',
    },
    description: {
      en: [
        'A converted warehouse unit with 5-metre ceilings, a mezzanine bedroom and steel-framed windows.',
        'Rent includes building maintenance and generator subscription.',
      ],
      ar: [
        'وحدة مستودع محوّلة بأسقف ارتفاعها خمسة أمتار وغرفة نوم على طابق نصفي ونوافذ بإطارات فولاذية.',
        'يشمل الإيجار صيانة المبنى واشتراك المولّد.',
      ],
    },
    features: {
      en: ['Double-height ceilings', 'Mezzanine bedroom', 'Furnished', 'Generator included'],
      ar: ['أسقف مزدوجة الارتفاع', 'غرفة نوم على طابق نصفي', 'مفروش', 'اشتراك المولّد مشمول'],
    },
    photoStart: 2,
    listedAt: '2026-10-11',
  },
  {
    id: 'garden-apartment-jounieh',
    title: { en: 'Garden apartment in Jounieh', ar: 'شقة مع حديقة في جونية' },
    type: 'apartment',
    deal: 'sale',
    price: 315_000,
    location: place.kaslik,
    bedrooms: 2,
    bathrooms: 2,
    areaSqm: 150,
    yearBuilt: 2021,
    summary: {
      en: 'Ground-floor apartment with a private garden, close to the Kaslik waterfront.',
      ar: 'شقة في الطابق الأرضي مع حديقة خاصة، قريبة من واجهة الكسليك البحرية.',
    },
    description: {
      en: [
        'A modern two-bedroom apartment with a private 80 m² garden, an open kitchen and a large master suite.',
        'The residence is a short walk from the Kaslik promenade, shops and the university.',
      ],
      ar: [
        'شقة حديثة من غرفتي نوم مع حديقة خاصة مساحتها 80 م² ومطبخ مفتوح وجناح رئيسي واسع.',
        'يقع المبنى على مسافة قصيرة سيرًا من كورنيش الكسليك والمتاجر والجامعة.',
      ],
    },
    features: {
      en: ['Private garden', 'Open kitchen', 'Storage room', 'One parking space'],
      ar: ['حديقة خاصة', 'مطبخ مفتوح', 'غرفة تخزين', 'موقف سيارة واحد'],
    },
    photoStart: 3,
    listedAt: '2026-09-21',
  },
  {
    id: 'studio-hamra',
    title: { en: 'Bright studio near Hamra Street', ar: 'استوديو مشرق قرب شارع الحمرا' },
    type: 'apartment',
    deal: 'rent',
    price: 850,
    location: place.hamra,
    bedrooms: 0,
    bathrooms: 1,
    areaSqm: 48,
    yearBuilt: 2012,
    summary: {
      en: 'Compact furnished studio, ideal for students and young professionals.',
      ar: 'استوديو مفروش وعملي، مثالي للطلاب والمهنيين الشباب.',
    },
    description: {
      en: [
        'A well-planned furnished studio with a kitchenette, balcony and plenty of storage.',
        'Walking distance to universities, Hamra Street and public transport.',
      ],
      ar: [
        'استوديو مفروش ومدروس التصميم مع مطبخ صغير وشرفة ومساحات تخزين وافرة.',
        'على مسافة قريبة سيرًا من الجامعات وشارع الحمرا والنقل العام.',
      ],
    },
    features: {
      en: ['Furnished', 'Balcony', 'Internet ready', 'Elevator'],
      ar: ['مفروش', 'شرفة', 'جاهز للإنترنت', 'مصعد'],
    },
    photoStart: 4,
    listedAt: '2026-10-14',
  },
  {
    id: 'office-floor-downtown',
    title: { en: 'Grade-A office floor, Downtown Beirut', ar: 'طابق مكاتب فئة أولى في وسط بيروت' },
    type: 'commercial',
    deal: 'rent',
    price: 12_500,
    location: place.downtown,
    bathrooms: 4,
    areaSqm: 640,
    yearBuilt: 2014,
    summary: {
      en: 'A full open-plan floor with city and harbour views in a landmark tower.',
      ar: 'طابق كامل بتصميم مفتوح يطلّ على المدينة والمرفأ في برج معروف.',
    },
    description: {
      en: [
        'A complete floor of Grade-A office space delivered in shell-and-core, ready for a tenant fit-out.',
        'The building offers raised floors, central air-conditioning, backup power and secure underground parking.',
      ],
      ar: [
        'طابق كامل من المكاتب فئة أولى يُسلَّم على الهيكل، جاهز لتجهيزه وفق احتياجات المستأجر.',
        'يوفّر المبنى أرضيات مرتفعة وتكييفًا مركزيًا وطاقة احتياطية وموقفًا آمنًا تحت الأرض.',
      ],
    },
    features: {
      en: ['Open plan', 'Raised floors', 'Central A/C', '10 parking spaces', 'Backup power'],
      ar: ['تصميم مفتوح', 'أرضيات مرتفعة', 'تكييف مركزي', '10 مواقف للسيارات', 'طاقة احتياطية'],
    },
    photoStart: 1,
    featured: true,
    listedAt: '2026-09-30',
  },
  {
    id: 'retail-unit-verdun',
    title: { en: 'Corner retail unit on Verdun Street', ar: 'محل تجاري على زاوية شارع فردان' },
    type: 'commercial',
    deal: 'sale',
    price: 1_450_000,
    location: place.verdun,
    bathrooms: 1,
    areaSqm: 280,
    yearBuilt: 2010,
    summary: {
      en: 'High-footfall corner shop with double frontage and a mezzanine.',
      ar: 'محل على زاوية في موقع مزدحم بواجهتين وطابق نصفي.',
    },
    description: {
      en: [
        'A prominent corner unit with 22 metres of glazed frontage on one of Beirut’s busiest shopping streets.',
        'Includes a 90 m² mezzanine suitable for stock or offices.',
      ],
      ar: [
        'وحدة بارزة على زاوية بواجهة زجاجية طولها 22 مترًا في أحد أكثر شوارع التسوّق ازدحامًا في بيروت.',
        'تشمل طابقًا نصفيًا بمساحة 90 م² يصلح للتخزين أو المكاتب.',
      ],
    },
    features: {
      en: ['Double frontage', 'Mezzanine', 'Loading access', 'Signage rights'],
      ar: ['واجهتان', 'طابق نصفي', 'مدخل للتحميل', 'حق تركيب لافتات'],
    },
    photoStart: 2,
    listedAt: '2026-08-27',
  },
  {
    id: 'warehouse-dbayeh',
    title: { en: 'Warehouse with offices in Dbayeh', ar: 'مستودع مع مكاتب في ضبيه' },
    type: 'commercial',
    deal: 'rent',
    price: 6_000,
    location: place.dbayeh,
    bathrooms: 2,
    areaSqm: 1_200,
    yearBuilt: 2005,
    summary: {
      en: 'Clear-span warehouse with highway access and a two-storey office block.',
      ar: 'مستودع بمساحة مفتوحة بلا أعمدة مع وصول مباشر إلى الأوتوستراد ومبنى مكاتب من طابقين.',
    },
    description: {
      en: [
        'A 1,000 m² clear-span warehouse with 9-metre eaves, plus 200 m² of offices across two floors.',
        'Direct access to the coastal highway makes it ideal for distribution.',
      ],
      ar: [
        'مستودع مفتوح بمساحة 1,000 م² وارتفاع 9 أمتار، إضافة إلى 200 م² من المكاتب على طابقين.',
        'الوصول المباشر إلى الأوتوستراد الساحلي يجعله مثاليًا للتوزيع.',
      ],
    },
    features: {
      en: ['9 m clear height', 'Two loading docks', 'Office block', 'Yard'],
      ar: ['ارتفاع صافٍ 9 أمتار', 'رصيفا تحميل', 'مبنى مكاتب', 'باحة خارجية'],
    },
    photoStart: 3,
    listedAt: '2026-09-05',
  },
  {
    id: 'hillside-plot-faqra',
    title: { en: 'Hillside building plot near Faqra', ar: 'أرض للبناء على تلّة قرب فقرا' },
    type: 'land',
    deal: 'sale',
    price: 390_000,
    location: place.kfardebian,
    areaSqm: 2_400,
    summary: {
      en: 'A south-facing mountain plot with approved access and views to the coast.',
      ar: 'أرض جبلية متّجهة جنوبًا مع طريق وصول مرخّص وإطلالة على الساحل.',
    },
    description: {
      en: [
        'A gently sloping 2,400 m² plot zoned for residential use, with road access and utilities at the boundary.',
        'Fifteen minutes from Faqra and the ski slopes, with year-round views to the coast.',
      ],
      ar: [
        'أرض منحدرة بلطف مساحتها 2,400 م² مصنّفة للاستخدام السكني، مع طريق وصول والخدمات عند حدودها.',
        'على بُعد خمس عشرة دقيقة من فقرا ومنحدرات التزلّج، مع إطلالة على الساحل طوال العام.',
      ],
    },
    features: {
      en: ['Residential zoning', 'Road access', 'Utilities at boundary', 'South-facing'],
      ar: ['تصنيف سكني', 'طريق وصول', 'الخدمات عند الحدود', 'متّجهة جنوبًا'],
    },
    photoStart: 1,
    featured: true,
    listedAt: '2026-09-18',
  },
  {
    id: 'olive-grove-koura',
    title: { en: 'Olive grove in Koura', ar: 'بستان زيتون في الكورة' },
    type: 'land',
    deal: 'sale',
    price: 220_000,
    location: place.amioun,
    areaSqm: 8_500,
    summary: {
      en: 'Established olive grove of around 300 trees, with well and stone terraces.',
      ar: 'بستان زيتون قائم يضمّ نحو 300 شجرة، مع بئر وجلول حجرية.',
    },
    description: {
      en: [
        'A productive olive grove on traditional stone terraces, with a private well and a small stone storage hut.',
        'Suitable for continued agricultural use or a future country retreat, subject to permits.',
      ],
      ar: [
        'بستان زيتون منتج على جلول حجرية تقليدية، مع بئر خاصة وغرفة تخزين حجرية صغيرة.',
        'يصلح لمواصلة الاستثمار الزراعي أو لبناء منزل ريفي مستقبلًا، وفق التراخيص.',
      ],
    },
    features: {
      en: ['≈300 olive trees', 'Private well', 'Stone terraces', 'Agricultural zoning'],
      ar: ['نحو 300 شجرة زيتون', 'بئر خاصة', 'جلول حجرية', 'تصنيف زراعي'],
    },
    photoStart: 2,
    listedAt: '2026-08-30',
  },
  {
    id: 'seasonal-land-lease-bekaa',
    title: { en: 'Agricultural land lease, Bekaa Valley', ar: 'أرض زراعية للإيجار في سهل البقاع' },
    type: 'land',
    deal: 'rent',
    price: 1_200,
    location: place.zahle,
    areaSqm: 20_000,
    summary: {
      en: 'Two hectares of irrigated farmland available on an annual lease.',
      ar: 'هكتاران من الأراضي الزراعية المرويّة متاحان بعقد إيجار سنوي.',
    },
    description: {
      en: [
        'Flat, fertile land with irrigation rights, previously used for vineyards and vegetables.',
        'Offered on a renewable annual lease, payable monthly.',
      ],
      ar: [
        'أرض مستوية وخصبة مع حقوق ري، استُخدمت سابقًا لكروم العنب والخضار.',
        'معروضة بعقد إيجار سنوي قابل للتجديد، يُدفع شهريًا.',
      ],
    },
    features: {
      en: ['Irrigation rights', 'Flat terrain', 'Road frontage', 'Annual lease'],
      ar: ['حقوق ري', 'أرض مستوية', 'واجهة على الطريق', 'إيجار سنوي'],
    },
    photoStart: 3,
    listedAt: '2026-10-05',
  },
];
