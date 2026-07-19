// @ts-nocheck
import { useState, useEffect } from 'react';
import React from 'react';
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';
import './App.css';
import { sendTangailReportToTelegram, sendPlazaWiseReport } from './utils/telegram';
import { db } from './firebase';
import {
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  writeBatch,
  query,
  orderBy,
} from 'firebase/firestore';

interface PlazaData {
  Rank_No: number;
  Plaza: string;
  Area: string;
  Division: string;
  Total_Marks: number;
  Achv_Pct: number;
  Profit_Achv: number;
  allColumns?: any[];
  // Total Sales
  Total_Target?: number;
  Total_Ach?: number;
  Total_Ach_Pct?: number;
  // Retail Sales
  Retail_Sales_Target?: number;
  Retail_Sales_Ach?: number;
  Retail_Sales_Ach_Pct?: number;
  Retail_Marks?: number;
  // Hire Sales
  Hire_Sales_Target?: number;
  Hire_Sales_Ach?: number;
  Hire_Sales_Ach_Pct?: number;
  Hire_Sales_Marks?: number;
  // Hire DP Collection
  Hire_DP_Target?: number;
  Hire_DP_Ach?: number;
  Hire_DP_Ach_Pct?: number;
  Hire_DP_Marks?: number;
  // Hire LPR Collection
  Hire_LPR_Target?: number;
  Hire_LPR_Ach?: number;
  Hire_LPR_Ach_Pct?: number;
  Hire_LPR_Marks?: number;
  // Hire Collection Account Cash
  Hire_Cash_Acc_Target?: number;
  Hire_Cash_Acc_Ach?: number;
  Hire_Cash_Acc_Ach_Pct?: number;
  Hire_Cash_Acc_Marks?: number;
  // Hire Collection Account Digital
  Hire_Digital_Acc_Target?: number;
  Hire_Digital_Acc_Ach?: number;
  Hire_Digital_Acc_Ach_Pct?: number;
  Hire_Digital_Acc_Marks?: number;
  // Dealer Sales
  Dealer_Sales_Target?: number;
  Dealer_Sales_Ach?: number;
  Dealer_Sales_Ach_Pct?: number;
  Dealer_Sales_Marks?: number;
  // Corporate Sales
  Corporate_Sales_Target?: number;
  Corporate_Sales_Ach?: number;
  Corporate_Sales_Ach_Pct?: number;
  Corporate_Sales_Marks?: number;
  // Dealer Collection
  Dealer_Collection_Target?: number;
  Dealer_Collection_Ach?: number;
  Dealer_Collection_Ach_Pct?: number;
  Dealer_Collection_Marks?: number;
  // Corporate Collection
  Corporate_Collection_Target?: number;
  Corporate_Collection_Ach?: number;
  Corporate_Collection_Ach_Pct?: number;
  Corporate_Collection_Marks?: number;
  // Sales Growth Cumulative
  Sales_Growth_Target?: number;
  Sales_Growth_Ach?: number;
  Sales_Growth_Status?: string;
  Sales_Growth_Marks?: number;
  // Net Profit
  Net_Profit_Target?: number;
  Net_Profit_Ach?: number;
  Net_Profit_Ach_Pct?: number;
  Net_Profit_Marks?: number;
  // Fridge Sales
  Fridge_Sales_Target?: number;
  Fridge_Sales_Ach?: number;
  Fridge_Sales_Ach_Pct?: number;
  Fridge_Sales_Marks?: number;
  // TV Sales
  TV_Sales_Target?: number;
  TV_Sales_Ach?: number;
  TV_Sales_Ach_Pct?: number;
  TV_Sales_Marks?: number;
  // AC Sales
  AC_Sales_Target?: number;
  AC_Sales_Ach?: number;
  AC_Sales_Ach_Pct?: number;
  AC_Sales_Marks?: number;
  // HAP Sales
  HAP_Sales_Target?: number;
  HAP_Sales_Ach?: number;
  HAP_Sales_Ach_Pct?: number;
  HAP_Sales_Marks?: number;
  // EAP Sales
  EAP_Sales_Target?: number;
  EAP_Sales_Ach?: number;
  EAP_Sales_Ach_Pct?: number;
  EAP_Sales_Marks?: number;
  // Mobile Sales
  Mobile_Sales_Target?: number;
  Mobile_Sales_Ach?: number;
  Mobile_Sales_Ach_Pct?: number;
  Mobile_Sales_Marks?: number;
  // IT Sales
  IT_Sales_Target?: number;
  IT_Sales_Ach?: number;
  IT_Sales_Ach_Pct?: number;
  IT_Sales_Marks?: number;
}

function App() {
  const [fullData, setFullData] = useState<PlazaData[]>([]);
  const [filteredData, setFilteredData] = useState<PlazaData[]>([]);
  const [divisionFilter, setDivisionFilter] = useState('');
  const [areaFilter, setAreaFilter] = useState('');
  // Unused from hidden dashboard section
  // const [plazaFilter, setPlazaFilter] = useState('');
  // const [selectedPlaza, setSelectedPlaza] = useState<PlazaData | null>(null);
  // const [headers, setHeaders] = useState<{ [key: number]: string }>({});
  // const [isDragging, setIsDragging] = useState(false);

  // ACH Growth Comparison states
  const [currentYearData, setCurrentYearData] = useState<PlazaData[]>([]);
  const [previousYearData, setPreviousYearData] = useState<PlazaData[]>([]);
  // @ts-ignore - Used in JSX for drag and drop styling
  const [isDraggingCurrent, setIsDraggingCurrent] = useState(false);
  const [isDraggingPrevious, setIsDraggingPrevious] = useState(false);
  const [comparisonDivisionFilter, setComparisonDivisionFilter] = useState('');
  const [comparisonAreaFilter, setComparisonAreaFilter] = useState('');
  const [comparisonPlazaFilter, setComparisonPlazaFilter] = useState('');
  const [isDegrowthSectionOpen, setIsDegrowthSectionOpen] = useState(false);
  const [isComparisonSectionOpen, setIsComparisonSectionOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'amount' | 'percent'>('amount');

  // Current Month Target states
  interface TargetRow {
    Division: string;
    Area: string;
    PlazaName: string;
    BaseTarget: number;
    Targets: number[];
  }
  const [monthlyTargetData, setMonthlyTargetData] = useState<TargetRow[]>([]);
  const [isDraggingTarget, setIsDraggingTarget] = useState(false);
  const [targetDivisionFilter, setTargetDivisionFilter] = useState('');
  const [targetAreaFilter, setTargetAreaFilter] = useState('');
  const [activeTargetSlab, setActiveTargetSlab] = useState<number>(-1);
  const [targetViewMode, setTargetViewMode] = useState<'division'|'area'|'plaza'>('plaza');
  const [targetLabels, setTargetLabels] = useState<string[]>(['Target-1 (350 Cr)','Target-2 (400 Cr)','Target-3 (440 Cr)','Target-4 (480 Cr)','Target-5 (520 Cr)','Target-6 (560 Cr)','Target-7 (600 Cr)']);
  const [showRemaining, setShowRemaining] = useState<Record<string, boolean>>({});
  // Sorting for target table
  const [targetSortColumn, setTargetSortColumn] = useState<string>('');
  const [targetSortDir, setTargetSortDir] = useState<'asc'|'desc'>('desc');

  // Yearly Target states
  interface YearlyTargetRow {
    Division: string;
    Area: string;
    PlazaName: string;
    SalesTarget: number;
    CollectionTarget: number;
    NetProfitTarget: number;
    ProfitTargetManager: number;
    ProfitTargetManagerPlus2: number;
    ProfitTargetAllEmployee: number;
  }
  const [yearlyTargetData, setYearlyTargetData] = useState<YearlyTargetRow[]>([]);
  const [isDraggingYearlyTarget, setIsDraggingYearlyTarget] = useState(false);
  const [yearlyTargetDivisionFilter, setYearlyTargetDivisionFilter] = useState('');
  const [yearlyTargetAreaFilter, setYearlyTargetAreaFilter] = useState('');
  const [yearlyTargetViewMode, setYearlyTargetViewMode] = useState<'division'|'area'|'plaza'>('plaza');
  const [yearlyTargetSortColumn, setYearlyTargetSortColumn] = useState<string>('');
  const [yearlyTargetSortDir, setYearlyTargetSortDir] = useState<'asc'|'desc'>('desc');
  const [yearlyTargetLabels, setYearlyTargetLabels] = useState<string[]>(['Sales Target', 'Collection Target', 'Net Profit Target', 'Profit Target For Manager', 'Profit Target For Manager+ 2 Best Employee', 'Profit Target for All Employee']);
  const [isYearlySectionOpen, setIsYearlySectionOpen] = useState(false);

  // Ranking Analysis states
  const [isRankingSectionOpen, setIsRankingSectionOpen] = useState(false);
  const [isDivision2Open, setIsDivision2Open] = useState(false);
  const [rankingViewMode, setRankingViewMode] = useState<'division'|'area'|'plaza'>('area');
  const [rankingDivisionFilter, setRankingDivisionFilter] = useState('');
  const [rankingAreaFilter, setRankingAreaFilter] = useState('');
  const [rankingPlazaFilter, setRankingPlazaFilter] = useState('');
  const [rankingSelectedCard, setRankingSelectedCard] = useState('Total');
  const [rankingSortColumn, setRankingSortColumn] = useState<string>('marks');
  const [rankingSortDir, setRankingSortDir] = useState<'asc'|'desc'>('desc');

  // Ranking category definitions
  const rankingCategories = [
    { key: 'Total', label: 'Total Sales', targetField: 'Total_Target', achField: 'Total_Ach', achPctField: 'Total_Ach_Pct', marksField: 'Total_Marks' },
    { key: 'Retail', label: 'Retail Sales', targetField: 'Retail_Sales_Target', achField: 'Retail_Sales_Ach', achPctField: 'Retail_Sales_Ach_Pct', marksField: 'Retail_Marks' },
    { key: 'HireSales', label: 'Hire Sales', targetField: 'Hire_Sales_Target', achField: 'Hire_Sales_Ach', achPctField: 'Hire_Sales_Ach_Pct', marksField: 'Hire_Sales_Marks' },
    { key: 'HireDP', label: 'Hire DP Collection', targetField: 'Hire_DP_Target', achField: 'Hire_DP_Ach', achPctField: 'Hire_DP_Ach_Pct', marksField: 'Hire_DP_Marks' },
    { key: 'HireLPR', label: 'Hire Installment/LPR', targetField: 'Hire_LPR_Target', achField: 'Hire_LPR_Ach', achPctField: 'Hire_LPR_Ach_Pct', marksField: 'Hire_LPR_Marks' },
    { key: 'HireCashAcc', label: 'Hire Cash Account', targetField: 'Hire_Cash_Acc_Target', achField: 'Hire_Cash_Acc_Ach', achPctField: 'Hire_Cash_Acc_Ach_Pct', marksField: 'Hire_Cash_Acc_Marks' },
    { key: 'HireDigitalAcc', label: 'Hire Digital Account', targetField: 'Hire_Digital_Acc_Target', achField: 'Hire_Digital_Acc_Ach', achPctField: 'Hire_Digital_Acc_Ach_Pct', marksField: 'Hire_Digital_Acc_Marks' },
    { key: 'DealerSales', label: 'Dealer Sales', targetField: 'Dealer_Sales_Target', achField: 'Dealer_Sales_Ach', achPctField: 'Dealer_Sales_Ach_Pct', marksField: 'Dealer_Sales_Marks' },
    { key: 'CorpSales', label: 'Corporate Sales', targetField: 'Corporate_Sales_Target', achField: 'Corporate_Sales_Ach', achPctField: 'Corporate_Sales_Ach_Pct', marksField: 'Corporate_Sales_Marks' },
    { key: 'DealerCol', label: 'Dealer Collection', targetField: 'Dealer_Collection_Target', achField: 'Dealer_Collection_Ach', achPctField: 'Dealer_Collection_Ach_Pct', marksField: 'Dealer_Collection_Marks' },
    { key: 'CorpCol', label: 'Corporate Collection', targetField: 'Corporate_Collection_Target', achField: 'Corporate_Collection_Ach', achPctField: 'Corporate_Collection_Ach_Pct', marksField: 'Corporate_Collection_Marks' },
    { key: 'SalesGrowth', label: 'Sales Growth', targetField: 'Sales_Growth_Target', achField: 'Sales_Growth_Ach', achPctField: null, marksField: 'Sales_Growth_Marks' },
    { key: 'NetProfit', label: 'Net Profit', targetField: 'Net_Profit_Target', achField: 'Net_Profit_Ach', achPctField: 'Net_Profit_Ach_Pct', marksField: 'Net_Profit_Marks' },
    { key: 'Fridge', label: 'Fridge Sales', targetField: 'Fridge_Sales_Target', achField: 'Fridge_Sales_Ach', achPctField: 'Fridge_Sales_Ach_Pct', marksField: 'Fridge_Sales_Marks' },
    { key: 'TV', label: 'TV Sales', targetField: 'TV_Sales_Target', achField: 'TV_Sales_Ach', achPctField: 'TV_Sales_Ach_Pct', marksField: 'TV_Sales_Marks' },
    { key: 'AC', label: 'AC Sales', targetField: 'AC_Sales_Target', achField: 'AC_Sales_Ach', achPctField: 'AC_Sales_Ach_Pct', marksField: 'AC_Sales_Marks' },
    { key: 'HAP', label: 'HAP Sales', targetField: 'HAP_Sales_Target', achField: 'HAP_Sales_Ach', achPctField: 'HAP_Sales_Ach_Pct', marksField: 'HAP_Sales_Marks' },
    { key: 'EAP', label: 'EAP Sales', targetField: 'EAP_Sales_Target', achField: 'EAP_Sales_Ach', achPctField: 'EAP_Sales_Ach_Pct', marksField: 'EAP_Sales_Marks' },
    { key: 'Mobile', label: 'Mobile Sales', targetField: 'Mobile_Sales_Target', achField: 'Mobile_Sales_Ach', achPctField: 'Mobile_Sales_Ach_Pct', marksField: 'Mobile_Sales_Marks' },
    { key: 'IT', label: 'IT Sales', targetField: 'IT_Sales_Target', achField: 'IT_Sales_Ach', achPctField: 'IT_Sales_Ach_Pct', marksField: 'IT_Sales_Marks' },
  ];

  // Password protection
  const CORRECT_PASSWORD = '4452';
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('ranking_app_auth') === 'verified';
  });
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === CORRECT_PASSWORD) {
      localStorage.setItem('ranking_app_auth', 'verified');
      setIsAuthenticated(true);
      setPasswordError('');
    } else {
      setPasswordError('Incorrect password. Please try again.');
      setPasswordInput('');
    }
  };

  // Firebase sync state
  const [isSavingTarget, setIsSavingTarget] = useState(false);
  const [isLoadingPrevious, setIsLoadingPrevious] = useState(false);
  const [savePreviousStatus, setSavePreviousStatus] = useState<'idle'|'saving'|'saved'|'error'>('idle');
  const [isLoadingCurrent, setIsLoadingCurrent] = useState(false);
  const [saveCurrentStatus, setSaveCurrentStatus] = useState<'idle'|'saving'|'saved'|'error'>('idle');
  const [currentUploadedAt, setCurrentUploadedAt] = useState('');
  const [previousUploadedAt, setPreviousUploadedAt] = useState('');
  const [targetUploadedAt, setTargetUploadedAt] = useState('');

  // Yearly target Firebase sync
  const [isSavingYearlyTarget, setIsSavingYearlyTarget] = useState(false);
  const [isLoadingYearlyTarget, setIsLoadingYearlyTarget] = useState(false);
  const [yearlySaveStatus, setYearlySaveStatus] = useState<'idle'|'saving'|'saved'|'error'>('idle');
  const [savedYearlyLabel, setSavedYearlyLabel] = useState('');
  const [yearlyTargetUploadedAt, setYearlyTargetUploadedAt] = useState('');

  // Yearly achievement data (separate upload)
  const [yearlyAchievementData, setYearlyAchievementData] = useState<PlazaData[]>([]);
  const [isDraggingYearlyAch, setIsDraggingYearlyAch] = useState(false);
  const [isLoadingYearlyAch, setIsLoadingYearlyAch] = useState(false);
  const [yearlyAchSaveStatus, setYearlyAchSaveStatus] = useState<'idle'|'saving'|'saved'|'error'>('idle');
  const [yearlyAchUploadedAt, setYearlyAchUploadedAt] = useState('');

  // Yearly Collection Ach File 1 (new custom format)
  interface YearlyCollRow1New {
    Plaza: string;
    HireCollectionAch: number;
    DealerCollectionAch: number;
    CorpCollectionAch: number;
  }
  const [yearlyCollAch1, setYearlyCollAch1] = useState<YearlyCollRow1New[]>([]);
  const [isDraggingCollAch1, setIsDraggingCollAch1] = useState(false);
  const [isLoadingCollAch1, setIsLoadingCollAch1] = useState(false);
  const [collAch1SaveStatus, setCollAch1SaveStatus] = useState<'idle'|'saving'|'saved'|'error'>('idle');
  const [collAch1UploadedAt, setCollAch1UploadedAt] = useState('');

  // Yearly Collection Ach File 2 (new format)
  interface YearlyCollRow2 {
    PlazaName: string;
    CashCollection: number;
    HireCollection: number;
    DealerCollection: number;
    CorpCollection: number;
    TotalCollection: number;
  }
  const [yearlyCollAch2, setYearlyCollAch2] = useState<YearlyCollRow2[]>([]);
  const [isDraggingCollAch2, setIsDraggingCollAch2] = useState(false);
  const [isLoadingCollAch2, setIsLoadingCollAch2] = useState(false);
  const [collAch2SaveStatus, setCollAch2SaveStatus] = useState<'idle'|'saving'|'saved'|'error'>('idle');
  const [collAch2UploadedAt, setCollAch2UploadedAt] = useState('');

  // Password protection state for target upload
  const [isTargetUploadUnlocked, setIsTargetUploadUnlocked] = useState(false);
  const [targetPasswordInput, setTargetPasswordInput] = useState('');
  const [showTargetUploadOptions, setShowTargetUploadOptions] = useState(false);
  
  // Password protection state for yearly target upload
  const [isYearlyTargetUploadUnlocked, setIsYearlyTargetUploadUnlocked] = useState(false);
  const [yearlyTargetPasswordInput, setYearlyTargetPasswordInput] = useState('');
  const [showYearlyTargetUploadOptions, setShowYearlyTargetUploadOptions] = useState(false);

  // Password protection state for previous year upload
  const [isPreviousUploadUnlocked, setIsPreviousUploadUnlocked] = useState(false);
  const [previousPasswordInput, setPreviousPasswordInput] = useState('');
  const [showPreviousUploadOptions, setShowPreviousUploadOptions] = useState(false);
  const [showPreviousYearSection, setShowPreviousYearSection] = useState(false);
  const [isLoadingTarget, setIsLoadingTarget] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle'|'saving'|'saved'|'error'>('idle');
  const [savedMonthLabel, setSavedMonthLabel] = useState('');

  // Load saved previous month data from Firestore on mount
  // Shared helper: parse a single Excel row into PlazaData using new column structure
  const parseExcelRow = (r: any[]): PlazaData => ({
    Rank_No: r[1],
    Division: r[2],
    Area: r[3],
    Plaza: r[4],
    Total_Marks: parseFloat(r[5]) || 0,
    allColumns: r,
    // Total Sales
    Total_Target: parseFloat((r[6] || '').toString().replace(/,/g, '')) || 0,
    Total_Ach: parseFloat((r[8] || '').toString().replace(/,/g, '')) || 0,
    Total_Ach_Pct: parseFloat(r[9]) || 0,
    Achv_Pct: parseFloat(r[9]) || 0,
    // Retail Sales
    Retail_Sales_Target: parseFloat((r[10] || '').toString().replace(/,/g, '')) || 0,
    Retail_Sales_Ach: parseFloat((r[11] || '').toString().replace(/,/g, '')) || 0,
    Retail_Sales_Ach_Pct: parseFloat(r[12]) || 0,
    Retail_Marks: parseFloat(r[13]) || 0,
    // Hire Sales
    Hire_Sales_Target: parseFloat((r[14] || '').toString().replace(/,/g, '')) || 0,
    Hire_Sales_Ach: parseFloat((r[15] || '').toString().replace(/,/g, '')) || 0,
    Hire_Sales_Ach_Pct: parseFloat(r[16]) || 0,
    Hire_Sales_Marks: parseFloat(r[17]) || 0,
    // Hire DP Collection
    Hire_DP_Target: parseFloat((r[18] || '').toString().replace(/,/g, '')) || 0,
    Hire_DP_Ach: parseFloat((r[19] || '').toString().replace(/,/g, '')) || 0,
    Hire_DP_Ach_Pct: parseFloat(r[20]) || 0,
    Hire_DP_Marks: parseFloat(r[21]) || 0,
    // Hire LPR Collection
    Hire_LPR_Target: parseFloat((r[22] || '').toString().replace(/,/g, '')) || 0,
    Hire_LPR_Ach: parseFloat((r[23] || '').toString().replace(/,/g, '')) || 0,
    Hire_LPR_Ach_Pct: parseFloat(r[24]) || 0,
    Hire_LPR_Marks: parseFloat(r[25]) || 0,
    // Hire Collection Account Cash
    Hire_Cash_Acc_Target: parseFloat((r[26] || '').toString().replace(/,/g, '')) || 0,
    Hire_Cash_Acc_Ach: parseFloat((r[27] || '').toString().replace(/,/g, '')) || 0,
    Hire_Cash_Acc_Ach_Pct: parseFloat(r[28]) || 0,
    Hire_Cash_Acc_Marks: parseFloat(r[29]) || 0,
    // Hire Collection Account Digital
    Hire_Digital_Acc_Target: parseFloat((r[30] || '').toString().replace(/,/g, '')) || 0,
    Hire_Digital_Acc_Ach: parseFloat((r[31] || '').toString().replace(/,/g, '')) || 0,
    Hire_Digital_Acc_Ach_Pct: parseFloat(r[32]) || 0,
    Hire_Digital_Acc_Marks: parseFloat(r[33]) || 0,
    // Dealer Sales
    Dealer_Sales_Target: parseFloat((r[34] || '').toString().replace(/,/g, '')) || 0,
    Dealer_Sales_Ach: parseFloat((r[35] || '').toString().replace(/,/g, '')) || 0,
    Dealer_Sales_Ach_Pct: parseFloat(r[36]) || 0,
    Dealer_Sales_Marks: parseFloat(r[37]) || 0,
    // Corporate Sales
    Corporate_Sales_Target: parseFloat((r[38] || '').toString().replace(/,/g, '')) || 0,
    Corporate_Sales_Ach: parseFloat((r[39] || '').toString().replace(/,/g, '')) || 0,
    Corporate_Sales_Ach_Pct: parseFloat(r[40]) || 0,
    Corporate_Sales_Marks: parseFloat(r[41]) || 0,
    // Dealer Collection
    Dealer_Collection_Target: parseFloat((r[42] || '').toString().replace(/,/g, '')) || 0,
    Dealer_Collection_Ach: parseFloat((r[43] || '').toString().replace(/,/g, '')) || 0,
    Dealer_Collection_Ach_Pct: parseFloat(r[44]) || 0,
    Dealer_Collection_Marks: parseFloat(r[45]) || 0,
    // Corporate Collection
    Corporate_Collection_Target: parseFloat((r[46] || '').toString().replace(/,/g, '')) || 0,
    Corporate_Collection_Ach: parseFloat((r[47] || '').toString().replace(/,/g, '')) || 0,
    Corporate_Collection_Ach_Pct: parseFloat(r[48]) || 0,
    Corporate_Collection_Marks: parseFloat(r[49]) || 0,
    // Sales Growth Cumulative
    Sales_Growth_Target: parseFloat((r[50] || '').toString().replace(/,/g, '')) || 0,
    Sales_Growth_Ach: parseFloat((r[51] || '').toString().replace(/,/g, '')) || 0,
    Sales_Growth_Status: (r[52] || '').toString().trim(),
    Sales_Growth_Marks: parseFloat(r[53]) || 0,
    // Net Profit
    Net_Profit_Target: parseFloat((r[54] || '').toString().replace(/,/g, '')) || 0,
    Net_Profit_Ach: parseFloat((r[55] || '').toString().replace(/,/g, '')) || 0,
    Net_Profit_Ach_Pct: parseFloat(r[56]) || 0,
    Net_Profit_Marks: parseFloat(r[57]) || 0,
    Profit_Achv: parseFloat((r[55] || '').toString().replace(/,/g, '')) || 0,
    // Fridge Sales
    Fridge_Sales_Target: parseFloat((r[58] || '').toString().replace(/,/g, '')) || 0,
    Fridge_Sales_Ach: parseFloat((r[59] || '').toString().replace(/,/g, '')) || 0,
    Fridge_Sales_Ach_Pct: parseFloat(r[60]) || 0,
    Fridge_Sales_Marks: parseFloat(r[61]) || 0,
    // TV Sales
    TV_Sales_Target: parseFloat((r[62] || '').toString().replace(/,/g, '')) || 0,
    TV_Sales_Ach: parseFloat((r[63] || '').toString().replace(/,/g, '')) || 0,
    TV_Sales_Ach_Pct: parseFloat(r[64]) || 0,
    TV_Sales_Marks: parseFloat(r[65]) || 0,
    // AC Sales
    AC_Sales_Target: parseFloat((r[66] || '').toString().replace(/,/g, '')) || 0,
    AC_Sales_Ach: parseFloat((r[67] || '').toString().replace(/,/g, '')) || 0,
    AC_Sales_Ach_Pct: parseFloat(r[68]) || 0,
    AC_Sales_Marks: parseFloat(r[69]) || 0,
    // HAP Sales
    HAP_Sales_Target: parseFloat((r[70] || '').toString().replace(/,/g, '')) || 0,
    HAP_Sales_Ach: parseFloat((r[71] || '').toString().replace(/,/g, '')) || 0,
    HAP_Sales_Ach_Pct: parseFloat(r[72]) || 0,
    HAP_Sales_Marks: parseFloat(r[73]) || 0,
    // EAP Sales
    EAP_Sales_Target: parseFloat((r[74] || '').toString().replace(/,/g, '')) || 0,
    EAP_Sales_Ach: parseFloat((r[75] || '').toString().replace(/,/g, '')) || 0,
    EAP_Sales_Ach_Pct: parseFloat(r[76]) || 0,
    EAP_Sales_Marks: parseFloat(r[77]) || 0,
    // Mobile Sales
    Mobile_Sales_Target: parseFloat((r[78] || '').toString().replace(/,/g, '')) || 0,
    Mobile_Sales_Ach: parseFloat((r[79] || '').toString().replace(/,/g, '')) || 0,
    Mobile_Sales_Ach_Pct: parseFloat(r[80]) || 0,
    Mobile_Sales_Marks: parseFloat(r[81]) || 0,
    // IT Sales
    IT_Sales_Target: parseFloat((r[82] || '').toString().replace(/,/g, '')) || 0,
    IT_Sales_Ach: parseFloat((r[84] || '').toString().replace(/,/g, '')) || 0,
    IT_Sales_Ach_Pct: parseFloat(r[86]) || 0,
    IT_Sales_Marks: parseFloat(r[87]) || 0,
  });

  // Old format parser (previous Excel column structure)
  const parseExcelRowOld = (r: any[]): PlazaData => ({
    Rank_No: r[1],
    Plaza: r[2],
    Area: r[3],
    Division: r[4],
    Total_Marks: parseFloat(r[5]) || 0,
    allColumns: r,
    // Total Sales
    Total_Target: parseFloat((r[6] || '').toString().replace(/,/g, '')) || 0,
    Total_Ach: parseFloat((r[8] || '').toString().replace(/,/g, '')) || 0,
    Total_Ach_Pct: parseFloat(r[9]) || 0,
    Achv_Pct: parseFloat(r[9]) || 0,
    // Retail Sales
    Retail_Sales_Target: parseFloat((r[10] || '').toString().replace(/,/g, '')) || 0,
    Retail_Sales_Ach: parseFloat((r[11] || '').toString().replace(/,/g, '')) || 0,
    Retail_Sales_Ach_Pct: parseFloat(r[12]) || 0,
    // Hire Sales
    Hire_Sales_Target: parseFloat((r[14] || '').toString().replace(/,/g, '')) || 0,
    Hire_Sales_Ach: parseFloat((r[15] || '').toString().replace(/,/g, '')) || 0,
    Hire_Sales_Ach_Pct: parseFloat(r[17]) || 0,
    // Hire DP Collection (old: Hire_DP_Col)
    Hire_DP_Target: parseFloat((r[20] || '').toString().replace(/,/g, '')) || 0,
    Hire_DP_Ach: parseFloat((r[21] || '').toString().replace(/,/g, '')) || 0,
    Hire_DP_Ach_Pct: parseFloat(r[22]) || 0,
    // Hire LPR Collection (old: Hire_LPR_Col)
    Hire_LPR_Target: parseFloat((r[24] || '').toString().replace(/,/g, '')) || 0,
    Hire_LPR_Ach: parseFloat((r[26] || '').toString().replace(/,/g, '')) || 0,
    Hire_LPR_Ach_Pct: parseFloat(r[29]) || 0,
    // Dealer Sales (old: Dealer_Corp_Sales - combined, map to Dealer_Sales)
    Dealer_Sales_Target: parseFloat((r[39] || '').toString().replace(/,/g, '')) || 0,
    Dealer_Sales_Ach: parseFloat((r[40] || '').toString().replace(/,/g, '')) || 0,
    Dealer_Sales_Ach_Pct: parseFloat(r[41]) || 0,
    // Dealer Collection (old: Dealer_Corp_Col - combined, map to Dealer_Collection)
    Dealer_Collection_Target: parseFloat((r[43] || '').toString().replace(/,/g, '')) || 0,
    Dealer_Collection_Ach: parseFloat((r[44] || '').toString().replace(/,/g, '')) || 0,
    Dealer_Collection_Ach_Pct: parseFloat(r[45]) || 0,
    // Net Profit (old: Profit)
    Net_Profit_Target: parseFloat((r[47] || '').toString().replace(/,/g, '')) || 0,
    Net_Profit_Ach: parseFloat((r[49] || '').toString().replace(/,/g, '')) || 0,
    Profit_Achv: parseFloat((r[49] || '').toString().replace(/,/g, '')) || 0,
  });

  // Detect Excel format: returns 'new' or 'old'
  // New format has "Division" in header rows at column index 2
  // Old format has "Plaza" in header rows at column index 2
  const detectExcelFormat = (raw: any[][]): 'new' | 'old' => {
    // Check first 8 rows (header area) for distinguishing keywords
    for (let rowIdx = 0; rowIdx < Math.min(8, raw.length); rowIdx++) {
      const row = raw[rowIdx];
      if (!row) continue;
      for (let colIdx = 0; colIdx < Math.min(10, row.length); colIdx++) {
        const cellVal = (row[colIdx] || '').toString().trim().toLowerCase();
        if (cellVal === 'division' && colIdx <= 4) {
          // In new format, Division is at col 2; in old format it's at col 4
          if (colIdx === 2) return 'new';
          if (colIdx === 4) return 'old';
        }
      }
    }
    // Fallback: check if column count is large (new format has 88+ columns)
    for (let rowIdx = 0; rowIdx < Math.min(8, raw.length); rowIdx++) {
      if (raw[rowIdx] && raw[rowIdx].length > 60) return 'new';
    }
    // Default to new format
    return 'new';
  };

  // Universal parse function: auto-detects format and parses accordingly
  const parseExcelRows = (raw: any[][]): PlazaData[] => {
    const format = detectExcelFormat(raw);
    const parser = format === 'new' ? parseExcelRow : parseExcelRowOld;
    console.log('Detected Excel format:', format);
    const rows = raw.slice(7);
    return rows.map(parser).filter(filterValidPlaza);
  };

  const filterValidPlaza = (d: PlazaData): boolean => {
    const plazaName = d.Plaza?.toString().trim();
    return plazaName &&
           plazaName !== '' &&
           plazaName !== '0' &&
           plazaName !== 'Plaza' &&
           plazaName !== 'undefined' &&
           plazaName !== 'null';
  };

  useEffect(() => {
    const loadSavedPrevious = async () => {
      setIsLoadingPrevious(true);
      try {
        const q = query(collection(db, 'previous_month_data'));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const rows = snapshot.docs.map(d => d.data() as PlazaData);
          setPreviousYearData(rows);
          try {
            const metaSnap = await getDocs(collection(db, 'previous_month_meta'));
            if (!metaSnap.empty) {
              setPreviousUploadedAt(metaSnap.docs[0].data().updatedAt || '');
            }
          } catch (_) {}
          console.log('Loaded', rows.length, 'previous rows from Firestore');
        }
      } catch (err) {
        console.error('Failed to load previous data from Firestore:', err);
      } finally {
        setIsLoadingPrevious(false);
      }
    };
    loadSavedPrevious();
  }, []);

  // Load saved current year data from Firestore on mount
  useEffect(() => {
    const loadSavedCurrent = async () => {
      setIsLoadingCurrent(true);
      try {
        const q = query(collection(db, 'current_month_data'));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const rows = snapshot.docs.map(d => d.data() as PlazaData);
          setCurrentYearData(rows);
          try {
            const metaSnap = await getDocs(collection(db, 'current_month_meta'));
            if (!metaSnap.empty) {
              setCurrentUploadedAt(metaSnap.docs[0].data().updatedAt || '');
            }
          } catch (_) {}
          console.log('Loaded', rows.length, 'current rows from Firestore');
        }
      } catch (err) {
        console.error('Failed to load current data from Firestore:', err);
      } finally {
        setIsLoadingCurrent(false);
      }
    };
    loadSavedCurrent();
  }, []);

  // Load saved target data from Firestore on mount
  useEffect(() => {
    const loadSavedTarget = async () => {
      setIsLoadingTarget(true);
      try {
        const q = query(collection(db, 'monthly_targets'), orderBy('Division'));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const rows = snapshot.docs.map(d => d.data() as TargetRow);
          setMonthlyTargetData(rows);
          // Try to get saved month label and timestamp from meta doc
          try {
            const metaSnap = await getDocs(collection(db, 'monthly_targets_meta'));
            if (!metaSnap.empty) {
              setSavedMonthLabel(metaSnap.docs[0].data().monthLabel || '');
              setTargetUploadedAt(metaSnap.docs[0].data().updatedAt || '');
            }
          } catch (_) {}
          console.log('Loaded', rows.length, 'rows from Firestore');
        }
      } catch (err) {
        console.error('Failed to load target from Firestore:', err);
      } finally {
        setIsLoadingTarget(false);
      }
    };
    loadSavedTarget();
  }, []);

  // Load saved yearly target data from Firestore on mount
  useEffect(() => {
    const loadSavedYearlyTarget = async () => {
      setIsLoadingYearlyTarget(true);
      try {
        const q = query(collection(db, 'yearly_targets'), orderBy('Division'));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const rows = snapshot.docs.map(d => d.data() as YearlyTargetRow);
          setYearlyTargetData(rows);
          try {
            const metaSnap = await getDocs(collection(db, 'yearly_targets_meta'));
            if (!metaSnap.empty) {
              setSavedYearlyLabel(metaSnap.docs[0].data().yearLabel || '');
              setYearlyTargetUploadedAt(metaSnap.docs[0].data().updatedAt || '');
            }
          } catch (_) {}
          console.log('Loaded', rows.length, 'yearly target rows from Firestore');
        }
      } catch (err) {
        console.error('Failed to load yearly target from Firestore:', err);
      } finally {
        setIsLoadingYearlyTarget(false);
      }
    };
    loadSavedYearlyTarget();
  }, []);

  // Load saved yearly achievement data from Firestore on mount
  useEffect(() => {
    const loadSavedYearlyAch = async () => {
      setIsLoadingYearlyAch(true);
      try {
        const q = query(collection(db, 'yearly_achievement_data'));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const rows = snapshot.docs.map(d => d.data() as PlazaData);
          setYearlyAchievementData(rows);
          try {
            const metaSnap = await getDocs(collection(db, 'yearly_achievement_meta'));
            if (!metaSnap.empty) {
              setYearlyAchUploadedAt(metaSnap.docs[0].data().updatedAt || '');
            }
          } catch (_) {}
          console.log('Loaded', rows.length, 'yearly ach rows from Firestore');
        }
      } catch (err) {
        console.error('Failed to load yearly ach from Firestore:', err);
      } finally {
        setIsLoadingYearlyAch(false);
      }
    };
    loadSavedYearlyAch();
  }, []);

  // Load saved yearly collection ach file 1 from Firestore
  useEffect(() => {
    const loadSavedCollAch1 = async () => {
      setIsLoadingCollAch1(true);
      try {
        const q = query(collection(db, 'yearly_coll_ach1_data'));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const rows = snapshot.docs.map(d => d.data() as YearlyCollRow1New);
          setYearlyCollAch1(rows);
          try {
            const metaSnap = await getDocs(collection(db, 'yearly_coll_ach1_meta'));
            if (!metaSnap.empty) {
              setCollAch1UploadedAt(metaSnap.docs[0].data().updatedAt || '');
            }
          } catch (_) {}
          console.log('Loaded', rows.length, 'coll ach1 rows from Firestore');
        }
      } catch (err) {
        console.error('Failed to load coll ach1 from Firestore:', err);
      } finally {
        setIsLoadingCollAch1(false);
      }
    };
    loadSavedCollAch1();
  }, []);

  // Load saved yearly collection ach file 2 from Firestore
  useEffect(() => {
    const loadSavedCollAch2 = async () => {
      setIsLoadingCollAch2(true);
      try {
        const q = query(collection(db, 'yearly_coll_ach2_data'));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const rows = snapshot.docs.map(d => d.data() as YearlyCollRow2);
          setYearlyCollAch2(rows);
          try {
            const metaSnap = await getDocs(collection(db, 'yearly_coll_ach2_meta'));
            if (!metaSnap.empty) {
              setCollAch2UploadedAt(metaSnap.docs[0].data().updatedAt || '');
            }
          } catch (_) {}
          console.log('Loaded', rows.length, 'coll ach2 rows from Firestore');
        }
      } catch (err) {
        console.error('Failed to load coll ach2 from Firestore:', err);
      } finally {
        setIsLoadingCollAch2(false);
      }
    };
    loadSavedCollAch2();
  }, []);

  // Auto-select Tangail area when yearly target data loads
  useEffect(() => {
    if (yearlyTargetData.length > 0 && !yearlyTargetAreaFilter) {
      const areas = [...new Set(yearlyTargetData.map(d => d.Area))];
      const tangail = areas.find(a => a?.toLowerCase().includes('tangail'));
      if (tangail) setYearlyTargetAreaFilter(tangail);
    }
  }, [yearlyTargetData]);

  // Auto-select Tangail area when target data loads (one-time default)
  useEffect(() => {
    if (monthlyTargetData.length > 0 && !targetAreaFilter) {
      const areas = [...new Set(monthlyTargetData.map(d => d.Area))];
      const tangail = areas.find(a => a?.toLowerCase().includes('tangail'));
      if (tangail) setTargetAreaFilter(tangail);
    }
  }, [monthlyTargetData]);

  // Helper function to format timestamp as DD-MM-YYYY (HH:MM AM/PM)
  const formatTimestamp = (timestamp: string) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${day}-${month}-${year} (${String(displayHours).padStart(2, '0')}:${minutes} ${ampm})`;
  };

  // Function to check and send Telegram report when both files are uploaded
  const checkAndSendTelegramReport = (currentData: PlazaData[], previousData: PlazaData[]) => {
    // Only send if both files are uploaded
    if (currentData.length > 0 && previousData.length > 0) {
      console.log('Both files uploaded. Checking for Tangail area data...');
      
      const tangailCurrent = currentData.filter(d => d.Area === 'Tangail Area');
      const tangailPrevious = previousData.filter(d => d.Area === 'Tangail Area');
      
      if (tangailCurrent.length > 0) {
        // Calculate Previous Year Sale (Total Achievement)
        const previousYearSale = tangailPrevious.reduce((sum, d) => sum + (d.Total_Ach || 0), 0);
        
        // Calculate Current Year Sale (Total Achievement)
        const currentYearSale = tangailCurrent.reduce((sum, d) => sum + (d.Total_Ach || 0), 0);
        
        // Calculate Growth/Degrowth %
        const growthDegrowthAmount = currentYearSale - previousYearSale;
        const growthDegrowthPercent = previousYearSale > 0 
          ? ((growthDegrowthAmount / previousYearSale) * 100).toFixed(2) + '%'
          : '0.00%';
        
        // Calculate Total Profit
        const totalProfit = tangailCurrent.reduce((sum, d) => sum + (d.Net_Profit_Ach || 0), 0);
        
        // Calculate Growth Plazas (plazas with increased achievement)
        const growthPlazas = tangailCurrent.filter(current => {
          const previous = tangailPrevious.find(p => p.Plaza === current.Plaza);
          if (!previous) return false;
          const currentAch = current.Total_Ach || 0;
          const previousAch = previous.Total_Ach || 0;
          return currentAch > previousAch;
        }).length;

        // Calculate Degrowth Plazas (plazas with decreased achievement)
        const degrowthPlazas = tangailCurrent.filter(current => {
          const previous = tangailPrevious.find(p => p.Plaza === current.Plaza);
          if (!previous) return false;
          const currentAch = current.Total_Ach || 0;
          const previousAch = previous.Total_Ach || 0;
          return currentAch < previousAch;
        }).length;

        // Calculate Profit Plazas (plazas with positive profit)
        const profitPlazas = tangailCurrent.filter(d => (d.Net_Profit_Ach || 0) > 0).length;
        
        // Calculate Loss Plazas (plazas with negative profit)
        const lossPlazas = tangailCurrent.filter(d => (d.Net_Profit_Ach || 0) < 0).length;
        
        console.log('Sending Tangail report to Telegram (silent mode)...');
        sendTangailReportToTelegram({
          totalPlazas: tangailCurrent.length,
          previousYearSale: previousYearSale,
          currentYearSale: currentYearSale,
          growthDegrowthPercent: growthDegrowthPercent,
          totalProfit: totalProfit,
          growthPlazas: growthPlazas,
          degrowthPlazas: degrowthPlazas,
          profitPlazas: profitPlazas,
          lossPlazas: lossPlazas,
          timestamp: new Date().toLocaleString(),
        });

        // Prepare plaza-wise details
        const plazaDetails = tangailCurrent.map(current => {
          const previous = tangailPrevious.find(p => p.Plaza === current.Plaza);
          const currentSale = current.Total_Ach || 0;
          const previousSale = previous ? (previous.Total_Ach || 0) : 0;
          const growthDegrowth = currentSale - previousSale;
          const growthDegrowthPercent = previousSale > 0 
            ? ((growthDegrowth / previousSale) * 100).toFixed(2) + '%'
            : '0.00%';
          const profit = current.Net_Profit_Ach || 0;

          return {
            plaza: current.Plaza,
            previousYearSale: previousSale,
            currentYearSale: currentSale,
            growthDegrowth: growthDegrowth,
            growthDegrowthPercent: growthDegrowthPercent,
            profit: profit,
            status: growthDegrowth > 0 ? 'growth' : growthDegrowth < 0 ? 'degrowth' : 'same',
            profitStatus: profit > 0 ? 'profit' : profit < 0 ? 'loss' : 'breakeven',
          };
        });

        // Send plaza-wise report
        console.log('Sending plaza-wise report to Telegram...');
        sendPlazaWiseReport(plazaDetails as any);
      } else {
        console.log('No Tangail Area data found in current year file');
      }
    }
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const raw: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      // Detect format and create header mapping
      const format = detectExcelFormat(raw);
      const headerMapping: { [key: number]: string } = format === 'new' ? {
        1: 'Rank No',
        2: 'Division',
        3: 'Area',
        4: 'Plaza',
        5: 'Total Marks',
        6: 'Total Sales Target',
        8: 'Total Sales Achv',
        9: 'Total Sales Achv %',
        10: 'Retail Sales Target',
        11: 'Retail Sales Achv',
        12: 'Retail Sales Achv %',
        13: 'Retail Marks (10)',
        14: 'Hire Sales Target',
        15: 'Hire Sales Achv',
        16: 'Hire Sales Achv %',
        17: 'Hire Sales Marks (12)',
        18: 'Hire DP Target',
        19: 'Hire DP Achv',
        20: 'Hire DP Achv %',
        21: 'Hire DP Marks',
        22: 'Hire LPR Target',
        23: 'Hire LPR Achv',
        24: 'Hire LPR Achv %',
        25: 'Hire LPR Marks',
        26: 'Hire Cash Acc Target',
        27: 'Hire Cash Acc Achv',
        28: 'Hire Cash Acc Achv %',
        29: 'Hire Cash Acc Marks',
        30: 'Hire Digital Acc Target',
        31: 'Hire Digital Acc Achv',
        32: 'Hire Digital Acc Achv %',
        33: 'Hire Digital Acc Marks',
        34: 'Dealer Sales Target',
        35: 'Dealer Sales Achv',
        36: 'Dealer Sales Achv %',
        37: 'Dealer Sales Marks (8)',
        38: 'Corporate Sales Target',
        39: 'Corporate Sales Achv',
        40: 'Corporate Sales Achv %',
        41: 'Corporate Sales Marks (7)',
        42: 'Dealer Collection Target',
        43: 'Dealer Collection Achv',
        44: 'Dealer Collection Achv %',
        45: 'Dealer Collection Marks (8)',
        46: 'Corporate Collection Target',
        47: 'Corporate Collection Achv',
        48: 'Corporate Collection Achv %',
        49: 'Corporate Collection Marks (7)',
        50: 'Sales Growth Target',
        51: 'Sales Growth Achv',
        52: 'Sales Growth Status',
        53: 'Sales Growth Marks (4)',
        54: 'Net Profit Target',
        55: 'Net Profit Achv',
        56: 'Net Profit Achv %',
        57: 'Net Profit Marks (22)',
        58: 'Fridge Sales Target',
        59: 'Fridge Sales Achv',
        60: 'Fridge Sales Achv %',
        61: 'Fridge Sales Marks (6)',
        62: 'TV Sales Target',
        63: 'TV Sales Achv',
        64: 'TV Sales Achv %',
        65: 'TV Sales Marks (3)',
        66: 'AC Sales Target',
        67: 'AC Sales Achv',
        68: 'AC Sales Achv %',
        69: 'AC Sales Marks (3)',
        70: 'HAP Sales Target',
        71: 'HAP Sales Achv',
        72: 'HAP Sales Achv %',
        73: 'HAP Sales Marks (3)',
        74: 'EAP Sales Target',
        75: 'EAP Sales Achv',
        76: 'EAP Sales Achv %',
        77: 'EAP Sales Marks (2)',
        78: 'Mobile Sales Target',
        79: 'Mobile Sales Achv',
        80: 'Mobile Sales Achv %',
        81: 'Mobile Sales Marks (3)',
        82: 'IT Sales Target',
        84: 'IT Sales Achv',
        86: 'IT Sales Achv %',
        87: 'IT Sales Marks (2)',
      } : {
        // Old format header mapping
        1: 'Rank No',
        2: 'Plaza',
        3: 'Area',
        4: 'Division',
        5: 'Total Marks',
        6: 'Total Tk',
        8: 'Achv Tk',
        9: 'Achv %',
        10: 'Retail Sales Tk',
        11: 'Retail Achv',
        12: 'Retail Achv %',
        14: 'Hire Sales Tk',
        15: 'Hire Achv',
        17: 'Hire Achv %',
        20: 'Hire DP Col Tk',
        21: 'DP Achv',
        22: 'DP Achv %',
        24: 'Hire LPR Col Tk',
        26: 'LPR Achv',
        29: 'LPR Achv %',
        39: 'Dealer Corp Sales Tk',
        40: 'Dealer Corp Sales Achv',
        41: 'Dealer Corp Sales Achv %',
        43: 'Dealer Corp Col Tk',
        44: 'Dealer Corp Col Achv',
        45: 'Dealer Corp Col Achv %',
        47: 'Profit Tk',
        49: 'Profit Achv',
      };
      
      if (typeof setHeaders === 'function') setHeaders(headerMapping);

      const parsedData: PlazaData[] = parseExcelRows(raw);

      setFullData(parsedData);
      setFilteredData(parsedData);
      // Also set as current year data for comparison
      setCurrentYearData(parsedData);
      
      // Automatically send Tangail area report to Telegram
      const tangailData = parsedData.filter(d => d.Area === 'Tangail Area');
      
      if (tangailData.length > 0) {
        const totalTarget = tangailData.reduce((sum, d) => sum + (d.Total_Target || 0), 0);
        const totalAch = tangailData.reduce((sum, d) => sum + (d.Total_Ach || 0), 0);
        const avgAchv = totalTarget > 0 ? ((totalAch / totalTarget) * 100).toFixed(2) : '0.00';
        const totalProfit = tangailData.reduce((sum, d) => sum + (d.Net_Profit_Ach || 0), 0);
        
        sendTangailReportToTelegram({
          totalPlazas: tangailData.length,
          avgAchievement: avgAchv,
          totalProfit: totalProfit,
          timestamp: new Date().toLocaleString(),
        });
      }
    };

    reader.readAsArrayBuffer(file);
  };

  // Unused from hidden dashboard section - keeping for potential future use
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
      processFile(file);
    }
  };

  const applyFilters = (division: string, area: string, plaza: string) => {
    const filtered = fullData.filter(
      (d) =>
        (!division || d.Division === division) &&
        (!area || d.Area === area) &&
        (!plaza || d.Plaza === plaza)
    );
    setFilteredData(filtered);
  };

  const handleDivisionChange = (value: string) => {
    setDivisionFilter(value);
    setAreaFilter('');
    setPlazaFilter('');
    applyFilters(value, '', '');
  };

  const handleAreaChange = (value: string) => {
    setAreaFilter(value);
    setPlazaFilter('');
    applyFilters(divisionFilter, value, '');
  };

  const handlePlazaChange = (value: string) => {
    setPlazaFilter(value);
    applyFilters(divisionFilter, areaFilter, value);
  };

  const divisions = [...new Set(fullData.map((d) => d.Division))];
  
  const areas = [...new Set(
    fullData
      .filter((d) => !divisionFilter || d.Division === divisionFilter)
      .map((d) => d.Area)
  )];
  
  const plazas = [...new Set(
    fullData
      .filter((d) => 
        (!divisionFilter || d.Division === divisionFilter) &&
        (!areaFilter || d.Area === areaFilter)
      )
      .map((d) => d.Plaza)
  )];

  const avgAchv = filteredData.length
    ? (() => {
        const totalTarget = filteredData.reduce((sum, d) => sum + (d.Total_Target || 0), 0);
        const totalAch = filteredData.reduce((sum, d) => sum + (d.Total_Ach || 0), 0);
        return totalTarget > 0 ? ((totalAch / totalTarget) * 100).toFixed(2) : '0.00';
      })()
    : '0.00';

  const totalProfit = filteredData.reduce((a, b) => a + b.Profit_Achv, 0);

  const downloadExcel = () => {
    // Prepare data for export
    const exportData = filteredData.map((d) => ({
      'Rank': d.Rank_No,
      'Plaza': d.Plaza,
      'Area': d.Area,
      'Division': d.Division,
      'Total Target (Tk.)': d.Total_Target || 0,
      'Total Ach': d.Total_Ach || 0,
      'Total Ach %': d.Total_Ach_Pct || 0,
      'Retail Sales Target (Tk.)': d.Retail_Sales_Target || 0,
      'Retail Sales Ach': d.Retail_Sales_Ach || 0,
      'Retail Sales Ach %': d.Retail_Sales_Ach_Pct || 0,
      'Hire Sales Target (Tk.)': d.Hire_Sales_Target || 0,
      'Hire Sales Ach': d.Hire_Sales_Ach || 0,
      'Hire Sales Ach %': d.Hire_Sales_Ach_Pct || 0,
      'Hire DP Collection Target (Tk.)': d.Hire_DP_Target || 0,
      'Hire DP Collection Ach': d.Hire_DP_Ach || 0,
      'Hire DP Collection Ach %': d.Hire_DP_Ach_Pct || 0,
      'Hire LPR Collection Target (Tk.)': d.Hire_LPR_Target || 0,
      'Hire LPR Collection Ach': d.Hire_LPR_Ach || 0,
      'Hire LPR Collection Ach %': d.Hire_LPR_Ach_Pct || 0,
      'Hire Cash Acc Target (Qty.)': d.Hire_Cash_Acc_Target || 0,
      'Hire Cash Acc Ach': d.Hire_Cash_Acc_Ach || 0,
      'Hire Cash Acc Ach %': d.Hire_Cash_Acc_Ach_Pct || 0,
      'Hire Digital Acc Target (Qty.)': d.Hire_Digital_Acc_Target || 0,
      'Hire Digital Acc Ach': d.Hire_Digital_Acc_Ach || 0,
      'Hire Digital Acc Ach %': d.Hire_Digital_Acc_Ach_Pct || 0,
      'Dealer Sales Target (Tk.)': d.Dealer_Sales_Target || 0,
      'Dealer Sales Ach': d.Dealer_Sales_Ach || 0,
      'Dealer Sales Ach %': d.Dealer_Sales_Ach_Pct || 0,
      'Corporate Sales Target (Tk.)': d.Corporate_Sales_Target || 0,
      'Corporate Sales Ach': d.Corporate_Sales_Ach || 0,
      'Corporate Sales Ach %': d.Corporate_Sales_Ach_Pct || 0,
      'Dealer Collection Target (Tk.)': d.Dealer_Collection_Target || 0,
      'Dealer Collection Ach': d.Dealer_Collection_Ach || 0,
      'Dealer Collection Ach %': d.Dealer_Collection_Ach_Pct || 0,
      'Corporate Collection Target (Tk.)': d.Corporate_Collection_Target || 0,
      'Corporate Collection Ach': d.Corporate_Collection_Ach || 0,
      'Corporate Collection Ach %': d.Corporate_Collection_Ach_Pct || 0,
      'Sales Growth Target': d.Sales_Growth_Target || 0,
      'Sales Growth Ach': d.Sales_Growth_Ach || 0,
      'Sales Growth Status': d.Sales_Growth_Status || '',
      'Net Profit Target (Tk.)': d.Net_Profit_Target || 0,
      'Net Profit Ach': d.Net_Profit_Ach || 0,
      'Net Profit Ach %': d.Net_Profit_Ach_Pct || 0,
      'Fridge Sales Target (Tk.)': d.Fridge_Sales_Target || 0,
      'Fridge Sales Ach': d.Fridge_Sales_Ach || 0,
      'Fridge Sales Ach %': d.Fridge_Sales_Ach_Pct || 0,
      'TV Sales Target (Tk.)': d.TV_Sales_Target || 0,
      'TV Sales Ach': d.TV_Sales_Ach || 0,
      'TV Sales Ach %': d.TV_Sales_Ach_Pct || 0,
      'AC Sales Target (Tk.)': d.AC_Sales_Target || 0,
      'AC Sales Ach': d.AC_Sales_Ach || 0,
      'AC Sales Ach %': d.AC_Sales_Ach_Pct || 0,
      'HAP Sales Target (Tk.)': d.HAP_Sales_Target || 0,
      'HAP Sales Ach': d.HAP_Sales_Ach || 0,
      'HAP Sales Ach %': d.HAP_Sales_Ach_Pct || 0,
      'EAP Sales Target (Tk.)': d.EAP_Sales_Target || 0,
      'EAP Sales Ach': d.EAP_Sales_Ach || 0,
      'EAP Sales Ach %': d.EAP_Sales_Ach_Pct || 0,
      'Mobile Sales Target (Tk.)': d.Mobile_Sales_Target || 0,
      'Mobile Sales Ach': d.Mobile_Sales_Ach || 0,
      'Mobile Sales Ach %': d.Mobile_Sales_Ach_Pct || 0,
      'IT Sales Target (Tk.)': d.IT_Sales_Target || 0,
      'IT Sales Ach': d.IT_Sales_Ach || 0,
      'IT Sales Ach %': d.IT_Sales_Ach_Pct || 0,
    }));

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(exportData);
    
    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'All Criteria Details');
    
    // Generate filename with current date
    const date = new Date().toISOString().split('T')[0];
    const filename = `Plaza_Performance_All_Criteria_${date}.xlsx`;
    
    // Download
    XLSX.writeFile(wb, filename);
  };

  // Download Division 2 Report
  const downloadDivision2Excel = () => {
    // Filter Division 2 data
    const division2Data = currentYearData.filter(d => d.Division === 'Division-02');
    
    if (division2Data.length === 0) {
      alert('No Division-02 data available. Please upload current year file first.');
      return;
    }

    // Get unique areas and sort
    const areas = [...new Set(division2Data.map(d => d.Area))].sort();
    
    // Prepare export data with area subtotals
    const exportData: any[] = [];
    
    areas.forEach(area => {
      const areaPlazas = division2Data.filter(d => d.Area === area).sort((a, b) => a.Plaza.localeCompare(b.Plaza));
      
      // Add plaza rows
      areaPlazas.forEach(plaza => {
        const targetRow = monthlyTargetData.find(t => t.PlazaName === plaza.Plaza);
        const baseTarget = targetRow?.BaseTarget || 0;
        const targets = targetRow?.Targets || [];
        const ach = plaza.Total_Ach || 0;
        const achPct = baseTarget > 0 ? ((ach / baseTarget) * 100).toFixed(2) : '0.00';
        
        const row: any = {
          'Area': area,
          'Plaza Name': plaza.Plaza,
          'Base Target': baseTarget,
          'Ach': ach,
          'Ach %': achPct + '%',
        };
        targets.forEach((t, i) => {
          const tAchPct = t > 0 ? ((ach / t) * 100).toFixed(2) : '0.00';
          row[`${targetLabels[i] || 'Target-' + (i+1)} Target`] = t;
          row[`${targetLabels[i] || 'Target-' + (i+1)} Ach %`] = tAchPct + '%';
        });
        row['Profit Ach'] = plaza.Net_Profit_Ach || 0;
        exportData.push(row);
      });
      
      // Add area subtotal
      const areaBaseTarget = areaPlazas.reduce((sum, p) => {
        return sum + (monthlyTargetData.find(t => t.PlazaName === p.Plaza)?.BaseTarget || 0);
      }, 0);
      const areaTargets = Array.from({ length: targetLabels.length }, (_, i) =>
        areaPlazas.reduce((sum, p) => sum + (monthlyTargetData.find(t => t.PlazaName === p.Plaza)?.Targets?.[i] || 0), 0));
      const areaAch = areaPlazas.reduce((sum, p) => sum + (p.Total_Ach || 0), 0);
      const areaAchPct = areaBaseTarget > 0 ? ((areaAch / areaBaseTarget) * 100).toFixed(2) : '0.00';
      const areaProfit = areaPlazas.reduce((sum, p) => sum + (p.Net_Profit_Ach || 0), 0);
      
      const subRow: any = {
        'Area': `${area} - SUBTOTAL`,
        'Plaza Name': '',
        'Base Target': areaBaseTarget,
        'Ach': areaAch,
        'Ach %': areaAchPct + '%',
      };
      areaTargets.forEach((t, i) => {
        const tAchPct = t > 0 ? ((areaAch / t) * 100).toFixed(2) : '0.00';
        subRow[`${targetLabels[i] || 'Target-' + (i+1)} Target`] = t;
        subRow[`${targetLabels[i] || 'Target-' + (i+1)} Ach %`] = tAchPct + '%';
      });
      subRow['Profit Ach'] = areaProfit;
      exportData.push(subRow);
      
      // Add empty row for spacing
      exportData.push({});
    });

    // Add Grand Total
    const grandTotalBaseTarget = division2Data.reduce((sum, p) => {
      return sum + (monthlyTargetData.find(t => t.PlazaName === p.Plaza)?.BaseTarget || 0);
    }, 0);
    const grandTotalTargets = Array.from({ length: targetLabels.length }, (_, i) =>
      division2Data.reduce((sum, p) => sum + (monthlyTargetData.find(t => t.PlazaName === p.Plaza)?.Targets?.[i] || 0), 0));
    const grandTotalAch = division2Data.reduce((sum, p) => sum + (p.Total_Ach || 0), 0);
    const grandTotalAchPct = grandTotalBaseTarget > 0 ? ((grandTotalAch / grandTotalBaseTarget) * 100).toFixed(2) : '0.00';
    const grandTotalProfit = division2Data.reduce((sum, p) => sum + (p.Net_Profit_Ach || 0), 0);

    const grandRow: any = {
      'Area': 'GRAND TOTAL',
      'Plaza Name': '',
      'Base Target': grandTotalBaseTarget,
      'Ach': grandTotalAch,
      'Ach %': grandTotalAchPct + '%',
    };
    grandTotalTargets.forEach((t, i) => {
      const tAchPct = t > 0 ? ((grandTotalAch / t) * 100).toFixed(2) : '0.00';
      grandRow[`${targetLabels[i] || 'Target-' + (i+1)} Target`] = t;
      grandRow[`${targetLabels[i] || 'Target-' + (i+1)} Ach %`] = tAchPct + '%';
    });
    grandRow['Profit Ach'] = grandTotalProfit;
    exportData.push(grandRow);

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(exportData);
    
    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Division 2 Report');
    
    // Generate filename with current date
    const date = new Date().toISOString().split('T')[0];
    const filename = `Division_2_Report_${date}.xlsx`;
    
    // Download
    XLSX.writeFile(wb, filename);
  };

  // Share Division 2 as Picture
  const shareDivision2AsPicture = async () => {
    const element = document.getElementById('division2-table-container');
    if (!element) {
      alert('Table not found. Please try again.');
      return;
    }

    try {
      // Show loading message
      const originalContent = element.innerHTML;
      
      // Capture the element as canvas with high quality
      const canvas = await html2canvas(element, {
        scale: 3, // Higher scale for better quality (3x resolution)
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight,
      });

      // Convert canvas to blob
      canvas.toBlob(async (blob) => {
        if (!blob) {
          alert('Failed to create image. Please try again.');
          return;
        }

        // Create download link
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const date = new Date().toISOString().split('T')[0];
        link.download = `Division-02_Report_${date}.png`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);

        // Try to share if Web Share API is available
        if (navigator.share && navigator.canShare) {
          try {
            const file = new File([blob], `Division-02_Report_${date}.png`, { type: 'image/png' });
            if (navigator.canShare({ files: [file] })) {
              await navigator.share({
                files: [file],
                title: 'Division-02 Report',
                text: 'Division-02 Performance Report',
              });
            }
          } catch (shareError) {
            console.log('Share cancelled or not supported:', shareError);
          }
        }
      }, 'image/png', 1.0);
    } catch (error) {
      console.error('Error capturing image:', error);
      alert('Failed to capture image. Please try again.');
    }
  };

  // ACH Growth Comparison file handlers
  const processComparisonFile = (file: File, setData: (data: PlazaData[]) => void) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const raw: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      const parsedData: PlazaData[] = parseExcelRows(raw);

      setData(parsedData);
    };
    reader.readAsArrayBuffer(file);
  };

  // @ts-ignore - Used in JSX file input onChange handler
  const handleCurrentYearUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    console.log('Current year file uploaded:', file.name);
    
    // Process file
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const raw: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      const parsedData: PlazaData[] = parseExcelRows(raw);

      console.log('Parsed current year data:', parsedData.length, 'plazas');
      setCurrentYearData(parsedData);
      saveCurrentToFirestore(parsedData);
      
      // Check if both files are uploaded and send Telegram report
      checkAndSendTelegramReport(parsedData, previousYearData);
    };
    reader.readAsArrayBuffer(file);
  };

  const handlePreviousYearUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    console.log('Previous year file uploaded:', file.name);
    
    // Process file
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const raw: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      const parsedData: PlazaData[] = parseExcelRows(raw);

      console.log('Parsed previous year data:', parsedData.length, 'plazas');
      setPreviousYearData(parsedData);
      savePreviousToFirestore(parsedData);
      
      // Check if both files are uploaded and send Telegram report
      checkAndSendTelegramReport(currentYearData, parsedData);
    };
    reader.readAsArrayBuffer(file);
  };

  // @ts-ignore - Used in JSX onDrop handler for drag and drop
  const handleCurrentYearDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingCurrent(false);
    const file = e.dataTransfer.files?.[0];
    if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
      console.log('Current year file dropped:', file.name);
      
      // Process file
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const raw: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        const parsedData: PlazaData[] = parseExcelRows(raw);

        console.log('Parsed current year data (dropped):', parsedData.length, 'plazas');
        setCurrentYearData(parsedData);
        saveCurrentToFirestore(parsedData);
        
        // Check if both files are uploaded and send Telegram report
        checkAndSendTelegramReport(parsedData, previousYearData);
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const handlePreviousYearDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingPrevious(false);
    const file = e.dataTransfer.files?.[0];
    if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
      console.log('Previous year file dropped:', file.name);
      
      // Process file and send Telegram notification
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const raw: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        const parsedData: PlazaData[] = parseExcelRows(raw);

        console.log('Parsed previous year data (dropped):', parsedData.length, 'plazas');
        setPreviousYearData(parsedData);
        savePreviousToFirestore(parsedData);
        
        // Check if both files are uploaded and send Telegram report
        checkAndSendTelegramReport(currentYearData, parsedData);
      };
      reader.readAsArrayBuffer(file);
    }
  };

  // Save parsed rows to Firestore (collection: monthly_targets)
  const saveTargetToFirestore = async (rows: TargetRow[], monthLabel: string) => {
    setIsSavingTarget(true);
    setSaveStatus('saving');
    try {
      // Delete existing docs first, then batch write new ones
      const existingSnap = await getDocs(collection(db, 'monthly_targets'));
      const deleteBatch = writeBatch(db);
      existingSnap.docs.forEach(d => deleteBatch.delete(d.ref));
      await deleteBatch.commit();

      // Write new docs in batches of 500 (Firestore limit)
      const BATCH_SIZE = 400;
      for (let i = 0; i < rows.length; i += BATCH_SIZE) {
        const batch = writeBatch(db);
        rows.slice(i, i + BATCH_SIZE).forEach((row, idx) => {
          const docId = `${row.PlazaName.replace(/[^a-zA-Z0-9]/g, '_')}_${i + idx}`;
          batch.set(doc(db, 'monthly_targets', docId), row);
        });
        await batch.commit();
      }

      const timestamp = new Date().toLocaleString();
      // Save month label meta
      await setDoc(doc(db, 'monthly_targets_meta', 'current'), {
        monthLabel,
        updatedAt: timestamp,
        rowCount: rows.length,
      });
      setTargetUploadedAt(timestamp);

      setSavedMonthLabel(monthLabel);
      setSaveStatus('saved');
      console.log('Saved', rows.length, 'rows to Firestore');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err) {
      console.error('Failed to save to Firestore:', err);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 5000);
    } finally {
      setIsSavingTarget(false);
    }
  };

  const saveYearlyAchToFirestore = async (rows: PlazaData[]) => {
    setYearlyAchSaveStatus('saving');
    try {
      const existingSnap = await getDocs(collection(db, 'yearly_achievement_data'));
      const deleteBatch = writeBatch(db);
      existingSnap.docs.forEach(d => deleteBatch.delete(d.ref));
      await deleteBatch.commit();

      const BATCH_SIZE = 400;
      const cleanRows = rows.map(r => {
        const { allColumns, ...rest } = r;
        return Object.fromEntries(Object.entries(rest).filter(([_, v]) => v !== undefined));
      });

      for (let i = 0; i < cleanRows.length; i += BATCH_SIZE) {
        const batch = writeBatch(db);
        cleanRows.slice(i, i + BATCH_SIZE).forEach((row, idx) => {
          const docId = `${(row.Plaza || 'Unknown').replace(/[^a-zA-Z0-9]/g, '_')}_${i + idx}`;
          batch.set(doc(db, 'yearly_achievement_data', docId), row);
        });
        await batch.commit();
      }

      const timestamp = new Date().toLocaleString();
      await setDoc(doc(db, 'yearly_achievement_meta', 'current'), {
        updatedAt: timestamp,
        rowCount: rows.length,
      });
      setYearlyAchUploadedAt(timestamp);
      setYearlyAchSaveStatus('saved');
      console.log('Saved', cleanRows.length, 'yearly ach rows to Firestore');
      setTimeout(() => setYearlyAchSaveStatus('idle'), 3000);
    } catch (err) {
      console.error('Failed to save yearly ach to Firestore:', err);
      setYearlyAchSaveStatus('error');
      setTimeout(() => setYearlyAchSaveStatus('idle'), 5000);
    }
  };

  const saveCollAch1ToFirestore = async (rows: YearlyCollRow1New[]) => {
    setCollAch1SaveStatus('saving');
    try {
      const existingSnap = await getDocs(collection(db, 'yearly_coll_ach1_data'));
      const deleteBatch = writeBatch(db);
      existingSnap.docs.forEach(d => deleteBatch.delete(d.ref));
      await deleteBatch.commit();

      const BATCH_SIZE = 400;
      for (let i = 0; i < rows.length; i += BATCH_SIZE) {
        const batch = writeBatch(db);
        rows.slice(i, i + BATCH_SIZE).forEach((row, idx) => {
          const docId = `${row.Plaza.replace(/[^a-zA-Z0-9]/g, '_')}_${i + idx}`;
          batch.set(doc(db, 'yearly_coll_ach1_data', docId), row);
        });
        await batch.commit();
      }

      const timestamp = new Date().toLocaleString();
      await setDoc(doc(db, 'yearly_coll_ach1_meta', 'current'), {
        updatedAt: timestamp,
        rowCount: rows.length,
      });
      setCollAch1UploadedAt(timestamp);
      setCollAch1SaveStatus('saved');
      console.log('Saved', rows.length, 'coll ach1 rows to Firestore');
      setTimeout(() => setCollAch1SaveStatus('idle'), 3000);
    } catch (err) {
      console.error('Failed to save coll ach1 to Firestore:', err);
      setCollAch1SaveStatus('error');
      setTimeout(() => setCollAch1SaveStatus('idle'), 5000);
    }
  };

  const saveCollAch2ToFirestore = async (rows: YearlyCollRow2[]) => {
    setCollAch2SaveStatus('saving');
    try {
      const existingSnap = await getDocs(collection(db, 'yearly_coll_ach2_data'));
      const deleteBatch = writeBatch(db);
      existingSnap.docs.forEach(d => deleteBatch.delete(d.ref));
      await deleteBatch.commit();

      const BATCH_SIZE = 400;
      for (let i = 0; i < rows.length; i += BATCH_SIZE) {
        const batch = writeBatch(db);
        rows.slice(i, i + BATCH_SIZE).forEach((row, idx) => {
          const docId = `${row.PlazaName.replace(/[^a-zA-Z0-9]/g, '_')}_${i + idx}`;
          batch.set(doc(db, 'yearly_coll_ach2_data', docId), row);
        });
        await batch.commit();
      }

      const timestamp = new Date().toLocaleString();
      await setDoc(doc(db, 'yearly_coll_ach2_meta', 'current'), {
        updatedAt: timestamp,
        rowCount: rows.length,
      });
      setCollAch2UploadedAt(timestamp);
      setCollAch2SaveStatus('saved');
      console.log('Saved', rows.length, 'coll ach2 rows to Firestore');
      setTimeout(() => setCollAch2SaveStatus('idle'), 3000);
    } catch (err) {
      console.error('Failed to save coll ach2 to Firestore:', err);
      setCollAch2SaveStatus('error');
      setTimeout(() => setCollAch2SaveStatus('idle'), 5000);
    }
  };

  const saveYearlyTargetToFirestore = async (rows: YearlyTargetRow[], yearLabel: string) => {
    setIsSavingYearlyTarget(true);
    setYearlySaveStatus('saving');
    try {
      const existingSnap = await getDocs(collection(db, 'yearly_targets'));
      const deleteBatch = writeBatch(db);
      existingSnap.docs.forEach(d => deleteBatch.delete(d.ref));
      await deleteBatch.commit();

      const BATCH_SIZE = 400;
      for (let i = 0; i < rows.length; i += BATCH_SIZE) {
        const batch = writeBatch(db);
        rows.slice(i, i + BATCH_SIZE).forEach((row, idx) => {
          const docId = `${row.PlazaName.replace(/[^a-zA-Z0-9]/g, '_')}_${i + idx}`;
          batch.set(doc(db, 'yearly_targets', docId), row);
        });
        await batch.commit();
      }

      const timestamp = new Date().toLocaleString();
      await setDoc(doc(db, 'yearly_targets_meta', 'current'), {
        yearLabel,
        updatedAt: timestamp,
        rowCount: rows.length,
      });
      setYearlyTargetUploadedAt(timestamp);
      setSavedYearlyLabel(yearLabel);
      setYearlySaveStatus('saved');
      console.log('Saved', rows.length, 'yearly target rows to Firestore');
      setTimeout(() => setYearlySaveStatus('idle'), 3000);
    } catch (err) {
      console.error('Failed to save yearly target to Firestore:', err);
      setYearlySaveStatus('error');
      setTimeout(() => setYearlySaveStatus('idle'), 5000);
    } finally {
      setIsSavingYearlyTarget(false);
    }
  };

  const saveCurrentToFirestore = async (rows: PlazaData[]) => {
    setSaveCurrentStatus('saving');
    try {
      const existingSnap = await getDocs(collection(db, 'current_month_data'));
      const deleteBatch = writeBatch(db);
      existingSnap.docs.forEach(d => deleteBatch.delete(d.ref));
      await deleteBatch.commit();

      const BATCH_SIZE = 400;
      const cleanRows = rows.map(r => {
        const { allColumns, ...rest } = r;
        // Remove undefined values for Firestore compatibility
        return Object.fromEntries(Object.entries(rest).filter(([_, v]) => v !== undefined));
      });

      for (let i = 0; i < cleanRows.length; i += BATCH_SIZE) {
        const batch = writeBatch(db);
        cleanRows.slice(i, i + BATCH_SIZE).forEach((row, idx) => {
          const docId = `${(row.Plaza || 'Unknown').replace(/[^a-zA-Z0-9]/g, '_')}_${i + idx}`;
          batch.set(doc(db, 'current_month_data', docId), row);
        });
        await batch.commit();
      }

      const timestamp = new Date().toLocaleString();
      await setDoc(doc(db, 'current_month_meta', 'current'), {
        updatedAt: timestamp,
        rowCount: rows.length,
      });
      setCurrentUploadedAt(timestamp);

      setSaveCurrentStatus('saved');
      console.log('Saved', cleanRows.length, 'current rows to Firestore');
      setTimeout(() => setSaveCurrentStatus('idle'), 3000);
    } catch (err) {
      console.error('Failed to save current data to Firestore:', err);
      setSaveCurrentStatus('error');
      setTimeout(() => setSaveCurrentStatus('idle'), 5000);
    }
  };

  const savePreviousToFirestore = async (rows: PlazaData[]) => {
    setSavePreviousStatus('saving');
    try {
      const existingSnap = await getDocs(collection(db, 'previous_month_data'));
      const deleteBatch = writeBatch(db);
      existingSnap.docs.forEach(d => deleteBatch.delete(d.ref));
      await deleteBatch.commit();

      const BATCH_SIZE = 400;
      const cleanRows = rows.map(r => {
        const { allColumns, ...rest } = r;
        return Object.fromEntries(Object.entries(rest).filter(([_, v]) => v !== undefined));
      });

      for (let i = 0; i < cleanRows.length; i += BATCH_SIZE) {
        const batch = writeBatch(db);
        cleanRows.slice(i, i + BATCH_SIZE).forEach((row, idx) => {
          const docId = `${(row.Plaza || 'Unknown').replace(/[^a-zA-Z0-9]/g, '_')}_${i + idx}`;
          batch.set(doc(db, 'previous_month_data', docId), row);
        });
        await batch.commit();
      }

      const timestamp = new Date().toLocaleString();
      await setDoc(doc(db, 'previous_month_meta', 'previous'), {
        updatedAt: timestamp,
        rowCount: rows.length,
      });
      setPreviousUploadedAt(timestamp);

      setSavePreviousStatus('saved');
      console.log('Saved', cleanRows.length, 'previous rows to Firestore');
      setTimeout(() => setSavePreviousStatus('idle'), 3000);
    } catch (err) {
      console.error('Failed to save previous data to Firestore:', err);
      setSavePreviousStatus('error');
      setTimeout(() => setSavePreviousStatus('idle'), 5000);
    }
  };

  const clearFirestorePrevious = async () => {
    if (!confirm('Are you sure you want to clear the saved previous month data from the database?')) return;
    try {
      const snap = await getDocs(collection(db, 'previous_month_data'));
      const batch = writeBatch(db);
      snap.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();
      setPreviousYearData([]);
      setSavePreviousStatus('idle');
      console.log('Cleared Firestore previous data');
    } catch (err) {
      console.error('Failed to clear Firestore previous data:', err);
    }
  };

  const clearFirestoreCurrent = async () => {
    if (!confirm('Are you sure you want to clear the saved current year data from the database?')) return;
    try {
      const snap = await getDocs(collection(db, 'current_month_data'));
      const batch = writeBatch(db);
      snap.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();
      
      const metaSnap = await getDocs(collection(db, 'current_month_meta'));
      const mb = writeBatch(db);
      metaSnap.docs.forEach(d => mb.delete(d.ref));
      await mb.commit();
      
      setCurrentYearData([]);
      setCurrentUploadedAt('');
      setSaveCurrentStatus('idle');
      console.log('Cleared Firestore current data');
    } catch (err) {
      console.error('Failed to clear Firestore current data:', err);
    }
  };

  const clearFirestoreYearlyAch = async () => {
    if (!confirm('Are you sure you want to clear the saved yearly achievement data from the database?')) return;
    try {
      const snap = await getDocs(collection(db, 'yearly_achievement_data'));
      const batch = writeBatch(db);
      snap.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();
      const metaSnap = await getDocs(collection(db, 'yearly_achievement_meta'));
      const mb = writeBatch(db);
      metaSnap.docs.forEach(d => mb.delete(d.ref));
      await mb.commit();
      setYearlyAchievementData([]);
      setYearlyAchSaveStatus('idle');
      setYearlyAchUploadedAt('');
      console.log('Cleared Firestore yearly ach data');
    } catch (err) {
      console.error('Failed to clear yearly ach Firestore:', err);
    }
  };

  // Clear saved yearly target data from Firestore
  const clearFirestoreCollAch1 = async () => {
    if (!confirm('Are you sure you want to clear the saved collection ach file 1 data from the database?')) return;
    try {
      const snap = await getDocs(collection(db, 'yearly_coll_ach1_data'));
      const batch = writeBatch(db);
      snap.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();
      const metaSnap = await getDocs(collection(db, 'yearly_coll_ach1_meta'));
      const mb = writeBatch(db);
      metaSnap.docs.forEach(d => mb.delete(d.ref));
      await mb.commit();
      setYearlyCollAch1([]);
      setCollAch1SaveStatus('idle');
      setCollAch1UploadedAt('');
      console.log('Cleared Firestore coll ach1 data');
    } catch (err) {
      console.error('Failed to clear coll ach1 Firestore:', err);
    }
  };

  const clearFirestoreCollAch2 = async () => {
    if (!confirm('Are you sure you want to clear the saved collection ach file 2 data from the database?')) return;
    try {
      const snap = await getDocs(collection(db, 'yearly_coll_ach2_data'));
      const batch = writeBatch(db);
      snap.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();
      const metaSnap = await getDocs(collection(db, 'yearly_coll_ach2_meta'));
      const mb = writeBatch(db);
      metaSnap.docs.forEach(d => mb.delete(d.ref));
      await mb.commit();
      setYearlyCollAch2([]);
      setCollAch2SaveStatus('idle');
      setCollAch2UploadedAt('');
      console.log('Cleared Firestore coll ach2 data');
    } catch (err) {
      console.error('Failed to clear coll ach2 Firestore:', err);
    }
  };

  const clearFirestoreYearlyTarget = async () => {
    if (!confirm('Are you sure you want to clear the saved yearly target data from the database?')) return;
    try {
      const snap = await getDocs(collection(db, 'yearly_targets'));
      const batch = writeBatch(db);
      snap.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();
      const metaSnap = await getDocs(collection(db, 'yearly_targets_meta'));
      const mb = writeBatch(db);
      metaSnap.docs.forEach(d => mb.delete(d.ref));
      await mb.commit();
      setYearlyTargetData([]);
      setSavedYearlyLabel('');
      setYearlySaveStatus('idle');
      console.log('Cleared Firestore yearly target data');
    } catch (err) {
      console.error('Failed to clear yearly Firestore:', err);
    }
  };

  // Clear saved target data from Firestore
  const clearFirestoreTarget = async () => {
    if (!confirm('Are you sure you want to clear the saved target data from the database?')) return;
    try {
      const snap = await getDocs(collection(db, 'monthly_targets'));
      const batch = writeBatch(db);
      snap.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();
      const metaSnap = await getDocs(collection(db, 'monthly_targets_meta'));
      const mb = writeBatch(db);
      metaSnap.docs.forEach(d => mb.delete(d.ref));
      await mb.commit();
      setMonthlyTargetData([]);
      setSavedMonthLabel('');
      setSaveStatus('idle');
      console.log('Cleared Firestore target data');
    } catch (err) {
      console.error('Failed to clear Firestore:', err);
    }
  };

  // Process the monthly target file (columns: Division, Area, Plaza Name, Base Target, Slab-1, Slab-2)
  const processTargetFile = (file: File, monthLabel?: string) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const raw: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      // Auto-detect header row: skip row 0 if col D is non-numeric (it's a header)
      const firstDataRow = raw[0] && isNaN(parseFloat((raw[0][3] || '').toString().replace(/,/g, ''))) ? 1 : 0;

      // Extract target labels from header row
      if (firstDataRow > 0 && raw[0]) {
        const headerRow = raw[0];
        const labels: string[] = [];
        for (let i = 4; i < headerRow.length; i++) {
          const h = (headerRow[i] || '').toString().trim();
          if (h) labels.push(h);
        }
        if (labels.length > 0) setTargetLabels(labels);
      }

      const rows = raw.slice(firstDataRow);
      const numTargets = targetLabels.length;

      const parsed = rows
        .map((r) => {
          const targets: number[] = [];
          for (let i = 0; i < numTargets; i++) {
            targets.push(parseFloat((r[4 + i] || '').toString().replace(/,/g, '')) || 0);
          }
          return {
            Division: (r[0] || '').toString().trim(),
            Area: (r[1] || '').toString().trim(),
            PlazaName: (r[2] || '').toString().trim(),
            BaseTarget: parseFloat((r[3] || '').toString().replace(/,/g, '')) || 0,
            Targets: targets,
          };
        })
        .filter((d) => {
          const name = d.PlazaName;
          return name && name !== '' && name !== '0' && name.toLowerCase() !== 'plaza name' && name.toLowerCase() !== 'plaza';
        });

      console.log('Target file parsed:', parsed.length, 'rows');
      setMonthlyTargetData(parsed);

      // Auto-derive month label from filename or use provided
      const label = monthLabel || file.name.replace(/\.(xlsx?)/i, '') || new Date().toLocaleDateString('en-BD', { month: 'long', year: 'numeric' });
      saveTargetToFirestore(parsed, label);
    };
    reader.readAsArrayBuffer(file);
  };

  // Process the yearly target file (columns: Division, Area, Plaza Name, Sales Target, Collection Target, Net Profit Target, Profit Target For Manager, Profit Target For Manager+ 2 Best Employee, Profit Target for All Employee)
  const processYearlyTargetFile = (file: File, yearLabel?: string) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const raw: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      // Auto-detect header row: skip row 0 if col C (Plaza Name) is non-numeric
      const firstDataRow = raw[0] && isNaN(parseFloat((raw[0][2] || '').toString().replace(/,/g, ''))) ? 1 : 0;

      // Extract target labels from header row
      if (firstDataRow > 0 && raw[0]) {
        const headerRow = raw[0];
        const labels: string[] = [];
        for (let i = 3; i < Math.min(9, headerRow.length); i++) {
          const h = (headerRow[i] || '').toString().trim();
          if (h) labels.push(h);
        }
        if (labels.length > 0) setYearlyTargetLabels(labels);
      }

      const rows = raw.slice(firstDataRow);

      const parsed = rows
        .map((r) => ({
          Division: (r[0] || '').toString().trim(),
          Area: (r[1] || '').toString().trim(),
          PlazaName: (r[2] || '').toString().trim(),
          SalesTarget: parseFloat((r[3] || '').toString().replace(/,/g, '')) || 0,
          CollectionTarget: parseFloat((r[4] || '').toString().replace(/,/g, '')) || 0,
          NetProfitTarget: parseFloat((r[5] || '').toString().replace(/,/g, '')) || 0,
          ProfitTargetManager: parseFloat((r[6] || '').toString().replace(/,/g, '')) || 0,
          ProfitTargetManagerPlus2: parseFloat((r[7] || '').toString().replace(/,/g, '')) || 0,
          ProfitTargetAllEmployee: parseFloat((r[8] || '').toString().replace(/,/g, '')) || 0,
        }))
        .filter((d) => {
          const name = d.PlazaName;
          return name && name !== '' && name !== '0' && name.toLowerCase() !== 'plaza name' && name.toLowerCase() !== 'plaza';
        });

      console.log('Yearly target file parsed:', parsed.length, 'rows');
      setYearlyTargetData(parsed);

      const label = yearLabel || file.name.replace(/\.(xlsx?)/i, '') || 'Yearly Target';
      saveYearlyTargetToFirestore(parsed, label);
    };
    reader.readAsArrayBuffer(file);
  };

  // Comparison filter handlers
  const handleComparisonDivisionChange = (value: string) => {
    setComparisonDivisionFilter(value);
    setComparisonAreaFilter('');
    setComparisonPlazaFilter('');
  };

  const handleComparisonAreaChange = (value: string) => {
    setComparisonAreaFilter(value);
    setComparisonPlazaFilter('');
  };

  const handleComparisonPlazaChange = (value: string) => {
    setComparisonPlazaFilter(value);
  };

  // Get unique values for comparison filters
  const comparisonDivisions = [...new Set(currentYearData.map((d) => d.Division))];
  
  const comparisonAreas = [...new Set(
    currentYearData
      .filter((d) => !comparisonDivisionFilter || d.Division === comparisonDivisionFilter)
      .map((d) => d.Area)
  )];
  
  const comparisonPlazas = [...new Set(
    currentYearData
      .filter((d) => 
        (!comparisonDivisionFilter || d.Division === comparisonDivisionFilter) &&
        (!comparisonAreaFilter || d.Area === comparisonAreaFilter)
      )
      .map((d) => d.Plaza)
  )];

  // Filter comparison data
  const filteredComparisonData = currentYearData.filter((d) =>
    (!comparisonDivisionFilter || d.Division === comparisonDivisionFilter) &&
    (!comparisonAreaFilter || d.Area === comparisonAreaFilter) &&
    (!comparisonPlazaFilter || d.Plaza === comparisonPlazaFilter)
  );

  // Password gate
  if (!isAuthenticated) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
      }}>
        <div style={{
          background: 'white',
          padding: '50px 40px',
          borderRadius: '16px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          width: '100%',
          maxWidth: '400px',
          textAlign: 'center'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '15px 25px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px'
          }}>
            <p style={{ 
              color: 'white', 
              margin: 0, 
              fontSize: '16px',
              fontWeight: '700',
              letterSpacing: '0.5px'
            }}>Powered By <span style={{ fontSize: '17px', fontWeight: '900' }}>BLCian</span></p>
          </div>
          <h1 style={{ margin: '0 0 8px 0', fontSize: '24px', color: '#333' }}>Ranking Analysis</h1>
          <p style={{ color: '#888', margin: '0 0 30px 0', fontSize: '14px' }}>Enter password to access the dashboard</p>
          <form onSubmit={handlePasswordSubmit}>
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => { setPasswordInput(e.target.value); setPasswordError(''); }}
              placeholder="Enter password"
              autoFocus
              style={{
                width: '100%',
                padding: '14px 16px',
                fontSize: '16px',
                border: passwordError ? '2px solid #dc3545' : '2px solid #e0e0e0',
                borderRadius: '10px',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s',
                marginBottom: passwordError ? '8px' : '0'
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = passwordError ? '#dc3545' : '#e0e0e0'}
            />
            {passwordError && (
              <p style={{ color: '#dc3545', fontSize: '13px', margin: '0 0 12px 0', textAlign: 'left' }}>{passwordError}</p>
            )}
            <button
              type="submit"
              style={{
                width: '100%',
                padding: '14px',
                fontSize: '16px',
                fontWeight: '600',
                color: 'white',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                marginTop: '12px',
                transition: 'opacity 0.2s'
              }}
              onMouseOver={(e) => (e.target as HTMLButtonElement).style.opacity = '0.9'}
              onMouseOut={(e) => (e.target as HTMLButtonElement).style.opacity = '1'}
            >
              Unlock Dashboard
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      {/* Watermark */}
      <div className="watermark" aria-hidden="true">
        {Array.from({ length: 32 }).map((_, i) => (
          <span key={i} className="watermark-item">Rezaul Karim - BLCian</span>
        ))}
      </div>

      {/* Top Credit */}
      <div className="credit-banner" style={{ 
        background: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)', 
        padding: '15px 20px', 
        marginBottom: '20px',
        borderRadius: '8px',
        textAlign: 'center',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
      }}>
        <p style={{ 
          color: 'white', 
          margin: 0, 
          fontSize: '18px',
          fontWeight: '700',
          letterSpacing: '0.5px'
        }}>
          Developed by <span style={{ fontWeight: '900', color: '#3498db', fontSize: '20px' }}>Md Rezaul Karim RCM</span>
        </p>
      </div>

      {/* Download Instruction Banner */}
      <div className="download-banner" style={{ 
        background: 'linear-gradient(135deg, #f39c12 0%, #e67e22 100%)', 
        padding: '20px 30px', 
        marginBottom: '20px',
        borderRadius: '12px',
        textAlign: 'center',
        boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
        border: '2px solid #d68910'
      }}>
        <p style={{ 
          color: 'white', 
          margin: '0 0 15px 0', 
          fontSize: '18px',
          fontWeight: '600',
          letterSpacing: '0.3px'
        }}>
          📥 Download Current Year and Previous Nine Criteria Report
        </p>
        <a 
          href="https://pos.waltonbd.com/pos/reports/trAchvPeriodWise25"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-block',
            padding: '12px 40px',
            background: 'white',
            color: '#e67e22',
            borderRadius: '8px',
            textDecoration: 'none',
            fontSize: '16px',
            fontWeight: '700',
            boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
            transition: 'all 0.3s ease',
            border: '2px solid white'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)';
            e.currentTarget.style.boxShadow = '0 6px 15px rgba(0,0,0,0.3)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 4px 10px rgba(0,0,0,0.2)';
          }}
        >
          🔗 Click Here to Download
        </a>
      </div>

      {/* Hide Performance Dashboard - Show only ACH Growth Comparison 
      <div style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
        padding: '30px 20px', 
        marginBottom: '30px',
        borderRadius: '12px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
      }}>
        <h1 style={{ 
          color: 'white', 
          margin: 0, 
          fontSize: '32px',
          textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
        }}>📊 Plaza Performance Dashboard</h1>
        <p style={{ 
          color: 'rgba(255,255,255,0.9)', 
          margin: '10px 0 0 0',
          fontSize: '16px'
        }}>Upload your Excel file to analyze plaza performance metrics</p>
      </div>

      <div 
        className="upload-box"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          border: isDragging ? '3px dashed #667eea' : '3px dashed #ddd',
          background: isDragging ? '#f0f4ff' : 'white',
          padding: '40px',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.3s ease'
        }}
      >
        <div style={{ marginBottom: '20px' }}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke={isDragging ? '#667eea' : '#999'} strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="17 8 12 3 7 8"></polyline>
            <line x1="12" y1="3" x2="12" y2="15"></line>
          </svg>
        </div>
        <p style={{ fontSize: '18px', color: '#333', marginBottom: '10px', fontWeight: '500' }}>
          {isDragging ? 'Drop your file here' : 'Drag & Drop your Excel file here'}
        </p>
        <p style={{ fontSize: '14px', color: '#666', marginBottom: '20px' }}>or</p>
        <label style={{
          display: 'inline-block',
          padding: '12px 30px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '16px',
          fontWeight: '500',
          transition: 'transform 0.2s ease',
        }}
        onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
        onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          Browse Files
          <input 
            type="file" 
            accept=".xls,.xlsx" 
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
        </label>
        <p style={{ fontSize: '12px', color: '#999', marginTop: '15px' }}>
          Supported formats: .xlsx, .xls
        </p>
          </div>
      End Hide Performance Dashboard */}

      {/* ACH Growth Comparison Section - Always Visible */}
      <div className="ach-section-container">
        <div className="ach-header">
          <h2>📈 ACH Growth Comparison</h2>
          <p>Upload current year and previous year files to compare achievement growth</p>
        </div>

        <div className="ach-content">
          {isLoadingPrevious && (
            <div className="loading-indicator">
              <span className="loading-spinner">⏳</span>
              Loading previous month data from database...
            </div>
          )}

          <div className={`upload-section ${!showPreviousYearSection ? 'single-column' : ''}`}>
            
            {/* Current Year Upload Card */}
            <div className="upload-card">
              <div className="upload-card-header">
                <h3 className="upload-card-title">Current Year File</h3>
                <button
                  className={`toggle-btn ${showPreviousYearSection ? 'hide' : 'show'}`}
                  onClick={() => setShowPreviousYearSection(!showPreviousYearSection)}
                >
                  {showPreviousYearSection ? '✕ Hide Previous Year' : '📂 Show Previous Year'}
                </button>
              </div>

              <div
                className={`dropzone ${isDraggingCurrent ? 'dragging' : ''} ${currentYearData.length > 0 ? 'loaded' : ''}`}
                onDragOver={(e) => { e.preventDefault(); setIsDraggingCurrent(true); }}
                onDragLeave={(e) => { e.preventDefault(); setIsDraggingCurrent(false); }}
                onDrop={handleCurrentYearDrop}
              >
                {currentYearData.length > 0 ? (
                  <div>
                    <div className="dropzone-icon">✅</div>
                    <p className="dropzone-title">File Loaded Successfully</p>
                    <p className="dropzone-subtitle">{currentYearData.length} plazas loaded</p>
                    
                    <div className="timestamp-badge">
                      <p>📅 Data Updated: {formatTimestamp(currentUploadedAt)}</p>
                    </div>

                    <div>
                      <span className={`sync-status-badge ${
                        saveCurrentStatus === 'saving' ? 'saving' :
                        saveCurrentStatus === 'saved' ? 'saved' :
                        saveCurrentStatus === 'error' ? 'error' : 'synced'
                      }`}>
                        {saveCurrentStatus === 'saving' && '☁️ Saving...'}
                        {saveCurrentStatus === 'saved' && '✅ Saved'}
                        {saveCurrentStatus === 'error' && '❌ Failed'}
                        {saveCurrentStatus === 'idle' && '☁️ Synced'}
                      </span>
                    </div>

                    <div className="action-buttons">
                      <label className="upload-btn">
                        Re-upload
                        <input type="file" accept=".xls,.xlsx" onChange={handleCurrentYearUpload} />
                      </label>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="dropzone-icon">📄</div>
                    <p className="dropzone-subtitle">
                      {isDraggingCurrent ? 'Drop file here' : 'Drag & drop or click to browse'}
                    </p>
                    <label className="upload-btn">
                      Browse Files
                      <input type="file" accept=".xls,.xlsx" onChange={handleCurrentYearUpload} />
                    </label>
                    <p className="file-info">Supported formats: .xlsx, .xls</p>
                  </>
                )}
              </div>
            </div>

            {/* Previous Year Upload Card */}
            {showPreviousYearSection && (
              <div className="upload-card">
                <div className="upload-card-header">
                  <h3 className="upload-card-title">Previous Year File</h3>
                  <button 
                    className="manage-link"
                    onClick={() => setShowPreviousUploadOptions(!showPreviousUploadOptions)}
                  >
                    {showPreviousUploadOptions ? 'Hide Options' : 'Manage Upload 🔒'}
                  </button>
                </div>

                {!showPreviousUploadOptions && (
                  <div className={`locked-state ${previousYearData.length > 0 ? 'loaded' : 'no-data'}`}>
                    {previousYearData.length > 0 ? (
                      <>
                        <div className="dropzone-icon">✅</div>
                        <p className="dropzone-title">File Loaded</p>
                        <p className="dropzone-subtitle">{previousYearData.length} plazas loaded</p>
                        <span className="sync-status-badge synced">☁️ Synced with Firebase</span>
                      </>
                    ) : (
                      <>
                        <div className="dropzone-icon">⚠️</div>
                        <p className="dropzone-title" style={{ color: '#856404' }}>No Previous Data</p>
                        <p className="dropzone-subtitle">Unlock to upload data.</p>
                      </>
                    )}
                  </div>
                )}

                {showPreviousUploadOptions && (
                  !isPreviousUploadUnlocked ? (
                    <div className="locked-state">
                      <h4 style={{ marginBottom: '12px', color: '#333', fontSize: '15px', fontWeight: '600' }}>🔒 Password Required</h4>
                      <p className="dropzone-subtitle">Enter password to upload previous month data.</p>
                      <div className="password-form">
                        <input
                          type="password"
                          placeholder="Password..."
                          value={previousPasswordInput}
                          onChange={(e) => setPreviousPasswordInput(e.target.value)}
                          style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc', outline: 'none', width: '100%', maxWidth: '200px' }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              if (previousPasswordInput === '123456') {
                                setIsPreviousUploadUnlocked(true);
                                setPreviousPasswordInput('');
                              } else {
                                alert('Incorrect password!');
                              }
                            }
                          }}
                        />
                        <button
                          onClick={() => {
                            if (previousPasswordInput === '123456') {
                              setIsPreviousUploadUnlocked(true);
                              setPreviousPasswordInput('');
                            } else {
                              alert('Incorrect password!');
                            }
                          }}
                          style={{ padding: '8px 16px', background: '#667eea', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', width: '100%', maxWidth: '200px' }}
                        >
                          Unlock
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onDragOver={(e) => { e.preventDefault(); setIsDraggingPrevious(true); }}
                      onDragLeave={(e) => { e.preventDefault(); setIsDraggingPrevious(false); }}
                      onDrop={handlePreviousYearDrop}
                      style={{
                        border: isDraggingPrevious ? '2px dashed #667eea' : '2px dashed #ddd',
                        background: isDraggingPrevious ? '#f0f4ff' : previousYearData.length > 0 ? '#e8f5e9' : '#f9f9f9',
                        padding: '20px',
                        textAlign: 'center',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      {previousYearData.length > 0 ? (
                        <div>
                          <div style={{ fontSize: '32px', marginBottom: '8px' }}>✅</div>
                          <p style={{ color: '#28a745', fontWeight: 'bold', marginBottom: '4px', fontSize: '14px' }}>
                            File Loaded Successfully
                          </p>
                          <p style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>
                            {previousYearData.length} plazas loaded
                          </p>
                          
                          {/* Big Bold Timestamp */}
                          <div style={{ 
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            padding: '12px 20px',
                            borderRadius: '8px',
                            marginBottom: '10px'
                          }}>
                            <p style={{ 
                              fontSize: '16px', 
                              color: 'white', 
                              fontWeight: 'bold',
                              margin: 0,
                              letterSpacing: '0.5px'
                            }}>
                              📅 Data Updated: {formatTimestamp(previousUploadedAt)}
                            </p>
                          </div>
                          
                          <div style={{ marginBottom: '8px' }}>
                            {savePreviousStatus === 'saving' && (
                              <span style={{ display: 'inline-block', padding: '3px 10px', background: '#fff3cd', color: '#856404', borderRadius: '15px', fontSize: '11px', fontWeight: '600' }}>
                                ☁️ Saving...
                              </span>
                            )}
                            {savePreviousStatus === 'saved' && (
                              <span style={{ display: 'inline-block', padding: '3px 10px', background: '#d4edda', color: '#155724', borderRadius: '15px', fontSize: '11px', fontWeight: '600' }}>
                                ✅ Saved
                              </span>
                            )}
                            {savePreviousStatus === 'error' && (
                              <span style={{ display: 'inline-block', padding: '3px 10px', background: '#f8d7da', color: '#721c24', borderRadius: '15px', fontSize: '11px', fontWeight: '600' }}>
                                ❌ Failed
                              </span>
                            )}
                            {savePreviousStatus === 'idle' && (
                              <span style={{ display: 'inline-block', padding: '3px 10px', background: '#d1ecf1', color: '#0c5460', borderRadius: '15px', fontSize: '11px', fontWeight: '600' }}>
                                ☁️ Synced
                              </span>
                            )}
                          </div>

                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                            <label style={{
                              display: 'inline-block',
                              padding: '6px 16px',
                              background: '#667eea',
                              color: 'white',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}>
                              Re-upload
                              <input type="file" accept=".xls,.xlsx" onChange={handlePreviousYearUpload} style={{ display: 'none' }} />
                            </label>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div style={{ fontSize: '36px', marginBottom: '10px' }}>📄</div>
                          <p style={{ fontSize: '14px', color: '#666', marginBottom: '15px' }}>
                            {isDraggingPrevious ? 'Drop file here' : 'Drag & drop or click to browse'}
                          </p>
                          <label style={{
                            display: 'inline-block',
                            padding: '10px 20px',
                            background: '#667eea',
                            color: 'white',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '500'
                          }}>
                            Browse Files
                            <input
                              type="file"
                              accept=".xls,.xlsx"
                              onChange={handlePreviousYearUpload}
                              style={{ display: 'none' }}
                            />
                          </label>
                          <p style={{ fontSize: '12px', color: '#999', marginTop: '12px' }}>
                            Supported formats: .xlsx, .xls
                          </p>
                        </>
                      )}
                    </div>
                  )
                )}
              </div>
              )} {/* end showPreviousYearSection */}

            </div>

        {/* Comparison Results */}
        {currentYearData.length > 0 && previousYearData.length > 0 && (
          <div style={{ 
            marginTop: '30px', 
            background: '#fff', 
            borderRadius: '8px', 
            border: '1px solid #e0e0e0', 
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
          }}>
            <div 
              onClick={() => setIsComparisonSectionOpen(!isComparisonSectionOpen)}
              style={{ 
                padding: '15px 20px',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: '#f8f9fa',
                transition: 'background 0.2s ease',
                borderBottom: isComparisonSectionOpen ? '1px solid #e0e0e0' : 'none'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = '#e9ecef'}
              onMouseOut={(e) => e.currentTarget.style.background = '#f8f9fa'}
            >
              <h3 style={{ margin: 0, fontSize: '18px', color: '#333' }}>
                📊 Growth Comparison Results
              </h3>
              <span style={{ fontSize: '20px', color: '#333' }}>
                {isComparisonSectionOpen ? '▼' : '▶'}
              </span>
            </div>

            {isComparisonSectionOpen && (
              <div style={{ padding: '20px' }}>
                {/* Comparison Filters */}
            <div className="filter-row" style={{ 
              display: 'flex', 
              gap: '15px', 
              marginBottom: '20px', 
              flexWrap: 'wrap',
              background: '#f8f9fa',
              padding: '15px',
              borderRadius: '8px'
            }}>
              <select 
                value={comparisonDivisionFilter} 
                onChange={(e) => handleComparisonDivisionChange(e.target.value)}
                style={{
                  padding: '10px 14px',
                  minWidth: '180px',
                  border: '2px solid #e0e0e0',
                  borderRadius: '6px',
                  fontSize: '14px',
                  background: 'white',
                  cursor: 'pointer'
                }}
              >
                <option value="">All Divisions</option>
                {comparisonDivisions.map((division) => (
                  <option key={division} value={division}>
                    {division}
                  </option>
                ))}
              </select>

              <select 
                value={comparisonAreaFilter} 
                onChange={(e) => handleComparisonAreaChange(e.target.value)}
                style={{
                  padding: '10px 14px',
                  minWidth: '180px',
                  border: '2px solid #e0e0e0',
                  borderRadius: '6px',
                  fontSize: '14px',
                  background: 'white',
                  cursor: 'pointer'
                }}
              >
                <option value="">All Areas</option>
                {comparisonAreas.map((area) => (
                  <option key={area} value={area}>
                    {area}
                  </option>
                ))}
              </select>

              <select 
                value={comparisonPlazaFilter} 
                onChange={(e) => handleComparisonPlazaChange(e.target.value)}
                style={{
                  padding: '10px 14px',
                  minWidth: '180px',
                  border: '2px solid #e0e0e0',
                  borderRadius: '6px',
                  fontSize: '14px',
                  background: 'white',
                  cursor: 'pointer'
                }}
              >
                <option value="">All Plazas</option>
                {comparisonPlazas.map((plaza) => (
                  <option key={plaza} value={plaza}>
                    {plaza}
                  </option>
                ))}
              </select>
            </div>

            {/* Summary Cards */}
            <div className="summary-grid" style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: '15px',
              marginBottom: '20px'
            }}>
              <div style={{ 
                padding: '15px', 
                background: '#f0f4ff', 
                borderRadius: '8px',
                border: '1px solid #667eea'
              }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#666', fontSize: '13px' }}>Total Plazas</h4>
                <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#667eea', margin: '0 0 10px 0' }}>
                  {filteredComparisonData.length}
                </p>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  paddingTop: '10px',
                  borderTop: '1px solid #d0d7ff'
                }}>
                  <span style={{ fontSize: '12px', color: '#666' }}>Degrowth Plaza Qty:</span>
                  <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#dc3545' }}>
                    {(() => {
                      let degrowthCount = 0;
                      filteredComparisonData.forEach((current) => {
                        const previous = previousYearData.find(p => p.Plaza === current.Plaza);
                        const currentAch = current?.Total_Ach ?? 0;
                        const previousAch = previous?.Total_Ach ?? 0;
                        if (currentAch < previousAch) {
                          degrowthCount++;
                        }
                      });
                      return degrowthCount;
                    })()}
                  </span>
                </div>
              </div>

              <div style={{ 
                padding: '15px', 
                background: '#e8f5e9', 
                borderRadius: '8px',
                border: '1px solid #28a745'
              }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#666', fontSize: '13px' }}>Total Growth %</h4>
                <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#28a745', margin: 0 }}>
                  {(() => {
                    let totalPreviousAch = 0;
                    let totalCurrentAch = 0;
                    
                    filteredComparisonData.forEach((current) => {
                      const previous = previousYearData.find(p => p.Plaza === current.Plaza);
                      totalPreviousAch += previous?.Total_Ach ?? 0;
                      totalCurrentAch += current?.Total_Ach ?? 0;
                    });
                    
                    const totalGrowthPercent = totalPreviousAch > 0 
                      ? ((totalCurrentAch - totalPreviousAch) / totalPreviousAch * 100).toFixed(2)
                      : '0.00';
                    
                    return parseFloat(totalGrowthPercent) >= 0 ? `+${totalGrowthPercent}%` : `${totalGrowthPercent}%`;
                  })()}
                </p>
              </div>

              <div style={{ 
                padding: '15px', 
                background: '#fff3e0', 
                borderRadius: '8px',
                border: '1px solid #ff9800'
              }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#666', fontSize: '13px' }}>Total Growth Amount</h4>
                <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#ff9800', margin: 0 }}>
                  {(() => {
                    const totalGrowth = filteredComparisonData.reduce((sum, current) => {
                      const previous = previousYearData.find(p => p.Plaza === current.Plaza);
                      const currentAch = current?.Total_Ach ?? 0;
                      const previousAch = previous?.Total_Ach ?? 0;
                      return sum + (currentAch - previousAch);
                    }, 0);
                    
                    return (totalGrowth >= 0 ? '+' : '') + totalGrowth.toLocaleString();
                  })()}
                </p>
              </div>
            </div>

            {/* Degrowth Summary Section - Collapsible */}
            <div style={{ 
              marginBottom: '20px',
              background: '#fff5f5',
              borderRadius: '8px',
              border: '1px solid #f5c6cb',
              overflow: 'hidden'
            }}>
              <div 
                onClick={() => setIsDegrowthSectionOpen(!isDegrowthSectionOpen)}
                style={{ 
                  padding: '15px 20px',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: '#f8d7da',
                  transition: 'background 0.2s ease'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = '#f1b0b7'}
                onMouseOut={(e) => e.currentTarget.style.background = '#f8d7da'}
              >
                <h3 style={{ margin: 0, fontSize: '16px', color: '#721c24' }}>
                  📉 Total Degrowth Summary
                </h3>
                <span style={{ fontSize: '20px', color: '#721c24' }}>
                  {isDegrowthSectionOpen ? '▼' : '▶'}
                </span>
              </div>

              {isDegrowthSectionOpen && (
                <div style={{ padding: '20px' }}>
                  {/* Summary Cards */}
                  <div className="summary-grid" style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                    gap: '15px',
                    marginBottom: '20px'
                  }}>
                    {(() => {
                      // Calculate all plazas (include all, even without previous year data)
                      const allComparisonPlazas = filteredComparisonData;

                      // Calculate degrowth plazas (individual plazas with degrowth)
                      const degrowthPlazas = allComparisonPlazas.filter((current) => {
                        const previous = previousYearData.find(p => p.Plaza === current.Plaza);
                        const currentAch = current?.Total_Ach ?? 0;
                        const previousAch = previous?.Total_Ach ?? 0;
                        return currentAch < previousAch;
                      });

                      // Calculate divisions with overall degrowth
                      const divisionTotals = allComparisonPlazas.reduce((acc, current) => {
                        const previous = previousYearData.find(p => p.Plaza === current.Plaza);
                        
                        if (!acc[current.Division]) {
                          acc[current.Division] = 0;
                        }
                        const currentAch = current?.Total_Ach ?? 0;
                        const previousAch = previous?.Total_Ach ?? 0;
                        acc[current.Division] += (currentAch - previousAch);
                        return acc;
                      }, {} as Record<string, number>);
                      
                      const degrowthDivisions = Object.values(divisionTotals).filter(total => total < 0).length;

                      // Calculate areas with overall degrowth
                      const areaTotals = allComparisonPlazas.reduce((acc, current) => {
                        const previous = previousYearData.find(p => p.Plaza === current.Plaza);
                        
                        if (!acc[current.Area]) {
                          acc[current.Area] = 0;
                        }
                        const currentAch = current?.Total_Ach ?? 0;
                        const previousAch = previous?.Total_Ach ?? 0;
                        acc[current.Area] += (currentAch - previousAch);
                        return acc;
                      }, {} as Record<string, number>);
                      
                      const degrowthAreas = Object.values(areaTotals).filter(total => total < 0).length;

                      return (
                        <>
                          <div style={{ 
                            padding: '15px', 
                            background: 'white', 
                            borderRadius: '6px',
                            border: '2px solid #dc3545'
                          }}>
                            <h4 style={{ margin: '0 0 8px 0', color: '#666', fontSize: '13px' }}>
                              Total Degrowth Division Qty
                            </h4>
                            <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#dc3545', margin: 0 }}>
                              {degrowthDivisions}
                            </p>
                          </div>

                          <div style={{ 
                            padding: '15px', 
                            background: 'white', 
                            borderRadius: '6px',
                            border: '2px solid #dc3545'
                          }}>
                            <h4 style={{ margin: '0 0 8px 0', color: '#666', fontSize: '13px' }}>
                              Total Degrowth Area Qty
                            </h4>
                            <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#dc3545', margin: 0 }}>
                              {degrowthAreas}
                            </p>
                          </div>

                          <div style={{ 
                            padding: '15px', 
                            background: 'white', 
                            borderRadius: '6px',
                            border: '2px solid #dc3545'
                          }}>
                            <h4 style={{ margin: '0 0 8px 0', color: '#666', fontSize: '13px' }}>
                              Total Degrowth Plaza Qty
                            </h4>
                            <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#dc3545', margin: 0 }}>
                              {degrowthPlazas.length}
                            </p>
                          </div>
                        </>
                      );
                    })()}
                  </div>

                  {/* Shared Sort Toggle for Division and Area */}
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    marginBottom: '20px',
                    padding: '15px',
                    background: '#fff',
                    borderRadius: '8px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <span style={{ fontSize: '14px', color: '#666', fontWeight: '600', marginRight: '10px' }}>
                        Sort By:
                      </span>
                      <button
                        onClick={() => setSortBy('amount')}
                        style={{
                          padding: '8px 24px',
                          border: sortBy === 'amount' ? '2px solid #721c24' : '1px solid #ddd',
                          background: sortBy === 'amount' ? '#f8d7da' : 'white',
                          color: sortBy === 'amount' ? '#721c24' : '#666',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: sortBy === 'amount' ? 'bold' : 'normal',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        Amount
                      </button>
                      <button
                        onClick={() => setSortBy('percent')}
                        style={{
                          padding: '8px 24px',
                          border: sortBy === 'percent' ? '2px solid #721c24' : '1px solid #ddd',
                          background: sortBy === 'percent' ? '#f8d7da' : 'white',
                          color: sortBy === 'percent' ? '#721c24' : '#666',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: sortBy === 'percent' ? 'bold' : 'normal',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        Percentage (%)
                      </button>
                    </div>
                  </div>

                  {/* Details by Division */}
                  <div style={{ marginBottom: '20px' }}>
                    <h4 style={{ marginBottom: '10px', color: '#721c24' }}>Growth/Degrowth by Division</h4>
                    <div className="degrowth-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
                      {(() => {
                        const divisionSummary = filteredComparisonData.reduce((acc, current) => {
                          const previous = previousYearData.find(p => p.Plaza === current.Plaza);
                          
                          if (!acc[current.Division]) {
                            acc[current.Division] = { growthQty: 0, degrowthQty: 0, amount: 0, previousTotal: 0, currentTotal: 0 };
                          }
                          
                          const currentAch = current?.Total_Ach ?? 0;
                          const previousAch = previous?.Total_Ach ?? 0;
                          const diff = currentAch - previousAch;
                          
                          if (diff >= 0) {
                            acc[current.Division].growthQty += 1;
                          } else {
                            acc[current.Division].degrowthQty += 1;
                          }
                          acc[current.Division].amount += diff;
                          acc[current.Division].previousTotal += previousAch;
                          acc[current.Division].currentTotal += currentAch;
                          
                          return acc;
                        }, {} as Record<string, { growthQty: number; degrowthQty: number; amount: number; previousTotal: number; currentTotal: number }>);

                        return Object.entries(divisionSummary)
                          .sort((a, b) => {
                            if (sortBy === 'amount') {
                              return Math.abs(b[1].amount) - Math.abs(a[1].amount);
                            } else {
                              const percentA = a[1].previousTotal > 0 ? Math.abs((a[1].amount / a[1].previousTotal) * 100) : 0;
                              const percentB = b[1].previousTotal > 0 ? Math.abs((b[1].amount / b[1].previousTotal) * 100) : 0;
                              return percentB - percentA;
                            }
                          })
                          .map(([division, data], index) => {
                            const isGrowth = data.amount >= 0;
                            const growthPercent = data.previousTotal > 0 
                              ? ((data.amount / data.previousTotal) * 100).toFixed(2)
                              : '0.00';
                            return (
                              <div key={division} style={{ 
                                padding: '12px', 
                                background: 'white', 
                                borderRadius: '6px', 
                                border: `2px solid ${isGrowth ? '#28a745' : '#dc3545'}`,
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                position: 'relative'
                              }}>
                                <div style={{
                                  position: 'absolute',
                                  top: '8px',
                                  right: '8px',
                                  background: isGrowth ? '#28a745' : '#dc3545',
                                  color: 'white',
                                  borderRadius: '50%',
                                  width: '24px',
                                  height: '24px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '12px',
                                  fontWeight: 'bold'
                                }}>
                                  {index + 1}
                                </div>
                                <h5 style={{ 
                                  margin: '0 0 10px 0', 
                                  color: isGrowth ? '#28a745' : '#721c24', 
                                  fontSize: '15px',
                                  fontWeight: 'bold',
                                  paddingRight: '30px'
                                }}>
                                  {division}
                                </h5>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                  <span style={{ fontSize: '12px', color: '#666' }}>Growth Plaza:</span>
                                  <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#28a745' }}>
                                    {data.growthQty}
                                  </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                  <span style={{ fontSize: '12px', color: '#666' }}>Degrowth Plaza:</span>
                                  <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#dc3545' }}>
                                    {data.degrowthQty}
                                  </span>
                                </div>
                                <div style={{ 
                                  display: 'flex', 
                                  justifyContent: 'space-between',
                                  paddingTop: '8px',
                                  borderTop: '1px solid #eee',
                                  marginTop: '8px',
                                  marginBottom: '4px'
                                }}>
                                  <span style={{ fontSize: '12px', color: '#666', fontWeight: 'bold' }}>
                                    {isGrowth ? 'Growth' : 'Degrowth'} Amount:
                                  </span>
                                  <span style={{ 
                                    fontSize: '15px', 
                                    fontWeight: 'bold', 
                                    color: isGrowth ? '#28a745' : '#dc3545' 
                                  }}>
                                    {isGrowth ? '+' : ''}{data.amount.toLocaleString()}
                                  </span>
                                </div>
                                <div style={{ 
                                  display: 'flex', 
                                  justifyContent: 'space-between'
                                }}>
                                  <span style={{ fontSize: '12px', color: '#666', fontWeight: 'bold' }}>
                                    {isGrowth ? 'Growth' : 'Degrowth'} %:
                                  </span>
                                  <span style={{ 
                                    fontSize: '15px', 
                                    fontWeight: 'bold', 
                                    color: isGrowth ? '#28a745' : '#dc3545' 
                                  }}>
                                    {isGrowth ? '+' : ''}{growthPercent}%
                                  </span>
                                </div>
                              </div>
                            );
                          });
                      })()}
                    </div>
                  </div>

                  {/* Details by Area */}
                  <div>
                    <h4 style={{ marginBottom: '10px', color: '#721c24' }}>Growth/Degrowth by Area</h4>
                    <div className="degrowth-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
                      {(() => {
                        const areaSummary = filteredComparisonData.reduce((acc, current) => {
                          const previous = previousYearData.find(p => p.Plaza === current.Plaza);
                          
                          if (!acc[current.Area]) {
                            acc[current.Area] = { growthQty: 0, degrowthQty: 0, amount: 0, previousTotal: 0, currentTotal: 0 };
                          }
                          
                          const currentAch = current?.Total_Ach ?? 0;
                          const previousAch = previous?.Total_Ach ?? 0;
                          const diff = currentAch - previousAch;
                          
                          if (diff >= 0) {
                            acc[current.Area].growthQty += 1;
                          } else {
                            acc[current.Area].degrowthQty += 1;
                          }
                          acc[current.Area].amount += diff;
                          acc[current.Area].previousTotal += previousAch;
                          acc[current.Area].currentTotal += currentAch;
                          
                          return acc;
                        }, {} as Record<string, { growthQty: number; degrowthQty: number; amount: number; previousTotal: number; currentTotal: number }>);

                        return Object.entries(areaSummary)
                          .sort((a, b) => {
                            if (sortBy === 'amount') {
                              return Math.abs(b[1].amount) - Math.abs(a[1].amount);
                            } else {
                              const percentA = a[1].previousTotal > 0 ? Math.abs((a[1].amount / a[1].previousTotal) * 100) : 0;
                              const percentB = b[1].previousTotal > 0 ? Math.abs((b[1].amount / b[1].previousTotal) * 100) : 0;
                              return percentB - percentA;
                            }
                          })
                          .map(([area, data], index) => {
                            const isGrowth = data.amount >= 0;
                            const growthPercent = data.previousTotal > 0 
                              ? ((data.amount / data.previousTotal) * 100).toFixed(2)
                              : '0.00';
                            return (
                              <div key={area} style={{ 
                                padding: '12px', 
                                background: 'white', 
                                borderRadius: '6px', 
                                border: `2px solid ${isGrowth ? '#28a745' : '#dc3545'}`,
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                position: 'relative'
                              }}>
                                <div style={{
                                  position: 'absolute',
                                  top: '8px',
                                  right: '8px',
                                  background: isGrowth ? '#28a745' : '#dc3545',
                                  color: 'white',
                                  borderRadius: '50%',
                                  width: '24px',
                                  height: '24px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '12px',
                                  fontWeight: 'bold'
                                }}>
                                  {index + 1}
                                </div>
                                <h5 style={{ 
                                  margin: '0 0 10px 0', 
                                  color: isGrowth ? '#28a745' : '#721c24', 
                                  fontSize: '15px',
                                  fontWeight: 'bold',
                                  paddingRight: '30px'
                                }}>
                                  {area}
                                </h5>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                  <span style={{ fontSize: '12px', color: '#666' }}>Growth Plaza:</span>
                                  <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#28a745' }}>
                                    {data.growthQty}
                                  </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                  <span style={{ fontSize: '12px', color: '#666' }}>Degrowth Plaza:</span>
                                  <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#dc3545' }}>
                                    {data.degrowthQty}
                                  </span>
                                </div>
                                <div style={{ 
                                  display: 'flex', 
                                  justifyContent: 'space-between',
                                  paddingTop: '8px',
                                  borderTop: '1px solid #eee',
                                  marginTop: '8px',
                                  marginBottom: '4px'
                                }}>
                                  <span style={{ fontSize: '12px', color: '#666', fontWeight: 'bold' }}>
                                    {isGrowth ? 'Growth' : 'Degrowth'} Amount:
                                  </span>
                                  <span style={{ 
                                    fontSize: '15px', 
                                    fontWeight: 'bold', 
                                    color: isGrowth ? '#28a745' : '#dc3545' 
                                  }}>
                                    {isGrowth ? '+' : ''}{data.amount.toLocaleString()}
                                  </span>
                                </div>
                                <div style={{ 
                                  display: 'flex', 
                                  justifyContent: 'space-between'
                                }}>
                                  <span style={{ fontSize: '12px', color: '#666', fontWeight: 'bold' }}>
                                    {isGrowth ? 'Growth' : 'Degrowth'} %:
                                  </span>
                                  <span style={{ 
                                    fontSize: '15px', 
                                    fontWeight: 'bold', 
                                    color: isGrowth ? '#28a745' : '#dc3545' 
                                  }}>
                                    {isGrowth ? '+' : ''}{growthPercent}%
                                  </span>
                                </div>
                              </div>
                            );
                          });
                      })()}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Download Button for Comparison */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', color: '#333' }}>Growth Comparison Details</h3>
              <button 
                onClick={() => {
                  const now = new Date();
                  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                  const month = monthNames[now.getMonth()];
                  const prevYear = now.getFullYear() - 1;
                  const currYear = now.getFullYear();
                  
                  const exportData = filteredComparisonData
                    .map((current) => {
                      const previous = previousYearData.find(p => p.Plaza === current.Plaza);
                      
                      const currentAch = current?.Total_Ach ?? 0;
                      const previousAch = previous?.Total_Ach ?? 0;
                      const profitAch = current?.Net_Profit_Ach ?? 0;
                      const growthAmount = currentAch - previousAch;
                      const growthPercent = previousAch > 0 
                        ? ((growthAmount / previousAch) * 100).toFixed(2)
                        : '0.00';
                      
                      return {
                        'Plaza': current.Plaza,
                        'Area': current.Area,
                        'Division': current.Division,
                        [`${month} - ${prevYear} ACH`]: previousAch,
                        [`${month} - ${currYear} ACH`]: currentAch,
                        [`Profit ACH ${currYear}`]: profitAch,
                        'Growth Amount': growthAmount,
                        'Growth %': parseFloat(growthPercent)
                      };
                    })
                    .sort((a, b) => (a?.Plaza || '').localeCompare(b?.Plaza || ''));

                  const ws = XLSX.utils.json_to_sheet(exportData);
                  const wb = XLSX.utils.book_new();
                  XLSX.utils.book_append_sheet(wb, ws, 'Growth Comparison');
                  
                  const date = new Date().toISOString().split('T')[0];
                  const filename = `Growth_Comparison_${month}_${currYear}_${date}.xlsx`;
                  
                  XLSX.writeFile(wb, filename);
                }}
                style={{ 
                  padding: '10px 20px', 
                  cursor: 'pointer', 
                  borderRadius: '6px', 
                  border: '1px solid #28a745', 
                  background: '#28a745',
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '14px'
                }}
              >
                📥 Download Excel
              </button>
            </div>

            <div className="table-scroll" style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>PLAZA</th>
                    <th>AREA</th>
                    <th>DIVISION</th>
                    <th>{(() => {
                      const now = new Date();
                      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                      const month = monthNames[now.getMonth()];
                      const year = now.getFullYear() - 1;
                      return `${month} - ${year} ACH`;
                    })()}</th>
                    <th>{(() => {
                      const now = new Date();
                      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                      const month = monthNames[now.getMonth()];
                      const year = now.getFullYear();
                      return `${month} - ${year} ACH`;
                    })()}</th>
                    <th>{(() => {
                      const now = new Date();
                      const year = now.getFullYear();
                      return `Profit ACH ${year}`;
                    })()}</th>
                    <th>GROWTH AMOUNT</th>
                    <th>GROWTH %</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredComparisonData
                    .sort((a, b) => (a.Plaza || '').toString().localeCompare((b.Plaza || '').toString()))
                    .map((current) => {
                    const previous = previousYearData.find(p => p.Plaza === current.Plaza);
                    
                    const currentAch = current?.Total_Ach ?? 0;
                    const previousAch = previous?.Total_Ach ?? 0;
                    const growthAmount = currentAch - previousAch;
                    const growthPercent = previousAch > 0 
                      ? ((growthAmount / previousAch) * 100).toFixed(2)
                      : '0.00';
                    
                    const profitAch = current?.Net_Profit_Ach ?? 0;
                    
                    return (
                      <tr key={current.Plaza}>
                        <td>{current.Plaza}</td>
                        <td>{current.Area}</td>
                        <td>{current.Division}</td>
                        <td>{previousAch.toLocaleString()}</td>
                        <td>{currentAch.toLocaleString()}</td>
                        <td style={{ 
                          color: profitAch >= 0 ? '#28a745' : '#dc3545',
                          fontWeight: 'bold'
                        }}>
                          {profitAch.toLocaleString()}
                        </td>
                        <td style={{ 
                          color: growthAmount >= 0 ? '#28a745' : '#dc3545',
                          fontWeight: 'bold'
                        }}>
                          {growthAmount >= 0 ? '+' : ''}{growthAmount.toLocaleString()}
                        </td>
                        <td style={{ 
                          color: parseFloat(growthPercent) >= 0 ? '#28a745' : '#dc3545',
                          fontWeight: 'bold'
                        }}>
                          {parseFloat(growthPercent) >= 0 ? '+' : ''}{growthPercent}%
                        </td>
                      </tr>
                    );
                  })}
                  
                  {/* Total Row */}
                  {filteredComparisonData.length > 0 && (() => {
                    let totalPreviousAch = 0;
                    let totalCurrentAch = 0;
                    let totalProfitAch = 0;
                    
                    filteredComparisonData.forEach((current) => {
                      const previous = previousYearData.find(p => p.Plaza === current.Plaza);
                      totalPreviousAch += previous?.Total_Ach ?? 0;
                      totalCurrentAch += current?.Total_Ach ?? 0;
                      totalProfitAch += current?.Net_Profit_Ach ?? 0;
                    });
                    
                    const totalGrowthAmount = totalCurrentAch - totalPreviousAch;
                    const totalGrowthPercent = totalPreviousAch > 0 
                      ? ((totalGrowthAmount / totalPreviousAch) * 100).toFixed(2)
                      : '0.00';
                    
                    return (
                      <tr style={{ 
                        background: '#2c3e50', 
                        color: 'white', 
                        fontWeight: 'bold',
                        fontSize: '15px'
                      }}>
                        <td colSpan={3}>TOTAL</td>
                        <td>{totalPreviousAch.toLocaleString()}</td>
                        <td>{totalCurrentAch.toLocaleString()}</td>
                        <td style={{ 
                          color: totalProfitAch >= 0 ? '#4ade80' : '#f87171',
                          fontWeight: 'bold'
                        }}>
                          {totalProfitAch.toLocaleString()}
                        </td>
                        <td style={{ 
                          color: totalGrowthAmount >= 0 ? '#4ade80' : '#f87171',
                          fontWeight: 'bold'
                        }}>
                          {totalGrowthAmount >= 0 ? '+' : ''}{totalGrowthAmount.toLocaleString()}
                        </td>
                        <td style={{ 
                          color: parseFloat(totalGrowthPercent) >= 0 ? '#4ade80' : '#f87171',
                          fontWeight: 'bold'
                        }}>
                          {parseFloat(totalGrowthPercent) >= 0 ? '+' : ''}{totalGrowthPercent}%
                        </td>
                      </tr>
                    );
                  })()}
                </tbody>
              </table>
            </div>
              </div>
            )}
          </div>
        )}

        </div> {/* End ach-content */}
      </div> {/* End ach-section-container */}

      {/* ===== CURRENT MONTH ACHIEVEMENT SECTION ===== */}
      <div style={{
        background: 'white',
        marginBottom: '30px',
        borderRadius: '12px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 30px',
          background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
        }}>
          <h2 style={{ margin: '0 0 5px 0', color: 'white', fontSize: '24px' }}>
            🎯 Current Month Achievement
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.9)', margin: 0, fontSize: '14px' }}>
            Upload the current month target file to see Base / Slab-1 / Slab-2 achievement
          </p>
        </div>

        <div style={{ padding: '30px' }}>
          {/* Loading from DB indicator */}
          {isLoadingTarget && (
            <div style={{ textAlign: 'center', padding: '20px', color: '#11998e', fontSize: '14px', marginBottom: '15px' }}>
              <span style={{ fontSize: '24px', display: 'block', marginBottom: '8px', animation: 'spin 1s linear infinite' }}>⏳</span>
              Loading saved target data from database...
            </div>
          )}

          {/* Toggle Upload Options Button */}
          <div style={{ textAlign: 'right', marginBottom: '15px' }}>
            <button 
              onClick={() => setShowTargetUploadOptions(!showTargetUploadOptions)}
              style={{
                background: 'none',
                border: 'none',
                color: '#11998e',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '14px',
                textDecoration: 'underline'
              }}
            >
              {showTargetUploadOptions ? 'Hide Upload Options' : 'Show Upload Options 🔒'}
            </button>
          </div>

          {showTargetUploadOptions && (
            <div style={{ marginBottom: '25px' }}>
              {!isTargetUploadUnlocked ? (
                <div style={{ textAlign: 'center', padding: '30px', background: '#f9f9f9', borderRadius: '8px', border: '1px solid #ddd' }}>
                  <h3 style={{ marginBottom: '10px', color: '#333' }}>🔒 Password Required</h3>
                  <p style={{ color: '#666', marginBottom: '15px', fontSize: '14px' }}>Please enter the password to upload or manage target files.</p>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                    <input
                      type="password"
                      placeholder="Enter password..."
                      value={targetPasswordInput}
                      onChange={(e) => setTargetPasswordInput(e.target.value)}
                      style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid #ccc', outline: 'none', width: '200px' }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          if (targetPasswordInput === '123456') {
                            setIsTargetUploadUnlocked(true);
                            setTargetPasswordInput('');
                          } else {
                            alert('Incorrect password!');
                          }
                        }
                      }}
                    />
                    <button
                      onClick={() => {
                        if (targetPasswordInput === '123456') {
                          setIsTargetUploadUnlocked(true);
                          setTargetPasswordInput('');
                        } else {
                          alert('Incorrect password!');
                        }
                      }}
                      style={{ padding: '8px 16px', background: '#11998e', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      Unlock
                    </button>
                  </div>
                </div>
              ) : (
                /* Upload Box */
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDraggingTarget(true); }}
            onDragLeave={(e) => { e.preventDefault(); setIsDraggingTarget(false); }}
            onDrop={(e) => {
              e.preventDefault();
              setIsDraggingTarget(false);
              const file = e.dataTransfer.files?.[0];
              if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
                processTargetFile(file);
              }
            }}
            style={{
              border: isDraggingTarget ? '2px dashed #11998e' : '2px dashed #ddd',
              background: isDraggingTarget ? '#e6fff8' : monthlyTargetData.length > 0 ? '#e8f5e9' : '#f9f9f9',
              padding: '20px',
              textAlign: 'center',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              marginBottom: '25px'
            }}
          >
            {monthlyTargetData.length > 0 ? (
              <div>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>✅</div>
                <p style={{ color: '#28a745', fontWeight: 'bold', marginBottom: '4px', fontSize: '14px' }}>Target File Loaded</p>
                <p style={{ fontSize: '12px', color: '#666', marginBottom: '6px' }}>{monthlyTargetData.length} plazas loaded</p>
                {savedMonthLabel && (
                  <p style={{ fontSize: '11px', color: '#11998e', fontWeight: '600', marginBottom: '10px' }}>
                    🗓️ {savedMonthLabel}
                  </p>
                )}

                {/* Big Bold Timestamp */}
                <div style={{ 
                  background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                  padding: '12px 20px',
                  borderRadius: '8px',
                  marginBottom: '10px'
                }}>
                  <p style={{ 
                    fontSize: '16px', 
                    color: 'white', 
                    fontWeight: 'bold',
                    margin: 0,
                    letterSpacing: '0.5px'
                  }}>
                    📅 Data Updated: {formatTimestamp(targetUploadedAt)}
                  </p>
                </div>

                {/* Firebase sync status badge */}
                <div style={{ marginBottom: '8px' }}>
                  {saveStatus === 'saving' && (
                    <span style={{ display: 'inline-block', padding: '3px 10px', background: '#fff3cd', color: '#856404', borderRadius: '15px', fontSize: '11px', fontWeight: '600' }}>
                      ☁️ Saving...
                    </span>
                  )}
                  {saveStatus === 'saved' && (
                    <span style={{ display: 'inline-block', padding: '3px 10px', background: '#d4edda', color: '#155724', borderRadius: '15px', fontSize: '11px', fontWeight: '600' }}>
                      ✅ Saved
                    </span>
                  )}
                  {saveStatus === 'error' && (
                    <span style={{ display: 'inline-block', padding: '3px 10px', background: '#f8d7da', color: '#721c24', borderRadius: '15px', fontSize: '11px', fontWeight: '600' }}>
                      ❌ Failed
                    </span>
                  )}
                  {saveStatus === 'idle' && savedMonthLabel && (
                    <span style={{ display: 'inline-block', padding: '3px 10px', background: '#d1ecf1', color: '#0c5460', borderRadius: '15px', fontSize: '11px', fontWeight: '600' }}>
                      ☁️ Synced
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <label style={{
                    display: 'inline-block',
                    padding: '6px 16px',
                    background: '#11998e',
                    color: 'white',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}>
                    Re-upload
                    <input type="file" accept=".xls,.xlsx" onChange={(e) => { const f = e.target.files?.[0]; if (f) processTargetFile(f); }} style={{ display: 'none' }} />
                  </label>
                </div>
              </div>
            ) : (
              <>
                <div style={{ fontSize: '36px', marginBottom: '10px' }}>📊</div>
                <p style={{ fontSize: '14px', color: '#666', marginBottom: '15px' }}>
                  {isDraggingTarget ? 'Drop the target file here' : 'Drag & drop the target Excel file or click to browse'}
                </p>
                <p style={{ fontSize: '12px', color: '#888', marginBottom: '15px', fontStyle: 'italic' }}>
                  💡 Previously saved data loads automatically from Firebase on each visit
                </p>
                <label style={{
                  display: 'inline-block',
                  padding: '10px 20px',
                  background: '#11998e',
                  color: 'white',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  Browse Files
                  <input type="file" accept=".xls,.xlsx" onChange={(e) => { const f = e.target.files?.[0]; if (f) processTargetFile(f); }} style={{ display: 'none' }} />
                </label>
                <p style={{ fontSize: '12px', color: '#999', marginTop: '12px' }}>Supported formats: .xlsx, .xls</p>
              </>
            )}
          </div>
        )}
      </div>
    )}

    {/* Results */}
          {monthlyTargetData.length > 0 && (() => {
            // Slab toggle
            // Filters
            const targetDivisions = [...new Set(monthlyTargetData.map(d => d.Division))];
            const targetAreas = [...new Set(
              monthlyTargetData
                .filter(d => !targetDivisionFilter || d.Division === targetDivisionFilter)
                .map(d => d.Area)
            )];

            const filteredTarget = monthlyTargetData.filter(t =>
              (!targetDivisionFilter || t.Division === targetDivisionFilter) &&
              (!targetAreaFilter || t.Area === targetAreaFilter)
            );

            // Match achievement from currentYearData
            // Build enriched from filteredTarget first
            const enrichedFromTarget = filteredTarget.map(t => {
              const achRow = currentYearData.find(c =>
                c.Plaza?.toString().trim().toLowerCase() === t.PlazaName?.toString().trim().toLowerCase()
              );
              const prevRow = previousYearData.find(p =>
                p.Plaza?.toString().trim().toLowerCase() === t.PlazaName?.toString().trim().toLowerCase()
              );
              const ach = achRow ? (achRow.Total_Ach || 0) : null;
              const profitAch = achRow ? (achRow.Net_Profit_Ach || 0) : null;
              const prevAch = prevRow ? (prevRow.Total_Ach || 0) : null;
              const growthPct = (ach !== null && prevAch !== null && prevAch > 0)
                ? ((ach - prevAch) / prevAch * 100)
                : null;
              const baseAchPct = (ach !== null && t.BaseTarget > 0) ? (ach / t.BaseTarget * 100) : null;
              const targetAchPcts = (t.Targets || []).map((tgt: number) =>
                (ach !== null && tgt > 0) ? (ach / tgt * 100) : null
              );
              return { ...t, ach, profitAch, prevAch, growthPct, baseAchPct, targetAchPcts };
            });

            // Also include plazas from currentYearData that have NO matching target row
            // (they exist in current year file but were not in the target upload)
            const targetPlazaNames = new Set(filteredTarget.map(t => t.PlazaName?.toString().trim().toLowerCase()));
            const currentYearFiltered = currentYearData.filter(c => {
              const matchesDivision = !targetDivisionFilter || c.Division === targetDivisionFilter;
              const matchesArea = !targetAreaFilter || c.Area === targetAreaFilter;
              return matchesDivision && matchesArea;
            });
            const unmatchedCurrent = currentYearFiltered.filter(c =>
              !targetPlazaNames.has(c.Plaza?.toString().trim().toLowerCase())
            ).map(c => {
              const prevRow = previousYearData.find(p =>
                p.Plaza?.toString().trim().toLowerCase() === c.Plaza?.toString().trim().toLowerCase()
              );
              const ach = c.Total_Ach || 0;
              const profitAch = c.Net_Profit_Ach || 0;
              const prevAch = prevRow ? (prevRow.Total_Ach || 0) : null;
              const growthPct = (prevAch !== null && prevAch > 0) ? ((ach - prevAch) / prevAch * 100) : null;
              return {
                Division: c.Division || '',
                Area: c.Area || '',
                PlazaName: c.Plaza || '',
                BaseTarget: 0,
                Targets: targetLabels.map(() => 0),
                ach,
                profitAch,
                prevAch,
                growthPct,
                baseAchPct: null,
                targetAchPcts: targetLabels.map(() => null as number | null),
              };
            });

            // Merge: target-matched plazas + unmatched current year plazas
            const enriched = [...enrichedFromTarget, ...unmatchedCurrent];

            // Compute aggregated data
            const divisionWiseData = Object.values(enriched.reduce((acc, row) => {
              const div = row.Division || 'Unknown';
              if (!acc[div]) {
                acc[div] = { Division: div, BaseTarget: 0, Targets: targetLabels.map(() => 0), ach: 0, profitAch: 0, prevAch: 0, plazaCount: 0 };
              }
              acc[div].BaseTarget += row.BaseTarget;
              (row.Targets || []).forEach((t: number, i: number) => { acc[div].Targets[i] = (acc[div].Targets[i] || 0) + t; });
              acc[div].ach += row.ach || 0;
              acc[div].profitAch += row.profitAch || 0;
              acc[div].prevAch += row.prevAch || 0;
              acc[div].plazaCount += 1;
              return acc;
            }, {} as Record<string, any>)).map((row: any) => ({
              ...row,
              baseAchPct: row.BaseTarget > 0 ? (row.ach / row.BaseTarget * 100) : null,
              targetAchPcts: (row.Targets || []).map((t: number) => t > 0 ? (row.ach / t * 100) : null),
              growthPct: row.prevAch > 0 ? ((row.ach - row.prevAch) / row.prevAch * 100) : null,
            }));

            const areaWiseData = Object.values(enriched.reduce((acc, row) => {
              const key = `${row.Division}|${row.Area}`;
              if (!acc[key]) {
                acc[key] = { Division: row.Division || 'Unknown', Area: row.Area || 'Unknown', BaseTarget: 0, Targets: targetLabels.map(() => 0), ach: 0, profitAch: 0, prevAch: 0, plazaCount: 0 };
              }
              acc[key].BaseTarget += row.BaseTarget;
              (row.Targets || []).forEach((t: number, i: number) => { acc[key].Targets[i] = (acc[key].Targets[i] || 0) + t; });
              acc[key].ach += row.ach || 0;
              acc[key].profitAch += row.profitAch || 0;
              acc[key].prevAch += row.prevAch || 0;
              acc[key].plazaCount += 1;
              return acc;
            }, {} as Record<string, any>)).map((row: any) => ({
              ...row,
              baseAchPct: row.BaseTarget > 0 ? (row.ach / row.BaseTarget * 100) : null,
              targetAchPcts: (row.Targets || []).map((t: number) => t > 0 ? (row.ach / t * 100) : null),
              growthPct: row.prevAch > 0 ? ((row.ach - row.prevAch) / row.prevAch * 100) : null,
            }));

            // Summary totals
            const totalBase = enriched.reduce((s, r) => s + r.BaseTarget, 0);
            const totalTargets = targetLabels.map((_, i) => enriched.reduce((s, r) => s + (r.Targets?.[i] || 0), 0));
            const totalAch = enriched.reduce((s, r) => s + (r.ach || 0), 0);
            const totalBaseAchPct = totalBase > 0 ? (totalAch / totalBase * 100) : 0;
            const totalTargetAchPcts = totalTargets.map(t => t > 0 ? (totalAch / t * 100) : 0);

            const achPctColor = (pct: number | null) => {
              if (pct === null) return '#999';
              if (pct >= 100) return '#28a745';
              if (pct >= 80) return '#ff9800';
              return '#dc3545';
            };

            // ----- Sorting logic -----
            const baseRows = targetViewMode === 'division' ? divisionWiseData : targetViewMode === 'area' ? areaWiseData : enriched;
            const sortedRows = (() => {
              if (!targetSortColumn) return baseRows;
              const dir = targetSortDir === 'asc' ? 1 : -1;
              const getVal = (row: any) => {
                switch (targetSortColumn) {
                  case 'Division': return (row.Division || '').toString().toLowerCase();
                  case 'Area': return (row.Area || '').toString().toLowerCase();
                  case 'PlazaName': return (row.PlazaName || '').toString().toLowerCase();
                  case 'plazaCount': return row.plazaCount ?? 0;
                  case 'ach': return row.ach ?? -Infinity;
                  case 'profitAch': return row.profitAch ?? -Infinity;
                  case 'growthPct': return row.growthPct ?? -Infinity;
                  case 'BaseTarget': return row.BaseTarget ?? 0;
                  case 'baseAchPct': return row.baseAchPct ?? -Infinity;
                  case 'baseRemaining': return (row.BaseTarget || 0) - (row.ach || 0);
                  default:
                    if (targetSortColumn.startsWith('Target_')) {
                      const parts = targetSortColumn.split('_');
                      const idx = parseInt(parts[1]);
                      if (parts.length === 3 && parts[2] === 'pct') return row.targetAchPcts?.[idx] ?? -Infinity;
                      if (parts.length === 3 && parts[2] === 'remaining') return (row.Targets?.[idx] || 0) - (row.ach || 0);
                      return row.Targets?.[idx] ?? 0;
                    }
                    return 0;
                }
              };
              return [...baseRows].sort((a, b) => {
                const va = getVal(a);
                const vb = getVal(b);
                if (typeof va === 'string' && typeof vb === 'string') {
                  return va.localeCompare(vb) * dir;
                }
                return ((va as number) - (vb as number)) * dir;
              });
            })();

            const handleSort = (col: string) => {
              if (targetSortColumn === col) {
                setTargetSortDir(targetSortDir === 'asc' ? 'desc' : 'asc');
              } else {
                setTargetSortColumn(col);
                setTargetSortDir('desc');
              }
            };

            const sortArrow = (col: string) => {
              if (targetSortColumn !== col) return <span style={{ opacity: 0.35, fontSize: '10px' }}> ⇅</span>;
              return <span style={{ fontSize: '10px' }}>{targetSortDir === 'asc' ? ' ▲' : ' ▼'}</span>;
            };

            return (
              <>
                {/* Slab Toggle */}
                <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '14px', fontWeight: '600', color: '#555' }}>Highlight Target:</span>
                  <button
                    onClick={() => setActiveTargetSlab(-1)}
                    style={{
                      padding: '8px 20px',
                      border: activeTargetSlab === -1 ? '2px solid #11998e' : '1px solid #ddd',
                      background: activeTargetSlab === -1 ? '#e6fff8' : 'white',
                      color: activeTargetSlab === -1 ? '#11998e' : '#666',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: activeTargetSlab === -1 ? 'bold' : 'normal',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    Base Target
                  </button>
                  {targetLabels.map((label, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveTargetSlab(idx)}
                      style={{
                        padding: '8px 20px',
                        border: activeTargetSlab === idx ? '2px solid #11998e' : '1px solid #ddd',
                        background: activeTargetSlab === idx ? '#e6fff8' : 'white',
                        color: activeTargetSlab === idx ? '#11998e' : '#666',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: activeTargetSlab === idx ? 'bold' : 'normal',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {/* View Mode Toggle */}
                <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
                  {(['division', 'area', 'plaza'] as const).map(mode => (
                    <button
                      key={mode}
                      onClick={() => setTargetViewMode(mode)}
                      style={{
                        padding: '8px 20px',
                        border: targetViewMode === mode ? 'none' : '1px solid #ddd',
                        background: targetViewMode === mode ? 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' : 'white',
                        color: targetViewMode === mode ? 'white' : '#666',
                        borderRadius: '20px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        transition: 'all 0.2s ease',
                        boxShadow: targetViewMode === mode ? '0 2px 8px rgba(17,153,142,0.3)' : 'none'
                      }}
                    >
                      {mode === 'division' ? '1. Division Wise Summary' : mode === 'area' ? '2. Area Wise Summary' : '3. Existing (Plaza Wise)'}
                    </button>
                  ))}
                </div>

                {/* Filters */}
                <div className="filter-row" style={{ display: 'flex', gap: '15px', marginBottom: '20px', flexWrap: 'wrap', background: '#f8f9fa', padding: '15px', borderRadius: '8px' }}>
                  <select
                    value={targetDivisionFilter}
                    onChange={e => { setTargetDivisionFilter(e.target.value); setTargetAreaFilter(''); }}
                    style={{ padding: '10px 14px', minWidth: '180px', border: '2px solid #e0e0e0', borderRadius: '6px', fontSize: '14px', background: 'white', cursor: 'pointer' }}
                  >
                    <option value="">All Divisions</option>
                    {targetDivisions.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <select
                    value={targetAreaFilter}
                    onChange={e => setTargetAreaFilter(e.target.value)}
                    style={{ padding: '10px 14px', minWidth: '180px', border: '2px solid #e0e0e0', borderRadius: '6px', fontSize: '14px', background: 'white', cursor: 'pointer' }}
                  >
                    <option value="">All Areas</option>
                    {targetAreas.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>

                {/* Summary Cards */}
                <div className="summary-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '25px' }}>
                  {[
                    { label: 'Total Achievement', value: totalAch.toLocaleString(), color: '#667eea', bg: '#f0f4ff', border: '#667eea' },
                    { label: 'Base Target Ach %', value: totalBaseAchPct.toFixed(2) + '%', color: achPctColor(totalBaseAchPct), bg: '#fff', border: '#11998e' },
                    ...totalTargetAchPcts.map((pct, i) => ({
                      label: `${targetLabels[i]} Ach %`,
                      value: pct.toFixed(2) + '%',
                      color: achPctColor(pct),
                      bg: '#fff',
                      border: ['#ff9800','#dc3545','#9c27b0','#2196f3','#00bcd4','#4caf50','#ff5722'][i % 7],
                    })),
                    { label: 'Total Plazas', value: enriched.length.toString(), color: '#333', bg: '#f8f9fa', border: '#ddd' },
                    { label: 'Base Target Achieved', value: enriched.filter(r => (r.baseAchPct ?? 0) >= 100).length.toString(), color: '#28a745', bg: '#e8f5e9', border: '#28a745' },
                  ].map(card => (
                    <div key={card.label} style={{ padding: '15px', background: card.bg, borderRadius: '8px', border: `1px solid ${card.border}` }}>
                      <h4 style={{ margin: '0 0 8px 0', color: '#666', fontSize: '12px' }}>{card.label}</h4>
                      <p style={{ fontSize: '22px', fontWeight: 'bold', color: card.color, margin: 0 }}>{card.value}</p>
                    </div>
                  ))}
                </div>

                {/* Show Remaining Columns Checkboxes */}
                <div style={{ display: 'flex', gap: '15px', marginBottom: '15px', alignItems: 'center', flexWrap: 'wrap', padding: '12px 15px', background: '#f8f9fa', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#555' }}>Show Remaining:</span>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', fontSize: '13px', color: '#444' }}>
                    <input
                      type="checkbox"
                      checked={!!showRemaining['base']}
                      onChange={(e) => setShowRemaining(prev => ({ ...prev, base: e.target.checked }))}
                      style={{ accentColor: '#11998e' }}
                    />
                    Base Remaining
                  </label>
                  {targetLabels.map((label, i) => (
                    <label key={i} style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', fontSize: '13px', color: '#444' }}>
                      <input
                        type="checkbox"
                        checked={!!showRemaining[`target_${i}`]}
                        onChange={(e) => setShowRemaining(prev => ({ ...prev, [`target_${i}`]: e.target.checked }))}
                        style={{ accentColor: '#11998e' }}
                      />
                      {label} Remaining
                    </label>
                  ))}
                </div>

                {/* Download Excel Button */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '15px' }}>
                  <button
                    onClick={() => {
                      const rows = sortedRows.map((row: any) => {
                        const obj: Record<string, any> = {};
                        obj['Division'] = row.Division;
                        if (targetViewMode === 'area' || targetViewMode === 'plaza') obj['Area'] = row.Area;
                        if (targetViewMode === 'plaza') obj['Plaza Name'] = row.PlazaName;
                        if (targetViewMode !== 'plaza') obj['Plaza Count'] = row.plazaCount;
                        obj['Achievement'] = row.ach ?? 0;
                        obj['Profit Ach'] = row.profitAch ?? 0;
                        obj['Growth %'] = row.growthPct != null ? parseFloat(row.growthPct.toFixed(2)) : '';
                        obj['Base Target'] = row.BaseTarget ?? 0;
                        obj['Base Ach %'] = row.baseAchPct != null ? parseFloat(row.baseAchPct.toFixed(2)) : '';
                        if (showRemaining['base']) obj['Base Remaining'] = (row.BaseTarget || 0) - (row.ach || 0);
                        (targetLabels || []).forEach((label: string, i: number) => {
                          obj[`${label} Target`] = row.Targets?.[i] ?? 0;
                          obj[`${label} Ach %`] = row.targetAchPcts?.[i] != null ? parseFloat(row.targetAchPcts[i].toFixed(2)) : '';
                          if (showRemaining[`target_${i}`]) obj[`${label} Remaining`] = (row.Targets?.[i] || 0) - (row.ach || 0);
                        });
                        return obj;
                      });
                      // Add total row
                      const totalRow: Record<string, any> = {};
                      totalRow['Division'] = 'TOTAL';
                      if (targetViewMode === 'area' || targetViewMode === 'plaza') totalRow['Area'] = '';
                      if (targetViewMode === 'plaza') totalRow['Plaza Name'] = '';
                      if (targetViewMode !== 'plaza') totalRow['Plaza Count'] = enriched.length;
                      totalRow['Achievement'] = totalAch;
                      const totalProfit = enriched.reduce((s, r) => s + (r.profitAch || 0), 0);
                      const totalPrev = enriched.reduce((s, r) => s + (r.prevAch || 0), 0);
                      totalRow['Profit Ach'] = totalProfit;
                      totalRow['Growth %'] = totalPrev > 0 ? parseFloat(((totalAch - totalPrev) / totalPrev * 100).toFixed(2)) : '';
                      totalRow['Base Target'] = totalBase;
                      totalRow['Base Ach %'] = parseFloat(totalBaseAchPct.toFixed(2));
                      if (showRemaining['base']) totalRow['Base Remaining'] = totalBase - totalAch;
                      (totalTargets || []).forEach((t: number, i: number) => {
                        totalRow[`${targetLabels[i]} Target`] = t;
                        totalRow[`${targetLabels[i]} Ach %`] = parseFloat(totalTargetAchPcts[i].toFixed(2));
                        if (showRemaining[`target_${i}`]) totalRow[`${targetLabels[i]} Remaining`] = t - totalAch;
                      });
                      rows.push(totalRow);
                      const ws = XLSX.utils.json_to_sheet(rows);
                      const wb = XLSX.utils.book_new();
                      XLSX.utils.book_append_sheet(wb, ws, 'Achievement');
                      const vl = targetViewMode === 'division' ? 'Division' : targetViewMode === 'area' ? 'Area' : 'Plaza';
                      XLSX.writeFile(wb, `Current_Month_Achievement_${vl}.xlsx`);
                    }}
                    style={{
                      padding: '10px 20px',
                      background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                      color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer',
                      fontWeight: '600', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px',
                      boxShadow: '0 2px 8px rgba(17,153,142,0.3)'
                    }}
                  >
                    📥 Download Excel
                  </button>
                </div>

                {/* Table */}
                <div className="table-scroll" style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr>
                        <th onClick={() => handleSort('Division')} style={{ padding: '12px 10px', textAlign: 'left', cursor: 'pointer', userSelect: 'none' }}>Division{sortArrow('Division')}</th>
                        {(targetViewMode === 'area' || targetViewMode === 'plaza') && <th onClick={() => handleSort('Area')} style={{ padding: '12px 10px', textAlign: 'left', cursor: 'pointer', userSelect: 'none' }}>Area{sortArrow('Area')}</th>}
                        {targetViewMode === 'plaza' && <th onClick={() => handleSort('PlazaName')} style={{ padding: '12px 10px', textAlign: 'left', cursor: 'pointer', userSelect: 'none' }}>Plaza Name{sortArrow('PlazaName')}</th>}
                        {targetViewMode !== 'plaza' && <th onClick={() => handleSort('plazaCount')} style={{ padding: '12px 10px', textAlign: 'center', cursor: 'pointer', userSelect: 'none' }}>Plaza Count{sortArrow('plazaCount')}</th>}
                        <th onClick={() => handleSort('ach')} style={{ padding: '12px 10px', textAlign: 'right', cursor: 'pointer', userSelect: 'none' }}>Achievement{sortArrow('ach')}</th>
                        <th onClick={() => handleSort('profitAch')} style={{ padding: '12px 10px', textAlign: 'right', cursor: 'pointer', userSelect: 'none', background: 'linear-gradient(135deg, #1a9641 0%, #52b788 100%)', color: 'white' }}>Profit Ach{sortArrow('profitAch')}</th>
                        <th onClick={() => handleSort('growthPct')} style={{ padding: '12px 10px', textAlign: 'right', cursor: 'pointer', userSelect: 'none', background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)', color: 'white' }}>Growth %{sortArrow('growthPct')}</th>
                        <th onClick={() => handleSort('BaseTarget')} style={{ padding: '12px 10px', textAlign: 'right', cursor: 'pointer', userSelect: 'none', background: activeTargetSlab === -1 ? 'linear-gradient(135deg, #7f95f5 0%, #8d62bc 100%)' : undefined }}>Base Target{sortArrow('BaseTarget')}</th>
                        <th onClick={() => handleSort('baseAchPct')} style={{ padding: '12px 10px', textAlign: 'right', cursor: 'pointer', userSelect: 'none', background: activeTargetSlab === -1 ? 'linear-gradient(135deg, #7f95f5 0%, #8d62bc 100%)' : undefined }}>Base Ach %{sortArrow('baseAchPct')}</th>
                        {showRemaining['base'] && <th onClick={() => handleSort('baseRemaining')} style={{ padding: '12px 10px', textAlign: 'right', cursor: 'pointer', userSelect: 'none', background: '#ffeaa7' }}>Base Remaining{sortArrow('baseRemaining')}</th>}
                        {targetLabels.map((label, i) => (
                          <React.Fragment key={i}>
                            <th onClick={() => handleSort(`Target_${i}`)} style={{ padding: '12px 10px', textAlign: 'right', cursor: 'pointer', userSelect: 'none', background: activeTargetSlab === i ? 'linear-gradient(135deg, #7f95f5 0%, #8d62bc 100%)' : undefined }}>{label} Target{sortArrow(`Target_${i}`)}</th>
                            <th onClick={() => handleSort(`Target_${i}_pct`)} style={{ padding: '12px 10px', textAlign: 'right', cursor: 'pointer', userSelect: 'none', background: activeTargetSlab === i ? 'linear-gradient(135deg, #7f95f5 0%, #8d62bc 100%)' : undefined }}>{label} Ach %{sortArrow(`Target_${i}_pct`)}</th>
                            {showRemaining[`target_${i}`] && <th onClick={() => handleSort(`Target_${i}_remaining`)} style={{ padding: '12px 10px', textAlign: 'right', cursor: 'pointer', userSelect: 'none', background: '#ffeaa7' }}>{label} Remaining{sortArrow(`Target_${i}_remaining`)}</th>}
                          </React.Fragment>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sortedRows.map((row: any, idx: number) => (
                        <tr key={idx} style={{ background: idx % 2 === 0 ? 'white' : '#f8f9fa', borderBottom: '1px solid #eee' }}>
                          <td style={{ padding: '10px', fontWeight: targetViewMode === 'division' ? 'bold' : 'normal' }}>{row.Division}</td>
                          {(targetViewMode === 'area' || targetViewMode === 'plaza') && <td style={{ padding: '10px', fontWeight: targetViewMode === 'area' ? 'bold' : 'normal' }}>{row.Area}</td>}
                          {targetViewMode === 'plaza' && <td style={{ padding: '10px', fontWeight: '500' }}>{row.PlazaName}</td>}
                          {targetViewMode !== 'plaza' && <td style={{ padding: '10px', textAlign: 'center', color: '#666' }}>{row.plazaCount}</td>}
                          <td style={{ padding: '10px', textAlign: 'right', fontWeight: '500' }}>{row.ach !== null ? row.ach.toLocaleString() : <span style={{ color: '#999' }}>—</span>}</td>
                          {/* Profit Ach */}
                          <td style={{ padding: '10px', textAlign: 'right', fontWeight: '600', color: row.profitAch !== null ? (row.profitAch >= 0 ? '#28a745' : '#dc3545') : '#999' }}>
                            {row.profitAch !== null ? (row.profitAch >= 0 ? '+' : '') + row.profitAch.toLocaleString() : '—'}
                          </td>
                          {/* Growth % */}
                          <td style={{ padding: '10px', textAlign: 'right', fontWeight: '700', color: row.growthPct !== null ? (row.growthPct >= 0 ? '#28a745' : '#dc3545') : '#999' }}>
                            {row.growthPct !== null ? (row.growthPct >= 0 ? '+' : '') + row.growthPct.toFixed(2) + '%' : '—'}
                          </td>
                          {/* Base */}
                          <td style={{ padding: '10px', textAlign: 'right', background: activeTargetSlab === -1 ? '#f0f4f8' : 'transparent' }}>{(row.BaseTarget || 0).toLocaleString()}</td>
                          <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold', background: activeTargetSlab === -1 ? '#f0f4f8' : 'transparent', color: achPctColor(row.baseAchPct) }}>
                            {row.baseAchPct !== null ? row.baseAchPct.toFixed(2) + '%' : '—'}
                          </td>
                          {showRemaining['base'] && <td style={{ padding: '10px', textAlign: 'right', fontWeight: '600', background: '#ffeaa7', color: ((row.BaseTarget || 0) - (row.ach || 0)) > 0 ? '#dc3545' : '#28a745' }}>
                            {((row.BaseTarget || 0) - (row.ach || 0)).toLocaleString()}
                          </td>}
                          {/* Dynamic Targets */}
                          {(row.Targets || []).map((tgt: number, i: number) => (
                            <React.Fragment key={i}>
                              <td style={{ padding: '10px', textAlign: 'right', background: activeTargetSlab === i ? '#fff8e1' : 'transparent' }}>{(tgt || 0).toLocaleString()}</td>
                              <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold', background: activeTargetSlab === i ? '#fff8e1' : 'transparent', color: achPctColor(row.targetAchPcts?.[i]) }}>
                                {row.targetAchPcts?.[i] != null ? row.targetAchPcts[i].toFixed(2) + '%' : '—'}
                              </td>
                              {showRemaining[`target_${i}`] && <td style={{ padding: '10px', textAlign: 'right', fontWeight: '600', background: '#ffeaa7', color: ((tgt || 0) - (row.ach || 0)) > 0 ? '#dc3545' : '#28a745' }}>
                                {((tgt || 0) - (row.ach || 0)).toLocaleString()}
                              </td>}
                            </React.Fragment>
                          ))}
                        </tr>
                      ))}
                      {/* Total row */}
                      <tr style={{ background: '#2c3e50', color: 'white', fontWeight: 'bold', fontSize: '14px' }}>
                        <td colSpan={targetViewMode === 'division' ? 2 : targetViewMode === 'area' ? 3 : 3} style={{ padding: '12px 10px' }}>TOTAL</td>
                        <td style={{ padding: '12px 10px', textAlign: 'right' }}>{totalAch.toLocaleString()}</td>
                        {/* Total Profit Ach */}
                        <td style={{ padding: '12px 10px', textAlign: 'right', color: enriched.reduce((s,r) => s + (r.profitAch||0), 0) >= 0 ? '#4ade80' : '#f87171' }}>
                          {(() => { const t = enriched.reduce((s,r) => s + (r.profitAch||0), 0); return (t >= 0 ? '+' : '') + t.toLocaleString(); })()}
                        </td>
                        {/* Total Growth % */}
                        <td style={{ padding: '12px 10px', textAlign: 'right', color: (() => { const tp = enriched.reduce((s,r) => s + (r.prevAch||0), 0); const tc = totalAch; return tp > 0 ? ((tc-tp)/tp*100) : 0; })() >= 0 ? '#4ade80' : '#f87171' }}>
                          {(() => { const tp = enriched.reduce((s,r) => s + (r.prevAch||0), 0); if (tp <= 0) return '—'; const pct = ((totalAch - tp) / tp * 100); return (pct >= 0 ? '+' : '') + pct.toFixed(2) + '%'; })()}
                        </td>
                        <td style={{ padding: '12px 10px', textAlign: 'right' }}>{totalBase.toLocaleString()}</td>
                        <td style={{ padding: '12px 10px', textAlign: 'right', color: totalBaseAchPct >= 100 ? '#4ade80' : '#f87171' }}>{totalBaseAchPct.toFixed(2)}%</td>
                        {showRemaining['base'] && <td style={{ padding: '12px 10px', textAlign: 'right', background: '#ffeaa7', color: (totalBase - totalAch) > 0 ? '#f87171' : '#4ade80' }}>{(totalBase - totalAch).toLocaleString()}</td>}
                        {totalTargets.map((t, i) => (
                          <React.Fragment key={i}>
                            <td style={{ padding: '12px 10px', textAlign: 'right' }}>{t.toLocaleString()}</td>
                            <td style={{ padding: '12px 10px', textAlign: 'right', color: totalTargetAchPcts[i] >= 100 ? '#4ade80' : '#f87171' }}>{totalTargetAchPcts[i].toFixed(2)}%</td>
                            {showRemaining[`target_${i}`] && <td style={{ padding: '12px 10px', textAlign: 'right', background: '#ffeaa7', color: (t - totalAch) > 0 ? '#f87171' : '#4ade80' }}>{(t - totalAch).toLocaleString()}</td>}
                          </React.Fragment>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Note if ACH data is missing */}
                {currentYearData.length === 0 && (
                  <div style={{ marginTop: '15px', padding: '12px 16px', background: '#fff3cd', borderRadius: '8px', border: '1px solid #ffc107', color: '#856404', fontSize: '13px' }}>
                    ⚠️ <strong>Note:</strong> Achievement data is not loaded yet. Please upload the current year nine-criteria file in the "ACH Growth Comparison" section above to see achievement figures.
                  </div>
                )}
              </>
            );
          })()}
        </div>
      </div>
      {/* ===== END CURRENT MONTH ACHIEVEMENT SECTION ===== */}

      {/* ===== YEARLY TARGET ACHIEVEMENT SECTION ===== */}
      <div style={{
        background: 'white',
        marginBottom: '30px',
        borderRadius: '12px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
        overflow: 'hidden'
      }}>
        {/* Collapsible Header */}
        <div
          onClick={() => setIsYearlySectionOpen(!isYearlySectionOpen)}
          style={{
            padding: '20px 30px',
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            transition: 'background 0.2s ease'
          }}
          onMouseOver={(e) => e.currentTarget.style.background = 'linear-gradient(135deg, #0f3460 0%, #1a1a2e 50%, #16213e 100%)'}
          onMouseOut={(e) => e.currentTarget.style.background = 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)'}
        >
          <div>
            <h2 style={{ margin: '0 0 5px 0', color: 'white', fontSize: '24px' }}>
              Yearly Target Achievement
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.9)', margin: 0, fontSize: '14px' }}>
              Upload the yearly target file to see achievement against annual targets
            </p>
          </div>
          <span style={{ fontSize: '24px', color: 'white', transition: 'transform 0.3s ease', transform: isYearlySectionOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
            ▼
          </span>
        </div>

        {isYearlySectionOpen && (
        <div style={{ padding: '30px' }}>
          {/* Loading from DB indicator */}
          {isLoadingYearlyTarget && (
            <div style={{ textAlign: 'center', padding: '20px', color: '#16213e', fontSize: '14px', marginBottom: '15px' }}>
              <span style={{ fontSize: '24px', display: 'block', marginBottom: '8px', animation: 'spin 1s linear infinite' }}>⏳</span>
              Loading saved yearly target data from database...
            </div>
          )}

          {/* Toggle Upload Options Button */}
          <div style={{ textAlign: 'right', marginBottom: '15px' }}>
            <button 
              onClick={() => setShowYearlyTargetUploadOptions(!showYearlyTargetUploadOptions)}
              style={{
                background: 'none',
                border: 'none',
                color: '#16213e',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '14px',
                textDecoration: 'underline'
              }}
            >
              {showYearlyTargetUploadOptions ? 'Hide Upload Options' : 'Show Upload Options 🔒'}
            </button>
          </div>

          {showYearlyTargetUploadOptions && (
            <div style={{ marginBottom: '25px' }}>
              {!isYearlyTargetUploadUnlocked ? (
                <div style={{ textAlign: 'center', padding: '30px', background: '#f9f9f9', borderRadius: '8px', border: '1px solid #ddd' }}>
                  <h3 style={{ marginBottom: '10px', color: '#333' }}>🔒 Password Required</h3>
                  <p style={{ color: '#666', marginBottom: '15px', fontSize: '14px' }}>Please enter the password to upload or manage yearly files.</p>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                    <input
                      type="password"
                      placeholder="Enter password..."
                      value={yearlyTargetPasswordInput}
                      onChange={(e) => setYearlyTargetPasswordInput(e.target.value)}
                      style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid #ccc', outline: 'none', width: '200px' }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          if (yearlyTargetPasswordInput === '123456') {
                            setIsYearlyTargetUploadUnlocked(true);
                            setYearlyTargetPasswordInput('');
                          } else {
                            alert('Incorrect password!');
                          }
                        }
                      }}
                    />
                    <button
                      onClick={() => {
                        if (yearlyTargetPasswordInput === '123456') {
                          setIsYearlyTargetUploadUnlocked(true);
                          setYearlyTargetPasswordInput('');
                        } else {
                          alert('Incorrect password!');
                        }
                      }}
                      style={{ padding: '8px 16px', background: '#16213e', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      Unlock
                    </button>
                  </div>
                </div>
              ) : (
                <>
                {/* Upload Box - Yearly Target */}
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDraggingYearlyTarget(true); }}
                  onDragLeave={(e) => { e.preventDefault(); setIsDraggingYearlyTarget(false); }}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDraggingYearlyTarget(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
                      processYearlyTargetFile(file);
                    }
                  }}
                  style={{
                    border: isDraggingYearlyTarget ? '2px dashed #16213e' : '2px dashed #ddd',
                    background: isDraggingYearlyTarget ? '#e8ecf1' : yearlyTargetData.length > 0 ? '#e8f5e9' : '#f9f9f9',
                    padding: '20px',
                    textAlign: 'center',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    marginBottom: '25px'
                  }}
                >
                  {yearlyTargetData.length > 0 ? (
                    <div>
                      <div style={{ fontSize: '32px', marginBottom: '8px' }}>✅</div>
                      <p style={{ color: '#28a745', fontWeight: 'bold', marginBottom: '4px', fontSize: '14px' }}>Yearly Target File Loaded</p>
                      <p style={{ fontSize: '12px', color: '#666', marginBottom: '6px' }}>{yearlyTargetData.length} plazas loaded</p>
                      {savedYearlyLabel && (
                        <p style={{ fontSize: '11px', color: '#16213e', fontWeight: '600', marginBottom: '10px' }}>
                          {savedYearlyLabel}
                        </p>
                      )}

                      <div style={{ 
                        background: 'linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%)',
                        padding: '12px 20px',
                        borderRadius: '8px',
                        marginBottom: '10px'
                      }}>
                        <p style={{ 
                          fontSize: '16px', 
                          color: 'white', 
                          fontWeight: 'bold',
                          margin: 0,
                          letterSpacing: '0.5px'
                        }}>
                          Data Updated: {formatTimestamp(yearlyTargetUploadedAt)}
                        </p>
                      </div>

                      <div style={{ marginBottom: '8px' }}>
                        {yearlySaveStatus === 'saving' && (
                          <span style={{ display: 'inline-block', padding: '3px 10px', background: '#fff3cd', color: '#856404', borderRadius: '15px', fontSize: '11px', fontWeight: '600' }}>
                            ☁️ Saving...
                          </span>
                        )}
                        {yearlySaveStatus === 'saved' && (
                          <span style={{ display: 'inline-block', padding: '3px 10px', background: '#d4edda', color: '#155724', borderRadius: '15px', fontSize: '11px', fontWeight: '600' }}>
                            ✅ Saved
                          </span>
                        )}
                        {yearlySaveStatus === 'error' && (
                          <span style={{ display: 'inline-block', padding: '3px 10px', background: '#f8d7da', color: '#721c24', borderRadius: '15px', fontSize: '11px', fontWeight: '600' }}>
                            ❌ Failed
                          </span>
                        )}
                        {yearlySaveStatus === 'idle' && savedYearlyLabel && (
                          <span style={{ display: 'inline-block', padding: '3px 10px', background: '#d1ecf1', color: '#0c5460', borderRadius: '15px', fontSize: '11px', fontWeight: '600' }}>
                            ☁️ Synced
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <label style={{
                          display: 'inline-block',
                          padding: '6px 16px',
                          background: '#16213e',
                          color: 'white',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}>
                          Re-upload
                          <input type="file" accept=".xls,.xlsx" onChange={(e) => { const f = e.target.files?.[0]; if (f) processYearlyTargetFile(f); }} style={{ display: 'none' }} />
                        </label>
                        <button
                          onClick={clearFirestoreYearlyTarget}
                          style={{
                            padding: '6px 16px',
                            background: '#dc3545',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          Clear Data
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div style={{ fontSize: '36px', marginBottom: '10px' }}>📅</div>
                      <p style={{ fontSize: '14px', color: '#666', marginBottom: '15px' }}>
                        {isDraggingYearlyTarget ? 'Drop the yearly target file here' : 'Drag & drop the yearly target Excel file or click to browse'}
                      </p>
                      <p style={{ fontSize: '12px', color: '#888', marginBottom: '15px', fontStyle: 'italic' }}>
                        Previously saved data loads automatically from Firebase on each visit
                      </p>
                      <label style={{
                        display: 'inline-block',
                        padding: '10px 20px',
                        background: '#16213e',
                        color: 'white',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500'
                      }}>
                        Browse Files
                        <input type="file" accept=".xls,.xlsx" onChange={(e) => { const f = e.target.files?.[0]; if (f) processYearlyTargetFile(f); }} style={{ display: 'none' }} />
                      </label>
                      <p style={{ fontSize: '12px', color: '#999', marginTop: '12px' }}>Supported formats: .xlsx, .xls</p>
                    </>
                  )}
                </div>

                {/* Yearly Achievement File Upload */}
                <div style={{ marginBottom: '20px', padding: '20px', background: '#f0f4ff', borderRadius: '8px', border: '1px solid #cce5ff' }}>
                  <h4 style={{ margin: '0 0 10px 0', color: '#16213e', fontSize: '16px' }}>Yearly Achievement File</h4>
                  <p style={{ fontSize: '13px', color: '#666', marginBottom: '15px' }}>Upload the nine-criteria achievement Excel file for yearly data</p>
                  {isLoadingYearlyAch && <div style={{ textAlign: 'center', padding: '10px', color: '#16213e', fontSize: '13px', marginBottom: '10px' }}>Loading saved achievement data from database...</div>}
                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsDraggingYearlyAch(true); }}
                    onDragLeave={(e) => { e.preventDefault(); setIsDraggingYearlyAch(false); }}
                    onDrop={(e) => { e.preventDefault(); setIsDraggingYearlyAch(false); const file = e.dataTransfer.files?.[0]; if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) { const reader = new FileReader(); reader.onload = (ev) => { const data = new Uint8Array(ev.target?.result as ArrayBuffer); const workbook = XLSX.read(data, { type: 'array' }); const sheet = workbook.Sheets[workbook.SheetNames[0]]; const raw: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 }); const parsedData = parseExcelRows(raw); setYearlyAchievementData(parsedData); saveYearlyAchToFirestore(parsedData); }; reader.readAsArrayBuffer(file); } }}
                    style={{ border: isDraggingYearlyAch ? '2px dashed #16213e' : '2px dashed #ccc', background: isDraggingYearlyAch ? '#e8ecf1' : yearlyAchievementData.length > 0 ? '#e8f5e9' : '#fafafa', padding: '20px', textAlign: 'center', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.3s ease' }}
                  >
                    {yearlyAchievementData.length > 0 ? (
                      <div>
                        <div style={{ fontSize: '28px', marginBottom: '6px' }}>✅</div>
                        <p style={{ color: '#28a745', fontWeight: 'bold', marginBottom: '4px', fontSize: '14px' }}>Yearly Achievement File Loaded</p>
                        <p style={{ fontSize: '12px', color: '#666', marginBottom: '6px' }}>{yearlyAchievementData.length} plazas loaded</p>
                        {yearlyAchUploadedAt && <p style={{ fontSize: '11px', color: '#666', marginBottom: '8px' }}>Updated: {formatTimestamp(yearlyAchUploadedAt)}</p>}
                        <div style={{ marginBottom: '6px' }}>
                          {yearlyAchSaveStatus === 'saving' && <span style={{ padding: '2px 8px', background: '#fff3cd', color: '#856404', borderRadius: '12px', fontSize: '11px' }}>☁️ Saving...</span>}
                          {yearlyAchSaveStatus === 'saved' && <span style={{ padding: '2px 8px', background: '#d4edda', color: '#155724', borderRadius: '12px', fontSize: '11px' }}>✅ Saved</span>}
                          {yearlyAchSaveStatus === 'error' && <span style={{ padding: '2px 8px', background: '#f8d7da', color: '#721c24', borderRadius: '12px', fontSize: '11px' }}>❌ Failed</span>}
                        </div>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                          <label style={{ display: 'inline-block', padding: '5px 14px', background: '#16213e', color: 'white', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>
                            Re-upload
                            <input type="file" accept=".xls,.xlsx" onChange={(e) => { const f = e.target.files?.[0]; if (f) { const reader = new FileReader(); reader.onload = (ev) => { const data = new Uint8Array(ev.target?.result as ArrayBuffer); const workbook = XLSX.read(data, { type: 'array' }); const sheet = workbook.Sheets[workbook.SheetNames[0]]; const raw: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 }); const parsedData = parseExcelRows(raw); setYearlyAchievementData(parsedData); saveYearlyAchToFirestore(parsedData); }; reader.readAsArrayBuffer(f); } }} style={{ display: 'none' }} />
                          </label>
                          <button onClick={clearFirestoreYearlyAch} style={{ padding: '5px 14px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>Clear</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div style={{ fontSize: '32px', marginBottom: '8px' }}>📊</div>
                        <p style={{ fontSize: '13px', color: '#666', marginBottom: '10px' }}>{isDraggingYearlyAch ? 'Drop the file here' : 'Drag & drop the nine-criteria Excel file or click to browse'}</p>
                        <label style={{ display: 'inline-block', padding: '8px 18px', background: '#16213e', color: 'white', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}>
                          Browse Files
                          <input type="file" accept=".xls,.xlsx" onChange={(e) => { const f = e.target.files?.[0]; if (f) { const reader = new FileReader(); reader.onload = (ev) => { const data = new Uint8Array(ev.target?.result as ArrayBuffer); const workbook = XLSX.read(data, { type: 'array' }); const sheet = workbook.Sheets[workbook.SheetNames[0]]; const raw: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 }); const parsedData = parseExcelRows(raw); setYearlyAchievementData(parsedData); saveYearlyAchToFirestore(parsedData); }; reader.readAsArrayBuffer(f); } }} style={{ display: 'none' }} />
                        </label>
                      </>
                    )}
                  </div>
                </div>

                {/* Collection Achievement Files */}
                <div style={{ marginBottom: '20px', padding: '20px', background: '#fefce8', borderRadius: '8px', border: '1px solid #fde68a' }}>
                  <h4 style={{ margin: '0 0 10px 0', color: '#92400e', fontSize: '16px' }}>Collection Achievement Files</h4>
                  <p style={{ fontSize: '13px', color: '#666', marginBottom: '15px' }}>Upload collection-specific ach files for more precise Collection Ach calculation</p>

                  {/* Collection File 1 */}
                  <div style={{ marginBottom: '20px', padding: '15px', background: 'white', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                    <h5 style={{ margin: '0 0 5px 0', color: '#374151', fontSize: '14px' }}>Collection File 1 (Custom Format)</h5>
                    <p style={{ fontSize: '12px', color: '#888', marginBottom: '10px' }}>Categories: Rank, Plaza, Total Marks, Total, Survey, Retail, Hire Sales, <b>Hire Collection</b>, Dealer Sales, <b>Dealer Collection</b>, Corporate Sales, <b>Corporate Collection</b>, Fridge, TV, AC, HAP, KAP, EAP, Mobile, Computer, Profit, Old Stock, Digital Hire, Sales Contribution, Collection Contribution, Profit Contribution</p>
                    {isLoadingCollAch1 && <div style={{ textAlign: 'center', padding: '8px', color: '#92400e', fontSize: '12px' }}>Loading...</div>}
                    <div
                      onDragOver={(e) => { e.preventDefault(); setIsDraggingCollAch1(true); }}
                      onDragLeave={(e) => { e.preventDefault(); setIsDraggingCollAch1(false); }}
                      onDrop={(e) => { e.preventDefault(); setIsDraggingCollAch1(false); const file = e.dataTransfer.files?.[0]; if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) { const reader = new FileReader(); reader.onload = (ev) => { const data = new Uint8Array(ev.target?.result as ArrayBuffer); const workbook = XLSX.read(data, { type: 'array' }); const sheet = workbook.Sheets[workbook.SheetNames[0]]; const raw: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 }); const firstRow = raw[0] && isNaN(parseFloat((raw[0][1] || '').toString().replace(/,/g, ''))) ? 1 : 0; const rows = raw.slice(firstRow); const parsed: YearlyCollRow1New[] = rows.map(r => ({ Plaza: (r[1] || '').toString().trim(), HireCollectionAch: parseFloat((r[18] || '').toString().replace(/,/g, '')) || 0, DealerCollectionAch: parseFloat((r[26] || '').toString().replace(/,/g, '')) || 0, CorpCollectionAch: parseFloat((r[34] || '').toString().replace(/,/g, '')) || 0 })).filter(d => d.Plaza && d.Plaza !== '' && d.Plaza.toLowerCase() !== 'plaza'); setYearlyCollAch1(parsed); saveCollAch1ToFirestore(parsed); }; reader.readAsArrayBuffer(file); } }}
                      style={{ border: isDraggingCollAch1 ? '2px dashed #92400e' : '2px dashed #ddd', background: isDraggingCollAch1 ? '#fffbeb' : yearlyCollAch1.length > 0 ? '#f0fdf4' : '#fafafa', padding: '15px', textAlign: 'center', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.3s ease' }}
                    >
                      {yearlyCollAch1.length > 0 ? (
                        <div>
                          <span style={{ fontSize: '16px' }}>✅ File 1 Loaded ({yearlyCollAch1.length} plazas)</span>
                          {collAch1UploadedAt && <p style={{ fontSize: '11px', color: '#888', margin: '4px 0' }}>Updated: {formatTimestamp(collAch1UploadedAt)}</p>}
                          <div style={{ marginTop: '6px', display: 'flex', gap: '6px', justifyContent: 'center' }}>
                            <label style={{ padding: '4px 12px', background: '#92400e', color: 'white', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}>
                              Re-upload
                              <input type="file" accept=".xls,.xlsx" onChange={(e) => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = (ev) => { const d = new Uint8Array(ev.target?.result as ArrayBuffer); const wb = XLSX.read(d, { type: 'array' }); const s = wb.Sheets[wb.SheetNames[0]]; const raw: any[][] = XLSX.utils.sheet_to_json(s, { header: 1 }); const fr = raw[0] && isNaN(parseFloat((raw[0][1] || '').toString().replace(/,/g, ''))) ? 1 : 0; const rows = raw.slice(fr); const p: YearlyCollRow1New[] = rows.map(r => ({ Plaza: (r[1] || '').toString().trim(), HireCollectionAch: parseFloat((r[18] || '').toString().replace(/,/g, '')) || 0, DealerCollectionAch: parseFloat((r[26] || '').toString().replace(/,/g, '')) || 0, CorpCollectionAch: parseFloat((r[34] || '').toString().replace(/,/g, '')) || 0 })).filter(d => d.Plaza && d.Plaza !== '' && d.Plaza.toLowerCase() !== 'plaza'); setYearlyCollAch1(p); saveCollAch1ToFirestore(p); }; r.readAsArrayBuffer(f); } }} style={{ display: 'none' }} />
                            </label>
                            <button onClick={clearFirestoreCollAch1} style={{ padding: '4px 12px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}>Clear</button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <p style={{ fontSize: '12px', color: '#888', margin: 0 }}>{isDraggingCollAch1 ? 'Drop file here' : 'Drag & drop or click to browse'}</p>
                          <label style={{ display: 'inline-block', marginTop: '8px', padding: '6px 14px', background: '#92400e', color: 'white', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
                            Browse
                            <input type="file" accept=".xls,.xlsx" onChange={(e) => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = (ev) => { const d = new Uint8Array(ev.target?.result as ArrayBuffer); const wb = XLSX.read(d, { type: 'array' }); const s = wb.Sheets[wb.SheetNames[0]]; const raw: any[][] = XLSX.utils.sheet_to_json(s, { header: 1 }); const fr = raw[0] && isNaN(parseFloat((raw[0][1] || '').toString().replace(/,/g, ''))) ? 1 : 0; const rows = raw.slice(fr); const p: YearlyCollRow1New[] = rows.map(r => ({ Plaza: (r[1] || '').toString().trim(), HireCollectionAch: parseFloat((r[18] || '').toString().replace(/,/g, '')) || 0, DealerCollectionAch: parseFloat((r[26] || '').toString().replace(/,/g, '')) || 0, CorpCollectionAch: parseFloat((r[34] || '').toString().replace(/,/g, '')) || 0 })).filter(d => d.Plaza && d.Plaza !== '' && d.Plaza.toLowerCase() !== 'plaza'); setYearlyCollAch1(p); saveCollAch1ToFirestore(p); }; r.readAsArrayBuffer(f); } }} style={{ display: 'none' }} />
                          </label>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Collection File 2 */}
                  <div style={{ padding: '15px', background: 'white', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                    <h5 style={{ margin: '0 0 5px 0', color: '#374151', fontSize: '14px' }}>Collection File 2 (Cash/Hire/Dealer/Corp Format)</h5>
                    <p style={{ fontSize: '12px', color: '#888', marginBottom: '10px' }}>Columns: Plaza Name (B), Cash Collection (D), Hire Collection (E), Dealer (G), Cor. Collection (H), Total Collection (J)</p>
                    {isLoadingCollAch2 && <div style={{ textAlign: 'center', padding: '8px', color: '#92400e', fontSize: '12px' }}>Loading...</div>}
                    <div
                      onDragOver={(e) => { e.preventDefault(); setIsDraggingCollAch2(true); }}
                      onDragLeave={(e) => { e.preventDefault(); setIsDraggingCollAch2(false); }}
                      onDrop={(e) => { e.preventDefault(); setIsDraggingCollAch2(false); const file = e.dataTransfer.files?.[0]; if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) { const reader = new FileReader(); reader.onload = (ev) => { const data = new Uint8Array(ev.target?.result as ArrayBuffer); const workbook = XLSX.read(data, { type: 'array' }); const sheet = workbook.Sheets[workbook.SheetNames[0]]; const raw: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 }); const firstRow = raw[0] && isNaN(parseFloat((raw[0][1] || '').toString().replace(/,/g, ''))) ? 1 : 0; const rows = raw.slice(firstRow); const parsed: YearlyCollRow2[] = rows.map(r => ({ PlazaName: (r[1] || '').toString().trim(), CashCollection: parseFloat((r[3] || '').toString().replace(/,/g, '')) || 0, HireCollection: parseFloat((r[4] || '').toString().replace(/,/g, '')) || 0, DealerCollection: parseFloat((r[6] || '').toString().replace(/,/g, '')) || 0, CorpCollection: parseFloat((r[7] || '').toString().replace(/,/g, '')) || 0, TotalCollection: parseFloat((r[9] || '').toString().replace(/,/g, '')) || 0 })).filter(d => d.PlazaName && d.PlazaName !== '' && d.PlazaName.toLowerCase() !== 'plaza name'); setYearlyCollAch2(parsed); saveCollAch2ToFirestore(parsed); }; reader.readAsArrayBuffer(file); } }}
                      style={{ border: isDraggingCollAch2 ? '2px dashed #92400e' : '2px dashed #ddd', background: isDraggingCollAch2 ? '#fffbeb' : yearlyCollAch2.length > 0 ? '#f0fdf4' : '#fafafa', padding: '15px', textAlign: 'center', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.3s ease' }}
                    >
                      {yearlyCollAch2.length > 0 ? (
                        <div>
                          <span style={{ fontSize: '16px' }}>✅ File 2 Loaded ({yearlyCollAch2.length} plazas)</span>
                          {collAch2UploadedAt && <p style={{ fontSize: '11px', color: '#888', margin: '4px 0' }}>Updated: {formatTimestamp(collAch2UploadedAt)}</p>}
                          <div style={{ marginTop: '6px', display: 'flex', gap: '6px', justifyContent: 'center' }}>
                            <label style={{ padding: '4px 12px', background: '#92400e', color: 'white', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}>
                              Re-upload
                              <input type="file" accept=".xls,.xlsx" onChange={(e) => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = (ev) => { const d = new Uint8Array(ev.target?.result as ArrayBuffer); const wb = XLSX.read(d, { type: 'array' }); const s = wb.Sheets[wb.SheetNames[0]]; const raw: any[][] = XLSX.utils.sheet_to_json(s, { header: 1 }); const fr = raw[0] && isNaN(parseFloat((raw[0][1] || '').toString().replace(/,/g, ''))) ? 1 : 0; const rows = raw.slice(fr); const p = rows.map(r => ({ PlazaName: (r[1] || '').toString().trim(), CashCollection: parseFloat((r[3] || '').toString().replace(/,/g, '')) || 0, HireCollection: parseFloat((r[4] || '').toString().replace(/,/g, '')) || 0, DealerCollection: parseFloat((r[6] || '').toString().replace(/,/g, '')) || 0, CorpCollection: parseFloat((r[7] || '').toString().replace(/,/g, '')) || 0, TotalCollection: parseFloat((r[9] || '').toString().replace(/,/g, '')) || 0 })).filter(d => d.PlazaName && d.PlazaName !== '' && d.PlazaName.toLowerCase() !== 'plaza name'); setYearlyCollAch2(p); saveCollAch2ToFirestore(p); }; r.readAsArrayBuffer(f); } }} style={{ display: 'none' }} />
                            </label>
                            <button onClick={clearFirestoreCollAch2} style={{ padding: '4px 12px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}>Clear</button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <p style={{ fontSize: '12px', color: '#888', margin: 0 }}>{isDraggingCollAch2 ? 'Drop file here' : 'Drag & drop or click to browse'}</p>
                          <label style={{ display: 'inline-block', marginTop: '8px', padding: '6px 14px', background: '#92400e', color: 'white', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
                            Browse
                            <input type="file" accept=".xls,.xlsx" onChange={(e) => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = (ev) => { const d = new Uint8Array(ev.target?.result as ArrayBuffer); const wb = XLSX.read(d, { type: 'array' }); const s = wb.Sheets[wb.SheetNames[0]]; const raw: any[][] = XLSX.utils.sheet_to_json(s, { header: 1 }); const fr = raw[0] && isNaN(parseFloat((raw[0][1] || '').toString().replace(/,/g, ''))) ? 1 : 0; const rows = raw.slice(fr); const p = rows.map(r => ({ PlazaName: (r[1] || '').toString().trim(), CashCollection: parseFloat((r[3] || '').toString().replace(/,/g, '')) || 0, HireCollection: parseFloat((r[4] || '').toString().replace(/,/g, '')) || 0, DealerCollection: parseFloat((r[6] || '').toString().replace(/,/g, '')) || 0, CorpCollection: parseFloat((r[7] || '').toString().replace(/,/g, '')) || 0, TotalCollection: parseFloat((r[9] || '').toString().replace(/,/g, '')) || 0 })).filter(d => d.PlazaName && d.PlazaName !== '' && d.PlazaName.toLowerCase() !== 'plaza name'); setYearlyCollAch2(p); saveCollAch2ToFirestore(p); }; r.readAsArrayBuffer(f); } }} style={{ display: 'none' }} />
                          </label>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                </>
              )}
            </div>
          )}

          {/* Results */}
          {yearlyTargetData.length > 0 && (() => {
            const yearlyDivisions = [...new Set(yearlyTargetData.map(d => d.Division))];
            const yearlyAreas = [...new Set(
              yearlyTargetData
                .filter(d => !yearlyTargetDivisionFilter || d.Division === yearlyTargetDivisionFilter)
                .map(d => d.Area)
            )];

            const filteredYearlyTarget = yearlyTargetData.filter(t =>
              (!yearlyTargetDivisionFilter || t.Division === yearlyTargetDivisionFilter) &&
              (!yearlyTargetAreaFilter || t.Area === yearlyTargetAreaFilter)
            );

            const sourceAchData = yearlyAchievementData.length > 0 ? yearlyAchievementData : currentYearData;

            // Helper: get collection ach from the two dedicated collection files
            const getCollectionAch = (plazaName: string): number | null => {
              let total = 0;
              let hasData = false;
              // Collection File 2: Cash (D) + Hire (E)
              const row2 = yearlyCollAch2.find(r =>
                r.PlazaName?.toString().trim().toLowerCase() === plazaName?.toString().trim().toLowerCase()
              );
              if (row2) {
                total += (row2.CashCollection || 0) + (row2.HireCollection || 0);
                hasData = true;
              }
              // Collection File 1: Dealer Collection Ach + Corp Collection Ach
              const row1 = yearlyCollAch1.find(r =>
                r.Plaza?.toString().trim().toLowerCase() === plazaName?.toString().trim().toLowerCase()
              );
              if (row1) {
                total += (row1.DealerCollectionAch || 0) + (row1.CorpCollectionAch || 0);
                hasData = true;
              }
              // Fallback to main ach data if neither file has data
              if (!hasData) {
                const achRow = sourceAchData.find(c =>
                  c.Plaza?.toString().trim().toLowerCase() === plazaName?.toString().trim().toLowerCase()
                );
                if (achRow) return (achRow.Hire_DP_Ach || 0) + (achRow.Hire_LPR_Ach || 0) + (achRow.Dealer_Collection_Ach || 0) + (achRow.Corporate_Collection_Ach || 0);
                return null;
              }
              return total;
            };

            // Match achievement from yearly achievement data (or fallback to current year data)
            const enrichedYearly = filteredYearlyTarget.map(t => {
              const achRow = sourceAchData.find(c =>
                c.Plaza?.toString().trim().toLowerCase() === t.PlazaName?.toString().trim().toLowerCase()
              );
              const salesAch = achRow ? (achRow.Total_Ach || 0) : null;
              const collectionAch = getCollectionAch(t.PlazaName);
              const profitAch = achRow ? (achRow.Net_Profit_Ach || 0) : null;
              return {
                ...t,
                salesAch,
                collectionAch,
                profitAch,
                salesAchPct: (salesAch !== null && t.SalesTarget > 0) ? (salesAch / t.SalesTarget * 100) : null,
                collectionAchPct: (collectionAch !== null && t.CollectionTarget > 0) ? (collectionAch / t.CollectionTarget * 100) : null,
                profitAchPct: (profitAch !== null && t.NetProfitTarget > 0) ? (profitAch / t.NetProfitTarget * 100) : null,
                profitMgrAchPct: (profitAch !== null && t.ProfitTargetManager > 0) ? (profitAch / t.ProfitTargetManager * 100) : null,
                profitMgrPlus2AchPct: (profitAch !== null && t.ProfitTargetManagerPlus2 > 0) ? (profitAch / t.ProfitTargetManagerPlus2 * 100) : null,
                profitAllAchPct: (profitAch !== null && t.ProfitTargetAllEmployee > 0) ? (profitAch / t.ProfitTargetAllEmployee * 100) : null,
              };
            });

            // Include plazas from ach data with no matching yearly target row
            const yearlyPlazaNames = new Set(filteredYearlyTarget.map(t => t.PlazaName?.toString().trim().toLowerCase()));
            const currentYearFilteredYearly = sourceAchData.filter(c => {
              const matchesDivision = !yearlyTargetDivisionFilter || c.Division === yearlyTargetDivisionFilter;
              const matchesArea = !yearlyTargetAreaFilter || c.Area === yearlyTargetAreaFilter;
              return matchesDivision && matchesArea;
            });
            const unmatchedYearlyCurrent = currentYearFilteredYearly.filter(c =>
              !yearlyPlazaNames.has(c.Plaza?.toString().trim().toLowerCase())
            ).map(c => {
              const salesAch = c.Total_Ach || 0;
              const collectionAch = getCollectionAch(c.Plaza) ?? ((c.Hire_DP_Ach || 0) + (c.Hire_LPR_Ach || 0) + (c.Dealer_Collection_Ach || 0) + (c.Corporate_Collection_Ach || 0));
              const profitAch = c.Net_Profit_Ach || 0;
              return {
                Division: c.Division || '',
                Area: c.Area || '',
                PlazaName: c.Plaza || '',
                SalesTarget: 0,
                CollectionTarget: 0,
                NetProfitTarget: 0,
                ProfitTargetManager: 0,
                ProfitTargetManagerPlus2: 0,
                ProfitTargetAllEmployee: 0,
                salesAch,
                collectionAch,
                profitAch,
                salesAchPct: null as number | null,
                collectionAchPct: null as number | null,
                profitAchPct: null as number | null,
                profitMgrAchPct: null as number | null,
                profitMgrPlus2AchPct: null as number | null,
                profitAllAchPct: null as number | null,
              };
            });

            const allEnrichedYearly = [...enrichedYearly, ...unmatchedYearlyCurrent];

            // Aggregations
            const yearlyDivisionWise = Object.values(allEnrichedYearly.reduce((acc, row) => {
              const div = row.Division || 'Unknown';
              if (!acc[div]) {
                acc[div] = { Division: div, SalesTarget: 0, CollectionTarget: 0, NetProfitTarget: 0, ProfitTargetManager: 0, ProfitTargetManagerPlus2: 0, ProfitTargetAllEmployee: 0, salesAch: 0, collectionAch: 0, profitAch: 0, plazaCount: 0 };
              }
              acc[div].SalesTarget += row.SalesTarget;
              acc[div].CollectionTarget += row.CollectionTarget;
              acc[div].NetProfitTarget += row.NetProfitTarget;
              acc[div].ProfitTargetManager += row.ProfitTargetManager;
              acc[div].ProfitTargetManagerPlus2 += row.ProfitTargetManagerPlus2;
              acc[div].ProfitTargetAllEmployee += row.ProfitTargetAllEmployee;
              acc[div].salesAch += row.salesAch || 0;
              acc[div].collectionAch += row.collectionAch || 0;
              acc[div].profitAch += row.profitAch || 0;
              acc[div].plazaCount += 1;
              return acc;
            }, {} as Record<string, any>)).map((row: any) => ({
              ...row,
              salesAchPct: row.SalesTarget > 0 ? (row.salesAch / row.SalesTarget * 100) : null,
              collectionAchPct: row.CollectionTarget > 0 ? (row.collectionAch / row.CollectionTarget * 100) : null,
              profitAchPct: row.NetProfitTarget > 0 ? (row.profitAch / row.NetProfitTarget * 100) : null,
              profitMgrAchPct: row.ProfitTargetManager > 0 ? (row.profitAch / row.ProfitTargetManager * 100) : null,
              profitMgrPlus2AchPct: row.ProfitTargetManagerPlus2 > 0 ? (row.profitAch / row.ProfitTargetManagerPlus2 * 100) : null,
              profitAllAchPct: row.ProfitTargetAllEmployee > 0 ? (row.profitAch / row.ProfitTargetAllEmployee * 100) : null,
            }));

            const yearlyAreaWise = Object.values(allEnrichedYearly.reduce((acc, row) => {
              const key = `${row.Division}|${row.Area}`;
              if (!acc[key]) {
                acc[key] = { Division: row.Division || 'Unknown', Area: row.Area || 'Unknown', SalesTarget: 0, CollectionTarget: 0, NetProfitTarget: 0, ProfitTargetManager: 0, ProfitTargetManagerPlus2: 0, ProfitTargetAllEmployee: 0, salesAch: 0, collectionAch: 0, profitAch: 0, plazaCount: 0 };
              }
              acc[key].SalesTarget += row.SalesTarget;
              acc[key].CollectionTarget += row.CollectionTarget;
              acc[key].NetProfitTarget += row.NetProfitTarget;
              acc[key].ProfitTargetManager += row.ProfitTargetManager;
              acc[key].ProfitTargetManagerPlus2 += row.ProfitTargetManagerPlus2;
              acc[key].ProfitTargetAllEmployee += row.ProfitTargetAllEmployee;
              acc[key].salesAch += row.salesAch || 0;
              acc[key].collectionAch += row.collectionAch || 0;
              acc[key].profitAch += row.profitAch || 0;
              acc[key].plazaCount += 1;
              return acc;
            }, {} as Record<string, any>)).map((row: any) => ({
              ...row,
              salesAchPct: row.SalesTarget > 0 ? (row.salesAch / row.SalesTarget * 100) : null,
              collectionAchPct: row.CollectionTarget > 0 ? (row.collectionAch / row.CollectionTarget * 100) : null,
              profitAchPct: row.NetProfitTarget > 0 ? (row.profitAch / row.NetProfitTarget * 100) : null,
              profitMgrAchPct: row.ProfitTargetManager > 0 ? (row.profitAch / row.ProfitTargetManager * 100) : null,
              profitMgrPlus2AchPct: row.ProfitTargetManagerPlus2 > 0 ? (row.profitAch / row.ProfitTargetManagerPlus2 * 100) : null,
              profitAllAchPct: row.ProfitTargetAllEmployee > 0 ? (row.profitAch / row.ProfitTargetAllEmployee * 100) : null,
            }));

            // Totals
            const yTotalSalesTarget = allEnrichedYearly.reduce((s, r) => s + r.SalesTarget, 0);
            const yTotalCollectionTarget = allEnrichedYearly.reduce((s, r) => s + r.CollectionTarget, 0);
            const yTotalNetProfitTarget = allEnrichedYearly.reduce((s, r) => s + r.NetProfitTarget, 0);
            const yTotalProfitMgrTarget = allEnrichedYearly.reduce((s, r) => s + r.ProfitTargetManager, 0);
            const yTotalProfitMgrPlus2Target = allEnrichedYearly.reduce((s, r) => s + r.ProfitTargetManagerPlus2, 0);
            const yTotalProfitAllTarget = allEnrichedYearly.reduce((s, r) => s + r.ProfitTargetAllEmployee, 0);
            const yTotalSalesAch = allEnrichedYearly.reduce((s, r) => s + (r.salesAch || 0), 0);
            const yTotalCollectionAch = allEnrichedYearly.reduce((s, r) => s + (r.collectionAch || 0), 0);
            const yTotalProfitAch = allEnrichedYearly.reduce((s, r) => s + (r.profitAch || 0), 0);

            const achPctColor = (pct: number | null) => {
              if (pct === null) return '#999';
              if (pct >= 100) return '#28a745';
              if (pct >= 80) return '#ff9800';
              return '#dc3545';
            };

            // Sorting
            const yrBaseRows = yearlyTargetViewMode === 'division' ? yearlyDivisionWise : yearlyTargetViewMode === 'area' ? yearlyAreaWise : allEnrichedYearly;
            const sortedYearlyRows = (() => {
              if (!yearlyTargetSortColumn) return yrBaseRows;
              const dir = yearlyTargetSortDir === 'asc' ? 1 : -1;
              const getVal = (row: any) => {
                switch (yearlyTargetSortColumn) {
                  case 'Division': return (row.Division || '').toString().toLowerCase();
                  case 'Area': return (row.Area || '').toString().toLowerCase();
                  case 'PlazaName': return (row.PlazaName || '').toString().toLowerCase();
                  case 'plazaCount': return row.plazaCount ?? 0;
                  case 'salesAch': return row.salesAch ?? -Infinity;
                  case 'collectionAch': return row.collectionAch ?? -Infinity;
                  case 'profitAch': return row.profitAch ?? -Infinity;
                  case 'SalesTarget': return row.SalesTarget ?? 0;
                  case 'CollectionTarget': return row.CollectionTarget ?? 0;
                  case 'NetProfitTarget': return row.NetProfitTarget ?? 0;
                  case 'ProfitTargetManager': return row.ProfitTargetManager ?? 0;
                  case 'ProfitTargetManagerPlus2': return row.ProfitTargetManagerPlus2 ?? 0;
                  case 'ProfitTargetAllEmployee': return row.ProfitTargetAllEmployee ?? 0;
                  case 'salesAchPct': return row.salesAchPct ?? -Infinity;
                  case 'collectionAchPct': return row.collectionAchPct ?? -Infinity;
                  case 'profitAchPct': return row.profitAchPct ?? -Infinity;
                  case 'profitMgrAchPct': return row.profitMgrAchPct ?? -Infinity;
                  case 'profitMgrPlus2AchPct': return row.profitMgrPlus2AchPct ?? -Infinity;
                  case 'profitAllAchPct': return row.profitAllAchPct ?? -Infinity;
                  default: return 0;
                }
              };
              return [...yrBaseRows].sort((a, b) => {
                const va = getVal(a);
                const vb = getVal(b);
                if (typeof va === 'string' && typeof vb === 'string') {
                  return va.localeCompare(vb) * dir;
                }
                return ((va as number) - (vb as number)) * dir;
              });
            })();

            const handleYearlySort = (col: string) => {
              if (yearlyTargetSortColumn === col) {
                setYearlyTargetSortDir(yearlyTargetSortDir === 'asc' ? 'desc' : 'asc');
              } else {
                setYearlyTargetSortColumn(col);
                setYearlyTargetSortDir('desc');
              }
            };

            const yearlySortArrow = (col: string) => {
              if (yearlyTargetSortColumn !== col) return <span style={{ opacity: 0.35, fontSize: '10px' }}> ⇅</span>;
              return <span style={{ fontSize: '10px' }}>{yearlyTargetSortDir === 'asc' ? ' ▲' : ' ▼'}</span>;
            };

            return (
              <>
                {/* View Mode Toggle */}
                <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
                  {(['division', 'area', 'plaza'] as const).map(mode => (
                    <button
                      key={mode}
                      onClick={() => setYearlyTargetViewMode(mode)}
                      style={{
                        padding: '8px 20px',
                        border: yearlyTargetViewMode === mode ? 'none' : '1px solid #ddd',
                        background: yearlyTargetViewMode === mode ? 'linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%)' : 'white',
                        color: yearlyTargetViewMode === mode ? 'white' : '#666',
                        borderRadius: '20px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        transition: 'all 0.2s ease',
                        boxShadow: yearlyTargetViewMode === mode ? '0 2px 8px rgba(15,52,96,0.3)' : 'none'
                      }}
                    >
                      {mode === 'division' ? '1. Division Wise Summary' : mode === 'area' ? '2. Area Wise Summary' : '3. Existing (Plaza Wise)'}
                    </button>
                  ))}
                </div>

                {/* Filters */}
                <div className="filter-row" style={{ display: 'flex', gap: '15px', marginBottom: '20px', flexWrap: 'wrap', background: '#f8f9fa', padding: '15px', borderRadius: '8px' }}>
                  <select
                    value={yearlyTargetDivisionFilter}
                    onChange={e => { setYearlyTargetDivisionFilter(e.target.value); setYearlyTargetAreaFilter(''); }}
                    style={{ padding: '10px 14px', minWidth: '180px', border: '2px solid #e0e0e0', borderRadius: '6px', fontSize: '14px', background: 'white', cursor: 'pointer' }}
                  >
                    <option value="">All Divisions</option>
                    {yearlyDivisions.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <select
                    value={yearlyTargetAreaFilter}
                    onChange={e => setYearlyTargetAreaFilter(e.target.value)}
                    style={{ padding: '10px 14px', minWidth: '180px', border: '2px solid #e0e0e0', borderRadius: '6px', fontSize: '14px', background: 'white', cursor: 'pointer' }}
                  >
                    <option value="">All Areas</option>
                    {yearlyAreas.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>

                {/* Summary Cards */}
                <div className="summary-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '25px' }}>
                  {[
                    { label: 'Total Sales Achievement', value: yTotalSalesAch.toLocaleString(), color: '#667eea', bg: '#f0f4ff', border: '#667eea' },
                    { label: 'Sales Target Ach %', value: yTotalSalesTarget > 0 ? ((yTotalSalesAch / yTotalSalesTarget) * 100).toFixed(2) + '%' : 'N/A', color: achPctColor(yTotalSalesTarget > 0 ? (yTotalSalesAch / yTotalSalesTarget * 100) : null), bg: '#fff', border: '#1a1a2e' },
                    { label: 'Collection Target Ach %', value: yTotalCollectionTarget > 0 ? ((yTotalCollectionAch / yTotalCollectionTarget) * 100).toFixed(2) + '%' : 'N/A', color: achPctColor(yTotalCollectionTarget > 0 ? (yTotalCollectionAch / yTotalCollectionTarget * 100) : null), bg: '#fff', border: '#0f3460' },
                    { label: 'Net Profit Target Ach %', value: yTotalNetProfitTarget > 0 ? ((yTotalProfitAch / yTotalNetProfitTarget) * 100).toFixed(2) + '%' : 'N/A', color: achPctColor(yTotalNetProfitTarget > 0 ? (yTotalProfitAch / yTotalNetProfitTarget * 100) : null), bg: '#fff', border: '#e94560' },
                    { label: 'Total Plazas', value: allEnrichedYearly.length.toString(), color: '#333', bg: '#f8f9fa', border: '#ddd' },
                  ].map(card => (
                    <div key={card.label} style={{ padding: '15px', background: card.bg, borderRadius: '8px', border: `1px solid ${card.border}` }}>
                      <h4 style={{ margin: '0 0 8px 0', color: '#666', fontSize: '12px' }}>{card.label}</h4>
                      <p style={{ fontSize: '22px', fontWeight: 'bold', color: card.color, margin: 0 }}>{card.value}</p>
                    </div>
                  ))}
                </div>

                {/* Download Excel Button */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '15px' }}>
                  <button
                    onClick={() => {
                      const rows = sortedYearlyRows.map((row: any) => {
                        const obj: Record<string, any> = {};
                        obj['Division'] = row.Division;
                        if (yearlyTargetViewMode === 'area' || yearlyTargetViewMode === 'plaza') obj['Area'] = row.Area;
                        if (yearlyTargetViewMode === 'plaza') obj['Plaza'] = row.PlazaName;
                        if (yearlyTargetViewMode !== 'plaza') obj['Plaza Count'] = row.plazaCount;
                        obj['Sales Target'] = row.SalesTarget ?? 0;
                        obj['Sales Ach'] = row.salesAch ?? 0;
                        obj['Sales Ach %'] = row.salesAchPct != null ? parseFloat(row.salesAchPct.toFixed(2)) : '';
                        obj['Collection Target'] = row.CollectionTarget ?? 0;
                        obj['Collection Ach'] = row.collectionAch ?? 0;
                        obj['Collection Ach %'] = row.collectionAchPct != null ? parseFloat(row.collectionAchPct.toFixed(2)) : '';
                        obj['Net Profit Target'] = row.NetProfitTarget ?? 0;
                        obj['Net Profit Ach'] = row.profitAch ?? 0;
                        obj['Net Profit Ach %'] = row.profitAchPct != null ? parseFloat(row.profitAchPct.toFixed(2)) : '';
                        obj['Profit Target (Manager)'] = row.ProfitTargetManager ?? 0;
                        obj['Profit Mgr Ach %'] = row.profitMgrAchPct != null ? parseFloat(row.profitMgrAchPct.toFixed(2)) : '';
                        obj['Profit Target (Mgr+2)'] = row.ProfitTargetManagerPlus2 ?? 0;
                        obj['Profit Mgr+2 Ach %'] = row.profitMgrPlus2AchPct != null ? parseFloat(row.profitMgrPlus2AchPct.toFixed(2)) : '';
                        obj['Profit Target (All)'] = row.ProfitTargetAllEmployee ?? 0;
                        obj['Profit All Ach %'] = row.profitAllAchPct != null ? parseFloat(row.profitAllAchPct.toFixed(2)) : '';
                        return obj;
                      });
                      // Add total row
                      const totalRow: Record<string, any> = {};
                      totalRow['Division'] = 'TOTAL';
                      if (yearlyTargetViewMode === 'area' || yearlyTargetViewMode === 'plaza') totalRow['Area'] = '';
                      if (yearlyTargetViewMode === 'plaza') totalRow['Plaza'] = '';
                      if (yearlyTargetViewMode !== 'plaza') totalRow['Plaza Count'] = allEnrichedYearly.length;
                      totalRow['Sales Target'] = yTotalSalesTarget;
                      totalRow['Sales Ach'] = yTotalSalesAch;
                      totalRow['Sales Ach %'] = yTotalSalesTarget > 0 ? parseFloat(((yTotalSalesAch / yTotalSalesTarget) * 100).toFixed(2)) : '';
                      totalRow['Collection Target'] = yTotalCollectionTarget;
                      totalRow['Collection Ach'] = yTotalCollectionAch;
                      totalRow['Collection Ach %'] = yTotalCollectionTarget > 0 ? parseFloat(((yTotalCollectionAch / yTotalCollectionTarget) * 100).toFixed(2)) : '';
                      totalRow['Net Profit Target'] = yTotalNetProfitTarget;
                      totalRow['Net Profit Ach'] = yTotalProfitAch;
                      totalRow['Net Profit Ach %'] = yTotalNetProfitTarget > 0 ? parseFloat(((yTotalProfitAch / yTotalNetProfitTarget) * 100).toFixed(2)) : '';
                      totalRow['Profit Target (Manager)'] = yTotalProfitMgrTarget;
                      totalRow['Profit Mgr Ach %'] = yTotalProfitMgrTarget > 0 ? parseFloat(((yTotalProfitAch / yTotalProfitMgrTarget) * 100).toFixed(2)) : '';
                      totalRow['Profit Target (Mgr+2)'] = yTotalProfitMgrPlus2Target;
                      totalRow['Profit Mgr+2 Ach %'] = yTotalProfitMgrPlus2Target > 0 ? parseFloat(((yTotalProfitAch / yTotalProfitMgrPlus2Target) * 100).toFixed(2)) : '';
                      totalRow['Profit Target (All)'] = yTotalProfitAllTarget;
                      totalRow['Profit All Ach %'] = yTotalProfitAllTarget > 0 ? parseFloat(((yTotalProfitAch / yTotalProfitAllTarget) * 100).toFixed(2)) : '';
                      rows.push(totalRow);
                      const ws = XLSX.utils.json_to_sheet(rows);
                      const wb = XLSX.utils.book_new();
                      XLSX.utils.book_append_sheet(wb, ws, 'YearlyAchievement');
                      const vl = yearlyTargetViewMode === 'division' ? 'Division' : yearlyTargetViewMode === 'area' ? 'Area' : 'Plaza';
                      XLSX.writeFile(wb, `Yearly_Target_Achievement_${vl}.xlsx`);
                    }}
                    style={{
                      padding: '10px 20px',
                      background: 'linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%)',
                      color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer',
                      fontWeight: '600', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px',
                      boxShadow: '0 2px 8px rgba(15,52,96,0.3)'
                    }}
                  >
                    Download Excel
                  </button>
                </div>

                {/* Table */}
                <div className="table-scroll" style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr>
                        <th onClick={() => handleYearlySort('Division')} style={{ padding: '12px 10px', textAlign: 'left', cursor: 'pointer', userSelect: 'none' }}>Division{yearlySortArrow('Division')}</th>
                        {(yearlyTargetViewMode === 'area' || yearlyTargetViewMode === 'plaza') && <th onClick={() => handleYearlySort('Area')} style={{ padding: '12px 10px', textAlign: 'left', cursor: 'pointer', userSelect: 'none' }}>Area{yearlySortArrow('Area')}</th>}
                        {yearlyTargetViewMode === 'plaza' && <th onClick={() => handleYearlySort('PlazaName')} style={{ padding: '12px 10px', textAlign: 'left', cursor: 'pointer', userSelect: 'none' }}>Plaza{yearlySortArrow('PlazaName')}</th>}
                        {yearlyTargetViewMode !== 'plaza' && <th onClick={() => handleYearlySort('plazaCount')} style={{ padding: '12px 10px', textAlign: 'center', cursor: 'pointer', userSelect: 'none' }}>Plaza Count{yearlySortArrow('plazaCount')}</th>}
                        <th onClick={() => handleYearlySort('SalesTarget')} style={{ padding: '12px 10px', textAlign: 'right', cursor: 'pointer', userSelect: 'none' }}>Sales Target{yearlySortArrow('SalesTarget')}</th>
                        <th onClick={() => handleYearlySort('salesAch')} style={{ padding: '12px 10px', textAlign: 'right', cursor: 'pointer', userSelect: 'none' }}>Sales Ach{yearlySortArrow('salesAch')}</th>
                        <th onClick={() => handleYearlySort('salesAchPct')} style={{ padding: '12px 10px', textAlign: 'right', cursor: 'pointer', userSelect: 'none' }}>Sales Ach %{yearlySortArrow('salesAchPct')}</th>
                        <th onClick={() => handleYearlySort('CollectionTarget')} style={{ padding: '12px 10px', textAlign: 'right', cursor: 'pointer', userSelect: 'none' }}>Collection Target{yearlySortArrow('CollectionTarget')}</th>
                        <th onClick={() => handleYearlySort('collectionAch')} style={{ padding: '12px 10px', textAlign: 'right', cursor: 'pointer', userSelect: 'none' }}>Collection Ach{yearlySortArrow('collectionAch')}</th>
                        <th onClick={() => handleYearlySort('collectionAchPct')} style={{ padding: '12px 10px', textAlign: 'right', cursor: 'pointer', userSelect: 'none' }}>Collection Ach %{yearlySortArrow('collectionAchPct')}</th>
                        <th onClick={() => handleYearlySort('NetProfitTarget')} style={{ padding: '12px 10px', textAlign: 'right', cursor: 'pointer', userSelect: 'none' }}>Net Profit Target{yearlySortArrow('NetProfitTarget')}</th>
                        <th onClick={() => handleYearlySort('profitAch')} style={{ padding: '12px 10px', textAlign: 'right', cursor: 'pointer', userSelect: 'none' }}>Net Profit Ach{yearlySortArrow('profitAch')}</th>
                        <th onClick={() => handleYearlySort('profitAchPct')} style={{ padding: '12px 10px', textAlign: 'right', cursor: 'pointer', userSelect: 'none' }}>Net Profit Ach %{yearlySortArrow('profitAchPct')}</th>
                        <th onClick={() => handleYearlySort('ProfitTargetManager')} style={{ padding: '12px 10px', textAlign: 'right', cursor: 'pointer', userSelect: 'none' }}>Profit Target (Manager){yearlySortArrow('ProfitTargetManager')}</th>
                        <th onClick={() => handleYearlySort('profitMgrAchPct')} style={{ padding: '12px 10px', textAlign: 'right', cursor: 'pointer', userSelect: 'none' }}>Profit Mgr Ach %{yearlySortArrow('profitMgrAchPct')}</th>
                        <th onClick={() => handleYearlySort('ProfitTargetManagerPlus2')} style={{ padding: '12px 10px', textAlign: 'right', cursor: 'pointer', userSelect: 'none' }}>Profit Target (Mgr+2){yearlySortArrow('ProfitTargetManagerPlus2')}</th>
                        <th onClick={() => handleYearlySort('profitMgrPlus2AchPct')} style={{ padding: '12px 10px', textAlign: 'right', cursor: 'pointer', userSelect: 'none' }}>Profit Mgr+2 Ach %{yearlySortArrow('profitMgrPlus2AchPct')}</th>
                        <th onClick={() => handleYearlySort('ProfitTargetAllEmployee')} style={{ padding: '12px 10px', textAlign: 'right', cursor: 'pointer', userSelect: 'none' }}>Profit Target (All){yearlySortArrow('ProfitTargetAllEmployee')}</th>
                        <th onClick={() => handleYearlySort('profitAllAchPct')} style={{ padding: '12px 10px', textAlign: 'right', cursor: 'pointer', userSelect: 'none' }}>Profit All Ach %{yearlySortArrow('profitAllAchPct')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedYearlyRows.map((row: any, idx: number) => (
                        <tr key={idx} style={{ background: idx % 2 === 0 ? 'white' : '#f8f9fa', borderBottom: '1px solid #eee' }}>
                          <td style={{ padding: '10px', fontWeight: yearlyTargetViewMode === 'division' ? 'bold' : 'normal' }}>{row.Division}</td>
                          {(yearlyTargetViewMode === 'area' || yearlyTargetViewMode === 'plaza') && <td style={{ padding: '10px', fontWeight: yearlyTargetViewMode === 'area' ? 'bold' : 'normal' }}>{row.Area}</td>}
                          {yearlyTargetViewMode === 'plaza' && <td style={{ padding: '10px', fontWeight: '500' }}>{row.PlazaName}</td>}
                          {yearlyTargetViewMode !== 'plaza' && <td style={{ padding: '10px', textAlign: 'center', color: '#666' }}>{row.plazaCount}</td>}
                          <td style={{ padding: '10px', textAlign: 'right' }}>{row.SalesTarget ? row.SalesTarget.toLocaleString() : 0}</td>
                          <td style={{ padding: '10px', textAlign: 'right', fontWeight: '500' }}>{row.salesAch !== null ? row.salesAch.toLocaleString() : <span style={{ color: '#999' }}>—</span>}</td>
                          <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold', color: achPctColor(row.salesAchPct) }}>
                            {row.salesAchPct !== null ? row.salesAchPct.toFixed(2) + '%' : '—'}
                          </td>
                          <td style={{ padding: '10px', textAlign: 'right' }}>{row.CollectionTarget ? row.CollectionTarget.toLocaleString() : 0}</td>
                          <td style={{ padding: '10px', textAlign: 'right', fontWeight: '500' }}>{row.collectionAch !== null ? row.collectionAch.toLocaleString() : <span style={{ color: '#999' }}>—</span>}</td>
                          <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold', color: achPctColor(row.collectionAchPct) }}>
                            {row.collectionAchPct !== null ? row.collectionAchPct.toFixed(2) + '%' : '—'}
                          </td>
                          <td style={{ padding: '10px', textAlign: 'right' }}>{row.NetProfitTarget ? row.NetProfitTarget.toLocaleString() : 0}</td>
                          <td style={{ padding: '10px', textAlign: 'right', fontWeight: '600', color: row.profitAch !== null ? (row.profitAch >= 0 ? '#28a745' : '#dc3545') : '#999' }}>
                            {row.profitAch !== null ? (row.profitAch >= 0 ? '+' : '') + row.profitAch.toLocaleString() : '—'}
                          </td>
                          <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold', color: achPctColor(row.profitAchPct) }}>
                            {row.profitAchPct !== null ? row.profitAchPct.toFixed(2) + '%' : '—'}
                          </td>
                          <td style={{ padding: '10px', textAlign: 'right' }}>{row.ProfitTargetManager ? row.ProfitTargetManager.toLocaleString() : 0}</td>
                          <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold', color: achPctColor(row.profitMgrAchPct) }}>
                            {row.profitMgrAchPct !== null ? row.profitMgrAchPct.toFixed(2) + '%' : '—'}
                          </td>
                          <td style={{ padding: '10px', textAlign: 'right' }}>{row.ProfitTargetManagerPlus2 ? row.ProfitTargetManagerPlus2.toLocaleString() : 0}</td>
                          <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold', color: achPctColor(row.profitMgrPlus2AchPct) }}>
                            {row.profitMgrPlus2AchPct !== null ? row.profitMgrPlus2AchPct.toFixed(2) + '%' : '—'}
                          </td>
                          <td style={{ padding: '10px', textAlign: 'right' }}>{row.ProfitTargetAllEmployee ? row.ProfitTargetAllEmployee.toLocaleString() : 0}</td>
                          <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold', color: achPctColor(row.profitAllAchPct) }}>
                            {row.profitAllAchPct !== null ? row.profitAllAchPct.toFixed(2) + '%' : '—'}
                          </td>
                        </tr>
                      ))}
                      {/* Total row */}
                      <tr style={{ background: '#1a1a2e', color: 'white', fontWeight: 'bold', fontSize: '14px' }}>
                        <td colSpan={yearlyTargetViewMode === 'division' ? 2 : yearlyTargetViewMode === 'area' ? 3 : 3} style={{ padding: '12px 10px' }}>TOTAL</td>
                        <td style={{ padding: '12px 10px', textAlign: 'right' }}>{yTotalSalesTarget.toLocaleString()}</td>
                        <td style={{ padding: '12px 10px', textAlign: 'right' }}>{yTotalSalesAch.toLocaleString()}</td>
                        <td style={{ padding: '12px 10px', textAlign: 'right', color: yTotalSalesTarget > 0 ? ((yTotalSalesAch / yTotalSalesTarget * 100) >= 100 ? '#4ade80' : '#f87171') : 'inherit' }}>
                          {yTotalSalesTarget > 0 ? (yTotalSalesAch / yTotalSalesTarget * 100).toFixed(2) + '%' : '—'}
                        </td>
                        <td style={{ padding: '12px 10px', textAlign: 'right' }}>{yTotalCollectionTarget.toLocaleString()}</td>
                        <td style={{ padding: '12px 10px', textAlign: 'right' }}>{yTotalCollectionAch.toLocaleString()}</td>
                        <td style={{ padding: '12px 10px', textAlign: 'right', color: yTotalCollectionTarget > 0 ? ((yTotalCollectionAch / yTotalCollectionTarget * 100) >= 100 ? '#4ade80' : '#f87171') : 'inherit' }}>
                          {yTotalCollectionTarget > 0 ? (yTotalCollectionAch / yTotalCollectionTarget * 100).toFixed(2) + '%' : '—'}
                        </td>
                        <td style={{ padding: '12px 10px', textAlign: 'right' }}>{yTotalNetProfitTarget.toLocaleString()}</td>
                        <td style={{ padding: '12px 10px', textAlign: 'right', color: yTotalProfitAch >= 0 ? '#4ade80' : '#f87171' }}>
                          {(yTotalProfitAch >= 0 ? '+' : '') + yTotalProfitAch.toLocaleString()}
                        </td>
                        <td style={{ padding: '12px 10px', textAlign: 'right', color: yTotalNetProfitTarget > 0 ? ((yTotalProfitAch / yTotalNetProfitTarget * 100) >= 100 ? '#4ade80' : '#f87171') : 'inherit' }}>
                          {yTotalNetProfitTarget > 0 ? (yTotalProfitAch / yTotalNetProfitTarget * 100).toFixed(2) + '%' : '—'}
                        </td>
                        <td style={{ padding: '12px 10px', textAlign: 'right' }}>{yTotalProfitMgrTarget.toLocaleString()}</td>
                        <td style={{ padding: '12px 10px', textAlign: 'right', color: yTotalProfitMgrTarget > 0 ? ((yTotalProfitAch / yTotalProfitMgrTarget * 100) >= 100 ? '#4ade80' : '#f87171') : 'inherit' }}>
                          {yTotalProfitMgrTarget > 0 ? (yTotalProfitAch / yTotalProfitMgrTarget * 100).toFixed(2) + '%' : '—'}
                        </td>
                        <td style={{ padding: '12px 10px', textAlign: 'right' }}>{yTotalProfitMgrPlus2Target.toLocaleString()}</td>
                        <td style={{ padding: '12px 10px', textAlign: 'right', color: yTotalProfitMgrPlus2Target > 0 ? ((yTotalProfitAch / yTotalProfitMgrPlus2Target * 100) >= 100 ? '#4ade80' : '#f87171') : 'inherit' }}>
                          {yTotalProfitMgrPlus2Target > 0 ? (yTotalProfitAch / yTotalProfitMgrPlus2Target * 100).toFixed(2) + '%' : '—'}
                        </td>
                        <td style={{ padding: '12px 10px', textAlign: 'right' }}>{yTotalProfitAllTarget.toLocaleString()}</td>
                        <td style={{ padding: '12px 10px', textAlign: 'right', color: yTotalProfitAllTarget > 0 ? ((yTotalProfitAch / yTotalProfitAllTarget * 100) >= 100 ? '#4ade80' : '#f87171') : 'inherit' }}>
                          {yTotalProfitAllTarget > 0 ? (yTotalProfitAch / yTotalProfitAllTarget * 100).toFixed(2) + '%' : '—'}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Note if ACH data is missing */}
                {sourceAchData.length === 0 && (
                  <div style={{ marginTop: '15px', padding: '12px 16px', background: '#fff3cd', borderRadius: '8px', border: '1px solid #ffc107', color: '#856404', fontSize: '13px' }}>
                    <strong>Note:</strong> Achievement data is not loaded yet. Please upload the yearly achievement file above to see achievement figures.
                  </div>
                )}
                {yearlyAchievementData.length === 0 && currentYearData.length > 0 && (
                  <div style={{ marginTop: '15px', padding: '12px 16px', background: '#e8f4fd', borderRadius: '8px', border: '1px solid #b8d4fe', color: '#0c5460', fontSize: '13px' }}>
                    <strong>Note:</strong> Using achievement data from the ACH Growth Comparison section. Upload a separate yearly achievement file above for dedicated yearly data.
                  </div>
                )}
              </>
            );
          })()}
        </div>
      )}
      </div>
      {/* ===== END YEARLY TARGET ACHIEVEMENT SECTION ===== */}

      {/* ===== RANKING ANALYSIS SECTION ===== */}
      {currentYearData.length > 0 && (() => {
        // Filter data
        const rankingDivisions = [...new Set(currentYearData.map(d => d.Division))].sort();
        const rankingAreas = [...new Set(
          currentYearData.filter(d => !rankingDivisionFilter || d.Division === rankingDivisionFilter).map(d => d.Area)
        )].sort();
        const rankingPlazas = [...new Set(
          currentYearData.filter(d =>
            (!rankingDivisionFilter || d.Division === rankingDivisionFilter) &&
            (!rankingAreaFilter || d.Area === rankingAreaFilter)
          ).map(d => d.Plaza)
        )].sort();
        const rankingFiltered = currentYearData.filter(d =>
          (!rankingDivisionFilter || d.Division === rankingDivisionFilter) &&
          (!rankingAreaFilter || d.Area === rankingAreaFilter) &&
          (!rankingPlazaFilter || d.Plaza === rankingPlazaFilter)
        );

        // Get selected category
        const selCat = rankingCategories.find(c => c.key === rankingSelectedCard) || rankingCategories[0];

        // Helper to get field value
        const gv = (d: any, field: string | null) => field ? (d[field] || 0) : 0;

        // Card summaries (totals across all filtered plazas)
        const cardSummaries = rankingCategories.map(cat => {
          const totalTarget = rankingFiltered.reduce((s, d) => s + gv(d, cat.targetField), 0);
          const totalAch = rankingFiltered.reduce((s, d) => s + gv(d, cat.achField), 0);
          const totalMarks = rankingFiltered.reduce((s, d) => s + gv(d, cat.marksField), 0);
          const achPct = (cat.achPctField || totalTarget > 0)
            ? (totalTarget > 0 ? (totalAch / totalTarget * 100) : 0)
            : 0;
          return { ...cat, totalTarget, totalAch, achPct, totalMarks };
        });

        // Build table rows based on view mode
        const getGroupKey = (d: PlazaData) => {
          if (rankingViewMode === 'division') return d.Division || 'Unknown';
          if (rankingViewMode === 'area') return `${d.Division || 'Unknown'}|${d.Area || 'Unknown'}`;
          return `${d.Division || 'Unknown'}|${d.Area || 'Unknown'}|${d.Plaza || 'Unknown'}`;
        };

        const groupedRows = rankingFiltered.reduce((acc, d) => {
          const key = getGroupKey(d);
          if (!acc[key]) {
            acc[key] = {
              Division: d.Division || 'Unknown',
              Area: d.Area || 'Unknown',
              Plaza: d.Plaza || 'Unknown',
              target: 0, ach: 0, marks: 0, count: 0,
              achPctSum: 0
            };
          }
          acc[key].target += gv(d, selCat.targetField);
          acc[key].ach += gv(d, selCat.achField);
          acc[key].marks += gv(d, selCat.marksField);
          acc[key].achPctSum += selCat.achPctField ? gv(d, selCat.achPctField) : 0;
          acc[key].count += 1;
          return acc;
        }, {} as Record<string, any>);

        const tableRows = Object.values(groupedRows).map((row: any) => ({
          ...row,
          achPct: (selCat.achPctField || row.target > 0)
            ? (row.target > 0 ? (row.ach / row.target * 100) : 0)
            : 0
        }));

        // Sort table rows
        const sortedTableRows = (() => {
          const dir = rankingSortDir === 'asc' ? 1 : -1;
          return [...tableRows].sort((a, b) => {
            let va: any, vb: any;
            switch (rankingSortColumn) {
              case 'name': va = (rankingViewMode === 'division' ? a.Division : rankingViewMode === 'area' ? a.Area : a.Plaza || '').toString().toLowerCase(); vb = (rankingViewMode === 'division' ? b.Division : rankingViewMode === 'area' ? b.Area : b.Plaza || '').toString().toLowerCase(); return va.localeCompare(vb);
              case 'target': va = a.target; vb = b.target; break;
              case 'ach': va = a.ach; vb = b.ach; break;
              case 'achPct': va = a.achPct; vb = b.achPct; break;
              case 'marks': va = a.marks; vb = b.marks; break;
              default: va = a.marks; vb = b.marks;
            }
            return (va - vb) * dir;
          });
        })();

        // Totals
        const grandTarget = sortedTableRows.reduce((s, r) => s + r.target, 0);
        const grandAch = sortedTableRows.reduce((s, r) => s + r.ach, 0);
        const grandMarks = sortedTableRows.reduce((s, r) => s + r.marks, 0);
        const grandAchPct = (selCat.achPctField || grandTarget > 0) ? (grandTarget > 0 ? (grandAch / grandTarget * 100) : 0) : 0;

        const handleRankingSort = (col: string) => {
          if (rankingSortColumn === col) { setRankingSortDir(rankingSortDir === 'asc' ? 'desc' : 'asc'); }
          else { setRankingSortColumn(col); setRankingSortDir('desc'); }
        };
        const sortIndicator = (col: string) => rankingSortColumn === col ? (rankingSortDir === 'asc' ? ' ▲' : ' ▼') : '';

        const pctColor = (pct: number) => pct >= 100 ? '#28a745' : pct >= 80 ? '#ff9800' : '#dc3545';

        return (
          <div style={{ background: 'white', marginBottom: '30px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
            {/* Collapsible Header */}
            <div
              onClick={() => setIsRankingSectionOpen(!isRankingSectionOpen)}
              style={{
                padding: '20px 30px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                transition: 'opacity 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.opacity = '0.9'}
              onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
            >
              <div>
                <h2 style={{ margin: '0 0 5px 0', color: 'white', fontSize: '24px' }}>🏆 Ranking Analysis</h2>
                <p style={{ color: 'rgba(255,255,255,0.9)', margin: 0, fontSize: '14px' }}>
                  {isRankingSectionOpen
                    ? 'Performance ranking across all criteria — click any card to see detailed breakdown'
                    : 'Click to expand performance ranking across all criteria'}
                </p>
              </div>
              <div style={{
                fontSize: '28px',
                color: 'white',
                transform: isRankingSectionOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.3s ease',
                lineHeight: 1
              }}>
                ▼
              </div>
            </div>

            {/* Collapsible Body */}
            {isRankingSectionOpen && (
            <div style={{ padding: '25px' }}>
              {/* 20 Category Cards — Grouped Layout */}
              {(() => {
                const groups = [
                  {
                    title: 'Overall Business Performance',
                    icon: '📊',
                    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    keys: ['Total', 'Retail', 'HireSales', 'DealerSales', 'CorpSales', 'SalesGrowth', 'NetProfit'],
                  },
                  {
                    title: 'Collection',
                    icon: '💰',
                    gradient: 'linear-gradient(135deg, #f7971e 0%, #ffd200 100%)',
                    keys: ['HireDP', 'HireLPR', 'HireCashAcc', 'HireDigitalAcc', 'DealerCol', 'CorpCol'],
                  },
                  {
                    title: 'Product Category Performance',
                    icon: '📦',
                    gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                    keys: ['Fridge', 'TV', 'AC', 'HAP', 'EAP', 'Mobile', 'IT'],
                  },
                ];

                return groups.map((group, gi) => {
                  const groupCards = group.keys.map(k => cardSummaries.find(c => c.key === k)).filter(Boolean) as any[];
                  const groupTarget = groupCards.reduce((s: number, c: any) => s + c.totalTarget, 0);
                  const groupAch = groupCards.reduce((s: number, c: any) => s + c.totalAch, 0);
                  const groupMarks = groupCards.reduce((s: number, c: any) => s + c.totalMarks, 0);
                  const groupPct = groupTarget > 0 ? (groupAch / groupTarget * 100) : 0;
                  const sortedByPct = [...groupCards].sort((a: any, b: any) => b.achPct - a.achPct);
                  const topPerformer = sortedByPct[0];

                  return (
                    <div key={gi} style={{ marginBottom: '24px' }}>
                      {/* Group Header */}
                      <div style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '14px 20px', borderRadius: '10px', marginBottom: '14px',
                        background: group.gradient, boxShadow: '0 3px 12px rgba(0,0,0,0.12)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ fontSize: '28px' }}>{group.icon}</span>
                          <div>
                            <div style={{ fontSize: '16px', fontWeight: '700', color: 'white' }}>{group.title}</div>
                            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.85)', marginTop: '2px' }}>
                              {groupCards.length} criteria • Top: {topPerformer?.label} ({topPerformer?.achPct.toFixed(1)}%)
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '18px', alignItems: 'center' }}>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Marks</div>
                            <div style={{ fontSize: '18px', fontWeight: '800', color: 'white' }}>{groupMarks.toFixed(1)}</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Ach %</div>
                            <div style={{
                              fontSize: '14px', fontWeight: '700', color: groupPct >= 100 ? '#e6fff8' : groupPct >= 60 ? '#fff8e1' : '#ffeaea',
                              background: 'rgba(255,255,255,0.2)', padding: '3px 10px', borderRadius: '12px'
                            }}>{groupPct.toFixed(1)}%</div>
                          </div>
                        </div>
                      </div>

                      {/* Cards Grid */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
                        {groupCards.map((cat: any) => {
                          const isSelected = rankingSelectedCard === cat.key;
                          const pctVal = cat.achPct;
                          const pctCol = pctColor(pctVal);
                          const barWidth = Math.min(Math.max(pctVal, 0), 100);
                          const posInGroup = sortedByPct.findIndex((c: any) => c.key === cat.key) + 1;
                          return (
                            <div
                              key={cat.key}
                              onClick={() => setRankingSelectedCard(cat.key)}
                              style={{
                                padding: '0', borderRadius: '12px', position: 'relative',
                                border: isSelected ? '2px solid #667eea' : '1px solid #eaeaea',
                                background: '#fff', cursor: 'pointer', transition: 'all 0.2s ease',
                                boxShadow: isSelected ? '0 6px 20px rgba(102,126,234,0.22)' : '0 1px 6px rgba(0,0,0,0.05)',
                                transform: isSelected ? 'translateY(-2px)' : 'none',
                              }}
                            >
                              <div style={{ height: '3px', background: pctVal >= 100 ? 'linear-gradient(90deg, #11998e, #38ef7d)' : pctVal >= 50 ? 'linear-gradient(90deg, #f7971e, #ffd200)' : 'linear-gradient(90deg, #eb3349, #f45c43)' }} />
                              <div style={{ padding: '14px 16px 12px' }}>
                                {/* Title + Rank Badge */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                  <span style={{ fontSize: '12px', fontWeight: '700', color: isSelected ? '#667eea' : '#444' }}>{cat.label}</span>
                                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                                    {posInGroup <= 3 && <span style={{ fontSize: '14px' }}>{posInGroup === 1 ? '🥇' : posInGroup === 2 ? '🥈' : '🥉'}</span>}
                                    <span style={{
                                      fontSize: '10px', fontWeight: '700', color: pctCol,
                                      background: pctVal >= 100 ? '#e6fff8' : pctVal >= 50 ? '#fff8e1' : '#ffeaea',
                                      padding: '2px 7px', borderRadius: '8px'
                                    }}>{pctVal.toFixed(1)}%</span>
                                  </div>
                                </div>
                                {/* Metrics */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ fontSize: '10px', color: '#aaa' }}>Target</span>
                                    <span style={{ fontSize: '11px', fontWeight: '700', color: '#333' }}>{cat.totalTarget.toLocaleString()}</span>
                                  </div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ fontSize: '10px', color: '#aaa' }}>Achievement</span>
                                    <span style={{ fontSize: '11px', fontWeight: '700', color: '#333' }}>{cat.totalAch.toLocaleString()}</span>
                                  </div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ fontSize: '10px', color: '#aaa' }}>Marks</span>
                                    <span style={{ fontSize: '12px', fontWeight: '800', color: '#667eea' }}>{cat.totalMarks.toFixed(1)}</span>
                                  </div>
                                </div>
                                {/* Progress bar */}
                                <div style={{ marginTop: '8px', background: '#f0f0f0', borderRadius: '3px', height: '4px', overflow: 'hidden' }}>
                                  <div style={{ height: '100%', width: `${barWidth}%`, borderRadius: '3px', background: pctVal >= 100 ? 'linear-gradient(90deg, #11998e, #38ef7d)' : pctVal >= 50 ? 'linear-gradient(90deg, #f7971e, #ffd200)' : 'linear-gradient(90deg, #eb3349, #f45c43)', transition: 'width 0.4s ease' }} />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                });
              })()}

              {/* View Mode + Filters */}
              <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '20px' }}>
                {/* View Mode Buttons */}
                <div style={{ display: 'flex', gap: '4px', background: '#f0f0f0', borderRadius: '6px', padding: '3px' }}>
                  {(['division', 'area', 'plaza'] as const).map(mode => (
                    <button
                      key={mode}
                      onClick={() => { setRankingViewMode(mode); setRankingAreaFilter(''); }}
                      style={{
                        padding: '7px 16px', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '13px', fontWeight: '600',
                        background: rankingViewMode === mode ? '#667eea' : 'transparent',
                        color: rankingViewMode === mode ? 'white' : '#666',
                        transition: 'all 0.2s'
                      }}
                    >
                      {mode === 'division' ? '📊 Division' : mode === 'area' ? '📍 Area' : '🏢 Plaza'}
                    </button>
                  ))}
                </div>

                {/* Division Filter */}
                <select value={rankingDivisionFilter} onChange={(e) => { setRankingDivisionFilter(e.target.value); setRankingAreaFilter(''); setRankingPlazaFilter(''); }}
                  style={{ padding: '7px 12px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '13px', minWidth: '160px' }}>
                  <option value="">All Divisions</option>
                  {rankingDivisions.map(d => <option key={d} value={d}>{d}</option>)}
                </select>

                {/* Area Filter */}
                <select value={rankingAreaFilter} onChange={(e) => { setRankingAreaFilter(e.target.value); setRankingPlazaFilter(''); }}
                  style={{ padding: '7px 12px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '13px', minWidth: '160px' }}>
                  <option value="">All Areas</option>
                  {rankingAreas.map(a => <option key={a} value={a}>{a}</option>)}
                </select>

                {/* Plaza Filter */}
                <select value={rankingPlazaFilter} onChange={(e) => setRankingPlazaFilter(e.target.value)}
                  style={{ padding: '7px 12px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '13px', minWidth: '160px' }}>
                  <option value="">All Plazas</option>
                  {rankingPlazas.map(p => <option key={p} value={p}>{p}</option>)}
                </select>

                {/* Selected Category Label + Download */}
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ padding: '7px 14px', background: '#667eea', color: 'white', borderRadius: '6px', fontSize: '13px', fontWeight: '600' }}>
                    📋 {selCat.label}
                  </div>
                  <button
                    onClick={() => {
                      const rows = sortedTableRows.map((row: any) => {
                        const obj: Record<string, any> = {};
                        if (rankingViewMode === 'plaza') { obj['Division'] = row.Division; obj['Area'] = row.Area; obj['Plaza'] = row.Plaza; }
                        else if (rankingViewMode === 'area') { obj['Division'] = row.Division; obj['Area'] = row.Area; }
                        else { obj['Division'] = row.Division; }
                        obj['Category'] = selCat.label;
                        obj['Target'] = row.target;
                        obj['Achievement'] = row.ach;
                        obj['Ach %'] = parseFloat(row.achPct.toFixed(2));
                        obj['Marks'] = parseFloat(row.marks.toFixed(1));
                        return obj;
                      });
                      rows.push({
                        ...(rankingViewMode === 'plaza' ? { Division: 'TOTAL', Area: '', Plaza: '' } : rankingViewMode === 'area' ? { Division: 'TOTAL', Area: '' } : { Division: 'TOTAL' }),
                        Category: selCat.label, Target: grandTarget, Achievement: grandAch,
                        'Ach %': parseFloat(grandAchPct.toFixed(2)), Marks: parseFloat(grandMarks.toFixed(1)),
                      });
                      const ws = XLSX.utils.json_to_sheet(rows);
                      const wb = XLSX.utils.book_new();
                      XLSX.utils.book_append_sheet(wb, ws, 'Ranking');
                      const vl = rankingViewMode === 'division' ? 'Division' : rankingViewMode === 'area' ? 'Area' : 'Plaza';
                      XLSX.writeFile(wb, `Ranking_${selCat.label.replace(/[^a-zA-Z0-9]/g, '_')}_${vl}.xlsx`);
                    }}
                    style={{ padding: '7px 16px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '5px', boxShadow: '0 2px 8px rgba(102,126,234,0.3)' }}
                  >
                    📥 Download Excel
                  </button>
                </div>
              </div>

              {/* Ranking Table */}
              <div style={{ overflowX: 'auto', border: '1px solid #e0e0e0', borderRadius: '8px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                      {rankingViewMode === 'plaza' && <th style={{ padding: '10px 12px', textAlign: 'left', cursor: 'pointer' }} onClick={() => handleRankingSort('name')}>Plaza{sortIndicator('name')}</th>}
                      {rankingViewMode === 'area' && <><th style={{ padding: '10px 12px', textAlign: 'left' }}>Division</th><th style={{ padding: '10px 12px', textAlign: 'left', cursor: 'pointer' }} onClick={() => handleRankingSort('name')}>Area{sortIndicator('name')}</th></>}
                      {rankingViewMode === 'division' && <th style={{ padding: '10px 12px', textAlign: 'left', cursor: 'pointer' }} onClick={() => handleRankingSort('name')}>Division{sortIndicator('name')}</th>}
                      <th style={{ padding: '10px 12px', textAlign: 'right', cursor: 'pointer' }} onClick={() => handleRankingSort('target')}>Target{sortIndicator('target')}</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right', cursor: 'pointer' }} onClick={() => handleRankingSort('ach')}>Ach{sortIndicator('ach')}</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right', cursor: 'pointer' }} onClick={() => handleRankingSort('achPct')}>Ach %{sortIndicator('achPct')}</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right', cursor: 'pointer' }} onClick={() => handleRankingSort('marks')}>Marks{sortIndicator('marks')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedTableRows.map((row, idx) => (
                      <tr key={idx} style={{ background: idx % 2 === 0 ? '#fff' : '#f8f9fa', borderBottom: '1px solid #eee' }}>
                        {rankingViewMode === 'plaza' && <>
                          <td style={{ padding: '8px 12px' }}><b>{row.Division}</b> / <b>{row.Area}</b> / {row.Plaza}</td>
                        </>}
                        {rankingViewMode === 'area' && <>
                          <td style={{ padding: '8px 12px' }}>{row.Division}</td>
                          <td style={{ padding: '8px 12px', fontWeight: '600' }}>{row.Area}</td>
                        </>}
                        {rankingViewMode === 'division' && <>
                          <td style={{ padding: '8px 12px', fontWeight: '600' }}>{row.Division}</td>
                        </>}
                        <td style={{ padding: '8px 12px', textAlign: 'right' }}>{row.target.toLocaleString()}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'right' }}>{row.ach.toLocaleString()}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: '600', color: pctColor(row.achPct) }}>
                          {row.achPct.toFixed(2)}%
                        </td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: '700', color: '#667eea' }}>{row.marks.toFixed(1)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: '#2c3e50', color: 'white', fontWeight: 'bold' }}>
                      <td style={{ padding: '10px 12px' }} colSpan={rankingViewMode === 'plaza' || rankingViewMode === 'area' ? 1 : 1}>TOTAL</td>
                      {rankingViewMode === 'area' && <td style={{ padding: '10px 12px' }}></td>}
                      <td style={{ padding: '10px 12px', textAlign: 'right' }}>{grandTarget.toLocaleString()}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right' }}>{grandAch.toLocaleString()}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', color: '#4ade80' }}>{grandAchPct.toFixed(2)}%</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', color: '#a5b4fc' }}>{grandMarks.toFixed(1)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
            )}
          </div>
        );
      })()}
      {/* ===== END RANKING ANALYSIS SECTION ===== */}

      {/* Hide old performance dashboard details
      {fullData.length > 0 && (
        <>
          <div className="filters">
            <select value={divisionFilter} onChange={(e) => handleDivisionChange(e.target.value)}>
              <option value="">All Divisions</option>
              {divisions.map((division) => (
                <option key={division} value={division}>
                  {division}
                </option>
              ))}
            </select>

            <select value={areaFilter} onChange={(e) => handleAreaChange(e.target.value)}>
              <option value="">All Areas</option>
              {areas.map((area) => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </select>

            <select value={plazaFilter} onChange={(e) => handlePlazaChange(e.target.value)}>
              <option value="">All Plazas</option>
              {plazas.map((plaza) => (
                <option key={plaza} value={plaza}>
                  {plaza}
                </option>
              ))}
            </select>
          </div>

          <div className="cards">
            <div className="card">
              <h3>Total Plazas</h3>
              <p>{filteredData.length}</p>
            </div>
            <div className="card">
              <h3>Total (Tk.) Ach %</h3>
              <p>{avgAchv}%</p>
            </div>
            <div className="card">
              <h3>Total Profit</h3>
              <p>{totalProfit.toLocaleString()}</p>
            </div>
          </div>

          <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', marginBottom: '20px' }}>
            <h2 style={{ marginTop: 0, marginBottom: '15px' }}>All Criteria Targets</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '15px' }}>
              <div style={{ padding: '12px', background: '#f8f9fa', borderRadius: '6px' }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#666', fontSize: '13px' }}>Total (Tk.)</h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '12px', color: '#888' }}>Target:</span>
                  <span style={{ fontSize: '14px', fontWeight: 'bold' }}>
                    {filteredData.reduce((sum, d) => sum + (d.Total_Target || 0), 0).toLocaleString()}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '12px', color: '#888' }}>Ach:</span>
                  <span style={{ fontSize: '14px', fontWeight: 'bold' }}>
                    {filteredData.reduce((sum, d) => sum + (d.Total_Ach || 0), 0).toLocaleString()}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '12px', color: '#888' }}>Ach %:</span>
                  <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#28a745' }}>
                    {(() => {
                      const target = filteredData.reduce((sum, d) => sum + (d.Total_Target || 0), 0);
                      const ach = filteredData.reduce((sum, d) => sum + (d.Total_Ach || 0), 0);
                      return target > 0 ? ((ach / target) * 100).toFixed(2) : '0.00';
                    })()}%
                  </span>
                </div>
              </div>

              <div style={{ padding: '12px', background: '#f8f9fa', borderRadius: '6px' }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#666', fontSize: '13px' }}>Retail Sales (Tk.)</h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '12px', color: '#888' }}>Target:</span>
                  <span style={{ fontSize: '14px', fontWeight: 'bold' }}>
                    {filteredData.reduce((sum, d) => sum + (d.Retail_Sales_Target || 0), 0).toLocaleString()}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '12px', color: '#888' }}>Ach:</span>
                  <span style={{ fontSize: '14px', fontWeight: 'bold' }}>
                    {filteredData.reduce((sum, d) => sum + (d.Retail_Sales_Ach || 0), 0).toLocaleString()}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '12px', color: '#888' }}>Ach %:</span>
                  <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#28a745' }}>
                    {(() => {
                      const target = filteredData.reduce((sum, d) => sum + (d.Retail_Sales_Target || 0), 0);
                      const ach = filteredData.reduce((sum, d) => sum + (d.Retail_Sales_Ach || 0), 0);
                      return target > 0 ? ((ach / target) * 100).toFixed(2) : '0.00';
                    })()}%
                  </span>
                </div>
              </div>

              <div style={{ padding: '12px', background: '#f8f9fa', borderRadius: '6px' }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#666', fontSize: '13px' }}>Hire Sales (Tk.)</h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '12px', color: '#888' }}>Target:</span>
                  <span style={{ fontSize: '14px', fontWeight: 'bold' }}>
                    {filteredData.reduce((sum, d) => sum + (d.Hire_Sales_Target || 0), 0).toLocaleString()}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '12px', color: '#888' }}>Ach:</span>
                  <span style={{ fontSize: '14px', fontWeight: 'bold' }}>
                    {filteredData.reduce((sum, d) => sum + (d.Hire_Sales_Ach || 0), 0).toLocaleString()}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '12px', color: '#888' }}>Ach %:</span>
                  <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#28a745' }}>
                    {(() => {
                      const target = filteredData.reduce((sum, d) => sum + (d.Hire_Sales_Target || 0), 0);
                      const ach = filteredData.reduce((sum, d) => sum + (d.Hire_Sales_Ach || 0), 0);
                      return target > 0 ? ((ach / target) * 100).toFixed(2) : '0.00';
                    })()}%
                  </span>
                </div>
              </div>

              <div style={{ padding: '12px', background: '#f8f9fa', borderRadius: '6px' }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#666', fontSize: '13px' }}>Hire DP Collection (Tk.)</h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '12px', color: '#888' }}>Target:</span>
                  <span style={{ fontSize: '14px', fontWeight: 'bold' }}>
                    {filteredData.reduce((sum, d) => sum + (d.Hire_DP_Col_Target || 0), 0).toLocaleString()}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '12px', color: '#888' }}>Ach:</span>
                  <span style={{ fontSize: '14px', fontWeight: 'bold' }}>
                    {filteredData.reduce((sum, d) => sum + (d.Hire_DP_Col_Ach || 0), 0).toLocaleString()}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '12px', color: '#888' }}>Ach %:</span>
                  <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#28a745' }}>
                    {(() => {
                      const target = filteredData.reduce((sum, d) => sum + (d.Hire_DP_Col_Target || 0), 0);
                      const ach = filteredData.reduce((sum, d) => sum + (d.Hire_DP_Col_Ach || 0), 0);
                      return target > 0 ? ((ach / target) * 100).toFixed(2) : '0.00';
                    })()}%
                  </span>
                </div>
              </div>

              <div style={{ padding: '12px', background: '#f8f9fa', borderRadius: '6px' }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#666', fontSize: '13px' }}>Hire LPR Collection (Tk.)</h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '12px', color: '#888' }}>Target:</span>
                  <span style={{ fontSize: '14px', fontWeight: 'bold' }}>
                    {filteredData.reduce((sum, d) => sum + (d.Hire_LPR_Col_Target || 0), 0).toLocaleString()}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '12px', color: '#888' }}>Ach:</span>
                  <span style={{ fontSize: '14px', fontWeight: 'bold' }}>
                    {filteredData.reduce((sum, d) => sum + (d.Hire_LPR_Col_Ach || 0), 0).toLocaleString()}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '12px', color: '#888' }}>Ach %:</span>
                  <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#28a745' }}>
                    {(() => {
                      const target = filteredData.reduce((sum, d) => sum + (d.Hire_LPR_Col_Target || 0), 0);
                      const ach = filteredData.reduce((sum, d) => sum + (d.Hire_LPR_Col_Ach || 0), 0);
                      return target > 0 ? ((ach / target) * 100).toFixed(2) : '0.00';
                    })()}%
                  </span>
                </div>
              </div>

              <div style={{ padding: '12px', background: '#f8f9fa', borderRadius: '6px' }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#666', fontSize: '13px' }}>Collection Executive (Qty.)</h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '12px', color: '#888' }}>Target:</span>
                  <span style={{ fontSize: '14px', fontWeight: 'bold' }}>
                    {filteredData.reduce((sum, d) => sum + (d.Col_Exec_Target || 0), 0).toLocaleString()}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '12px', color: '#888' }}>Ach:</span>
                  <span style={{ fontSize: '14px', fontWeight: 'bold' }}>
                    {filteredData.reduce((sum, d) => sum + (d.Col_Exec_Ach || 0), 0).toLocaleString()}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '12px', color: '#888' }}>Ach %:</span>
                  <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#28a745' }}>
                    {(() => {
                      const target = filteredData.reduce((sum, d) => sum + (d.Col_Exec_Target || 0), 0);
                      const ach = filteredData.reduce((sum, d) => sum + (d.Col_Exec_Ach || 0), 0);
                      return target > 0 ? ((ach / target) * 100).toFixed(2) : '0.00';
                    })()}%
                  </span>
                </div>
              </div>

              <div style={{ padding: '12px', background: '#f8f9fa', borderRadius: '6px' }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#666', fontSize: '13px' }}>Collection Self (Qty.)</h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '12px', color: '#888' }}>Target:</span>
                  <span style={{ fontSize: '14px', fontWeight: 'bold' }}>
                    {filteredData.reduce((sum, d) => sum + (d.Col_Self_Target || 0), 0).toLocaleString()}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '12px', color: '#888' }}>Ach:</span>
                  <span style={{ fontSize: '14px', fontWeight: 'bold' }}>
                    {filteredData.reduce((sum, d) => sum + (d.Col_Self_Ach || 0), 0).toLocaleString()}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '12px', color: '#888' }}>Ach %:</span>
                  <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#28a745' }}>
                    {(() => {
                      const target = filteredData.reduce((sum, d) => sum + (d.Col_Self_Target || 0), 0);
                      const ach = filteredData.reduce((sum, d) => sum + (d.Col_Self_Ach || 0), 0);
                      return target > 0 ? ((ach / target) * 100).toFixed(2) : '0.00';
                    })()}%
                  </span>
                </div>
              </div>

              <div style={{ padding: '12px', background: '#f8f9fa', borderRadius: '6px' }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#666', fontSize: '13px' }}>Dealer & Corporate Sales (Tk.)</h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '12px', color: '#888' }}>Target:</span>
                  <span style={{ fontSize: '14px', fontWeight: 'bold' }}>
                    {filteredData.reduce((sum, d) => sum + (d.Dealer_Corp_Sales_Target || 0), 0).toLocaleString()}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '12px', color: '#888' }}>Ach:</span>
                  <span style={{ fontSize: '14px', fontWeight: 'bold' }}>
                    {filteredData.reduce((sum, d) => sum + (d.Dealer_Corp_Sales_Ach || 0), 0).toLocaleString()}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '12px', color: '#888' }}>Ach %:</span>
                  <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#28a745' }}>
                    {(() => {
                      const target = filteredData.reduce((sum, d) => sum + (d.Dealer_Corp_Sales_Target || 0), 0);
                      const ach = filteredData.reduce((sum, d) => sum + (d.Dealer_Corp_Sales_Ach || 0), 0);
                      return target > 0 ? ((ach / target) * 100).toFixed(2) : '0.00';
                    })()}%
                  </span>
                </div>
              </div>

              <div style={{ padding: '12px', background: '#f8f9fa', borderRadius: '6px' }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#666', fontSize: '13px' }}>Dealer & Corporate Collection (Tk.)</h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '12px', color: '#888' }}>Target:</span>
                  <span style={{ fontSize: '14px', fontWeight: 'bold' }}>
                    {filteredData.reduce((sum, d) => sum + (d.Dealer_Corp_Col_Target || 0), 0).toLocaleString()}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '12px', color: '#888' }}>Ach:</span>
                  <span style={{ fontSize: '14px', fontWeight: 'bold' }}>
                    {filteredData.reduce((sum, d) => sum + (d.Dealer_Corp_Col_Ach || 0), 0).toLocaleString()}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '12px', color: '#888' }}>Ach %:</span>
                  <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#28a745' }}>
                    {(() => {
                      const target = filteredData.reduce((sum, d) => sum + (d.Dealer_Corp_Col_Target || 0), 0);
                      const ach = filteredData.reduce((sum, d) => sum + (d.Dealer_Corp_Col_Ach || 0), 0);
                      return target > 0 ? ((ach / target) * 100).toFixed(2) : '0.00';
                    })()}%
                  </span>
                </div>
              </div>

              <div style={{ padding: '12px', background: '#f8f9fa', borderRadius: '6px' }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#666', fontSize: '13px' }}>Profit (Tk.)</h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '12px', color: '#888' }}>Target:</span>
                  <span style={{ fontSize: '14px', fontWeight: 'bold' }}>
                    {filteredData.reduce((sum, d) => sum + (d.Profit_Target || 0), 0).toLocaleString()}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '12px', color: '#888' }}>Ach:</span>
                  <span style={{ fontSize: '14px', fontWeight: 'bold' }}>
                    {filteredData.reduce((sum, d) => sum + (d.Net_Profit_Ach || 0), 0).toLocaleString()}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '12px', color: '#888' }}>Ach %:</span>
                  <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#28a745' }}>
                    {(() => {
                      const target = filteredData.reduce((sum, d) => sum + (d.Profit_Target || 0), 0);
                      const ach = filteredData.reduce((sum, d) => sum + (d.Net_Profit_Ach || 0), 0);
                      return target > 0 ? ((ach / target) * 100).toFixed(2) : '0.00';
                    })()}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Total Marks</th>
                <th>Plaza</th>
                <th>Total Target (Tk.)</th>
                <th>Total Ach</th>
                <th>Total Ach %</th>
                <th>Hire Sales Target (Tk.)</th>
                <th>Hire Sales Ach</th>
                <th>Hire Sales Ach %</th>
                <th>Profit Target (Tk.)</th>
                <th>Profit Ach</th>
                <th>Profit Ach %</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((d, idx) => (
                <tr key={idx} onClick={() => setSelectedPlaza(d)} style={{ cursor: 'pointer' }}>
                  <td>{d.Rank_No}</td>
                  <td>{d.Total_Marks}</td>
                  <td>{d.Plaza}</td>
                  <td>{(d.Total_Target || 0).toLocaleString()}</td>
                  <td>{(d.Total_Ach || 0).toLocaleString()}</td>
                  <td>{(d.Total_Ach_Pct || 0).toFixed(2)}%</td>
                  <td>{(d.Hire_Sales_Target || 0).toLocaleString()}</td>
                  <td>{(d.Hire_Sales_Ach || 0).toLocaleString()}</td>
                  <td>{(d.Hire_Sales_Ach_Pct || 0).toFixed(2)}%</td>
                  <td>{(d.Profit_Target || 0).toLocaleString()}</td>
                  <td>{(d.Net_Profit_Ach || 0).toLocaleString()}</td>
                  <td>{(d.Net_Profit_Ach_Pct || 0).toFixed(2)}%</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ marginTop: '30px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h2 style={{ margin: 0 }}>All Criteria Details</h2>
              <button 
                onClick={downloadExcel}
                style={{ 
                  padding: '10px 20px', 
                  cursor: 'pointer', 
                  borderRadius: '6px', 
                  border: '1px solid #28a745', 
                  background: '#28a745',
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '14px'
                }}
              >
                📥 Download Excel
              </button>
            </div>
            <div className="table-scroll" style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th rowSpan={2}>Rank</th>
                    <th rowSpan={2}>Plaza</th>
                    <th rowSpan={2}>Area</th>
                    <th rowSpan={2}>Division</th>
                    <th colSpan={3}>Total (Tk.)</th>
                    <th colSpan={3}>Retail Sales (Tk.)</th>
                    <th colSpan={3}>Hire Sales (Tk.)</th>
                    <th colSpan={3}>Hire DP Collection (Tk.)</th>
                    <th colSpan={3}>Hire LPR Collection (Tk.)</th>
                    <th colSpan={3}>Collection Executive (Qty.)</th>
                    <th colSpan={3}>Collection Self (Qty.)</th>
                    <th colSpan={3}>Dealer & Corporate Sales (Tk.)</th>
                    <th colSpan={3}>Dealer & Corporate Collection (Tk.)</th>
                    <th colSpan={3}>Profit (Tk.)</th>
                  </tr>
                  <tr>
                    <th>Target</th>
                    <th>Ach</th>
                    <th>Ach %</th>
                    <th>Target</th>
                    <th>Ach</th>
                    <th>Ach %</th>
                    <th>Target</th>
                    <th>Ach</th>
                    <th>Ach %</th>
                    <th>Target</th>
                    <th>Ach</th>
                    <th>Ach %</th>
                    <th>Target</th>
                    <th>Ach</th>
                    <th>Ach %</th>
                    <th>Target</th>
                    <th>Ach</th>
                    <th>Ach %</th>
                    <th>Target</th>
                    <th>Ach</th>
                    <th>Ach %</th>
                    <th>Target</th>
                    <th>Ach</th>
                    <th>Ach %</th>
                    <th>Target</th>
                    <th>Ach</th>
                    <th>Ach %</th>
                    <th>Target</th>
                    <th>Ach</th>
                    <th>Ach %</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((d, idx) => (
                    <tr key={idx}>
                      <td>{d.Rank_No}</td>
                      <td>{d.Plaza}</td>
                      <td>{d.Area}</td>
                      <td>{d.Division}</td>
                      <td>{(d.Total_Target || 0).toLocaleString()}</td>
                      <td>{(d.Total_Ach || 0).toLocaleString()}</td>
                      <td>{(d.Total_Ach_Pct || 0).toFixed(2)}%</td>
                      <td>{(d.Retail_Sales_Target || 0).toLocaleString()}</td>
                      <td>{(d.Retail_Sales_Ach || 0).toLocaleString()}</td>
                      <td>{(d.Retail_Sales_Ach_Pct || 0).toFixed(2)}%</td>
                      <td>{(d.Hire_Sales_Target || 0).toLocaleString()}</td>
                      <td>{(d.Hire_Sales_Ach || 0).toLocaleString()}</td>
                      <td>{(d.Hire_Sales_Ach_Pct || 0).toFixed(2)}%</td>
                      <td>{(d.Hire_DP_Col_Target || 0).toLocaleString()}</td>
                      <td>{(d.Hire_DP_Col_Ach || 0).toLocaleString()}</td>
                      <td>{(d.Hire_DP_Col_Ach_Pct || 0).toFixed(2)}%</td>
                      <td>{(d.Hire_LPR_Col_Target || 0).toLocaleString()}</td>
                      <td>{(d.Hire_LPR_Col_Ach || 0).toLocaleString()}</td>
                      <td>{(d.Hire_LPR_Col_Ach_Pct || 0).toFixed(2)}%</td>
                      <td>{(d.Col_Exec_Target || 0).toLocaleString()}</td>
                      <td>{(d.Col_Exec_Ach || 0).toLocaleString()}</td>
                      <td>{(d.Col_Exec_Ach_Pct || 0).toFixed(2)}%</td>
                      <td>{(d.Col_Self_Target || 0).toLocaleString()}</td>
                      <td>{(d.Col_Self_Ach || 0).toLocaleString()}</td>
                      <td>{(d.Col_Self_Ach_Pct || 0).toFixed(2)}%</td>
                      <td>{(d.Dealer_Corp_Sales_Target || 0).toLocaleString()}</td>
                      <td>{(d.Dealer_Corp_Sales_Ach || 0).toLocaleString()}</td>
                      <td>{(d.Dealer_Corp_Sales_Ach_Pct || 0).toFixed(2)}%</td>
                      <td>{(d.Dealer_Corp_Col_Target || 0).toLocaleString()}</td>
                      <td>{(d.Dealer_Corp_Col_Ach || 0).toLocaleString()}</td>
                      <td>{(d.Dealer_Corp_Col_Ach_Pct || 0).toFixed(2)}%</td>
                      <td>{(d.Profit_Target || 0).toLocaleString()}</td>
                      <td>{(d.Net_Profit_Ach || 0).toLocaleString()}</td>
                      <td>{(d.Net_Profit_Ach_Pct || 0).toFixed(2)}%</td>
                    </tr>
                  ))}
                  <tr style={{ background: '#2c3e50', color: 'white', fontWeight: 'bold' }}>
                    <td colSpan={4}>TOTAL</td>
                    <td>{filteredData.reduce((sum, d) => sum + (d.Total_Target || 0), 0).toLocaleString()}</td>
                    <td>{filteredData.reduce((sum, d) => sum + (d.Total_Ach || 0), 0).toLocaleString()}</td>
                    <td>{(filteredData.reduce((sum, d) => sum + (d.Total_Ach_Pct || 0), 0) / filteredData.length).toFixed(2)}%</td>
                    <td>{filteredData.reduce((sum, d) => sum + (d.Retail_Sales_Target || 0), 0).toLocaleString()}</td>
                    <td>{filteredData.reduce((sum, d) => sum + (d.Retail_Sales_Ach || 0), 0).toLocaleString()}</td>
                    <td>{(filteredData.reduce((sum, d) => sum + (d.Retail_Sales_Ach_Pct || 0), 0) / filteredData.length).toFixed(2)}%</td>
                    <td>{filteredData.reduce((sum, d) => sum + (d.Hire_Sales_Target || 0), 0).toLocaleString()}</td>
                    <td>{filteredData.reduce((sum, d) => sum + (d.Hire_Sales_Ach || 0), 0).toLocaleString()}</td>
                    <td>{(filteredData.reduce((sum, d) => sum + (d.Hire_Sales_Ach_Pct || 0), 0) / filteredData.length).toFixed(2)}%</td>
                    <td>{filteredData.reduce((sum, d) => sum + (d.Hire_DP_Col_Target || 0), 0).toLocaleString()}</td>
                    <td>{filteredData.reduce((sum, d) => sum + (d.Hire_DP_Col_Ach || 0), 0).toLocaleString()}</td>
                    <td>{(filteredData.reduce((sum, d) => sum + (d.Hire_DP_Col_Ach_Pct || 0), 0) / filteredData.length).toFixed(2)}%</td>
                    <td>{filteredData.reduce((sum, d) => sum + (d.Hire_LPR_Col_Target || 0), 0).toLocaleString()}</td>
                    <td>{filteredData.reduce((sum, d) => sum + (d.Hire_LPR_Col_Ach || 0), 0).toLocaleString()}</td>
                    <td>{(filteredData.reduce((sum, d) => sum + (d.Hire_LPR_Col_Ach_Pct || 0), 0) / filteredData.length).toFixed(2)}%</td>
                    <td>{filteredData.reduce((sum, d) => sum + (d.Col_Exec_Target || 0), 0).toLocaleString()}</td>
                    <td>{filteredData.reduce((sum, d) => sum + (d.Col_Exec_Ach || 0), 0).toLocaleString()}</td>
                    <td>{(filteredData.reduce((sum, d) => sum + (d.Col_Exec_Ach_Pct || 0), 0) / filteredData.length).toFixed(2)}%</td>
                    <td>{filteredData.reduce((sum, d) => sum + (d.Col_Self_Target || 0), 0).toLocaleString()}</td>
                    <td>{filteredData.reduce((sum, d) => sum + (d.Col_Self_Ach || 0), 0).toLocaleString()}</td>
                    <td>{(filteredData.reduce((sum, d) => sum + (d.Col_Self_Ach_Pct || 0), 0) / filteredData.length).toFixed(2)}%</td>
                    <td>{filteredData.reduce((sum, d) => sum + (d.Dealer_Corp_Sales_Target || 0), 0).toLocaleString()}</td>
                    <td>{filteredData.reduce((sum, d) => sum + (d.Dealer_Corp_Sales_Ach || 0), 0).toLocaleString()}</td>
                    <td>{(filteredData.reduce((sum, d) => sum + (d.Dealer_Corp_Sales_Ach_Pct || 0), 0) / filteredData.length).toFixed(2)}%</td>
                    <td>{filteredData.reduce((sum, d) => sum + (d.Dealer_Corp_Col_Target || 0), 0).toLocaleString()}</td>
                    <td>{filteredData.reduce((sum, d) => sum + (d.Dealer_Corp_Col_Ach || 0), 0).toLocaleString()}</td>
                    <td>{(filteredData.reduce((sum, d) => sum + (d.Dealer_Corp_Col_Ach_Pct || 0), 0) / filteredData.length).toFixed(2)}%</td>
                    <td>{filteredData.reduce((sum, d) => sum + (d.Profit_Target || 0), 0).toLocaleString()}</td>
                    <td>{filteredData.reduce((sum, d) => sum + (d.Net_Profit_Ach || 0), 0).toLocaleString()}</td>
                    <td>{(filteredData.reduce((sum, d) => sum + (d.Net_Profit_Ach_Pct || 0), 0) / filteredData.length).toFixed(2)}%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {selectedPlaza && (
            <div style={{ marginTop: '20px', background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h2 style={{ margin: 0 }}>All Criteria - {selectedPlaza.Plaza}</h2>
                <button onClick={() => setSelectedPlaza(null)} style={{ padding: '8px 16px', cursor: 'pointer', borderRadius: '4px', border: '1px solid #ddd', background: '#f4f6f9' }}>
                  Close
                </button>
              </div>
              <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                <table>
                  <thead>
                    <tr>
                      <th style={{ width: '40%' }}>Criteria</th>
                      <th style={{ width: '60%' }}>Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(headers).map(([idx, headerName]) => {
                      const value = selectedPlaza.allColumns?.[parseInt(idx)];
                      return (
                        <tr key={idx}>
                          <td><strong>{headerName}</strong></td>
                          <td>{value !== undefined && value !== null && value !== '' ? value : '-'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div style={{ marginTop: '30px' }}>
            <h2 style={{ marginBottom: '15px', color: '#dc3545' }}>
              Loss Plaza List ({fullData.filter((d) => (d.Net_Profit_Ach || 0) < 0).length} out of {fullData.length} Plazas)
            </h2>
            
            {fullData.filter((d) => (d.Net_Profit_Ach || 0) < 0).length > 0 && (
              <>
                <div style={{ marginBottom: '20px' }}>
                  <h3 style={{ marginBottom: '10px' }}>Loss Summary by Division</h3>
                  <div className="degrowth-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px', marginBottom: '20px' }}>
                    {(() => {
                      const lossPlazas = fullData.filter((d) => (d.Net_Profit_Ach || 0) < 0);
                      const divisionSummary = lossPlazas.reduce((acc, d) => {
                        if (!acc[d.Division]) {
                          acc[d.Division] = { qty: 0, amount: 0 };
                        }
                        acc[d.Division].qty += 1;
                        acc[d.Division].amount += d.Net_Profit_Ach || 0;
                        return acc;
                      }, {} as Record<string, { qty: number; amount: number }>);

                      return Object.entries(divisionSummary)
                        .sort((a, b) => b[1].qty - a[1].qty)
                        .map(([division, data]) => (
                          <div key={division} style={{ padding: '15px', background: '#fff5f5', borderRadius: '6px', border: '1px solid #f5c6cb' }}>
                            <h4 style={{ margin: '0 0 10px 0', color: '#721c24' }}>{division}</h4>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                              <span style={{ fontSize: '13px', color: '#666' }}>Loss Plaza Qty:</span>
                              <span style={{ fontSize: '15px', fontWeight: 'bold', color: '#dc3545' }}>{data.qty}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ fontSize: '13px', color: '#666' }}>Loss Amount:</span>
                              <span style={{ fontSize: '15px', fontWeight: 'bold', color: '#dc3545' }}>
                                {data.amount.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        ));
                    })()}
                  </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <h3 style={{ marginBottom: '10px' }}>Loss Summary by Area</h3>
                  <div className="degrowth-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px', marginBottom: '20px' }}>
                    {(() => {
                      const lossPlazas = fullData.filter((d) => (d.Net_Profit_Ach || 0) < 0);
                      const areaSummary = lossPlazas.reduce((acc, d) => {
                        if (!acc[d.Area]) {
                          acc[d.Area] = { qty: 0, amount: 0 };
                        }
                        acc[d.Area].qty += 1;
                        acc[d.Area].amount += d.Net_Profit_Ach || 0;
                        return acc;
                      }, {} as Record<string, { qty: number; amount: number }>);

                      return Object.entries(areaSummary)
                        .sort((a, b) => b[1].qty - a[1].qty)
                        .map(([area, data]) => (
                          <div key={area} style={{ padding: '15px', background: '#fff5f5', borderRadius: '6px', border: '1px solid #f5c6cb' }}>
                            <h4 style={{ margin: '0 0 10px 0', color: '#721c24' }}>{area}</h4>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                              <span style={{ fontSize: '13px', color: '#666' }}>Loss Plaza Qty:</span>
                              <span style={{ fontSize: '15px', fontWeight: 'bold', color: '#dc3545' }}>{data.qty}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ fontSize: '13px', color: '#666' }}>Loss Amount:</span>
                              <span style={{ fontSize: '15px', fontWeight: 'bold', color: '#dc3545' }}>
                                {data.amount.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        ));
                    })()}
                  </div>
                </div>
              </>
            )}

            <h3 style={{ marginBottom: '10px' }}>Detailed Loss Plaza List</h3>
            <div className="table-scroll" style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Division</th>
                    <th>Area</th>
                    <th>Plaza</th>
                    <th>Loss Amount (Tk.)</th>
                  </tr>
                </thead>
                <tbody>
                  {fullData
                    .filter((d) => (d.Net_Profit_Ach || 0) < 0)
                    .map((d, idx) => (
                      <tr key={idx} style={{ background: '#fff5f5' }}>
                        <td>{d.Division}</td>
                        <td>{d.Area}</td>
                        <td>{d.Plaza}</td>
                        <td style={{ color: '#dc3545', fontWeight: 'bold' }}>
                          {(d.Net_Profit_Ach || 0).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  {fullData.filter((d) => (d.Net_Profit_Ach || 0) < 0).length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', padding: '20px', color: '#28a745' }}>
                        No loss plazas found! All plazas are profitable. 🎉
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      End Hide old performance dashboard details */}

      {/* Bottom Credit */}
      <div className="credit-banner" style={{ 
        background: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)', 
        padding: '20px 20px', 
        marginTop: '40px',
        borderRadius: '8px',
        textAlign: 'center',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
      }}>
        <p style={{ 
          color: 'white', 
          margin: 0, 
          fontSize: '18px',
          fontWeight: '700',
          letterSpacing: '0.5px'
        }}>
          Developed by <span style={{ fontWeight: '900', color: '#3498db', fontSize: '22px' }}>Md Rezaul Karim RCM</span>
        </p>
        <p style={{ 
          color: 'rgba(255,255,255,0.8)', 
          margin: '8px 0 0 0', 
          fontSize: '14px',
          fontWeight: '600'
        }}>
          © {new Date().getFullYear()} All Rights Reserved
        </p>
      </div>

      {/* ===== DIVISION 2 DEDICATED SECTION (BOTTOM SEPARATED) ===== */}
      {isLoadingCurrent && (
        <div style={{ 
          margin: '50px 0',
          padding: '30px',
          background: '#e3f2fd',
          border: '2px solid #2196f3',
          borderRadius: '12px',
          textAlign: 'center'
        }}>
          <h3 style={{ color: '#1976d2', marginBottom: '15px' }}>⏳ Loading Division-02 Data...</h3>
          <p style={{ color: '#1976d2' }}>
            Please wait while we load the current year data from the database.
          </p>
        </div>
      )}
      
      {!isLoadingCurrent && (() => {
        const hasDivision2 = currentYearData.length > 0 && currentYearData.some(d => d.Division === 'Division-02');
        
        // Return null if no data or no Division-02
        if (!hasDivision2) return null;
        
        // Render Division-02 section
        return (
          <>
          <div
            onClick={() => setIsDivision2Open(!isDivision2Open)}
            style={{
              margin: '50px 0 0 0',
              padding: '20px 30px',
              background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
              borderRadius: '12px',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              transition: 'opacity 0.2s',
              boxShadow: '0 4px 15px rgba(231, 76, 60, 0.3)'
            }}
            onMouseOver={(e) => e.currentTarget.style.opacity = '0.9'}
            onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
          >
            <div>
              <h2 style={{ margin: '0 0 5px 0', color: 'white', fontSize: '24px' }}>📊 Division 2 - Detailed Report</h2>
              <p style={{ color: 'rgba(255,255,255,0.9)', margin: 0, fontSize: '14px' }}>
                {isDivision2Open
                  ? 'Area-wise performance with target tiers and profit analysis — click to collapse'
                  : 'Click to expand area-wise performance with target tiers and profit analysis'}
              </p>
            </div>
            <div style={{
              fontSize: '28px',
              color: 'white',
              transform: isDivision2Open ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.3s ease',
              lineHeight: 1
            }}>
              ▼
            </div>
          </div>

          {isDivision2Open && (
          <div className="division2-section" style={{ 
            background: 'linear-gradient(135deg, #fff5f5 0%, #ffe8e8 100%)', 
            padding: '40px', 
            borderRadius: '0 0 16px 16px',
            marginTop: '0',
            boxShadow: '0 8px 24px rgba(231, 76, 60, 0.15)',
            border: '2px solid #e74c3c',
            borderTop: 'none'
          }}>
            <div className="section-header" style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '25px' }}>
              <div className="btn-group" style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={shareDivision2AsPicture}
                  style={{
                    padding: '12px 24px',
                    background: 'linear-gradient(135deg, #27ae60 0%, #229954 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontSize: '15px',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    boxShadow: '0 4px 12px rgba(39, 174, 96, 0.4)',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-3px)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(39, 174, 96, 0.5)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(39, 174, 96, 0.4)';
                  }}
                >
                  📸 Share as Picture
                </button>
                <button
                  onClick={downloadDivision2Excel}
                  style={{
                    padding: '12px 24px',
                    background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontSize: '15px',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    boxShadow: '0 4px 12px rgba(231, 76, 60, 0.4)',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-3px)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(231, 76, 60, 0.5)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(231, 76, 60, 0.4)';
                  }}
                >
                  📥 Download Excel Report
                </button>
              </div>
            </div>

            {(() => {
              const division2Data = currentYearData.filter(d => d.Division === 'Division-02');
              const areas = [...new Set(division2Data.map(d => d.Area))].sort();

              return (
                <div 
                  id="division2-table-container"
                  className="table-scroll"
                  style={{ 
                    overflowX: 'auto',
                    background: 'white',
                    borderRadius: '12px',
                    padding: '20px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                  }}
                >
                  {/* Header for image capture */}
                  <div style={{ 
                    textAlign: 'center', 
                    marginBottom: '20px',
                    paddingBottom: '15px',
                    borderBottom: '3px solid #e74c3c'
                  }}>
                    <h3 style={{ 
                      margin: '0 0 5px 0',
                      color: '#e74c3c',
                      fontSize: '24px',
                      fontWeight: '900'
                    }}>
                      📊 Division-02 Performance Report
                    </h3>
                    <p style={{ 
                      margin: 0,
                      color: '#666',
                      fontSize: '13px',
                      fontWeight: '600'
                    }}>
                      Generated on {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  </div>

                  <table style={{ 
                    width: '100%', 
                    borderCollapse: 'collapse',
                    fontSize: '10px',
                    border: '2px solid #000'
                  }}>
                    <thead>
                      <tr style={{ background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)', color: 'white' }}>
                        <th style={{ padding: '6px 4px', textAlign: 'left', fontWeight: '700', border: '1px solid #000', fontSize: '10px', whiteSpace: 'nowrap' }}>Area</th>
                        <th style={{ padding: '6px 4px', textAlign: 'left', fontWeight: '700', border: '1px solid #000', fontSize: '10px', whiteSpace: 'nowrap' }}>Plaza Name</th>
                        <th style={{ padding: '6px 4px', textAlign: 'right', fontWeight: '700', border: '1px solid #000', fontSize: '10px', whiteSpace: 'nowrap' }}>Base Target</th>
                        <th style={{ padding: '6px 4px', textAlign: 'right', fontWeight: '700', border: '1px solid #000', fontSize: '10px', whiteSpace: 'nowrap' }}>Ach</th>
                        <th style={{ padding: '6px 4px', textAlign: 'right', fontWeight: '700', border: '1px solid #000', fontSize: '10px', whiteSpace: 'nowrap' }}>Ach %</th>
                        {targetLabels.map((label, i) => (
                          <React.Fragment key={i}>
                            <th style={{ padding: '6px 4px', textAlign: 'right', fontWeight: '700', border: '1px solid #000', fontSize: '10px', whiteSpace: 'nowrap' }}>{label} Target</th>
                            <th style={{ padding: '6px 4px', textAlign: 'right', fontWeight: '700', border: '1px solid #000', fontSize: '10px', whiteSpace: 'nowrap' }}>{label} Ach %</th>
                          </React.Fragment>
                        ))}
                        <th style={{ padding: '6px 4px', textAlign: 'right', fontWeight: '700', border: '1px solid #000', fontSize: '10px', whiteSpace: 'nowrap' }}>Profit Ach</th>
                      </tr>
                    </thead>
                    <tbody>
                      {areas.map((area, areaIdx) => {
                        const areaPlazas = division2Data.filter(d => d.Area === area).sort((a, b) => a.Plaza.localeCompare(b.Plaza));
                        
                        // Calculate area subtotals
                        const areaBaseTarget = areaPlazas.reduce((sum, p) => {
                          const target = monthlyTargetData.find(t => t.PlazaName === p.Plaza)?.BaseTarget || 0;
                          return sum + target;
                        }, 0);
                        const areaTargetsArr = Array.from({ length: targetLabels.length }, (_, i) =>
                          areaPlazas.reduce((sum, p) => sum + (monthlyTargetData.find(t => t.PlazaName === p.Plaza)?.Targets?.[i] || 0), 0));
                        const areaAch = areaPlazas.reduce((sum, p) => sum + (p.Total_Ach || 0), 0);
                        const areaAchPct = areaBaseTarget > 0 ? ((areaAch / areaBaseTarget) * 100).toFixed(2) : '0.00';
                        const areaProfit = areaPlazas.reduce((sum, p) => sum + (p.Net_Profit_Ach || 0), 0);

                        return (
                          <React.Fragment key={areaIdx}>
                            {areaPlazas.map((plaza, plazaIdx) => {
                              const targetRow = monthlyTargetData.find(t => t.PlazaName === plaza.Plaza);
                              const baseTarget = targetRow?.BaseTarget || 0;
                              const targets = targetRow?.Targets || [];
                              const ach = plaza.Total_Ach || 0;
                              const achPct = baseTarget > 0 ? ((ach / baseTarget) * 100).toFixed(2) : '0.00';
                              const profit = plaza.Net_Profit_Ach || 0;

                              return (
                                <tr key={plazaIdx} style={{ 
                                  background: plazaIdx % 2 === 0 ? '#f8f9fa' : 'white'
                                }}>
                                  <td style={{ padding: '4px 4px', border: '1px solid #000', fontWeight: '600', color: '#000', fontSize: '10px' }}>{plazaIdx === 0 ? area : ''}</td>
                                  <td style={{ padding: '4px 4px', border: '1px solid #000', fontWeight: '500', fontSize: '10px' }}>{plaza.Plaza}</td>
                                  <td style={{ padding: '4px 4px', textAlign: 'right', border: '1px solid #000', fontSize: '10px' }}>
                                    {baseTarget.toLocaleString('en-IN')}
                                  </td>
                                  <td style={{ padding: '4px 4px', textAlign: 'right', border: '1px solid #000', fontWeight: '600', fontSize: '10px' }}>
                                    {ach.toLocaleString('en-IN')}
                                  </td>
                                  <td style={{ padding: '4px 4px', textAlign: 'right', border: '1px solid #000', fontWeight: '700', color: parseFloat(achPct) >= 100 ? '#27ae60' : '#e74c3c', fontSize: '10px' }}>
                                    {achPct}%
                                  </td>
                                  {targets.map((tgt: number, i: number) => {
                                    const tAchPct = tgt > 0 ? ((ach / tgt) * 100).toFixed(2) : '0.00';
                                    return (
                                      <React.Fragment key={i}>
                                        <td style={{ padding: '4px 4px', textAlign: 'right', border: '1px solid #000', color: '#666', fontSize: '10px' }}>
                                          {tgt.toLocaleString('en-IN')}
                                        </td>
                                        <td style={{ padding: '4px 4px', textAlign: 'right', border: '1px solid #000', fontWeight: '700', color: parseFloat(tAchPct) >= 100 ? '#27ae60' : '#e74c3c', fontSize: '10px' }}>
                                          {tAchPct}%
                                        </td>
                                      </React.Fragment>
                                    );
                                  })}
                                  <td style={{ padding: '4px 4px', textAlign: 'right', border: '1px solid #000', fontWeight: '700', color: profit >= 0 ? '#27ae60' : '#e74c3c', fontSize: '10px' }}>
                                    {profit.toLocaleString('en-IN')}
                                  </td>
                                </tr>
                              );
                            })}
                            
                            {/* Area Subtotal Row */}
                            <tr style={{ 
                              background: 'linear-gradient(135deg, #fff5f5 0%, #ffe5e5 100%)',
                              borderTop: '2px solid #000',
                              borderBottom: '2px solid #000',
                              fontWeight: '700'
                            }}>
                              <td colSpan={2} style={{ padding: '6px 4px', border: '1px solid #000', color: '#c0392b', fontSize: '11px', fontWeight: '800' }}>
                                {area} - SUBTOTAL
                              </td>
                              <td style={{ padding: '6px 4px', textAlign: 'right', border: '1px solid #000', color: '#c0392b', fontSize: '10px', fontWeight: '700' }}>
                                {areaBaseTarget.toLocaleString('en-IN')}
                              </td>
                              <td style={{ padding: '6px 4px', textAlign: 'right', border: '1px solid #000', color: '#c0392b', fontSize: '10px', fontWeight: '700' }}>
                                {areaAch.toLocaleString('en-IN')}
                              </td>
                              <td style={{ padding: '6px 4px', textAlign: 'right', border: '1px solid #000', fontSize: '10px', fontWeight: '700', color: parseFloat(areaAchPct) >= 100 ? '#27ae60' : '#e74c3c' }}>
                                {areaAchPct}%
                              </td>
                              {areaTargetsArr.map((t: number, i: number) => {
                                const tAchPct = t > 0 ? ((areaAch / t) * 100).toFixed(2) : '0.00';
                                return (
                                  <React.Fragment key={i}>
                                    <td style={{ padding: '6px 4px', textAlign: 'right', border: '1px solid #000', color: '#666', fontSize: '10px' }}>
                                      {t.toLocaleString('en-IN')}
                                    </td>
                                    <td style={{ padding: '6px 4px', textAlign: 'right', border: '1px solid #000', fontSize: '10px', fontWeight: '700', color: parseFloat(tAchPct) >= 100 ? '#27ae60' : '#e74c3c' }}>
                                      {tAchPct}%
                                    </td>
                                  </React.Fragment>
                                );
                              })}
                              <td style={{ padding: '6px 4px', textAlign: 'right', border: '1px solid #000', fontSize: '10px', fontWeight: '700', color: areaProfit >= 0 ? '#27ae60' : '#e74c3c' }}>
                                {areaProfit.toLocaleString('en-IN')}
                              </td>
                            </tr>
                          </React.Fragment>
                        );
                      })}
                      
                      {/* Grand Total Row */}
                      {(() => {
                        const grandTotalBaseTarget = division2Data.reduce((sum, p) => {
                          const target = monthlyTargetData.find(t => t.PlazaName === p.Plaza)?.BaseTarget || 0;
                          return sum + target;
                        }, 0);
                        const grandTotalTargetsArr = Array.from({ length: targetLabels.length }, (_, i) =>
                          division2Data.reduce((sum, p) => sum + (monthlyTargetData.find(t => t.PlazaName === p.Plaza)?.Targets?.[i] || 0), 0));
                        const grandTotalAch = division2Data.reduce((sum, p) => sum + (p.Total_Ach || 0), 0);
                        const grandTotalAchPct = grandTotalBaseTarget > 0 ? ((grandTotalAch / grandTotalBaseTarget) * 100).toFixed(2) : '0.00';
                        const grandTotalProfit = division2Data.reduce((sum, p) => sum + (p.Net_Profit_Ach || 0), 0);

                        return (
                          <tr style={{ 
                            background: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)',
                            borderTop: '3px solid #000',
                            borderBottom: '3px solid #000',
                            fontWeight: '800',
                            color: 'white'
                          }}>
                            <td colSpan={2} style={{ padding: '8px 4px', border: '2px solid #000', fontSize: '11px', fontWeight: '900' }}>
                              GRAND TOTAL
                            </td>
                            <td style={{ padding: '8px 4px', textAlign: 'right', border: '2px solid #000', fontSize: '10px', fontWeight: '700' }}>
                              {grandTotalBaseTarget.toLocaleString('en-IN')}
                            </td>
                            <td style={{ padding: '8px 4px', textAlign: 'right', border: '2px solid #000', fontSize: '10px', fontWeight: '700' }}>
                              {grandTotalAch.toLocaleString('en-IN')}
                            </td>
                            <td style={{ padding: '8px 4px', textAlign: 'right', border: '2px solid #000', fontSize: '10px', fontWeight: '700', color: parseFloat(grandTotalAchPct) >= 100 ? '#2ecc71' : '#e74c3c' }}>
                              {grandTotalAchPct}%
                            </td>
                            {grandTotalTargetsArr.map((t: number, i: number) => {
                              const tAchPct = t > 0 ? ((grandTotalAch / t) * 100).toFixed(2) : '0.00';
                              return (
                                <React.Fragment key={i}>
                                  <td style={{ padding: '8px 4px', textAlign: 'right', border: '2px solid #000', fontSize: '10px', color: 'rgba(255,255,255,0.9)' }}>
                                    {t.toLocaleString('en-IN')}
                                  </td>
                                  <td style={{ padding: '8px 4px', textAlign: 'right', border: '2px solid #000', fontSize: '10px', fontWeight: '700', color: parseFloat(tAchPct) >= 100 ? '#2ecc71' : '#e74c3c' }}>
                                    {tAchPct}%
                                  </td>
                                </React.Fragment>
                              );
                            })}
                            <td style={{ padding: '12px 8px', textAlign: 'right', border: '3px solid #000', fontSize: '16px', fontWeight: '900', color: grandTotalProfit >= 0 ? '#2ecc71' : '#ff6b6b', background: grandTotalProfit >= 0 ? '#27ae60' : '#c0392b' }}>
                              {grandTotalProfit.toLocaleString('en-IN')}
                            </td>
                          </tr>
                        );
                      })()}
                    </tbody>
                  </table>
                </div>
              );
            })()}
          </div>
          )}
          </>
        );
      })()}

      {/* Footer - Powered By */}
      <div style={{ 
        background: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)', 
        padding: '20px',
        marginTop: '40px',
        textAlign: 'center',
        borderTop: '2px solid #1a252f',
        borderRadius: '0 0 8px 8px'
      }}>
        <p style={{ 
          color: '#ecf0f1', 
          margin: 0, 
          fontSize: '16px',
          fontWeight: '600',
          letterSpacing: '0.5px'
        }}>
          Powered By <span style={{ color: '#3498db', fontWeight: '700', fontSize: '17px' }}>Member of BLCian</span>
        </p>
      </div>
    </div>
  );
}

export default App;
