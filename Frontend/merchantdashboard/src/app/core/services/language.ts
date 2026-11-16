import { Injectable, signal } from '@angular/core';

export type Language = 'ar' | 'fr' | 'en';

const translations: Record<Language, Record<string, string>> = {
    ar: {
        language: 'اللغة',
        arabic: 'العربية',
        french: 'الفرنسية',
        english: 'الإنجليزية',
        orders: 'الطلبات',
        customers: 'العملاء',
        products: 'المنتجات',
        expenses: 'المصاريف',
        analytics: 'التحليلات',
        advisor: 'المستشار AI',
        settings: 'الإعدادات',
        logout: 'تسجيل الخروج',
        expenseTitle: 'المصاريف',
        expenseSubtitle: 'تابع تكاليف النشر والإعلانات والتوصيل والمصاريف الأخرى',
        addExpense: 'إضافة مصروف',
        totalExpenses: 'إجمالي المصاريف',
        loadingExpenses: 'جارٍ تحميل المصاريف...',
        noExpenses: 'لا توجد مصاريف بعد.',
        noExpensesHint: 'أضف تكاليف النشر أو الإعلانات أو التوصيل أو المصاريف التشغيلية الأخرى.',
        edit: 'تعديل',
        delete: 'حذف',
        other: 'أخرى',
        addExpenseTitle: 'إضافة مصروف',
        editExpenseTitle: 'تعديل المصروف',
        title: 'العنوان',
        titlePlaceholder: 'مثال: تكلفة نشر',
        category: 'الفئة',
        publication: 'النشر',
        ads: 'الإعلانات',
        logistics: 'التوصيل',
        tools: 'الأدوات',
        amount: 'المبلغ (DT)',
        date: 'التاريخ',
        notes: 'ملاحظات',
        optionalDetails: 'تفاصيل اختيارية',
        cancel: 'إلغاء',
        save: 'حفظ',
        saving: 'جارٍ الحفظ...',
        accountSettings: 'إعدادات الحساب',
        changePassword: 'تغيير كلمة المرور',
        secureAccount: 'حافظ على أمان حساب متجرك باستخدام كلمة مرور جديدة.',
        currentPassword: 'كلمة المرور الحالية',
        newPassword: 'كلمة المرور الجديدة',
        confirmPassword: 'تأكيد كلمة المرور الجديدة',
        currentPasswordPlaceholder: 'كلمة المرور الحالية',
        passwordPlaceholder: '6 أحرف على الأقل',
        repeatPasswordPlaceholder: 'أعد كتابة كلمة المرور الجديدة',
        passwordHint: 'اترك كلمة المرور الحالية فارغة إذا تم إنشاء الحساب بدون كلمة مرور.',
        updatingPassword: 'جارٍ تحديث كلمة المرور...',
        updatePassword: 'تحديث كلمة المرور',
        currentMonth: 'الشهر الحالي', analyticsTitle: 'التحليلات', performance: 'أداء', chooseAnalyticsMonth: 'اختيار شهر التحليل',
        goals: 'الأهداف', goalsReadOnly: 'أهداف هذا الشهر محفوظة للعرض فقط.', setGoals: 'حدد ما تريد تحقيقه هذا الشهر وتابع تقدمك.',
        saveGoals: 'حفظ الأهداف', loadingAnalytics: 'جارٍ تحميل التحليلات...', netProfitThisMonth: 'صافي الربح هذا الشهر', rejectionRate: 'نسبة الرفض',
        progressToGoals: 'التقدم نحو الأهداف', compareGoals: 'النتائج الحالية مقارنة بأهداف', askAdvisor: 'اسأل المساعد الذكي', remaining: 'المتبقي',
        explainAdvisor: 'شرح المساعد الذكي', ordersByProduct: 'الطلبات حسب المنتج', noProductData: 'لا توجد بيانات منتجات بعد.',
        productDataHint: 'بمجرد ظهور الطلبات، ستظهر هنا تفاصيل الأداء حسب المنتج.', rejected: 'المرفوضة', revenue: 'الإيراد', unknownProduct: 'منتج غير معروف',
        advisorTitle: 'المستشار AI', storeIntelligence: 'ذكاء المتجر', focusedChat: 'محادثة مركزة حول بيانات متجرك.', online: 'متصل', startNow: 'ابدأ الآن',
        improveQuestion: 'ما الذي تريد تحسينه؟', promptHint: 'اختر سؤالًا جاهزًا أو اكتب سؤالك الخاص لاكتشاف أفضل خطوة تالية.', storeAdvisor: 'مستشار المتجر',
        tailoredGuidance: 'إرشادات مخصصة لمتجرك', askAdvisorPlaceholder: 'اسأل عن متجرك...', sendQuestion: 'إرسال السؤال',
        importFile: 'استيراد ملف', newOrder: 'طلب جديد', noOrders: 'لا توجد طلبات حتى الآن.', orderHint: 'سيظهر الطلب الجديد من فيسبوك وإنستغرام هنا تلقائيًا.',
        customer: 'العميل', source: 'المصدر', status: 'الحالة', orderDate: 'التاريخ', update: 'تحديث', reject: 'رفض', moveTo: 'نقل إلى',
        deleteOrderQuestion: 'حذف الطلب؟', deleteOrderHint: 'هل أنت متأكد أنك تريد حذف هذا الطلب؟ لا يمكن التراجع عن هذا الإجراء.', deleteOrder: 'حذف الطلب',
        customerName: 'اسم العميل', phone: 'الهاتف', address: 'العنوان', product: 'المنتج', noProduct: 'لا يوجد', quantity: 'الكمية',
        createOrder: 'إنشاء الطلب', updateOrder: 'تحديث الطلب', loadingOrders: 'جارٍ تحميل الطلبات...',
        productsCount: 'منتج', addProduct: 'إضافة منتج', loadingProducts: 'جارٍ تحميل المنتجات...', noProducts: 'لا توجد منتجات بعد.',
        productsHint: 'أضف أول منتج لديك لبدء متابعة المخزون والطلبات.', noImage: 'لا توجد صورة', buying: 'شراء', selling: 'بيع', name: 'الاسم',
        description: 'الوصف', optional: 'اختياري', buyingPrice: 'سعر الشراء (DT)', sellingPrice: 'سعر البيع (DT)', stock: 'المخزون', imageUrl: 'رابط الصورة',
        addProductTitle: 'إضافة منتج', editProductTitle: 'تعديل المنتج', saveProduct: 'حفظ المنتج',
    },
    fr: {
        language: 'Langue', arabic: 'Arabe', french: 'Francais', english: 'Anglais',
        orders: 'Commandes', customers: 'Clients', products: 'Produits', expenses: 'Depenses',
        analytics: 'Analyses', advisor: 'Conseiller AI', settings: 'Parametres', logout: 'Se deconnecter',
        expenseTitle: 'Depenses', expenseSubtitle: 'Suivez les couts de publication, publicite, livraison et autres depenses',
        addExpense: 'Ajouter une depense', totalExpenses: 'Total des depenses', loadingExpenses: 'Chargement des depenses...',
        noExpenses: 'Aucune depense pour le moment.', noExpensesHint: 'Ajoutez les couts de publication, publicite, logistique ou autres frais.',
        edit: 'Modifier', delete: 'Supprimer', other: 'Autre', addExpenseTitle: 'Ajouter une depense', editExpenseTitle: 'Modifier la depense',
        title: 'Titre', titlePlaceholder: 'Ex. Cout de publication', category: 'Categorie', publication: 'Publication', ads: 'Publicite',
        logistics: 'Logistique', tools: 'Outils', amount: 'Montant (DT)', date: 'Date', notes: 'Notes', optionalDetails: 'Details facultatifs',
        cancel: 'Annuler', save: 'Enregistrer', saving: 'Enregistrement...', accountSettings: 'PARAMETRES DU COMPTE',
        changePassword: 'Changer votre mot de passe', secureAccount: 'Protegez votre compte marchand avec un nouveau mot de passe.',
        currentPassword: 'Mot de passe actuel', newPassword: 'Nouveau mot de passe', confirmPassword: 'Confirmer le nouveau mot de passe',
        currentPasswordPlaceholder: 'Votre mot de passe actuel', passwordPlaceholder: 'Au moins 6 caracteres', repeatPasswordPlaceholder: 'Repetez le nouveau mot de passe',
        passwordHint: 'Laissez le mot de passe actuel vide si le compte a ete cree sans mot de passe.', updatingPassword: 'Mise a jour...', updatePassword: 'Mettre a jour le mot de passe',
        currentMonth: 'Mois actuel', analyticsTitle: 'Analyses', performance: 'Performance', chooseAnalyticsMonth: 'Choisir le mois des analyses', goals: 'Objectifs',
        goalsReadOnly: 'Les objectifs de ce mois sont en lecture seule.', setGoals: 'Definissez vos objectifs pour ce mois et suivez vos progres.', saveGoals: 'Enregistrer les objectifs',
        loadingAnalytics: 'Chargement des analyses...', netProfitThisMonth: 'Benefice net ce mois', rejectionRate: 'Taux de refus', progressToGoals: 'Progression vers les objectifs',
        compareGoals: 'Resultats actuels compares aux objectifs de', askAdvisor: 'Demander au conseiller AI', remaining: 'restant', explainAdvisor: 'Explication du conseiller AI',
        ordersByProduct: 'Commandes par produit', noProductData: 'Pas encore de donnees produits.', productDataHint: 'Les performances par produit apparaitront des que les commandes seront disponibles.',
        rejected: 'Refusees', revenue: 'Chiffre d affaires', unknownProduct: 'Produit inconnu', advisorTitle: 'Conseiller AI', storeIntelligence: 'Intelligence du magasin',
        focusedChat: 'Une conversation centree sur les donnees de votre magasin.', online: 'En ligne', startNow: 'Commencer', improveQuestion: 'Que voulez-vous ameliorer?',
        promptHint: 'Choisissez une question ou ecrivez la votre pour trouver la meilleure prochaine action.', storeAdvisor: 'Conseiller du magasin', tailoredGuidance: 'Conseils personnalises pour votre magasin',
        askAdvisorPlaceholder: 'Posez une question sur votre magasin...', sendQuestion: 'Envoyer la question', importFile: 'Importer un fichier', newOrder: 'Nouvelle commande',
        noOrders: 'Aucune commande pour le moment.', orderHint: 'Les nouvelles commandes Facebook et Instagram apparaitront ici automatiquement.', customer: 'Client', source: 'Source', status: 'Statut', orderDate: 'Date',
        update: 'Modifier', reject: 'Refuser', moveTo: 'Passer a', deleteOrderQuestion: 'Supprimer la commande ?', deleteOrderHint: 'Voulez-vous vraiment supprimer cette commande ? Cette action est irreversible.', deleteOrder: 'Supprimer la commande',
        customerName: 'Nom du client', phone: 'Telephone', address: 'Adresse', product: 'Produit', noProduct: 'Aucun', quantity: 'Quantite', createOrder: 'Creer la commande', updateOrder: 'Modifier la commande', loadingOrders: 'Chargement des commandes...',
        productsCount: 'produit(s)', addProduct: 'Ajouter un produit', loadingProducts: 'Chargement des produits...', noProducts: 'Aucun produit pour le moment.', productsHint: 'Ajoutez votre premier produit pour suivre le stock et les commandes.', noImage: 'Pas d image', buying: 'Achat', selling: 'Vente', name: 'Nom', description: 'Description', optional: 'Facultatif', buyingPrice: 'Prix d achat (DT)', sellingPrice: 'Prix de vente (DT)', stock: 'Stock', imageUrl: 'Lien de l image', addProductTitle: 'Ajouter un produit', editProductTitle: 'Modifier le produit', saveProduct: 'Enregistrer le produit',
    },
    en: {
        language: 'Language', arabic: 'Arabic', french: 'French', english: 'English',
        orders: 'Orders', customers: 'Customers', products: 'Products', expenses: 'Expenses', analytics: 'Analytics',
        advisor: 'AI Advisor', settings: 'Settings', logout: 'Log out', expenseTitle: 'Expenses',
        expenseSubtitle: 'Track publication costs, ads, delivery fees, and other spending', addExpense: 'Add expense',
        totalExpenses: 'Total expenses', loadingExpenses: 'Loading expenses...', noExpenses: 'No expenses yet.',
        noExpensesHint: 'Add publication fees, ads, logistics, or other operating costs.', edit: 'Edit', delete: 'Delete', other: 'Other',
        addExpenseTitle: 'Add expense', editExpenseTitle: 'Edit expense', title: 'Title', titlePlaceholder: 'e.g. Publish cost', category: 'Category',
        publication: 'Publication', ads: 'Ads', logistics: 'Logistics', tools: 'Tools', amount: 'Amount (DT)', date: 'Date', notes: 'Notes',
        optionalDetails: 'Optional details', cancel: 'Cancel', save: 'Save', saving: 'Saving...', accountSettings: 'ACCOUNT SETTINGS',
        changePassword: 'Change your password', secureAccount: 'Keep your merchant account secure with a new password.', currentPassword: 'Current password',
        newPassword: 'New password', confirmPassword: 'Confirm new password', currentPasswordPlaceholder: 'Your current password',
        passwordPlaceholder: 'At least 6 characters', repeatPasswordPlaceholder: 'Repeat the new password',
        passwordHint: 'Leave current password blank only if this account was created without one.', updatingPassword: 'Updating password...', updatePassword: 'Update password',
        currentMonth: 'Current month', analyticsTitle: 'Analytics', performance: 'Performance', chooseAnalyticsMonth: 'Choose analytics month', goals: 'Goals', goalsReadOnly: 'This month’s goals are view-only.', setGoals: 'Set what you want to achieve this month and track your progress.', saveGoals: 'Save goals', loadingAnalytics: 'Loading analytics...', netProfitThisMonth: 'Net profit this month', rejectionRate: 'Rejection rate', progressToGoals: 'Progress toward goals', compareGoals: 'Current results compared with', askAdvisor: 'Ask AI advisor', remaining: 'remaining', explainAdvisor: 'AI advisor explanation', ordersByProduct: 'Orders by product', noProductData: 'No product data yet.', productDataHint: 'Product performance will appear here once orders are available.', rejected: 'Rejected', revenue: 'Revenue', unknownProduct: 'Unknown product', advisorTitle: 'AI Advisor', storeIntelligence: 'Store intelligence', focusedChat: 'A focused conversation about your store data.', online: 'Online', startNow: 'Start now', improveQuestion: 'What do you want to improve?', promptHint: 'Choose a prompt or write your own to find the best next step.', storeAdvisor: 'Store advisor', tailoredGuidance: 'Guidance tailored to your store', askAdvisorPlaceholder: 'Ask about your store...', sendQuestion: 'Send question', importFile: 'Import file', newOrder: 'New order', noOrders: 'No orders yet.', orderHint: 'New Facebook and Instagram orders will appear here automatically.', customer: 'Customer', source: 'Source', status: 'Status', orderDate: 'Date', update: 'Update', reject: 'Reject', moveTo: 'Move to', deleteOrderQuestion: 'Delete order?', deleteOrderHint: 'Are you sure you want to delete this order? This action cannot be undone.', deleteOrder: 'Delete order', customerName: 'Customer name', phone: 'Phone', address: 'Address', product: 'Product', noProduct: 'None', quantity: 'Quantity', createOrder: 'Create order', updateOrder: 'Update order', loadingOrders: 'Loading orders...', productsCount: 'product(s)', addProduct: 'Add product', loadingProducts: 'Loading products...', noProducts: 'No products yet.', productsHint: 'Add your first product to start tracking stock and orders.', noImage: 'No image', buying: 'Buy', selling: 'Sell', name: 'Name', description: 'Description', optional: 'Optional', buyingPrice: 'Buying price (DT)', sellingPrice: 'Selling price (DT)', stock: 'Stock', imageUrl: 'Image URL', addProductTitle: 'Add product', editProductTitle: 'Edit product', saveProduct: 'Save product',
    },
};

@Injectable({ providedIn: 'root' })
export class LanguageService {
    readonly language = signal<Language>((localStorage.getItem('language') as Language) || 'ar');

    constructor() {
        this.applyDirection(this.language());
    }

    setLanguage(language: Language): void {
        this.language.set(language);
        localStorage.setItem('language', language);
        this.applyDirection(language);
    }

    t(key: string): string {
        return translations[this.language()][key] || translations.en[key] || key;
    }

    private applyDirection(language: Language): void {
        document.documentElement.lang = language;
        document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    }
}