export type Lang = "en" | "ru" | "tg";

export const LANGUAGES: {
  id: Lang;
  label: string;
  endonym: string;
  /** Two-letter badge shown in the switcher, written in that language. */
  short: string;
}[] = [
  { id: "en", label: "English", endonym: "English", short: "EN" },
  { id: "ru", label: "Russian", endonym: "Русский", short: "РУ" },
  { id: "tg", label: "Tajik", endonym: "Тоҷикӣ", short: "ТҶ" },
];

/** A value that exists in every supported language. */
export type Localized<T = string> = Record<Lang, T>;

export function loc<T>(value: Localized<T>, lang: Lang): T {
  return value[lang];
}

/** Replace {placeholders} in a dictionary string. */
export function fmt(template: string, vars: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (match, key) =>
    key in vars ? String(vars[key]) : match
  );
}

const en = {
  // Announcement
  announcePromo: "10% off your first order with code",
  announceShipping: "Free shipping over ₽120",
  announceDismiss: "Dismiss announcement",

  // Navigation
  navShopAll: "Shop All",
  navTees: "Tees",
  navHoodies: "Hoodies",
  navAccessories: "Accessories",
  navSale: "Sale",
  navAbout: "About",
  navContact: "Contact",
  navWishlist: "Wishlist",

  // Header
  headerHome: "ORIYONI home",
  headerSearch: "Search",
  headerSearchPlaceholder: "Search tees, hoodies, accessories…",
  headerSearchClose: "Close search",
  headerOpenMenu: "Open menu",
  headerCloseMenu: "Close menu",
  headerCartLabel: "Cart, {n} items",
  headerWishlistLabel: "Wishlist, {n} items",
  headerNavPrimary: "Primary",
  headerNavMobile: "Mobile",

  // Bottom tab bar (mobile). Labels are kept to one short word so four fit
  // across a phone without truncating.
  tabBarLabel: "Primary",
  tabShop: "Shop",
  tabCart: "Cart",
  tabWishlist: "Saved",
  tabAccount: "Account",

  // Language switcher
  langSwitchLabel: "Language",
  langSwitchTo: "Switch language to {lang}",

  // Hero
  heroEyebrow: "Est. in the pursuit of quiet confidence",
  heroTitleLine1: "Wear the",
  heroTitleLine2: "Crown",
  heroSubtitle:
    "Heavyweight tees and hoodies, cut clean and built to last. No noise — just the crest.",
  heroShopTees: "Shop Tees",
  heroShopHoodies: "Shop Hoodies",

  // Category banners
  bannerTeesCopy:
    "Heavyweight cotton, cut clean. The everyday layer with the crest at heart.",
  bannerHoodiesCopy:
    "Brushed fleece built for cold mornings and long nights. Zero compromise.",
  bannerShopNow: "Shop Now",

  // Collection section
  collectionEyebrow: "The Collection",
  collectionHeading: "Shop the Line",
  collectionViewAll: "View All",
  tabsLabel: "Product collections",
  tabNew: "New Arrivals",
  tabSale: "Sale",
  tabBestseller: "Best Sellers",

  // Trust bar
  trustShippingTitle: "Free Shipping",
  trustShippingCopy: "On all orders over ₽120",
  trustReturnsTitle: "Easy 30-Day Returns",
  trustReturnsCopy: "Didn't fit? Send it back",
  trustSecureTitle: "Secure Checkout",
  trustSecureCopy: "Encrypted end to end",

  // Manifesto
  manifestoHeading: "Built for those who lead quietly",
  manifestoBody:
    "ORIYONI started with one idea: clothing should carry weight without shouting for attention. Every crest is embroidered, every cotton heavyweight, every fit deliberate. No collaborations, no gimmicks — just the standard we set for ourselves.",
  manifestoCta: "Our Story",
  manifestoCut: "Cut",
  manifestoCotton: "Cotton",
  manifestoCrest: "Crest",

  // Newsletter
  newsletterHeading: "Join the Court",
  newsletterCopy: "Get 10% off your first order and early access to new drops.",
  newsletterEmailLabel: "Email address",
  newsletterPlaceholder: "Enter your email",
  newsletterSubmit: "Subscribe",
  newsletterSuccess: "You're on the list — welcome to ORIYONI.",

  // Footer
  footerTagline:
    "Heavyweight tees and hoodies built on quiet confidence. Wear the crown.",
  footerShop: "Shop",
  footerHelp: "Help",
  footerCompany: "Company",
  footerContactUs: "Contact Us",
  footerShippingReturns: "Shipping & Returns",
  footerSizeGuide: "Size Guide",
  footerTrackOrder: "Track Order",
  footerOurStory: "Our Story",
  footerCraft: "Craft & Materials",
  footerWholesale: "Wholesale",
  footerRights: "© {year} ORIYONI. All rights reserved.",
  footerMotto: "Designed with intent. Made for the crowned.",
  footerInstagram: "ORIYONI on Instagram",
  footerTikTok: "ORIYONI on TikTok",
  footerTwitter: "ORIYONI on Twitter",

  // Product card / grid
  quickAdd: "Quick Add",
  addToWishlist: "Add to wishlist",
  removeFromWishlist: "Remove from wishlist",
  viewColor: "View {color}",
  badgeNew: "New",
  badgeBestseller: "Bestseller",
  gridEmpty: "No pieces here yet — check back soon.",

  // Breadcrumb
  breadcrumbHome: "Home",

  // Shop page
  shopTitle: "Shop All",
  shopDescription:
    "Heavyweight tees, hoodies, and the accessories built to go with them.",
  filterAll: "All",
  sortLabel: "Sort products",
  sortNewest: "Newest",
  sortPriceAsc: "Price: Low to High",
  sortPriceDesc: "Price: High to Low",
  resultsFor: "Results for",
  resultsClear: "Clear",
  countOne: "{n} piece",
  countFew: "{n} pieces",
  countMany: "{n} pieces",

  // Categories
  categoryTees: "Tees",
  categoryHoodies: "Hoodies",
  categoryAccessories: "Accessories",

  // Product detail
  pdpColor: "Color",
  pdpSize: "Size",
  pdpAddToCart: "Add to Cart",
  pdpAdded: "Added",
  pdpSoldOut: "Sold Out",
  pdpDetails: "Details & Care",
  pdpShipping: "Shipping & Returns",
  pdpShippingCopy:
    "Free shipping on orders over ₽120. Delivered in 3–5 business days. Not the right fit? Return it within 30 days for a full refund.",
  pdpRelated: "You May Also Like",
  qtyDecrease: "Decrease quantity",
  qtyIncrease: "Increase quantity",
  sizeOneSize: "One Size",

  // Cart
  cartTitle: "Your Bag",
  cartDrawerTitle: "Your Bag ({n})",
  cartClose: "Close cart",
  cartEmpty: "Your bag is empty.",
  cartShopCta: "Shop the collection",
  cartRemove: "Remove",
  cartViewCheckout: "View Bag & Checkout",
  cartSummary: "Order Summary",
  cartPromoLabel: "Promo code",
  cartPromoApply: "Apply",
  cartPromoHint: "Try code CROWN10 for 10% off.",
  cartPromoSuccess: "CROWN10 applied — 10% off.",
  cartSubtotal: "Subtotal",
  cartShipping: "Shipping",
  cartFree: "Free",
  cartDiscount: "Discount",
  cartTotal: "Total",
  cartCheckout: "Proceed to Checkout",
  cartCheckoutNote: "Payment is arranged by email before your order ships.",
  cartCheckoutTitle: "Go to checkout",

  // Wishlist
  wishlistTitle: "Wishlist",
  wishlistEmpty: "Nothing saved yet.",
  wishlistError: "Could not load your wishlist. Check your connection and try again.",
  wishlistCta: "Browse the Collection",

  // About
  aboutTitle: "Our Story",
  aboutHeading: "Quiet confidence, worn daily",
  aboutBody1:
    "ORIYONI was built on a simple belief: the clothes you reach for every day should feel as considered as the ones you save for occasions. We build heavyweight tees and hoodies around a single crest — no collaborations, no seasonal noise, just a standard we hold ourselves to with every stitch.",
  aboutBody2:
    "The crown isn't about status. It's a reminder to carry yourself like the standard is already set.",
  aboutCta: "Shop the Collection",
  aboutValuesHeading: "What We Stand On",
  aboutValue1Title: "Heavyweight, Always",
  aboutValue1Copy:
    "We don't cut corners on fabric. Every tee starts at 220gsm, every hoodie at 400gsm.",
  aboutValue2Title: "Embroidered, Not Printed",
  aboutValue2Copy:
    "The crest is stitched, not screened. It's meant to outlast the season.",
  aboutValue3Title: "Deliberate Drops",
  aboutValue3Copy:
    "No filler collections. Every release earns its place in the line.",

  // Contact
  contactTitle: "Contact Us",
  contactDescription:
    "Questions about an order, sizing, or wholesale? Reach out below.",
  contactEmailHeading: "Email",
  contactResponseHeading: "Response Time",
  contactResponseCopy: "We reply within 1–2 business days.",
  contactWholesaleHeading: "Wholesale",
  contactWholesaleCopy:
    "Interested in stocking ORIYONI? Mention it in your message.",
  contactName: "Name",
  contactEmail: "Email",
  contactSubject: "Subject",
  contactMessage: "Message",
  contactMessagePlaceholder: "How can we help?",
  contactSubmit: "Send Message",
  contactSuccess:
    "Thanks — your message has been noted. We'll get back to you shortly.",

  // 404
  notFoundTitle: "Page Not Found",
  notFoundCopy:
    "This page doesn't exist — the piece you're looking for may have moved or sold out.",
  notFoundCta: "Back to Home",

  // Account and authentication
  authSignIn: "Sign In",
  authSignOut: "Sign Out",
  authRegister: "Create Account",
  authAccount: "Account",
  authEmail: "Email",
  authPassword: "Password",
  authFirstName: "First Name",
  authLastName: "Last Name",
  authSignInTitle: "Sign In",
  authSignInDescription: "Your cart and saved pieces travel with your account.",
  authSignInSubmit: "Sign In",
  authSignInPrompt: "New to ORIYONI?",
  authSignInPromptLink: "Create an account",
  authRegisterTitle: "Create Account",
  authRegisterDescription:
    "Keep your cart, wishlist and order history on every device.",
  authRegisterSubmit: "Create Account",
  authRegisterPrompt: "Already have an account?",
  authRegisterPromptLink: "Sign in",
  authForgotPassword: "Forgot your password?",
  authForgotTitle: "Reset Password",
  authForgotDescription:
    "Enter your email and we will send a link to set a new password.",
  authForgotSubmit: "Send Reset Link",
  authForgotSent:
    "If that address has an account, a reset link is on its way. The link works once and expires in a few hours.",
  authResetTitle: "Choose a New Password",
  authResetDescription: "Pick something you have not used elsewhere.",
  authResetNewPassword: "New Password",
  authResetSubmit: "Save Password",
  authResetInvalid: "This reset link is invalid or has expired. Request a new one.",
  authResetDone: "Your password has been changed. You are signed in.",
  authBackToShop: "Back to shop",
  authWorking: "Working…",
  authAccountTitle: "Your Account",
  authAccountDescription: "Your details, orders and saved pieces.",
  authAccountDetails: "Details",
  authAccountSave: "Save Changes",
  authAccountSaved: "Saved.",
  authAccountPassword: "Change Password",
  authAccountCurrentPassword: "Current Password",
  authAccountNewPassword: "New Password",
  authAccountPasswordSaved: "Your password has been changed.",
  authAccountOrders: "Order History",
  authAccountNoOrders: "You have not placed an order yet.",
  authOrderItems: "{n} items",
  authSignedInAs: "Signed in as {email}",
  authRequired: "Sign in to see this page.",
  authGenericError: "Something went wrong. Please try again.",
  authOffline: "Could not reach the store. Check your connection and try again.",

  // Email confirmation. Nothing on the storefront waits for it, so the wording
  // is a nudge rather than a warning.
  authVerifyTitle: "Confirm Your Email",
  authVerifyDescription: "Confirming the email address on your account.",
  authVerifyDone: "Your email address is confirmed. Thank you.",
  authVerifyInvalid:
    "This confirmation link is invalid or has expired. We can send you a fresh one.",
  authVerifyResend: "Send a New Link",
  authVerifyResent:
    "If that address still needs confirming, a new link is on its way.",
  authVerifyBanner:
    "Your email is not confirmed yet. Confirm it so we can reach you about your orders.",
  authVerifyBannerAction: "Resend confirmation email",
  authVerifyEmailLabel: "Email",

  // Offered to a guest at checkout. Phrased as an invitation, not a gate —
  // guest checkout still works.
  guestPromptTitle: "Keep Track of Your Orders",
  guestPromptBody:
    "Create an account to save and track all your orders and shopping history. Your bag comes with you — nothing is lost.",
  guestPromptCreate: "Create Account",
  guestPromptSignIn: "Sign In",
  guestPromptContinue: "Continue as guest",
  guestPromptDismiss: "Close",

  // Checkout
  checkoutTitle: "Checkout",
  checkoutDescription: "Where should we send it?",
  checkoutContact: "Contact",
  checkoutShippingHeading: "Shipping Address",
  checkoutName: "Full Name",
  checkoutLine1: "Address",
  checkoutLine2: "Apartment, suite (optional)",
  checkoutCity: "City",
  checkoutPostalCode: "Postcode",
  checkoutCountry: "Country",
  checkoutCountryHint: "Two-letter code, e.g. GB",
  checkoutPhone: "Phone (optional)",
  checkoutNote: "Order Note (optional)",
  checkoutSummary: "Order Summary",
  checkoutPlaceOrder: "Place Order",
  checkoutEmpty: "There is nothing in your bag to check out.",
  checkoutPaymentPending:
    "Payments are not connected yet. Your order is recorded and we will email you to arrange payment before it ships.",
  orderPlacedTitle: "Order Placed",
  orderPlacedCopy:
    "Thank you. A confirmation is on its way to {email}. Keep order {number} for your records.",
  orderStatus: "Status",
  orderTotalLabel: "Total",
} as const;

export type Dict = Record<keyof typeof en, string>;

const ru: Dict = {
  // Announcement
  announcePromo: "Скидка 10% на первый заказ по промокоду",
  announceShipping: "Бесплатная доставка от 120 ₽",
  announceDismiss: "Закрыть объявление",

  // Navigation
  navShopAll: "Каталог",
  navTees: "Футболки",
  navHoodies: "Худи",
  navAccessories: "Аксессуары",
  navSale: "Распродажа",
  navAbout: "О бренде",
  navContact: "Контакты",
  navWishlist: "Избранное",

  // Header
  headerHome: "ORIYONI — на главную",
  headerSearch: "Поиск",
  headerSearchPlaceholder: "Поиск: футболки, худи, аксессуары…",
  headerSearchClose: "Закрыть поиск",
  headerOpenMenu: "Открыть меню",
  headerCloseMenu: "Закрыть меню",
  headerCartLabel: "Корзина, товаров: {n}",
  headerWishlistLabel: "Избранное, товаров: {n}",
  headerNavPrimary: "Основная навигация",
  headerNavMobile: "Мобильная навигация",

  // Bottom tab bar (mobile)
  tabBarLabel: "Основная навигация",
  tabShop: "Каталог",
  tabCart: "Корзина",
  tabWishlist: "Избранное",
  tabAccount: "Профиль",

  // Language switcher
  langSwitchLabel: "Язык",
  langSwitchTo: "Переключить язык на {lang}",

  // Hero
  heroEyebrow: "Создано в стремлении к тихой уверенности",
  heroTitleLine1: "Носи",
  heroTitleLine2: "корону",
  heroSubtitle:
    "Плотные футболки и худи с чистым кроем, созданные надолго. Без лишнего шума — только герб.",
  heroShopTees: "Смотреть футболки",
  heroShopHoodies: "Смотреть худи",

  // Category banners
  bannerTeesCopy:
    "Плотный хлопок и чистый крой. Базовый слой с гербом на груди.",
  bannerHoodiesCopy:
    "Начёсанный флис для холодного утра и долгих вечеров. Без компромиссов.",
  bannerShopNow: "В каталог",

  // Collection section
  collectionEyebrow: "Коллекция",
  collectionHeading: "Вся линейка",
  collectionViewAll: "Смотреть всё",
  tabsLabel: "Подборки товаров",
  tabNew: "Новинки",
  tabSale: "Распродажа",
  tabBestseller: "Хиты продаж",

  // Trust bar
  trustShippingTitle: "Бесплатная доставка",
  trustShippingCopy: "При заказе от 120 ₽",
  trustReturnsTitle: "Возврат 30 дней",
  trustReturnsCopy: "Не подошло? Просто верните",
  trustSecureTitle: "Безопасная оплата",
  trustSecureCopy: "Сквозное шифрование",

  // Manifesto
  manifestoHeading: "Для тех, кто ведёт за собой без слов",
  manifestoBody:
    "ORIYONI начался с одной мысли: одежда должна иметь вес, не требуя внимания. Каждый герб вышит, каждый хлопок плотный, каждая посадка продумана. Никаких коллабораций и уловок — только стандарт, который мы задали себе сами.",
  manifestoCta: "О бренде",
  manifestoCut: "Крой",
  manifestoCotton: "Хлопок",
  manifestoCrest: "Герб",

  // Newsletter
  newsletterHeading: "Присоединяйтесь ко двору",
  newsletterCopy:
    "Скидка 10% на первый заказ и ранний доступ к новым дропам.",
  newsletterEmailLabel: "Электронная почта",
  newsletterPlaceholder: "Введите ваш email",
  newsletterSubmit: "Подписаться",
  newsletterSuccess: "Вы в списке — добро пожаловать в ORIYONI.",

  // Footer
  footerTagline:
    "Плотные футболки и худи, построенные на тихой уверенности. Носи корону.",
  footerShop: "Каталог",
  footerHelp: "Помощь",
  footerCompany: "Компания",
  footerContactUs: "Связаться с нами",
  footerShippingReturns: "Доставка и возврат",
  footerSizeGuide: "Таблица размеров",
  footerTrackOrder: "Отследить заказ",
  footerOurStory: "О бренде",
  footerCraft: "Материалы и производство",
  footerWholesale: "Оптом",
  footerRights: "© {year} ORIYONI. Все права защищены.",
  footerMotto: "Создано осознанно. Для тех, кто носит корону.",
  footerInstagram: "ORIYONI в Instagram",
  footerTikTok: "ORIYONI в TikTok",
  footerTwitter: "ORIYONI в Twitter",

  // Product card / grid
  quickAdd: "Быстро в корзину",
  addToWishlist: "Добавить в избранное",
  removeFromWishlist: "Убрать из избранного",
  viewColor: "Посмотреть цвет: {color}",
  badgeNew: "Новинка",
  badgeBestseller: "Хит",
  gridEmpty: "Здесь пока пусто — загляните позже.",

  // Breadcrumb
  breadcrumbHome: "Главная",

  // Shop page
  shopTitle: "Каталог",
  shopDescription: "Плотные футболки, худи и аксессуары к ним.",
  filterAll: "Все",
  sortLabel: "Сортировка товаров",
  sortNewest: "Сначала новые",
  sortPriceAsc: "Цена: по возрастанию",
  sortPriceDesc: "Цена: по убыванию",
  resultsFor: "Результаты по запросу",
  resultsClear: "Сбросить",
  countOne: "{n} позиция",
  countFew: "{n} позиции",
  countMany: "{n} позиций",

  // Categories
  categoryTees: "Футболки",
  categoryHoodies: "Худи",
  categoryAccessories: "Аксессуары",

  // Product detail
  pdpColor: "Цвет",
  pdpSize: "Размер",
  pdpAddToCart: "В корзину",
  pdpAdded: "Добавлено",
  pdpSoldOut: "Распродано",
  pdpDetails: "Состав и уход",
  pdpShipping: "Доставка и возврат",
  pdpShippingCopy:
    "Бесплатная доставка при заказе от 120 ₽. Срок доставки — 3–5 рабочих дней. Не подошло? Вернём деньги в течение 30 дней.",
  pdpRelated: "Вам может понравиться",
  qtyDecrease: "Уменьшить количество",
  qtyIncrease: "Увеличить количество",
  sizeOneSize: "Один размер",

  // Cart
  cartTitle: "Корзина",
  cartDrawerTitle: "Корзина ({n})",
  cartClose: "Закрыть корзину",
  cartEmpty: "Ваша корзина пуста.",
  cartShopCta: "Перейти в каталог",
  cartRemove: "Удалить",
  cartViewCheckout: "Корзина и оформление",
  cartSummary: "Ваш заказ",
  cartPromoLabel: "Промокод",
  cartPromoApply: "Применить",
  cartPromoHint: "Введите промокод CROWN10 — скидка 10%.",
  cartPromoSuccess: "CROWN10 применён — скидка 10%.",
  cartSubtotal: "Сумма",
  cartShipping: "Доставка",
  cartFree: "Бесплатно",
  cartDiscount: "Скидка",
  cartTotal: "Итого",
  cartCheckout: "Перейти к оплате",
  cartCheckoutNote: "Об оплате договоримся по почте до отправки заказа.",
  cartCheckoutTitle: "Перейти к оформлению",

  // Wishlist
  wishlistTitle: "Избранное",
  wishlistEmpty: "Пока ничего не сохранено.",
  wishlistError: "Не удалось загрузить избранное. Проверьте соединение и попробуйте снова.",
  wishlistCta: "Перейти в каталог",

  // About
  aboutTitle: "О бренде",
  aboutHeading: "Тихая уверенность каждый день",
  aboutBody1:
    "ORIYONI построен на простом убеждении: одежда, которую вы носите каждый день, должна быть продумана так же, как та, что вы бережёте для особых случаев. Мы строим плотные футболки и худи вокруг одного герба — без коллабораций и сезонного шума, только стандарт, которому мы следуем в каждом шве.",
  aboutBody2:
    "Корона — не про статус. Это напоминание держаться так, будто планка уже задана.",
  aboutCta: "Перейти в каталог",
  aboutValuesHeading: "Наши принципы",
  aboutValue1Title: "Всегда плотная ткань",
  aboutValue1Copy:
    "Мы не экономим на материале. Каждая футболка — от 220 г/м², каждое худи — от 400 г/м².",
  aboutValue2Title: "Вышивка, а не печать",
  aboutValue2Copy:
    "Герб вышит, а не нанесён краской. Он переживёт не один сезон.",
  aboutValue3Title: "Осознанные дропы",
  aboutValue3Copy:
    "Никаких коллекций ради объёма. Каждый релиз заслуживает своё место в линейке.",

  // Contact
  contactTitle: "Контакты",
  contactDescription:
    "Вопросы о заказе, размерах или оптовых поставках? Напишите нам.",
  contactEmailHeading: "Email",
  contactResponseHeading: "Время ответа",
  contactResponseCopy: "Отвечаем в течение 1–2 рабочих дней.",
  contactWholesaleHeading: "Оптовые поставки",
  contactWholesaleCopy:
    "Хотите продавать ORIYONI? Укажите это в своём сообщении.",
  contactName: "Имя",
  contactEmail: "Email",
  contactSubject: "Тема",
  contactMessage: "Сообщение",
  contactMessagePlaceholder: "Чем мы можем помочь?",
  contactSubmit: "Отправить сообщение",
  contactSuccess:
    "Спасибо — мы получили ваше сообщение и скоро свяжемся с вами.",

  // 404
  notFoundTitle: "Страница не найдена",
  notFoundCopy:
    "Такой страницы не существует — возможно, товар перемещён или распродан.",
  notFoundCta: "На главную",

  // Account and authentication
  authSignIn: "Войти",
  authSignOut: "Выйти",
  authRegister: "Создать аккаунт",
  authAccount: "Аккаунт",
  authEmail: "Эл. почта",
  authPassword: "Пароль",
  authFirstName: "Имя",
  authLastName: "Фамилия",
  authSignInTitle: "Вход",
  authSignInDescription: "Корзина и избранное будут с вами на любом устройстве.",
  authSignInSubmit: "Войти",
  authSignInPrompt: "Впервые в ORIYONI?",
  authSignInPromptLink: "Создать аккаунт",
  authRegisterTitle: "Создание аккаунта",
  authRegisterDescription:
    "Корзина, избранное и история заказов — на всех устройствах.",
  authRegisterSubmit: "Создать аккаунт",
  authRegisterPrompt: "Уже есть аккаунт?",
  authRegisterPromptLink: "Войти",
  authForgotPassword: "Забыли пароль?",
  authForgotTitle: "Сброс пароля",
  authForgotDescription: "Введите адрес — мы пришлём ссылку для смены пароля.",
  authForgotSubmit: "Отправить ссылку",
  authForgotSent:
    "Если аккаунт с таким адресом есть, ссылка уже в пути. Она работает один раз и действует несколько часов.",
  authResetTitle: "Новый пароль",
  authResetDescription: "Выберите пароль, который больше нигде не используете.",
  authResetNewPassword: "Новый пароль",
  authResetSubmit: "Сохранить пароль",
  authResetInvalid: "Ссылка недействительна или истекла. Запросите новую.",
  authResetDone: "Пароль изменён. Вы вошли в аккаунт.",
  authBackToShop: "Вернуться в магазин",
  authWorking: "Секунду…",
  authAccountTitle: "Ваш аккаунт",
  authAccountDescription: "Данные, заказы и избранное.",
  authAccountDetails: "Данные",
  authAccountSave: "Сохранить",
  authAccountSaved: "Сохранено.",
  authAccountPassword: "Смена пароля",
  authAccountCurrentPassword: "Текущий пароль",
  authAccountNewPassword: "Новый пароль",
  authAccountPasswordSaved: "Пароль изменён.",
  authAccountOrders: "История заказов",
  authAccountNoOrders: "Вы ещё не оформляли заказов.",
  authOrderItems: "{n} шт.",
  authSignedInAs: "Вы вошли как {email}",
  authRequired: "Войдите, чтобы увидеть эту страницу.",
  authGenericError: "Что-то пошло не так. Попробуйте ещё раз.",
  authOffline: "Не удалось связаться с магазином. Проверьте соединение.",

  // Подтверждение почты
  authVerifyTitle: "Подтверждение почты",
  authVerifyDescription: "Подтверждаем адрес почты вашего аккаунта.",
  authVerifyDone: "Адрес подтверждён. Спасибо!",
  authVerifyInvalid: "Ссылка недействительна или истекла. Мы пришлём новую.",
  authVerifyResend: "Прислать новую ссылку",
  authVerifyResent: "Если адрес ещё не подтверждён, новая ссылка уже в пути.",
  authVerifyBanner:
    "Адрес почты пока не подтверждён. Подтвердите его, чтобы мы могли писать вам о заказах.",
  authVerifyBannerAction: "Отправить письмо ещё раз",
  authVerifyEmailLabel: "Эл. почта",

  // Предложение гостю при оформлении
  guestPromptTitle: "Сохраните свои заказы",
  guestPromptBody:
    "Создайте аккаунт, чтобы сохранять и отслеживать все заказы и историю покупок. Корзина останется с вами — ничего не потеряется.",
  guestPromptCreate: "Создать аккаунт",
  guestPromptSignIn: "Войти",
  guestPromptContinue: "Продолжить как гость",
  guestPromptDismiss: "Закрыть",

  // Checkout
  checkoutTitle: "Оформление",
  checkoutDescription: "Куда доставить заказ?",
  checkoutContact: "Контакты",
  checkoutShippingHeading: "Адрес доставки",
  checkoutName: "Имя и фамилия",
  checkoutLine1: "Адрес",
  checkoutLine2: "Квартира, офис (необязательно)",
  checkoutCity: "Город",
  checkoutPostalCode: "Индекс",
  checkoutCountry: "Страна",
  checkoutCountryHint: "Код из двух букв, например RU",
  checkoutPhone: "Телефон (необязательно)",
  checkoutNote: "Комментарий к заказу (необязательно)",
  checkoutSummary: "Ваш заказ",
  checkoutPlaceOrder: "Оформить заказ",
  checkoutEmpty: "В корзине нет товаров для оформления.",
  checkoutPaymentPending:
    "Оплата пока не подключена. Заказ сохранён — мы напишем вам, чтобы договориться об оплате до отправки.",
  orderPlacedTitle: "Заказ оформлен",
  orderPlacedCopy:
    "Спасибо. Подтверждение придёт на {email}. Сохраните номер заказа {number}.",
  orderStatus: "Статус",
  orderTotalLabel: "Итого",
};

const tg: Dict = {
  // Announcement
  announcePromo: "10% тахфиф ба фармоиши аввалин бо рамзи",
  announceShipping: "Аз 120 ₽ расонидан ройгон",
  announceDismiss: "Бастани эълон",

  // Navigation
  navShopAll: "Каталог",
  navTees: "Футболкаҳо",
  navHoodies: "Ҳудиҳо",
  navAccessories: "Лавозимот",
  navSale: "Тахфиф",
  navAbout: "Дар бораи бренд",
  navContact: "Тамос",
  navWishlist: "Дилхоҳҳо",

  // Header
  headerHome: "ORIYONI — ба саҳифаи асосӣ",
  headerSearch: "Ҷустуҷӯ",
  headerSearchPlaceholder: "Ҷустуҷӯ: футболка, ҳудӣ, лавозимот…",
  headerSearchClose: "Бастани ҷустуҷӯ",
  headerOpenMenu: "Кушодани меню",
  headerCloseMenu: "Бастани меню",
  headerCartLabel: "Сабад, {n} мол",
  headerWishlistLabel: "Дилхоҳҳо, {n} мол",
  headerNavPrimary: "Менюи асосӣ",
  headerNavMobile: "Менюи мобилӣ",

  // Bottom tab bar (mobile)
  tabBarLabel: "Менюи асосӣ",
  tabShop: "Каталог",
  tabCart: "Сабад",
  tabWishlist: "Дилхоҳ",
  tabAccount: "Профил",

  // Language switcher
  langSwitchLabel: "Забон",
  langSwitchTo: "Гузариш ба забони {lang}",

  // Hero
  heroEyebrow: "Дар талоши эътимоди ором таъсис ёфтааст",
  heroTitleLine1: "Тоҷро",
  heroTitleLine2: "бипӯш",
  heroSubtitle:
    "Футболкаҳо ва ҳудиҳои зич бо буриши тоза, ки барои дер пӯшидан сохта шудаанд. Бе ҳаёҳуи зиёдатӣ — танҳо нишон.",
  heroShopTees: "Дидани футболкаҳо",
  heroShopHoodies: "Дидани ҳудиҳо",

  // Category banners
  bannerTeesCopy:
    "Пахтаи зич ва буриши тоза. Қабати ҳаррӯза бо нишон дар сина.",
  bannerHoodiesCopy:
    "Флиси хобдор барои субҳҳои сард ва шабҳои дароз. Бе ягон созиш.",
  bannerShopNow: "Ба каталог",

  // Collection section
  collectionEyebrow: "Маҷмӯа",
  collectionHeading: "Тамоми хатти маҳсулот",
  collectionViewAll: "Дидани ҳама",
  tabsLabel: "Интихобҳои мол",
  tabNew: "Навомадҳо",
  tabSale: "Тахфиф",
  tabBestseller: "Серхаридор",

  // Trust bar
  trustShippingTitle: "Расонидани ройгон",
  trustShippingCopy: "Ҳангоми фармоиш аз 120 ₽",
  trustReturnsTitle: "Баргардонидан то 30 рӯз",
  trustReturnsCopy: "Мувофиқ наомад? Баргардонед",
  trustSecureTitle: "Пардохти бехатар",
  trustSecureCopy: "Рамзгузории саросарӣ",

  // Manifesto
  manifestoHeading: "Барои онҳое, ки бе ҳаёҳу пешсаф мешаванд",
  manifestoBody:
    "ORIYONI аз як андеша оғоз ёфт: либос бояд вазн дошта бошад, вале таваҷҷуҳро талаб накунад. Ҳар нишон гулдӯзӣ шудааст, ҳар пахта зич аст, ҳар буриш санҷида шудааст. Ҳеҷ ҳамкорӣ ва ҳеҷ ҳилае нест — танҳо меъёре, ки худамон барои худ гузоштаем.",
  manifestoCta: "Дар бораи бренд",
  manifestoCut: "Буриш",
  manifestoCotton: "Пахта",
  manifestoCrest: "Нишон",

  // Newsletter
  newsletterHeading: "Ба дарбор ҳамроҳ шавед",
  newsletterCopy:
    "10% тахфиф ба фармоиши аввалин ва дастрасии барвақт ба дропҳои нав.",
  newsletterEmailLabel: "Почтаи электронӣ",
  newsletterPlaceholder: "Почтаи худро ворид кунед",
  newsletterSubmit: "Обуна шудан",
  newsletterSuccess: "Шумо дар рӯйхатед — ба ORIYONI хуш омадед.",

  // Footer
  footerTagline:
    "Футболкаҳо ва ҳудиҳои зич, ки бар эътимоди ором сохта шудаанд. Тоҷро бипӯш.",
  footerShop: "Каталог",
  footerHelp: "Кӯмак",
  footerCompany: "Ширкат",
  footerContactUs: "Тамос бо мо",
  footerShippingReturns: "Расонидан ва баргардонидан",
  footerSizeGuide: "Ҷадвали андозаҳо",
  footerTrackOrder: "Пайгирии фармоиш",
  footerOurStory: "Дар бораи бренд",
  footerCraft: "Мавод ва истеҳсол",
  footerWholesale: "Яклухт",
  footerRights: "© {year} ORIYONI. Ҳамаи ҳуқуқҳо ҳифз шудаанд.",
  footerMotto: "Бо ният офарида шудааст. Барои онҳое, ки тоҷ мепӯшанд.",
  footerInstagram: "ORIYONI дар Instagram",
  footerTikTok: "ORIYONI дар TikTok",
  footerTwitter: "ORIYONI дар Twitter",

  // Product card / grid
  quickAdd: "Зуд ба сабад",
  addToWishlist: "Ба дилхоҳҳо илова кардан",
  removeFromWishlist: "Аз дилхоҳҳо гирифтан",
  viewColor: "Дидани ранг: {color}",
  badgeNew: "Нав",
  badgeBestseller: "Маъмул",
  gridEmpty: "Ҳоло дар ин ҷо чизе нест — дертар назар кунед.",

  // Breadcrumb
  breadcrumbHome: "Асосӣ",

  // Shop page
  shopTitle: "Каталог",
  shopDescription: "Футболкаҳо, ҳудиҳои зич ва лавозимоти мувофиқи онҳо.",
  filterAll: "Ҳама",
  sortLabel: "Тартиби мол",
  sortNewest: "Аввал навтаринҳо",
  sortPriceAsc: "Нарх: аз кам ба зиёд",
  sortPriceDesc: "Нарх: аз зиёд ба кам",
  resultsFor: "Натиҷаҳо аз рӯи дархост",
  resultsClear: "Тоза кардан",
  // Tajik does not inflect a noun after a numeral, so all three forms are one.
  countOne: "{n} дона",
  countFew: "{n} дона",
  countMany: "{n} дона",

  // Categories
  categoryTees: "Футболкаҳо",
  categoryHoodies: "Ҳудиҳо",
  categoryAccessories: "Лавозимот",

  // Product detail
  pdpColor: "Ранг",
  pdpSize: "Андоза",
  pdpAddToCart: "Ба сабад",
  pdpAdded: "Илова шуд",
  pdpSoldOut: "Фурӯхта шуд",
  pdpDetails: "Таркиб ва нигоҳубин",
  pdpShipping: "Расонидан ва баргардонидан",
  pdpShippingCopy:
    "Ҳангоми фармоиш аз 120 ₽ расонидан ройгон аст. Мӯҳлати расонидан — 3–5 рӯзи корӣ. Мувофиқ наомад? Дар давоми 30 рӯз пулро бармегардонем.",
  pdpRelated: "Ба шумо низ маъқул шуданаш мумкин",
  qtyDecrease: "Кам кардани шумора",
  qtyIncrease: "Зиёд кардани шумора",
  sizeOneSize: "Андозаи ягона",

  // Cart
  cartTitle: "Сабад",
  cartDrawerTitle: "Сабад ({n})",
  cartClose: "Бастани сабад",
  cartEmpty: "Сабади шумо холӣ аст.",
  cartShopCta: "Гузаштан ба каталог",
  cartRemove: "Нест кардан",
  cartViewCheckout: "Сабад ва ба расмият даровардан",
  cartSummary: "Фармоиши шумо",
  cartPromoLabel: "Рамзи тахфиф",
  cartPromoApply: "Татбиқ кардан",
  cartPromoHint: "Рамзи CROWN10-ро ворид кунед — 10% тахфиф.",
  cartPromoSuccess: "CROWN10 татбиқ шуд — 10% тахфиф.",
  cartSubtotal: "Маблағ",
  cartShipping: "Расонидан",
  cartFree: "Ройгон",
  cartDiscount: "Тахфиф",
  cartTotal: "Ҳамагӣ",
  cartCheckout: "Гузаштан ба пардохт",
  cartCheckoutNote:
    "Дар бораи пардохт пеш аз фиристодани фармоиш тавассути почта мувофиқа мекунем.",
  cartCheckoutTitle: "Гузаштан ба расмиятдарорӣ",

  // Wishlist
  wishlistTitle: "Дилхоҳҳо",
  wishlistEmpty: "Ҳоло чизе нигоҳ дошта нашудааст.",
  wishlistError:
    "Дилхоҳҳоро бор карда натавонистем. Пайвастро санҷед ва боз кӯшиш кунед.",
  wishlistCta: "Дидани маҷмӯа",

  // About
  aboutTitle: "Дар бораи бренд",
  aboutHeading: "Эътимоди ором дар ҳар рӯз",
  aboutBody1:
    "ORIYONI бар як бовари содда бунёд шудааст: либосе, ки ҳар рӯз мепӯшед, бояд ҳамон қадар санҷида бошад, ки либоси барои рӯзҳои махсус нигоҳдошта. Мо футболкаҳо ва ҳудиҳои зичро дар атрофи як нишон месозем — бе ҳамкорӣ ва бе ҳаёҳуи мавсимӣ, танҳо меъёре, ки дар ҳар дарз ба он содиқем.",
  aboutBody2:
    "Тоҷ дар бораи мақом нест. Ин ёдоварӣ аст, ки худро чунон нигоҳ доред, гӯё меъёр аллакай гузошта шудааст.",
  aboutCta: "Гузаштан ба каталог",
  aboutValuesHeading: "Принсипҳои мо",
  aboutValue1Title: "Ҳамеша матои зич",
  aboutValue1Copy:
    "Мо дар мавод сарфа намекунем. Ҳар футболка аз 220 г/м², ҳар ҳудӣ аз 400 г/м².",
  aboutValue2Title: "Гулдӯзӣ, на чоп",
  aboutValue2Copy:
    "Нишон гулдӯзӣ шудааст, на бо ранг чоп. Он на як мавсимро аз сар мегузаронад.",
  aboutValue3Title: "Дропҳои санҷида",
  aboutValue3Copy:
    "Ҳеҷ маҷмӯа барои шумора нест. Ҳар нашр ҷои худро дар хатти маҳсулот сазовор мешавад.",

  // Contact
  contactTitle: "Тамос",
  contactDescription:
    "Савол дар бораи фармоиш, андоза ё савдои яклухт? Ба мо нависед.",
  contactEmailHeading: "Email",
  contactResponseHeading: "Вақти ҷавоб",
  contactResponseCopy: "Дар давоми 1–2 рӯзи корӣ ҷавоб медиҳем.",
  contactWholesaleHeading: "Савдои яклухт",
  contactWholesaleCopy:
    "Мехоҳед ORIYONI-ро фурӯшед? Инро дар паёми худ қайд кунед.",
  contactName: "Ном",
  contactEmail: "Email",
  contactSubject: "Мавзӯъ",
  contactMessage: "Паём",
  contactMessagePlaceholder: "Чӣ гуна кӯмак карда метавонем?",
  contactSubmit: "Фиристодани паём",
  contactSuccess:
    "Ташаккур — паёми шуморо гирифтем ва ба зудӣ бо шумо дар тамос мешавем.",

  // 404
  notFoundTitle: "Саҳифа ёфт нашуд",
  notFoundCopy:
    "Чунин саҳифа вуҷуд надорад — шояд мол кӯчонида шуда ё фурӯхта шудааст.",
  notFoundCta: "Ба саҳифаи асосӣ",

  // Account and authentication
  authSignIn: "Ворид шудан",
  authSignOut: "Баромадан",
  authRegister: "Сохтани ҳисоб",
  authAccount: "Ҳисоб",
  authEmail: "Почтаи электронӣ",
  authPassword: "Парол",
  authFirstName: "Ном",
  authLastName: "Насаб",
  authSignInTitle: "Вуруд",
  authSignInDescription: "Сабад ва дилхоҳҳо дар ҳар дастгоҳ бо шумо мемонанд.",
  authSignInSubmit: "Ворид шудан",
  authSignInPrompt: "Бори аввал дар ORIYONI?",
  authSignInPromptLink: "Сохтани ҳисоб",
  authRegisterTitle: "Сохтани ҳисоб",
  authRegisterDescription:
    "Сабад, дилхоҳҳо ва таърихи фармоишҳо — дар ҳамаи дастгоҳҳо.",
  authRegisterSubmit: "Сохтани ҳисоб",
  authRegisterPrompt: "Аллакай ҳисоб доред?",
  authRegisterPromptLink: "Ворид шудан",
  authForgotPassword: "Паролро фаромӯш кардед?",
  authForgotTitle: "Барқарорсозии парол",
  authForgotDescription:
    "Суроғаро ворид кунед — мо пайванди иваз кардани паролро мефиристем.",
  authForgotSubmit: "Фиристодани пайванд",
  authForgotSent:
    "Агар ҳисоб бо чунин суроға бошад, пайванд аллакай дар роҳ аст. Он як маротиба кор мекунад ва чанд соат эътибор дорад.",
  authResetTitle: "Пароли нав",
  authResetDescription:
    "Пароле интихоб кунед, ки дар ҷои дигар истифода намебаред.",
  authResetNewPassword: "Пароли нав",
  authResetSubmit: "Нигоҳ доштани парол",
  authResetInvalid:
    "Пайванд эътибор надорад ё мӯҳлаташ гузаштааст. Пайванди нав дархост кунед.",
  authResetDone: "Парол иваз шуд. Шумо ба ҳисоб ворид шудед.",
  authBackToShop: "Бозгашт ба дӯкон",
  authWorking: "Як лаҳза…",
  authAccountTitle: "Ҳисоби шумо",
  authAccountDescription: "Маълумот, фармоишҳо ва дилхоҳҳо.",
  authAccountDetails: "Маълумот",
  authAccountSave: "Нигоҳ доштан",
  authAccountSaved: "Нигоҳ дошта шуд.",
  authAccountPassword: "Ивази парол",
  authAccountCurrentPassword: "Пароли ҷорӣ",
  authAccountNewPassword: "Пароли нав",
  authAccountPasswordSaved: "Парол иваз шуд.",
  authAccountOrders: "Таърихи фармоишҳо",
  authAccountNoOrders: "Шумо ҳанӯз фармоиш надодаед.",
  authOrderItems: "{n} дона",
  authSignedInAs: "Шумо ҳамчун {email} ворид шудаед",
  authRequired: "Барои дидани ин саҳифа ворид шавед.",
  authGenericError: "Чизе нодуруст шуд. Боз кӯшиш кунед.",
  authOffline: "Бо дӯкон пайваст шуда нашуд. Пайвастро санҷед.",

  // Тасдиқи почта
  authVerifyTitle: "Тасдиқи почта",
  authVerifyDescription: "Суроғаи почтаи ҳисоби шуморо тасдиқ карда истодаем.",
  authVerifyDone: "Суроға тасдиқ шуд. Ташаккур!",
  authVerifyInvalid:
    "Пайванд эътибор надорад ё мӯҳлаташ гузаштааст. Мо пайванди нав мефиристем.",
  authVerifyResend: "Фиристодани пайванди нав",
  authVerifyResent:
    "Агар суроға ҳанӯз тасдиқ нашуда бошад, пайванди нав дар роҳ аст.",
  authVerifyBanner:
    "Суроғаи почта ҳанӯз тасдиқ нашудааст. Онро тасдиқ кунед, то мо дар бораи фармоишҳо ба шумо нависем.",
  authVerifyBannerAction: "Боз як бор фиристодани мактуб",
  authVerifyEmailLabel: "Почтаи электронӣ",

  // Пешниҳод ба меҳмон ҳангоми ба расмият даровардан
  guestPromptTitle: "Фармоишҳои худро назорат кунед",
  guestPromptBody:
    "Ҳисоб созед, то ҳамаи фармоишҳо ва таърихи харидро нигоҳ доред ва пайгирӣ кунед. Сабад бо шумо мемонад — ҳеҷ чиз гум намешавад.",
  guestPromptCreate: "Сохтани ҳисоб",
  guestPromptSignIn: "Ворид шудан",
  guestPromptContinue: "Ҳамчун меҳмон идома додан",
  guestPromptDismiss: "Бастан",

  // Checkout
  checkoutTitle: "Ба расмият даровардан",
  checkoutDescription: "Фармоишро ба куҷо расонем?",
  checkoutContact: "Тамос",
  checkoutShippingHeading: "Суроғаи расонидан",
  checkoutName: "Ном ва насаб",
  checkoutLine1: "Суроға",
  checkoutLine2: "Хона, офис (ихтиёрӣ)",
  checkoutCity: "Шаҳр",
  checkoutPostalCode: "Индекс",
  checkoutCountry: "Кишвар",
  checkoutCountryHint: "Рамзи дуҳарфа, масалан TJ",
  checkoutPhone: "Телефон (ихтиёрӣ)",
  checkoutNote: "Эзоҳ ба фармоиш (ихтиёрӣ)",
  checkoutSummary: "Фармоиши шумо",
  checkoutPlaceOrder: "Додани фармоиш",
  checkoutEmpty: "Дар сабад моле барои ба расмият даровардан нест.",
  checkoutPaymentPending:
    "Пардохт ҳанӯз пайваст нашудааст. Фармоиш сабт шуд — мо ба шумо менависем, то пеш аз фиристодан дар бораи пардохт мувофиқа кунем.",
  orderPlacedTitle: "Фармоиш қабул шуд",
  orderPlacedCopy:
    "Ташаккур. Тасдиқ ба {email} мерасад. Рақами фармоиш {number}-ро нигоҳ доред.",
  orderStatus: "Ҳолат",
  orderTotalLabel: "Ҳамагӣ",
};

export const dictionaries: Record<Lang, Dict> = { en, ru, tg };

/**
 * Pick the right plural form for a count.
 * English has one/other; Russian has one/few/many; Tajik leaves the noun
 * alone after a numeral, so all three of its forms are the same string.
 */
export function plural(t: Dict, lang: Lang, n: number) {
  if (lang === "tg") return fmt(t.countMany, { n });

  if (lang === "ru") {
    const mod10 = n % 10;
    const mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) return fmt(t.countOne, { n });
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14))
      return fmt(t.countFew, { n });
    return fmt(t.countMany, { n });
  }
  return fmt(n === 1 ? t.countOne : t.countMany, { n });
}

// Tajik is formatted through ru-RU deliberately, not through tg-TJ: browsers
// ship no Tajik locale data, so `tg-TJ` resolves silently to the default
// locale and a Tajik page renders "₽2,000" instead of "2 000 ₽". Tajik follows
// the same convention as Russian here — space grouping, symbol after the
// number — so borrowing that locale is what the page should look like anyway.
const PRICE_LOCALES: Record<Lang, string> = {
  en: "en-US",
  ru: "ru-RU",
  tg: "ru-RU",
};

export function formatPrice(value: number, lang: Lang) {
  return new Intl.NumberFormat(PRICE_LOCALES[lang], {
    style: "currency",
    currency: "RUB",
    currencyDisplay: "narrowSymbol",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}
