import {
  SchoolFeeItem,
  StudentFinancialSummary,
  PaymentTransaction,
  PaymentInstallment,
  StudentFeeAssignment
} from '../types';

export const INITIAL_FEE_ITEMS: SchoolFeeItem[] = [
  {
    id: 'fee-1',
    schoolId: 'school-1',
    academicYearId: 'ay-1404-1405',
    title: 'شهریه پایه و خدمات آموزشی مصوب آموزش و پرورش',
    category: 'tuition',
    amount: 14500000, // 14,500,000 Tomans
    isMandatory: true,
    targetScope: 'all',
    description: 'شامل ساعات رسمی برنامه درسی مصوب، کارگاه‌ها، آزمایشگاه‌ها و خدمات آموزشی مدرسه.',
    dueDate: '۱۴۰۴/۰۸/۳۰',
    defaultInstallmentsCount: 3,
    createdAt: '۱۴۰۴/۰۶/۱۵'
  },
  {
    id: 'fee-2',
    schoolId: 'school-1',
    academicYearId: 'ay-1404-1405',
    title: 'حق‌الثبت، بیمه حوادث دانش‌آموزی و کتب درسی',
    category: 'registration_insurance',
    amount: 950000, // 950,000 Tomans
    isMandatory: true,
    targetScope: 'all',
    description: 'بیمه حوادث و درمان دانش‌آموزی کل سال تحصیلی و دریافت پک کامل کتب درسی.',
    dueDate: '۱۴۰۴/۰۷/۱۵',
    defaultInstallmentsCount: 1,
    createdAt: '۱۴۰۴/۰۶/۱۰'
  },
  {
    id: 'fee-3',
    schoolId: 'school-1',
    academicYearId: 'ay-1404-1405',
    title: 'سرویس ایاب و ذهاب دانش‌آموزان (مسیر شهری ۱ و ۲)',
    category: 'transportation',
    amount: 6800000, // 6,800,000 Tomans
    isMandatory: false,
    targetScope: 'selective',
    description: 'سرویس رفت و برگشت روزانه با خودروهای تاییدشده سازمان تاکسیرانی و نظارت معاونت مدرسه.',
    dueDate: '۱۴۰۴/۰۷/۳۰',
    defaultInstallmentsCount: 2,
    createdAt: '۱۴۰۴/۰۶/۲۰'
  },
  {
    id: 'fee-4',
    schoolId: 'school-1',
    academicYearId: 'ay-1404-1405',
    title: 'کلاس‌های فوق‌برنامه، آزمون‌های آزمایشی و کارگاه المپیاد',
    category: 'extracurricular',
    amount: 3800000, // 3,800,000 Tomans
    isMandatory: false,
    targetScope: 'grade_10',
    description: 'کلاس‌های تکمیلی عصرگاهی پنجشنبه‌ها، تست‌زنی تخصصی و بانک آزمون‌های هماهنگ استانی.',
    dueDate: '۱۴۰۴/۰۸/۱۵',
    defaultInstallmentsCount: 2,
    createdAt: '۱۴۰۴/۰۶/۲۵'
  },
  {
    id: 'fee-5',
    schoolId: 'school-1',
    academicYearId: 'ay-1404-1405',
    title: 'لباس فرم هماهنگ و بسته کمک‌آموزشی آموزشگاه',
    category: 'uniform_supplies',
    amount: 1400000, // 1,400,000 Tomans
    isMandatory: true,
    targetScope: 'all',
    description: 'لباس فرم مصوب انجمن اولیا و مربیان به همراه کیف کار، دفترچه برنامه‌ریزی و تقویم تحصیلی.',
    dueDate: '۱۴۰۴/۰۷/۱۰',
    defaultInstallmentsCount: 1,
    createdAt: '۱۴۰۴/۰۶/۰۵'
  },
  {
    id: 'fee-6',
    schoolId: 'school-1',
    academicYearId: 'ay-1404-1405',
    title: 'اردوی دو روزه علمی، پژوهشی و زیارتی قطب',
    category: 'camp_event',
    amount: 1200000, // 1,200,000 Tomans
    isMandatory: false,
    targetScope: 'selective',
    description: 'اردوی بازدید از پارک علم و فناوری، رصدخانه و کارگاه‌های تخصصی دانشگاه رازی.',
    dueDate: '۱۴۰۴/۰۹/۱۵',
    defaultInstallmentsCount: 1,
    createdAt: '۱۴۰۴/۰۸/۰۱'
  }
];

export function createInitialStudentFinancialSummary(
  studentId: string,
  studentName: string,
  grade: string,
  variant: 'normal_partial' | 'fully_paid' | 'overdue_debtor' | 'scholarship'
): StudentFinancialSummary {
  if (variant === 'fully_paid') {
    const assigned: StudentFeeAssignment[] = [
      {
        id: `asg-${studentId}-1`,
        feeItemId: 'fee-1',
        feeTitle: 'شهریه پایه و خدمات آموزشی مصوب آموزش و پرورش',
        category: 'tuition',
        originalAmount: 14500000,
        discountAmount: 0,
        finalAmount: 14500000,
        paidAmount: 14500000,
        status: 'paid',
        dueDate: '۱۴۰۴/۰۸/۳۰'
      },
      {
        id: `asg-${studentId}-2`,
        feeItemId: 'fee-2',
        feeTitle: 'حق‌الثبت، بیمه حوادث دانش‌آموزی و کتب درسی',
        category: 'registration_insurance',
        originalAmount: 950000,
        discountAmount: 0,
        finalAmount: 950000,
        paidAmount: 950000,
        status: 'paid',
        dueDate: '۱۴۰۴/۰۷/۱۵'
      },
      {
        id: `asg-${studentId}-5`,
        feeItemId: 'fee-5',
        feeTitle: 'لباس فرم هماهنگ و بسته کمک‌آموزشی آموزشگاه',
        category: 'uniform_supplies',
        originalAmount: 1400000,
        discountAmount: 0,
        finalAmount: 1400000,
        paidAmount: 1400000,
        status: 'paid',
        dueDate: '۱۴۰۴/۰۷/۱۰'
      }
    ];

    const totalBilled = 16850000;
    const totalPaid = 16850000;

    const installments: PaymentInstallment[] = [
      {
        id: `inst-${studentId}-1`,
        title: 'قسط اول (هنگام ثبت‌نام)',
        amount: 8850000,
        dueDate: '۱۴۰۴/۰۷/۰۵',
        paidAmount: 8850000,
        status: 'paid',
        paidDate: '۱۴۰۴/۰۷/۰۲',
        trackingCode: '۴۰۹۲۸۱۷۲'
      },
      {
        id: `inst-${studentId}-2`,
        title: 'قسط دوم (آبان‌ماه)',
        amount: 8000000,
        dueDate: '۱۴۰۴/۰۸/۳۰',
        paidAmount: 8000000,
        status: 'paid',
        paidDate: '۱۴۰۴/۰۸/۲۵',
        trackingCode: '۵۸۲۹۱۰۴۴'
      }
    ];

    const transactions: PaymentTransaction[] = [
      {
        id: `txn-${studentId}-1`,
        studentId,
        studentName,
        schoolId: 'school-1',
        amount: 8850000,
        date: '۱۴۰۴/۰۷/۰۲',
        trackingCode: '۴۰۹۲۸۱۷۲',
        method: 'pos',
        feeTitle: 'شهریه ثبت‌نام و بیمه و کتب',
        recordedBy: 'معاون اجرایی',
        status: 'confirmed'
      },
      {
        id: `txn-${studentId}-2`,
        studentId,
        studentName,
        schoolId: 'school-1',
        amount: 8000000,
        date: '۱۴۰۴/۰۸/۲۵',
        trackingCode: '۵۸۲۹۱۰۴۴',
        method: 'online',
        feeTitle: 'تسویه نهایی شهریه سالانه',
        recordedBy: 'درگاه پرداخت بله/شاپرک',
        status: 'confirmed'
      }
    ];

    return {
      totalBilled,
      totalDiscount: 0,
      totalPaid,
      remainingDebt: 0,
      status: 'settled',
      assignedFees: assigned,
      installments,
      transactions
    };
  }

  if (variant === 'overdue_debtor') {
    const assigned: StudentFeeAssignment[] = [
      {
        id: `asg-${studentId}-1`,
        feeItemId: 'fee-1',
        feeTitle: 'شهریه پایه و خدمات آموزشی مصوب آموزش و پرورش',
        category: 'tuition',
        originalAmount: 14500000,
        discountAmount: 0,
        finalAmount: 14500000,
        paidAmount: 5000000,
        status: 'partial',
        dueDate: '۱۴۰۴/۰۸/۳۰'
      },
      {
        id: `asg-${studentId}-2`,
        feeItemId: 'fee-2',
        feeTitle: 'حق‌الثبت، بیمه حوادث دانش‌آموزی و کتب درسی',
        category: 'registration_insurance',
        originalAmount: 950000,
        discountAmount: 0,
        finalAmount: 950000,
        paidAmount: 950000,
        status: 'paid',
        dueDate: '۱۴۰۴/۰۷/۱۵'
      },
      {
        id: `asg-${studentId}-3`,
        feeItemId: 'fee-3',
        feeTitle: 'سرویس ایاب و ذهاب دانش‌آموزان (مسیر شهری ۱ و ۲)',
        category: 'transportation',
        originalAmount: 6800000,
        discountAmount: 0,
        finalAmount: 6800000,
        paidAmount: 0,
        status: 'unpaid',
        dueDate: '۱۴۰۴/۰۷/۳۰'
      },
      {
        id: `asg-${studentId}-5`,
        feeItemId: 'fee-5',
        feeTitle: 'لباس فرم هماهنگ و بسته کمک‌آموزشی آموزشگاه',
        category: 'uniform_supplies',
        originalAmount: 1400000,
        discountAmount: 0,
        finalAmount: 1400000,
        paidAmount: 1400000,
        status: 'paid',
        dueDate: '۱۴۰۴/۰۷/۱۰'
      }
    ];

    const totalBilled = 23650000;
    const totalPaid = 7350000;
    const remainingDebt = 16300000;

    const installments: PaymentInstallment[] = [
      {
        id: `inst-${studentId}-1`,
        title: 'قسط اول (هنگام ثبت‌نام)',
        amount: 7350000,
        dueDate: '۱۴۰۴/۰۷/۰۵',
        paidAmount: 7350000,
        status: 'paid',
        paidDate: '۱۴۰۴/۰۷/۰۸',
        trackingCode: '۲۹۴۸۱۹۰۵'
      },
      {
        id: `inst-${studentId}-2`,
        title: 'قسط دوم (سرویس و نیمی از شهریه)',
        amount: 8300000,
        dueDate: '۱۴۰۴/۰۸/۳۰',
        paidAmount: 0,
        status: 'overdue'
      },
      {
        id: `inst-${studentId}-3`,
        title: 'قسط سوم (تسویه پایان ترم)',
        amount: 8000000,
        dueDate: '۱۴۰۴/۱۱/۱۵',
        paidAmount: 0,
        status: 'pending'
      }
    ];

    const transactions: PaymentTransaction[] = [
      {
        id: `txn-${studentId}-1`,
        studentId,
        studentName,
        schoolId: 'school-1',
        amount: 7350000,
        date: '۱۴۰۴/۰۷/۰۸',
        trackingCode: '۲۹۴۸۱۹۰۵',
        method: 'pos',
        feeTitle: 'پرداخت قسط اول ثبت‌نام و کتب',
        recordedBy: 'معاون اجرایی',
        status: 'confirmed'
      }
    ];

    return {
      totalBilled,
      totalDiscount: 0,
      totalPaid,
      remainingDebt,
      status: 'overdue',
      assignedFees: assigned,
      installments,
      transactions
    };
  }

  if (variant === 'scholarship') {
    // Has cultural/excellence scholarship discount
    const discount = 2000000;
    const assigned: StudentFeeAssignment[] = [
      {
        id: `asg-${studentId}-1`,
        feeItemId: 'fee-1',
        feeTitle: 'شهریه پایه و خدمات آموزشی مصوب آموزش و پرورش',
        category: 'tuition',
        originalAmount: 14500000,
        discountAmount: discount,
        finalAmount: 12500000,
        paidAmount: 7000000,
        status: 'partial',
        dueDate: '۱۴۰۴/۰۸/۳۰'
      },
      {
        id: `asg-${studentId}-2`,
        feeItemId: 'fee-2',
        feeTitle: 'حق‌الثبت، بیمه حوادث دانش‌آموزی و کتب درسی',
        category: 'registration_insurance',
        originalAmount: 950000,
        discountAmount: 0,
        finalAmount: 950000,
        paidAmount: 950000,
        status: 'paid',
        dueDate: '۱۴۰۴/۰۷/۱۵'
      },
      {
        id: `asg-${studentId}-4`,
        feeItemId: 'fee-4',
        feeTitle: 'کلاس‌های فوق‌برنامه، آزمون‌های آزمایشی و کارگاه المپیاد',
        category: 'extracurricular',
        originalAmount: 3800000,
        discountAmount: 0,
        finalAmount: 3800000,
        paidAmount: 3800000,
        status: 'paid',
        dueDate: '۱۴۰۴/۰۸/۱۵'
      },
      {
        id: `asg-${studentId}-5`,
        feeItemId: 'fee-5',
        feeTitle: 'لباس فرم هماهنگ و بسته کمک‌آموزشی آموزشگاه',
        category: 'uniform_supplies',
        originalAmount: 1400000,
        discountAmount: 0,
        finalAmount: 1400000,
        paidAmount: 1400000,
        status: 'paid',
        dueDate: '۱۴۰۴/۰۷/۱۰'
      }
    ];

    const totalBilled = 18650000;
    const totalPaid = 13150000;
    const remainingDebt = 5500000;

    const installments: PaymentInstallment[] = [
      {
        id: `inst-${studentId}-1`,
        title: 'قسط اول (هنگام ثبت‌نام)',
        amount: 8150000,
        dueDate: '۱۴۰۴/۰۷/۰۵',
        paidAmount: 8150000,
        status: 'paid',
        paidDate: '۱۴۰۴/۰۷/۰۳',
        trackingCode: '۹۴۸۲۷۱۶۴'
      },
      {
        id: `inst-${studentId}-2`,
        title: 'قسط دوم (فوق‌برنامه و بخشی از شهریه)',
        amount: 5000000,
        dueDate: '۱۴۰۴/۰۹/۳۰',
        paidAmount: 5000000,
        status: 'paid',
        paidDate: '۱۴۰۴/۰۹/۱۵',
        trackingCode: '۷۱۸۲۹۴۰۳'
      },
      {
        id: `inst-${studentId}-3`,
        title: 'قسط سوم (تسویه نهایی)',
        amount: 5500000,
        dueDate: '۱۴۰۴/۱۱/۳۰',
        paidAmount: 0,
        status: 'pending'
      }
    ];

    const transactions: PaymentTransaction[] = [
      {
        id: `txn-${studentId}-1`,
        studentId,
        studentName,
        schoolId: 'school-1',
        amount: 8150000,
        date: '۱۴۰۴/۰۷/۰۳',
        trackingCode: '۹۴۸۲۷۱۶۴',
        method: 'pos',
        feeTitle: 'قسط اول ثبت‌نام و کتب و فرم',
        recordedBy: 'معاون اجرایی',
        status: 'confirmed'
      },
      {
        id: `txn-${studentId}-2`,
        studentId,
        studentName,
        schoolId: 'school-1',
        amount: 5000000,
        date: '۱۴۰۴/۰۹/۱۵',
        trackingCode: '۷۱۸۲۹۴۰۳',
        method: 'bank_receipt',
        methodDetails: {
          bankName: 'بانک ملی ایران',
          payerName: 'بهروز احمدی',
          accountTail: '۵۰۴۱'
        },
        feeTitle: 'قسط دوم و کلاس‌های فوق‌برنامه',
        recordedBy: 'مدیر آموزشگاه',
        status: 'confirmed'
      }
    ];

    return {
      totalBilled,
      totalDiscount: discount,
      totalPaid,
      remainingDebt,
      status: 'has_debt',
      assignedFees: assigned,
      installments,
      transactions
    };
  }

  // Default: normal partial (has upcoming debt)
  const assigned: StudentFeeAssignment[] = [
    {
      id: `asg-${studentId}-1`,
      feeItemId: 'fee-1',
      feeTitle: 'شهریه پایه و خدمات آموزشی مصوب آموزش و پرورش',
      category: 'tuition',
      originalAmount: 14500000,
      discountAmount: 0,
      finalAmount: 14500000,
      paidAmount: 8500000,
      status: 'partial',
      dueDate: '۱۴۰۴/۰۸/۳۰'
    },
    {
      id: `asg-${studentId}-2`,
      feeItemId: 'fee-2',
      feeTitle: 'حق‌الثبت، بیمه حوادث دانش‌آموزی و کتب درسی',
      category: 'registration_insurance',
      originalAmount: 950000,
      discountAmount: 0,
      finalAmount: 950000,
      paidAmount: 950000,
      status: 'paid',
      dueDate: '۱۴۰۴/۰۷/۱۵'
    },
    {
      id: `asg-${studentId}-5`,
      feeItemId: 'fee-5',
      feeTitle: 'لباس فرم هماهنگ و بسته کمک‌آموزشی آموزشگاه',
      category: 'uniform_supplies',
      originalAmount: 1400000,
      discountAmount: 0,
      finalAmount: 1400000,
      paidAmount: 1400000,
      status: 'paid',
      dueDate: '۱۴۰۴/۰۷/۱۰'
    }
  ];

  const totalBilled = 16850000;
  const totalPaid = 10850000;
  const remainingDebt = 6000000;

  const installments: PaymentInstallment[] = [
    {
      id: `inst-${studentId}-1`,
      title: 'قسط اول (هنگام ثبت‌نام)',
      amount: 10850000,
      dueDate: '۱۴۰۴/۰۷/۰۵',
      paidAmount: 10850000,
      status: 'paid',
      paidDate: '۱۴۰۴/۰۷/۰۴',
      trackingCode: '۸۲۹۱۰۴۸۵'
    },
    {
      id: `inst-${studentId}-2`,
      title: 'قسط دوم (تسویه زمستانه)',
      amount: 6000000,
      dueDate: '۱۴۰۴/۱۱/۱۵',
      paidAmount: 0,
      status: 'pending'
    }
  ];

  const transactions: PaymentTransaction[] = [
    {
      id: `txn-${studentId}-1`,
      studentId,
      studentName,
      schoolId: 'school-1',
      amount: 10850000,
      date: '۱۴۰۴/۰۷/۰۴',
      trackingCode: '۸۲۹۱۰۴۸۵',
      method: 'pos',
      feeTitle: 'پیش‌پرداخت شهریه، کتاب و لباس',
      recordedBy: 'معاون اجرایی',
      status: 'confirmed'
    }
  ];

  return {
    totalBilled,
    totalDiscount: 0,
    totalPaid,
    remainingDebt,
    status: 'has_debt',
    assignedFees: assigned,
    installments,
    transactions
  };
}
