import { getSettings } from "@/data/settingsStore";

type TranslationKey =
  | "dashboard" | "billing" | "medicine" | "opdSection" | "prescriptions" | "doctors"
  | "healthServices" | "injections" | "labTests" | "labReports" | "xray"
  | "ultrasound" | "sampleCollection" | "hrm" | "roles" | "dueManagement"
  | "expenses" | "bankTransactions" | "investments" | "settings"
  | "patient" | "doctor" | "date" | "status" | "actions" | "price"
  | "category" | "stock" | "search" | "save" | "cancel" | "delete"
  | "edit" | "view" | "print" | "add" | "total" | "name"
  | "newPrescription" | "editPrescription" | "medicines" | "tests"
  | "notes" | "patientCare" | "diagnostics" | "management" | "finance" | "system"
  | "overview" | "addMedicine" | "addInjection" | "selectPatient" | "selectDoctor"
  | "clearAll" | "selectAll" | "prescribedTests" | "clinicProfile"
  | "usersAccess" | "preferences" | "billingInvoice" | "printers" | "currencyLanguage"
  | "inStock" | "lowStock" | "outOfStock" | "code" | "route" | "strength"
  | "frequency" | "duration" | "dosage" | "injection" | "systemManage"
  | "refund" | "addService" | "healthPackages" | "inventoryList" | "labTechnologists" | "patientLookup"
  | "patientList" | "registerPatient";

const translations: Record<string, Record<TranslationKey, string>> = {
  English: {
    dashboard: "Dashboard", billing: "Billing", medicine: "Medicine", opdSection: "OPD Section",
    prescriptions: "Prescriptions", doctors: "Doctors", healthServices: "Health Services",
    injections: "Injections", labTests: "Lab Tests", labReports: "Lab Reports",
    xray: "X-Ray", ultrasound: "Ultrasound", sampleCollection: "Sample Collection",
    hrm: "HRM", roles: "Roles & Permissions", dueManagement: "Due Management",
    expenses: "Expenses", bankTransactions: "Bank Transactions", investments: "Investments",
    settings: "Settings", patient: "Patient", doctor: "Doctor", date: "Date",
    status: "Status", actions: "Actions", price: "Price", category: "Category",
    stock: "Stock", search: "Search", save: "Save", cancel: "Cancel", delete: "Delete",
    edit: "Edit", view: "View", print: "Print", add: "Add", total: "Total", name: "Name",
    newPrescription: "New Prescription", editPrescription: "Edit Prescription",
    medicines: "Medicines", tests: "Tests", notes: "Notes",
    patientCare: "Patient Care", diagnostics: "Diagnostics", management: "Management",
    finance: "Finance", system: "System", overview: "Overview",
    addMedicine: "Add Medicine", addInjection: "Add Injection",
    selectPatient: "Select patient", selectDoctor: "Select doctor",
    clearAll: "Clear All", selectAll: "Select All", prescribedTests: "Prescribed Tests",
    clinicProfile: "Clinic Profile", usersAccess: "Users & Access",
    preferences: "Preferences", billingInvoice: "Billing & Invoice",
    printers: "Printers", currencyLanguage: "Currency & Language",
    inStock: "In Stock", lowStock: "Low Stock", outOfStock: "Out of Stock",
    code: "Code", route: "Route", strength: "Strength",
    frequency: "Frequency", duration: "Duration", dosage: "Dosage", injection: "Injection",
    systemManage: "System Manage",
    refund: "Refund",
    addService: "Add Service",
    healthPackages: "Packages",
    inventoryList: "Inventory List",
    labTechnologists: "Lab Technologists",
    patientLookup: "Patient Lookup",
    patientList: "Patients",
    registerPatient: "Register",
  },
  Khmer: {
    dashboard: "ផ្ទាំងគ្រប់គ្រង", billing: "វិក្កយបត្រ", medicine: "ឱសថ", opdSection: "ផ្នែក OPD",
    prescriptions: "វេជ្ជបញ្ជា", doctors: "វេជ្ជបណ្ឌិត", healthServices: "សេវាសុខភាព",
    injections: "ថ្នាំចាក់", labTests: "តេស្តមន្ទីរពិសោធន៍", labReports: "របាយការណ៍មន្ទីរពិសោធន៍",
    xray: "កាំរស្មីអ៊ិច", ultrasound: "អ៊ុលត្រាសោន", sampleCollection: "ប្រមូលសំណាក",
    hrm: "គ្រប់គ្រងធនធានមនុស្ស", roles: "តួនាទី និងការអនុញ្ញាត", dueManagement: "គ្រប់គ្រងបំណុល",
    expenses: "ចំណាយ", bankTransactions: "ប្រតិបត្តិការធនាគារ", investments: "ការវិនិយោគ",
    settings: "ការកំណត់", patient: "អ្នកជំងឺ", doctor: "វេជ្ជបណ្ឌិត", date: "កាលបរិច្ឆេទ",
    status: "ស្ថានភាព", actions: "សកម្មភាព", price: "តម្លៃ", category: "ប្រភេទ",
    stock: "ស្តុក", search: "ស្វែងរក", save: "រក្សាទុក", cancel: "បោះបង់", delete: "លុប",
    edit: "កែប្រែ", view: "មើល", print: "បោះពុម្ព", add: "បន្ថែម", total: "សរុប", name: "ឈ្មោះ",
    newPrescription: "វេជ្ជបញ្ជាថ្មី", editPrescription: "កែវេជ្ជបញ្ជា",
    medicines: "ឱសថ", tests: "តេស្ត", notes: "កំណត់ចំណាំ",
    patientCare: "ថែទាំអ្នកជំងឺ", diagnostics: "រោគវិនិច្ឆ័យ", management: "គ្រប់គ្រង",
    finance: "ហិរញ្ញវត្ថុ", system: "ប្រព័ន្ធ", overview: "ទិដ្ឋភាពទូទៅ",
    addMedicine: "បន្ថែមឱសថ", addInjection: "បន្ថែមថ្នាំចាក់",
    selectPatient: "ជ្រើសអ្នកជំងឺ", selectDoctor: "ជ្រើសវេជ្ជបណ្ឌិត",
    clearAll: "សម្អាតទាំងអស់", selectAll: "ជ្រើសទាំងអស់", prescribedTests: "តេស្តដែលបានចេញ",
    clinicProfile: "ព័ត៌មានគ្លីនិក", usersAccess: "អ្នកប្រើប្រាស់",
    preferences: "ចំណូលចិត្ត", billingInvoice: "វិក្កយបត្រ",
    printers: "ម៉ាស៊ីនបោះពុម្ព", currencyLanguage: "រូបិយប័ណ្ណ និងភាសា",
    inStock: "មានក្នុងស្តុក", lowStock: "ស្តុកទាប", outOfStock: "អស់ពីស្តុក",
    code: "កូដ", route: "ផ្លូវ", strength: "កម្លាំង",
    frequency: "ប្រេកង់", duration: "រយៈពេល", dosage: "កម្រិត", injection: "ថ្នាំចាក់",
    systemManage: "គ្រប់គ្រងប្រព័ន្ធ",
    refund: "បង្វិលសង",
    addService: "បន្ថែមសេវា",
    healthPackages: "កញ្ចប់",
    inventoryList: "បញ្ជីស្តុក",
    labTechnologists: "បច្ចេកទេសមន្ទីរពិសោធន៍",
    patientLookup: "ស្វែងរកអ្នកជំងឺ",
  },
  Bengali: {
    dashboard: "ড্যাশবোর্ড", billing: "বিলিং", medicine: "ওষুধ", opdSection: "ওপিডি বিভাগ",
    prescriptions: "প্রেসক্রিপশন", doctors: "ডাক্তার", healthServices: "স্বাস্থ্য সেবা",
    injections: "ইনজেকশন", labTests: "ল্যাব পরীক্ষা", labReports: "ল্যাব রিপোর্ট",
    xray: "এক্স-রে", ultrasound: "আল্ট্রাসাউন্ড", sampleCollection: "নমুনা সংগ্রহ",
    hrm: "এইচআরএম", roles: "ভূমিকা ও অনুমতি", dueManagement: "বকেয়া ব্যবস্থাপনা",
    expenses: "খরচ", bankTransactions: "ব্যাংক লেনদেন", investments: "বিনিয়োগ",
    settings: "সেটিংস", patient: "রোগী", doctor: "ডাক্তার", date: "তারিখ",
    status: "অবস্থা", actions: "অ্যাকশন", price: "দাম", category: "বিভাগ",
    stock: "স্টক", search: "খুঁজুন", save: "সংরক্ষণ", cancel: "বাতিল", delete: "মুছুন",
    edit: "সম্পাদনা", view: "দেখুন", print: "প্রিন্ট", add: "যোগ করুন", total: "মোট", name: "নাম",
    newPrescription: "নতুন প্রেসক্রিপশন", editPrescription: "প্রেসক্রিপশন সম্পাদনা",
    medicines: "ওষুধ", tests: "পরীক্ষা", notes: "নোট",
    patientCare: "রোগী সেবা", diagnostics: "ডায়াগনস্টিকস", management: "ম্যানেজমেন্ট",
    finance: "আর্থিক", system: "সিস্টেম", overview: "সারসংক্ষেপ",
    addMedicine: "ওষুধ যোগ করুন", addInjection: "ইনজেকশন যোগ করুন",
    selectPatient: "রোগী নির্বাচন", selectDoctor: "ডাক্তার নির্বাচন",
    clearAll: "সব মুছুন", selectAll: "সব নির্বাচন", prescribedTests: "নির্ধারিত পরীক্ষা",
    clinicProfile: "ক্লিনিক প্রোফাইল", usersAccess: "ব্যবহারকারী",
    preferences: "পছন্দ", billingInvoice: "বিলিং ও ইনভয়েস",
    printers: "প্রিন্টার", currencyLanguage: "মুদ্রা ও ভাষা",
    inStock: "স্টকে আছে", lowStock: "কম স্টক", outOfStock: "স্টক শেষ",
    code: "কোড", route: "রুট", strength: "শক্তি",
    frequency: "ফ্রিকোয়েন্সি", duration: "সময়কাল", dosage: "ডোজ", injection: "ইনজেকশন",
    systemManage: "সিস্টেম ম্যানেজ",
    refund: "ফেরত",
    addService: "সেবা যোগ করুন",
    healthPackages: "প্যাকেজ",
    inventoryList: "ইনভেন্টরি তালিকা",
    labTechnologists: "ল্যাব টেকনোলজিস্ট",
    patientLookup: "রোগী খুঁজুন",
  },
};

export type { TranslationKey };

export const t = (key: TranslationKey, lang?: string): string => {
  const language = lang || getSettings().language;
  return translations[language]?.[key] || translations.English[key] || key;
};
