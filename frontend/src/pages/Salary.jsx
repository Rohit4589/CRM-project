import React, { useState, useEffect, useMemo } from 'react';
import { API_BASE } from '../config/api';

// Helper to get all Thursdays in a given month (YYYY-MM)
const getThursdaysInMonth = (monthStr) => {
  if (!monthStr) return [];
  try {
    const [yearStr, mStr] = monthStr.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(mStr, 10) - 1;
    const d = new Date(year, month, 1);
    const thursdays = [];
    while (d.getMonth() === month) {
      if (d.getDay() === 4) { // 4 is Thursday (0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat)
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        thursdays.push(`${yyyy}-${mm}-${dd}`);
      }
      d.setDate(d.getDate() + 1);
    }
    return thursdays;
  } catch {
    return [];
  }
};

// Helper to get Wednesday, Thursday, Friday dates for a Thursday
const getWedThuFri = (thuDateStr) => {
  try {
    const d = new Date(thuDateStr + 'T00:00:00');
    const wed = new Date(d);
    wed.setDate(d.getDate() - 1);
    const fri = new Date(d);
    fri.setDate(d.getDate() + 1);

    const toStr = (dateObj) => {
      const y = dateObj.getFullYear();
      const m = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    return {
      wed: toStr(wed),
      thu: thuDateStr,
      fri: toStr(fri)
    };
  } catch {
    return { wed: '', thu: thuDateStr, fri: '' };
  }
};

// Check if worker worked on a given date (approved & dayValue > 0 & not admin bonus)
const hasWorkedOnDate = (dateStr, approvedLogs) => {
  if (!dateStr || !approvedLogs) return false;
  return approvedLogs.some(log => {
    const logDate = log.attendanceDate ? String(log.attendanceDate).slice(0, 10) : '';
    const dayVal = parseFloat(log.dayValue) || 0;
    const isNotGift = !log.isBonus && log.inTime !== 'GIFT' && log.inTime !== 'EXTRA' && log.outTime !== 'BONUS' && log.outTime !== 'ADDED';
    return logDate === dateStr && dayVal > 0 && isNotGift;
  });
};

const Salary = ({ onOpenFestivals }) => {
  const [employees, setEmployees] = useState([]);
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [sites, setSites] = useState([]);
  const [festivals, setFestivals] = useState([]);
  const [loading, setLoading] = useState(true);

  // Benefit Overrides (Editable by Admin, persisted in localStorage)
  const [benefitOverrides, setBenefitOverrides] = useState(() => {
    try {
      const saved = localStorage.getItem('mi_salary_benefit_overrides');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Edit Benefit Modal State
  const [showBenefitModal, setShowBenefitModal] = useState(false);
  const [benefitTargetEmp, setBenefitTargetEmp] = useState(null);
  const [benefitThursdayInput, setBenefitThursdayInput] = useState('');
  const [benefitFestivalInput, setBenefitFestivalInput] = useState('');
  const [benefitNotesInput, setBenefitNotesInput] = useState('');
  
  // Navigation & View Mode
  const [viewMode, setViewMode] = useState('employee'); // 'employee' | 'site'
  const [activeEmployeeId, setActiveEmployeeId] = useState(null);
  const [activeSiteId, setActiveSiteId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [siteTableTab, setSiteTableTab] = useState('workers'); // 'workers' | 'attendance'

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const formatToDMY = (dateStr) => {
    if (!dateStr) return '--';
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const [y, m, d] = dateStr.split('-');
      return `${d}-${m}-${y}`;
    }
    return dateStr;
  };

  const formatMonthName = (monthStr) => {
    if (!monthStr) return '';
    try {
      const [y, m] = monthStr.split('-');
      const d = new Date(Number(y), Number(m) - 1, 1);
      return d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    } catch {
      return monthStr;
    }
  };

  const formatPeriodRange = (monthStr) => {
    if (!monthStr) return '';
    try {
      const [y, m] = monthStr.split('-');
      const year = Number(y);
      const monthIdx = Number(m) - 1;
      const lastDay = new Date(year, monthIdx + 1, 0).getDate();
      const monthName = new Date(year, monthIdx, 1).toLocaleDateString('en-IN', { month: 'long' });
      
      const getOrdinal = (n) => {
        const s = ['th', 'st', 'nd', 'rd'];
        const v = n % 100;
        return n + (s[(v - 20) % 10] || s[v] || s[0]);
      };

      return `${getOrdinal(1)} to ${getOrdinal(lastDay)} ${monthName} ${year}`;
    } catch {
      return monthStr;
    }
  };

  const formatDays = (val) => {
    const d = Number(val) || 0;
    return d % 1 === 0 ? d.toFixed(0) : String(parseFloat(d.toFixed(2)));
  };

  // Fetch all required data in parallel
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const year = selectedMonth ? selectedMonth.split('-')[0] : new Date().getFullYear();
        const [empRes, attRes, siteRes, festRes] = await Promise.all([
          fetch(`${API_BASE}/employees`).then(r => r.json()).catch(() => ({ success: false })),
          fetch(`${API_BASE}/attendance?month=${selectedMonth}`).then(r => r.json()).catch(() => ({ success: false })),
          fetch(`${API_BASE}/sites`).then(r => r.json()).catch(() => ({ success: false })),
          fetch(`${API_BASE}/festivals?year=${year}`).then(r => r.json()).catch(() => ({ success: false }))
        ]);

        if (empRes.success) setEmployees(empRes.employees || []);
        if (attRes.success) setAttendanceLogs(attRes.attendance || []);
        if (siteRes.success) setSites(siteRes.sites || []);
        if (festRes.success) setFestivals(festRes.festivals || []);
      } catch (err) {
        console.error('Error fetching salary & site data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedMonth]);

  // Month-End Gift Attendance Modal State in Salary page
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [giftSaving, setGiftSaving] = useState(false);
  const [giftSuccessMsg, setGiftSuccessMsg] = useState('');
  const [giftFormData, setGiftFormData] = useState({
    userId: '',
    employeeName: '',
    dailyRate: 1000,
    bonusDays: '4',
    date: '',
    notes: '🎁 Month-End Performance Bonus (+4 Days)'
  });

  const handleOpenGiftModal = (emp) => {
    const eId = emp?.dbId || emp?.userId || (employees.length > 0 ? employees[0].dbId : '');
    const matched = employees.find(e => e.dbId === eId || String(e.id) === String(emp?.id));
    const rate = Number(matched?.dailySalary || emp?.dailyRate || 1000);
    const defaultDate = `${selectedMonth}-28`;
    setGiftFormData({
      userId: eId,
      employeeName: matched?.name || emp?.name || 'Employee',
      dailyRate: rate,
      bonusDays: '4',
      date: defaultDate,
      notes: 'Extra Attendance (+4 Days)'
    });
    setShowGiftModal(true);
  };

  const handleSaveGiftAttendance = async (e) => {
    e.preventDefault();
    if (!giftFormData.userId) {
      alert('Please select an employee');
      return;
    }
    const days = parseFloat(giftFormData.bonusDays);
    if (isNaN(days) || days <= 0) {
      alert('Please enter a valid number of days');
      return;
    }
    setGiftSaving(true);
    try {
      const res = await fetch(`${API_BASE}/attendance/bonus`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: Number(giftFormData.userId),
          bonusDays: days,
          date: giftFormData.date,
          notes: giftFormData.notes
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.message || 'Failed to add attendance days');
        setGiftSaving(false);
        return;
      }
      setShowGiftModal(false);
      setGiftSuccessMsg(data.message || `Successfully added +${days} Attendance Days!`);
      setTimeout(() => setGiftSuccessMsg(''), 7000);
      const attRes = await fetch(`${API_BASE}/attendance?month=${selectedMonth}`).then(r => r.json()).catch(() => ({ success: false }));
      if (attRes.success) setAttendanceLogs(attRes.attendance || []);
    } catch (err) {
      console.error('Error awarding bonus:', err);
      alert('Network error while awarding bonus');
    } finally {
      setGiftSaving(false);
    }
  };

  // Open & Save Benefit Overrides
  const handleOpenBenefitModal = (emp) => {
    if (!emp) return;
    setBenefitTargetEmp(emp);
    setBenefitThursdayInput(emp.finalThursdayDays !== undefined ? String(emp.finalThursdayDays) : String(emp.autoThursdayDays || 0));
    setBenefitFestivalInput(emp.finalFestivalDays !== undefined ? String(emp.finalFestivalDays) : String(emp.autoFestivalDays || 0));
    setBenefitNotesInput(emp.userOverride?.notes || '');
    setShowBenefitModal(true);
  };

  const handleSaveBenefitOverride = (e) => {
    e.preventDefault();
    if (!benefitTargetEmp) return;
    const thu = parseFloat(benefitThursdayInput);
    const fest = parseFloat(benefitFestivalInput);
    if (isNaN(thu) || isNaN(fest)) {
      alert('Please enter valid numeric day values');
      return;
    }

    const key = `${selectedMonth}_${benefitTargetEmp.id || benefitTargetEmp.dbId}`;
    const updated = {
      ...benefitOverrides,
      [key]: {
        thursdayDays: thu,
        festivalDays: fest,
        notes: benefitNotesInput.trim()
      }
    };
    setBenefitOverrides(updated);
    try {
      localStorage.setItem('mi_salary_benefit_overrides', JSON.stringify(updated));
    } catch (err) {
      console.error('Failed to save benefit override:', err);
    }
    setShowBenefitModal(false);
  };

  const handleResetBenefitOverride = () => {
    if (!benefitTargetEmp) return;
    const key = `${selectedMonth}_${benefitTargetEmp.id || benefitTargetEmp.dbId}`;
    const updated = { ...benefitOverrides };
    delete updated[key];
    setBenefitOverrides(updated);
    try {
      localStorage.setItem('mi_salary_benefit_overrides', JSON.stringify(updated));
    } catch (err) {
      console.error('Failed to reset benefit override:', err);
    }
    setShowBenefitModal(false);
  };

  // =========================================================================
  // 1. COMPUTE SALARY PER EMPLOYEE (EMPLOYEE-WISE)
  // =========================================================================
  const salaryRows = useMemo(() => {
    // 1. Gather all unique employee entities (active employees + former employees who worked in this month)
    const empMap = new Map();

    (employees || []).forEach(emp => {
      const key = String(emp.dbId || emp.id);
      empMap.set(key, {
        id: emp.id,
        dbId: emp.dbId,
        name: emp.name,
        role: emp.role,
        avatar: emp.avatar,
        dailyRate: Number(emp.dailySalary || 0),
        isPermanent: Boolean(emp.isPermanent || emp.is_permanent),
        isFormer: false,
      });
    });

    // Also include any employee from attendance logs who is no longer active
    (attendanceLogs || []).forEach(log => {
      const exists = Array.from(empMap.values()).some(e => 
        (log.userId && e.dbId === log.userId) || 
        (log.empId && String(e.id).toUpperCase() === String(log.empId).toUpperCase())
      );
      if (!exists) {
        const key = `user_${log.userId || log.empId || log.name}`;
        if (!empMap.has(key)) {
          empMap.set(key, {
            id: log.empId || (log.userId ? `EMP-${log.userId}` : 'EMP-000'),
            dbId: log.userId || null,
            name: log.name || log.employeeName || 'Former Employee',
            role: log.role || 'Carpenter',
            avatar: null,
            dailyRate: Number(log.dailyRate || 0),
            isPermanent: false,
            isFormer: true,
          });
        }
      }
    });

    const monthThursdays = getThursdaysInMonth(selectedMonth);
    const monthFestivals = (festivals || []).filter(f => f.date && f.date.startsWith(selectedMonth) && f.is_active !== false);

    const rows = Array.from(empMap.values()).map(emp => {
      // Only count Approved and Verified records in salary calculation
      const empAtt = attendanceLogs.filter(a => 
        (emp.dbId && a.userId === emp.dbId) || 
        (emp.id && String(a.empId).toUpperCase() === String(emp.id).toUpperCase()) ||
        (emp.name && a.name === emp.name)
      );
      const approvedAtt = empAtt.filter(a => a.status === 'Approved' || a.status === 'Verified');
      const totalDays = approvedAtt.reduce((sum, a) => sum + (parseFloat(a.dayValue) || 0), 0);

      // Determine daily rate: emp.dailyRate, or from their attendance log snapshots
      let dailyRate = emp.dailyRate;
      if (!dailyRate && empAtt.length > 0) {
        const found = empAtt.find(a => Number(a.dailyRate) > 0);
        if (found) dailyRate = Number(found.dailyRate);
      }

      // Permanent Member Benefits Calculation
      const isPermanent = Boolean(emp.isPermanent);
      let autoThursdayDays = 0;
      let qualifiedThursdays = [];
      let autoFestivalDays = 0;

      if (isPermanent) {
        // 1. Thursday Policy: Check Wednesday, Thursday, Friday work (at least 2 days worked)
        monthThursdays.forEach(thuDate => {
          const { wed, fri } = getWedThuFri(thuDate);
          let wCount = 0;
          if (hasWorkedOnDate(wed, approvedAtt)) wCount++;
          if (hasWorkedOnDate(thuDate, approvedAtt)) wCount++;
          if (hasWorkedOnDate(fri, approvedAtt)) wCount++;
          if (wCount >= 2) {
            qualifiedThursdays.push(thuDate);
            autoThursdayDays += 1.0;
          }
        });

        // 2. Festival Policy: 1 extra hajeri for every festival occurring in this month
        autoFestivalDays = monthFestivals.length * 1.0;
      }

      // Check for user manual overrides for this employee in this month
      const overrideKey = `${selectedMonth}_${emp.id || emp.dbId}`;
      const userOverride = benefitOverrides[overrideKey] || {};

      const finalThursdayDays = userOverride.thursdayDays !== undefined 
        ? Number(userOverride.thursdayDays) 
        : autoThursdayDays;

      const finalFestivalDays = userOverride.festivalDays !== undefined 
        ? Number(userOverride.festivalDays) 
        : autoFestivalDays;

      const thursdayAmount = Math.round(finalThursdayDays * dailyRate);
      const festivalAmount = Math.round(finalFestivalDays * dailyRate);
      const baseAmount = Math.round(totalDays * dailyRate);
      const grossAmount = baseAmount + thursdayAmount + festivalAmount;
      const deductions = 0; // Configurable advance / deduction
      const netPayable = grossAmount - deductions;
      const totalCombinedDays = totalDays + finalThursdayDays + finalFestivalDays;

      return {
        id: emp.id,
        dbId: emp.dbId,
        name: emp.name,
        role: emp.role,
        avatar: emp.avatar,
        isFormer: emp.isFormer,
        isPermanent,
        totalDays,
        dailyRate,
        baseAmount,
        // Benefit breakdown details
        totalThursdaysCount: monthThursdays.length,
        qualifiedThursdays,
        autoThursdayDays,
        finalThursdayDays,
        thursdayAmount,
        monthFestivals,
        autoFestivalDays,
        finalFestivalDays,
        festivalAmount,
        totalCombinedDays,
        userOverride,
        grossAmount,
        deductions,
        netPayable,
        status: totalCombinedDays > 0 ? 'Ready' : (emp.isFormer ? 'Former Employee' : 'No Punches'),
        attendanceLogs: empAtt.sort((a, b) => (a.attendanceDate || '').localeCompare(b.attendanceDate || ''))
      };
    });

    // If an employee is former and has 0 attendance records in this month, don't show them
    return rows.filter(r => !r.isFormer || r.attendanceLogs.length > 0);
  }, [employees, attendanceLogs, festivals, selectedMonth, benefitOverrides]);

  const totalEmployeePayroll = useMemo(() => {
    return salaryRows.reduce((sum, r) => sum + r.netPayable, 0);
  }, [salaryRows]);

  // Filtered employee rows based on search
  const filteredSalaryRows = useMemo(() => {
    if (!searchQuery.trim()) return salaryRows;
    const q = searchQuery.toLowerCase();
    return salaryRows.filter(r => 
      (r.name && r.name.toLowerCase().includes(q)) ||
      (r.id && r.id.toLowerCase().includes(q)) ||
      (r.role && r.role.toLowerCase().includes(q))
    );
  }, [salaryRows, searchQuery]);

  // =========================================================================
  // 2. COMPUTE SITE-WISE SALARY & LABOR BILLING EXPENSES
  // =========================================================================
  const siteSalaryRows = useMemo(() => {
    const siteMap = new Map();

    // Add registered sites from database
    (sites || []).forEach(s => {
      const sRef = s.siteRef || s.id || `SITE-${String(s.dbId).padStart(3, '0')}`;
      const key = String(s.dbId || sRef);
      siteMap.set(key, {
        id: sRef,
        siteRef: sRef,
        dbId: s.dbId,
        customerName: s.customerName || 'Customer Site',
        location: s.location || '',
        fullAddress: s.fullAddress || '',
        phone: s.phone || '',
        status: s.status || 'Running',
        startDate: s.startDate || '',
        targetDate: s.targetDate || '',
      });
    });

    // Also collect any sites that have attendance records but might not be in sites array
    attendanceLogs.forEach(log => {
      const sRef = log.siteRef || (log.siteId ? `SITE-${String(log.siteId).padStart(3, '0')}` : 'SITE');
      const key = String(log.siteId || sRef);
      if (!siteMap.has(key)) {
        siteMap.set(key, {
          id: sRef,
          siteRef: sRef,
          dbId: log.siteId || null,
          customerName: log.customerName || log.siteName || 'Work Site',
          location: log.siteLocation || '',
          fullAddress: log.siteLocation || '',
          phone: '',
          status: 'Running',
          startDate: '',
          targetDate: '',
        });
      }
    });

    // Calculate labor breakdown for each site
    const rows = Array.from(siteMap.values()).map(site => {
      // Find all attendance records for this site
      const siteLogs = attendanceLogs.filter(log => {
        if (site.dbId && log.siteId && Number(site.dbId) === Number(log.siteId)) return true;
        if (site.siteRef && log.siteRef && String(site.siteRef).trim().toUpperCase() === String(log.siteRef).trim().toUpperCase()) return true;
        if (site.id && log.siteRef && String(site.id).trim().toUpperCase() === String(log.siteRef).trim().toUpperCase()) return true;
        return false;
      });

      // Group by worker
      const workerMap = new Map();
      siteLogs.forEach(log => {
        const empKey = String(log.userId || log.empId);
        if (!workerMap.has(empKey)) {
          const empObj = employees.find(e => e.dbId === log.userId || String(e.id) === String(log.empId));
          const dailyRate = Number(log.dailyRate || empObj?.dailySalary || 0);
          workerMap.set(empKey, {
            id: log.empId || empObj?.id || `EMP-${log.userId}`,
            userId: log.userId,
            name: log.name || empObj?.name || log.employeeName || 'Unknown Employee',
            role: log.role || empObj?.role || 'Worker',
            dailyRate,
            daysOnSite: 0,
            workHours: 0,
            shiftCount: 0,
            shifts: []
          });
        }
        const w = workerMap.get(empKey);
        const isApproved = log.status === 'Approved' || log.status === 'Verified';
        const dayVal = isApproved ? (parseFloat(log.dayValue) || 0) : 0;
        w.daysOnSite += dayVal;
        w.workHours += Number(log.workHours || 0);
        w.shiftCount += 1;
        w.shifts.push(log);
      });

      // Calculate total salary per worker on this site
      const workers = Array.from(workerMap.values()).map(w => {
        const totalSalary = Math.round(w.daysOnSite * w.dailyRate);
        return {
          ...w,
          totalSalary,
          shifts: w.shifts.sort((a, b) => (a.attendanceDate || '').localeCompare(b.attendanceDate || ''))
        };
      }).sort((a, b) => b.totalSalary - a.totalSalary);

      const totalDays = workers.reduce((sum, w) => sum + w.daysOnSite, 0);
      const totalLaborCost = workers.reduce((sum, w) => sum + w.totalSalary, 0);
      const totalHours = siteLogs.reduce((sum, l) => sum + (Number(l.workHours) || 0), 0);
      const workerCount = workers.length;

      return {
        ...site,
        totalDays,
        totalLaborCost,
        totalHours,
        workerCount,
        workers,
        shifts: siteLogs.sort((a, b) => (a.attendanceDate || '').localeCompare(b.attendanceDate || ''))
      };
    });

    // Sort: sites with active work first, then by total labor cost descending
    return rows.sort((a, b) => {
      if (b.totalDays !== a.totalDays) return b.totalDays - a.totalDays;
      return b.totalLaborCost - a.totalLaborCost;
    });
  }, [sites, attendanceLogs, employees]);

  const totalSitePayroll = useMemo(() => {
    return siteSalaryRows.reduce((sum, s) => sum + s.totalLaborCost, 0);
  }, [siteSalaryRows]);

  const totalSiteManDays = useMemo(() => {
    return siteSalaryRows.reduce((sum, s) => sum + s.totalDays, 0);
  }, [siteSalaryRows]);

  const activeSitesCount = useMemo(() => {
    return siteSalaryRows.filter(s => s.totalDays > 0).length;
  }, [siteSalaryRows]);

  // Filtered site rows based on search
  const filteredSiteRows = useMemo(() => {
    if (!searchQuery.trim()) return siteSalaryRows;
    const q = searchQuery.toLowerCase();
    return siteSalaryRows.filter(s => 
      (s.customerName && s.customerName.toLowerCase().includes(q)) ||
      (s.siteRef && s.siteRef.toLowerCase().includes(q)) ||
      (s.location && s.location.toLowerCase().includes(q))
    );
  }, [siteSalaryRows, searchQuery]);

  // Active employee or active site for detailed drill-down views
  const activeEmployee = activeEmployeeId ? salaryRows.find(r => r.id === activeEmployeeId) : null;
  const activeSite = activeSiteId ? siteSalaryRows.find(s => s.id === activeSiteId || s.siteRef === activeSiteId || s.dbId === activeSiteId) : null;

  // Group activeEmployee.attendanceLogs by date for neat multi-site display with sequential timings
  const employeeGroupedShifts = useMemo(() => {
    if (!activeEmployee || !activeEmployee.attendanceLogs || activeEmployee.attendanceLogs.length === 0) return [];
    
    // Group logs by attendanceDate
    const dateMap = new Map();
    activeEmployee.attendanceLogs.forEach(log => {
      const dateKey = log.attendanceDate ? String(log.attendanceDate).slice(0, 10) : 'NO_DATE';
      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, []);
      }
      dateMap.get(dateKey).push(log);
    });

    const groups = [];
    for (const [dateKey, rawLogs] of dateMap.entries()) {
      // Sort shifts chronologically by ID
      const sortedLogs = [...rawLogs].sort((a, b) => (Number(a.id) || 0) - (Number(b.id) || 0));
      
      // Calculate sequential non-overlapping timings for multi-site shifts on the same day
      let resolvedLogs = sortedLogs.map((log, sIdx) => {
        let inTime = log.inTime || '09:00 AM';
        let outTime = log.outTime || '06:00 PM';
        let workHours = Number(log.workHours || 0);
        const dayVal = parseFloat(log.dayValue) || (log.isBonus ? 0 : 1.0);
        const isBonus = Boolean(log.isBonus || log.inTime === 'GIFT' || log.inTime === 'EXTRA' || log.outTime === 'BONUS' || log.outTime === 'ADDED');
        const computedSalary = Math.round(dayVal * (activeEmployee.dailyRate || 0));

        return {
          ...log,
          inTime,
          outTime,
          workHours,
          dayVal,
          daySalary: computedSalary,
          isBonus,
          shiftIndex: sIdx,
          totalShiftsOnDate: sortedLogs.length,
          shiftTag: ''
        };
      });

      // Contractor Hajeri Timing Rules:
      // 1 Hajeri = 09:00 AM to 06:00 PM (9 hrs)
      // 1.5 Hajeri = 09:00 AM to 09:00 PM (12 hrs total)
      // 2.0 Hajeri = 06:00 AM to 09:00 PM (15 hrs total)
      if (resolvedLogs.length === 1 && !resolvedLogs[0].isBonus) {
        const v = resolvedLogs[0].dayVal;
        if (v === 1.5) {
          resolvedLogs[0].inTime = '09:00 AM';
          resolvedLogs[0].outTime = '09:00 PM';
          resolvedLogs[0].workHours = 12;
        } else if (v === 2.0) {
          resolvedLogs[0].inTime = '06:00 AM';
          resolvedLogs[0].outTime = '09:00 PM';
          resolvedLogs[0].workHours = 15;
        } else if (v <= 0.5) {
          resolvedLogs[0].inTime = '09:00 AM';
          resolvedLogs[0].outTime = '01:00 PM';
          resolvedLogs[0].workHours = 4;
        } else {
          resolvedLogs[0].inTime = '09:00 AM';
          resolvedLogs[0].outTime = '06:00 PM';
          resolvedLogs[0].workHours = 9;
        }
      } else if (resolvedLogs.length === 2 && !resolvedLogs[0].isBonus && !resolvedLogs[1].isBonus) {
        const v1 = resolvedLogs[0].dayVal;
        const v2 = resolvedLogs[1].dayVal;

        if (v1 >= 1.0 && v2 <= 0.5) {
          // 1.5 Hajeri (1 Day + 0.5 Day): 1st site is Day shift (9 to 6), 2nd site is Evening OT (6 to 9)
          resolvedLogs[0].inTime = '09:00 AM';
          resolvedLogs[0].outTime = '06:00 PM';
          resolvedLogs[0].workHours = 9;
          resolvedLogs[0].shiftTag = '1st Site (Day Shift)';

          resolvedLogs[1].inTime = '06:00 PM';
          resolvedLogs[1].outTime = '09:00 PM';
          resolvedLogs[1].workHours = 3;
          resolvedLogs[1].shiftTag = '2nd Site (Evening OT)';
        } else if (v1 <= 0.5 && v2 >= 1.0) {
          // 1.5 Hajeri (0.5 Day + 1 Day): 1st site is Morning (9 to 1), 2nd site is Afternoon & OT (2 to 9)
          resolvedLogs[0].inTime = '09:00 AM';
          resolvedLogs[0].outTime = '01:00 PM';
          resolvedLogs[0].workHours = 4;
          resolvedLogs[0].shiftTag = '1st Site (Morning)';

          resolvedLogs[1].inTime = '02:00 PM';
          resolvedLogs[1].outTime = '09:00 PM';
          resolvedLogs[1].workHours = 7;
          resolvedLogs[1].shiftTag = '2nd Site (Afternoon & OT)';
        } else if (v1 <= 0.5 && v2 <= 0.5) {
          // 1.0 Hajeri (0.5 Day + 0.5 Day): 1st site Morning (9 to 1), 2nd site Afternoon (2 to 6)
          resolvedLogs[0].inTime = '09:00 AM';
          resolvedLogs[0].outTime = '01:00 PM';
          resolvedLogs[0].workHours = 4;
          resolvedLogs[0].shiftTag = '1st Site (Morning)';

          resolvedLogs[1].inTime = '02:00 PM';
          resolvedLogs[1].outTime = '06:00 PM';
          resolvedLogs[1].workHours = 4;
          resolvedLogs[1].shiftTag = '2nd Site (Afternoon)';
        } else if (v1 >= 1.0 && v2 >= 1.0) {
          // 2.0 Hajeri (1 Day + 1 Day): 06:00 AM to 02:00 PM, then 02:00 PM to 09:00 PM
          resolvedLogs[0].inTime = '06:00 AM';
          resolvedLogs[0].outTime = '02:00 PM';
          resolvedLogs[0].workHours = 8;
          resolvedLogs[0].shiftTag = '1st Site (Morning)';

          resolvedLogs[1].inTime = '02:00 PM';
          resolvedLogs[1].outTime = '09:00 PM';
          resolvedLogs[1].workHours = 7;
          resolvedLogs[1].shiftTag = '2nd Site (Evening)';
        }
      } else if (resolvedLogs.length === 3) {
        resolvedLogs[0].inTime = '09:00 AM';
        resolvedLogs[0].outTime = '01:00 PM';
        resolvedLogs[0].workHours = 4;
        resolvedLogs[0].shiftTag = '1st Site (Morning)';

        resolvedLogs[1].inTime = '02:00 PM';
        resolvedLogs[1].outTime = '06:00 PM';
        resolvedLogs[1].workHours = 4;
        resolvedLogs[1].shiftTag = '2nd Site (Afternoon)';

        resolvedLogs[2].inTime = '06:00 PM';
        resolvedLogs[2].outTime = '09:00 PM';
        resolvedLogs[2].workHours = 3;
        resolvedLogs[2].shiftTag = '3rd Site (Evening OT)';
      }

      const totalDateDayValue = resolvedLogs.reduce((sum, l) => sum + (l.isBonus ? 0 : l.dayVal), 0);
      const totalDateSalary = resolvedLogs.reduce((sum, l) => sum + l.daySalary, 0);

      groups.push({
        dateKey,
        formattedDate: dateKey !== 'NO_DATE' ? formatToDMY(dateKey) : 'N/A',
        shifts: resolvedLogs,
        totalDayValue: totalDateDayValue,
        totalDaySalary: totalDateSalary,
        shiftCount: resolvedLogs.length
      });
    }

    return groups;
  }, [activeEmployee]);

  const totalResolvedHours = useMemo(() => {
    return employeeGroupedShifts.reduce((acc, g) => {
      return acc + g.shifts.reduce((sAcc, s) => sAcc + (s.isBonus ? 0 : (Number(s.workHours) || 0)), 0);
    }, 0);
  }, [employeeGroupedShifts]);

  return (
    <main className="dashboard-content" style={{ padding: '24px 30px', maxWidth: '1600px', margin: '0 auto' }}>
      
      {/* =========================================================================
          VIEW A: INDIVIDUAL EMPLOYEE DAY-WISE SALARY STATEMENT (DRILL-DOWN)
          ========================================================================= */}
      {activeEmployee ? (
        <div className="salary-sheet-page">
          {/* Back Button & Top Navigation */}
          <div style={{ marginBottom: '20px' }}>
            <button
              onClick={() => setActiveEmployeeId(null)}
              className="no-print"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: '#fff',
                border: '1px solid #D1D5DB',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '700',
                color: '#374151',
                cursor: 'pointer',
                marginBottom: '16px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                transition: 'all 0.15s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--gold, #A56A30)';
                e.currentTarget.style.color = 'var(--gold, #A56A30)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#D1D5DB';
                e.currentTarget.style.color = '#374151';
              }}
            >
              <i className="fa-solid fa-arrow-left"></i> Back to All Employees
            </button>

            {/* Printable Official Company Header (Only visible on print) */}
            <div className="salary-print-header" style={{ display: 'none' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '2px solid var(--gold, #A56A30)',
                paddingBottom: '12px',
                marginBottom: '14px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <img src="/logo.png" alt="Modern Interior" style={{ height: '44px', width: 'auto', objectFit: 'contain' }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '13.5px', fontWeight: '800', color: '#111827' }}>
                    Period: <span style={{ color: 'var(--gold, #A56A30)' }}>{formatPeriodRange(selectedMonth)}</span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748B', marginTop: '3px', fontFamily: 'monospace' }}>
                    Generated: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </div>
                </div>
              </div>

              {/* Employee Particulars Card for Print (Structured 4-Column Grid) */}
              <div className="salary-print-emp-card" style={{
                background: '#FAF8F5',
                border: '1.5px solid #EAE3DA',
                borderRadius: '8px',
                padding: '12px 18px',
                marginBottom: '16px',
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '12px',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontSize: '10px', color: '#78716C', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Employee</div>
                  <div style={{ fontSize: '13.5px', fontWeight: '800', color: '#111827', marginTop: '2px' }}>
                    {activeEmployee.name} <span style={{ fontSize: '11px', color: 'var(--gold, #A56A30)', fontWeight: '700' }}>({activeEmployee.id})</span>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '10px', color: '#78716C', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Role / Designation</div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#44403C', marginTop: '2px' }}>
                    {activeEmployee.role || 'Staff'}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '10px', color: '#78716C', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Daily Wage Rate</div>
                  <div style={{ fontSize: '13.5px', fontWeight: '800', color: '#8C5521', marginTop: '2px' }}>
                    ₹{activeEmployee.dailyRate.toLocaleString('en-IN')} <span style={{ fontSize: '11px', fontWeight: '600', color: '#78716C' }}>/ Day</span>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '10px', color: 'var(--gold, #8C5521)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Salary Payable</div>
                  <div style={{ fontSize: '16px', fontWeight: '900', color: '#4A2C17', marginTop: '1px' }}>
                    ₹{activeEmployee.grossAmount.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
            </div>

            {/* Employee Banner (Hidden on print to avoid duplication) */}
            <div className="no-print" style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px'
            }}>
              <div>
                <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: '#111827' }}>
                  {activeEmployee.name} - Day-Wise Salary
                </h1>
                <div style={{ fontSize: '13px', color: '#6B7280', marginTop: '4px' }}>
                  <span style={{ fontWeight: '700', color: 'var(--gold, #A56A30)' }}>{activeEmployee.id}</span> · {activeEmployee.role}
                </div>
              </div>

              <div className="no-print" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{
                  background: '#F3EDE6',
                  color: '#7A4518',
                  border: '1px solid #D1C2AF',
                  padding: '6px 12px',
                  borderRadius: '7px',
                  fontSize: '12px',
                  fontWeight: '700',
                  whiteSpace: 'nowrap'
                }}>
                  <i className="fa-regular fa-calendar" style={{ marginRight: '5px' }}></i>
                  {formatMonthName(selectedMonth)}
                </span>
                {activeEmployee.isPermanent && (
                  <button
                    type="button"
                    onClick={() => handleOpenBenefitModal(activeEmployee)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '7px',
                      fontSize: '12px',
                      fontWeight: '700',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      background: '#ECFDF5',
                      color: '#065F46',
                      border: '1.5px solid #A7F3D0',
                      cursor: 'pointer',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    <i className="fa-solid fa-pen-to-square"></i> Edit Benefits
                  </button>
                )}
                {onOpenFestivals && (
                  <button
                    type="button"
                    onClick={onOpenFestivals}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '7px',
                      fontSize: '12px',
                      fontWeight: '700',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      background: '#FFFDF5',
                      color: '#B45309',
                      border: '1.5px solid #FDE68A',
                      cursor: 'pointer',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    <i className="fa-solid fa-champagne-glasses"></i> Festivals
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleOpenGiftModal(activeEmployee)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '7px',
                    fontSize: '12px',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    background: '#fff',
                    color: '#374151',
                    border: '1.5px solid #D1C2AF',
                    cursor: 'pointer',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <i className="fa-solid fa-plus" style={{ color: 'var(--gold, #A56A30)' }}></i> Add Days
                </button>
                <button
                  onClick={() => window.print()}
                  className="btn-primary"
                  style={{
                    padding: '6px 14px',
                    borderRadius: '7px',
                    fontSize: '12px',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <i className="fa-solid fa-print"></i> Print Statement
                </button>
              </div>
            </div>
          </div>

          {/* KPI Summary Cards (Hidden on print to save vertical paper space) */}
          <div className="no-print" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(135px, 1fr))',
            gap: '8px',
            marginBottom: '14px'
          }}>
            <div style={{ background: '#fff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #D1C2AF', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
              <div style={{ fontSize: '10px', color: '#6B7280', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Logged Shifts</div>
              <div style={{ fontSize: '18px', fontWeight: '800', color: '#111827', marginTop: '2px', whiteSpace: 'nowrap' }}>
                {activeEmployee.attendanceLogs.length} Shifts
              </div>
            </div>

            <div style={{ background: '#fff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #D1C2AF', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
              <div style={{ fontSize: '10px', color: '#6B7280', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Total Day Units</div>
              <div style={{ fontSize: '18px', fontWeight: '800', color: '#8C5521', marginTop: '2px', whiteSpace: 'nowrap' }}>
                {formatDays(activeEmployee.totalDays)} Days
              </div>
            </div>

            <div style={{ background: '#fff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #D1C2AF', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
              <div style={{ fontSize: '10px', color: '#6B7280', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Daily Wage Rate</div>
              <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--gold, #A56A30)', marginTop: '2px', whiteSpace: 'nowrap' }}>
                ₹{activeEmployee.dailyRate.toLocaleString('en-IN')}
              </div>
            </div>

            <div style={{ background: '#FAF8F5', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #EAE3DA', boxShadow: '0 1px 3px rgba(74, 44, 23, 0.04)' }}>
              <div style={{ fontSize: '10px', color: 'var(--gold, #8C5521)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Total Salary Earned</div>
              <div style={{ fontSize: '18px', fontWeight: '800', color: '#4A2C17', marginTop: '2px', whiteSpace: 'nowrap' }}>
                ₹{activeEmployee.grossAmount.toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          {/* Full-Page Day-Wise Shifts Table Container */}
          <div className="panel table-responsive salary-table-wrapper" style={{
            background: '#fff',
            borderRadius: '10px',
            border: '1px solid #EAE3DA',
            boxShadow: '0 2px 8px rgba(74, 44, 23, 0.04)',
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch'
          }}>
            <table className="salary-shifts-table" style={{ width: '100%', minWidth: '780px', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
              <thead>
                <tr style={{
                  background: '#FAF8F5',
                  borderBottom: '1.5px solid #EAE3DA',
                  color: '#4A2C17',
                  fontSize: '11px',
                  fontWeight: '800',
                  textTransform: 'uppercase',
                  letterSpacing: '0.6px'
                }}>
                  <th className="col-date" style={{ padding: '14px 18px', width: '14%', textAlign: 'left', fontWeight: '800', color: '#4A2C17' }}>Date</th>
                  <th className="col-site" style={{ padding: '14px 18px', width: '26%', textAlign: 'left', fontWeight: '800', color: '#4A2C17' }}>Site / Customer</th>
                  <th className="col-timings salary-hide-on-print" style={{ padding: '14px 18px', width: '26%', textAlign: 'center', fontWeight: '800', color: '#4A2C17' }}>Timings (IN / OUT)</th>
                  <th className="col-hours salary-hide-on-print" style={{ padding: '14px 18px', width: '11%', textAlign: 'center', fontWeight: '800', color: '#4A2C17' }}>Work Hours</th>
                  <th className="col-dayval" style={{ padding: '14px 18px', width: '10%', textAlign: 'center', fontWeight: '800', color: '#4A2C17' }}>Day Value</th>
                  <th className="col-salary" style={{ padding: '14px 18px', width: '13%', textAlign: 'right', fontWeight: '800', color: '#4A2C17' }}>Day Salary</th>
                </tr>
              </thead>
              <tbody>
                {employeeGroupedShifts.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ padding: '50px 20px', textAlign: 'center', color: '#9CA3AF' }}>
                      <i className="fa-regular fa-calendar-xmark" style={{ fontSize: '32px', color: '#D1D5DB', marginBottom: '10px', display: 'block' }}></i>
                      <div style={{ fontSize: '15px', fontWeight: '600', color: '#4B5563' }}>No attendance records found</div>
                      <div style={{ fontSize: '13px', marginTop: '4px' }}>No shifts recorded for {activeEmployee.name} in {formatMonthName(selectedMonth)}.</div>
                    </td>
                  </tr>
                ) : (
                  employeeGroupedShifts.map((group) => {
                    return group.shifts.map((shift, sIdx) => {
                      const isFirstShiftOfDate = sIdx === 0;
                      const isLastShiftOfDate = sIdx === group.shifts.length - 1;
                      const isMultiSite = group.shifts.length > 1;

                      return (
                        <tr 
                          key={shift.id || `${group.dateKey}-${sIdx}`} 
                          style={{
                            borderBottom: isLastShiftOfDate ? '1.5px solid #CBD5E1' : '1px dashed #E2E8F0',
                            background: shift.isBonus ? 'rgba(165, 106, 48, 0.03)' : (isMultiSite ? '#FAFCFF' : 'transparent'),
                            transition: 'background 0.15s ease'
                          }}
                        >
                          {/* DATE COLUMN: Rendered only once per date using rowSpan */}
                          {isFirstShiftOfDate && (
                            <td 
                              className="col-date" 
                              rowSpan={group.shifts.length} 
                              style={{ 
                                padding: '14px 18px', 
                                verticalAlign: 'top', 
                                textAlign: 'left',
                                borderRight: isMultiSite ? '1.5px solid #E2E8F0' : 'transparent',
                                background: isMultiSite ? '#F8FAFC' : 'inherit'
                              }}
                            >
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                <span style={{ fontWeight: '800', color: '#111827', fontFamily: 'monospace', fontSize: '13px', whiteSpace: 'nowrap' }}>
                                  {group.formattedDate}
                                </span>

                                {isMultiSite && (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '2px' }}>
                                    <span style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      padding: '3px 8px',
                                      background: '#FAF4EE',
                                      color: '#7A4518',
                                      border: '1px solid #EAD8C7',
                                      borderRadius: '12px',
                                      fontSize: '11px',
                                      fontWeight: '800',
                                      width: 'fit-content',
                                      whiteSpace: 'nowrap'
                                    }}>
                                      <i className="fa-solid fa-layer-group" style={{ fontSize: '10px' }}></i>
                                      {group.shifts.length} Sites ({formatDays(group.totalDayValue)} Days)
                                    </span>
                                    <span style={{ fontSize: '11px', fontWeight: '800', color: '#8C5521', paddingLeft: '2px' }}>
                                      Day Total: ₹{group.totalDaySalary.toLocaleString('en-IN')}
                                    </span>
                                  </div>
                                )}

                                {/* Date Notes */}
                                {group.shifts.some(s => s.notes) && (
                                  <div style={{ fontSize: '11px', color: shift.isBonus ? '#8C5521' : '#6B7280', marginTop: '2px', fontStyle: 'italic', fontWeight: shift.isBonus ? '600' : 'normal' }}>
                                    {group.shifts.map(s => s.notes).filter(Boolean).join(' • ')}
                                  </div>
                                )}
                              </div>
                            </td>
                          )}

                          {/* SITE / CUSTOMER COLUMN */}
                          <td className="col-site" style={{ padding: '14px 18px', verticalAlign: 'middle', textAlign: 'left' }}>
                            {shift.isBonus ? (
                              <div>
                                <span style={{
                                  background: '#F3EDE6',
                                  color: '#8C5521',
                                  border: '1px solid #D1C2AF',
                                  padding: '3px 8px',
                                  borderRadius: '6px',
                                  fontSize: '12px',
                                  fontWeight: '700',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '5px'
                                }}>
                                  <i className="fa-solid fa-plus" style={{ fontSize: '10px' }}></i>
                                  Extra Attendance
                                </span>
                                <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '2px' }}>
                                  Admin Added
                                </div>
                              </div>
                            ) : (
                              <div>
                                {/* Shift Sequence Pill for multi-site dates */}
                                {isMultiSite && (
                                  <div style={{ marginBottom: '5px' }}>
                                    <span style={{
                                      fontSize: '10.5px',
                                      fontWeight: '800',
                                      textTransform: 'uppercase',
                                      letterSpacing: '0.4px',
                                      padding: '2px 8px',
                                      borderRadius: '4px',
                                      background: sIdx === 0 ? '#FEF3C7' : (shift.shiftTag?.includes('Evening') ? '#EDE9FE' : '#E0E7FF'),
                                      color: sIdx === 0 ? '#92400E' : (shift.shiftTag?.includes('Evening') ? '#6B21A8' : '#3730A3'),
                                      border: sIdx === 0 ? '1px solid #FDE68A' : (shift.shiftTag?.includes('Evening') ? '1px solid #DDD6FE' : '1px solid #C7D2FE'),
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '5px'
                                    }}>
                                      <i className={`fa-solid ${shift.shiftTag?.includes('Evening') ? 'fa-moon' : (sIdx === 0 ? 'fa-sun' : 'fa-cloud-sun')}`} style={{ fontSize: '9px' }}></i>
                                      {shift.shiftTag || (sIdx === 0 ? '1st Site (Day Shift)' : (sIdx === 1 ? '2nd Site (Evening OT)' : `${sIdx + 1}th Site`))}
                                    </span>
                                  </div>
                                )}
                                <div style={{ fontWeight: '600', color: '#111827', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', wordBreak: 'break-word' }}>
                                  <i className="fa-solid fa-location-dot" style={{ color: 'var(--gold, #A56A30)', fontSize: '12px', flexShrink: 0 }}></i>
                                  <span>{shift.siteRef}: {shift.customerName}</span>
                                </div>
                                <div style={{ fontSize: '11px', color: '#6B7280', paddingLeft: '18px', marginTop: '2px', wordBreak: 'break-word' }}>
                                  {shift.siteLocation || 'Assigned Site'}
                                </div>
                              </div>
                            )}
                          </td>

                          {/* TIMINGS (IN / OUT) */}
                          <td className="col-timings salary-hide-on-print" style={{ padding: '14px 18px', verticalAlign: 'middle', textAlign: 'center' }}>
                            {shift.isBonus ? (
                              <span className="shift-badge-tag" style={{
                                background: '#F3EDE6',
                                color: '#8C5521',
                                border: '1px solid #D1C2AF',
                                padding: '3px 8px',
                                borderRadius: '4px',
                                fontSize: '11.5px',
                                fontWeight: '700'
                              }}>
                                Manual Entry
                              </span>
                            ) : (
                              <div className="shift-timings-wrap" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '12px', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                                <span className="shift-time-tag" style={{ background: '#ECFDF5', color: '#065F46', padding: '4px 8px', borderRadius: '4px', fontWeight: '700', whiteSpace: 'nowrap', display: 'inline-block' }}>
                                  IN: {shift.inTime}
                                </span>
                                <span style={{ color: '#9CA3AF' }}>→</span>
                                <span className="shift-time-tag" style={{ background: shift.outTime === '--:--' ? '#F3F4F6' : '#FEF2F2', color: shift.outTime === '--:--' ? '#6B7280' : '#DC2626', padding: '4px 8px', borderRadius: '4px', fontWeight: '700', whiteSpace: 'nowrap', display: 'inline-block' }}>
                                  OUT: {shift.outTime}
                                </span>
                              </div>
                            )}
                          </td>

                          {/* WORK HOURS */}
                          <td className="col-hours salary-hide-on-print" style={{ padding: '14px 18px', verticalAlign: 'middle', textAlign: 'center', fontSize: '13px', fontWeight: '700', color: shift.isBonus ? '#059669' : '#374151' }}>
                            {shift.isBonus ? '--' : (shift.workHours > 0 ? `${shift.workHours} hrs` : '--')}
                          </td>

                          {/* DAY VALUE */}
                          <td className="col-dayval" style={{ padding: '14px 18px', verticalAlign: 'middle', textAlign: 'center' }}>
                            {shift.isBonus ? (
                              <span className="shift-badge-tag" style={{
                                background: '#ECFDF5',
                                color: '#065F46',
                                border: '1px solid #A7F3D0',
                                padding: '4px 10px',
                                borderRadius: '12px',
                                fontSize: '12px',
                                fontWeight: '800',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                whiteSpace: 'nowrap'
                              }}>
                                <i className="fa-solid fa-plus" style={{ fontSize: '10px' }}></i>
                                {shift.dayVal} Day{shift.dayVal !== 1 ? 's' : ''}
                              </span>
                            ) : (
                              <span className="shift-badge-tag" style={{
                                background: shift.dayVal >= 1.0 ? '#FAF4EE' : '#FDF8F0',
                                color: shift.dayVal >= 1.0 ? 'var(--gold, #8C5521)' : '#9B6833',
                                border: shift.dayVal >= 1.0 ? '1px solid #EAD8C7' : '1px solid #F3E5D4',
                                padding: '4px 10px',
                                borderRadius: '12px',
                                fontSize: '12px',
                                fontWeight: '700',
                                display: 'inline-block',
                                whiteSpace: 'nowrap'
                              }}>
                                {formatDays(shift.dayVal)} Day
                              </span>
                            )}
                          </td>

                          {/* DAY SALARY */}
                          <td className="col-salary" style={{ padding: '14px 18px', verticalAlign: 'middle', textAlign: 'right' }}>
                            <span className="shift-salary-tag" style={{
                              background: '#FAF4EE',
                              color: 'var(--gold, #8C5521)',
                              border: shift.isBonus ? '1.5px solid var(--gold, #A56A30)' : '1px solid #EAD8C7',
                              padding: '4px 12px',
                              borderRadius: '8px',
                              fontSize: '13px',
                              fontWeight: '800',
                              display: 'inline-block',
                              whiteSpace: 'nowrap'
                            }}>
                              {shift.isBonus ? `+₹${shift.daySalary.toLocaleString('en-IN')}` : `₹${shift.daySalary.toLocaleString('en-IN')}`}
                            </span>
                          </td>
                        </tr>
                      );
                    });
                  })
                )}
              </tbody>
              {activeEmployee.attendanceLogs.length > 0 && (
                <tfoot>
                  {/* =========================================================
                      SCREEN FOOTER (Clean, Professional Alignment)
                      ========================================================= */}
                  {/* 1. Base Shifts Subtotal */}
                  <tr className="no-print" style={{
                    background: '#FAF8F5',
                    borderTop: '2px solid #EAE3DA',
                    borderBottom: '1px solid #EAE3DA'
                  }}>
                    <td colSpan="3" style={{ padding: '13px 18px', fontSize: '13px', color: '#111827', fontWeight: '800' }}>
                      Shifts Subtotal (Worked on Site)
                    </td>
                    <td style={{ padding: '13px 18px', fontSize: '12.5px', color: '#4B5563', fontWeight: '700', textAlign: 'center' }}>
                      {totalResolvedHours} hrs
                    </td>
                    <td style={{ padding: '13px 18px', fontSize: '13.5px', color: '#8C5521', fontWeight: '800', textAlign: 'center' }}>
                      {formatDays(activeEmployee.totalDays)} Days
                    </td>
                    <td style={{ padding: '13px 18px', fontSize: '14.5px', fontWeight: '800', color: '#111827', textAlign: 'right' }}>
                      ₹{activeEmployee.baseAmount.toLocaleString('en-IN')}
                    </td>
                  </tr>

                  {/* 2. Thursday Off Allowance (Permanent Member) */}
                  {activeEmployee.isPermanent && (
                    <tr className="no-print" style={{ background: '#FFFFFF', borderBottom: '1px solid #F0EAE4' }}>
                      <td colSpan="4" style={{ padding: '13px 18px', textAlign: 'left' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '13px', fontWeight: '800', color: '#111827' }}>
                            Thursday Off
                          </span>
                          <span style={{
                            background: '#ECFDF5',
                            color: '#065F46',
                            border: '1px solid #A7F3D0',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: '700'
                          }}>
                            Permanent Member
                          </span>
                          <button
                            type="button"
                            onClick={() => handleOpenBenefitModal(activeEmployee)}
                            title="Edit Thursday Benefit Days"
                            style={{
                              background: '#FFFFFF',
                              border: '1px solid #D1C2AF',
                              color: '#4A2C17',
                              borderRadius: '4px',
                              padding: '2px 8px',
                              fontSize: '11px',
                              fontWeight: '700',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                            }}
                          >
                            <i className="fa-solid fa-pen" style={{ fontSize: '9px', color: 'var(--gold, #A56A30)' }}></i>
                            Edit
                          </button>
                        </div>
                        <div style={{ fontSize: '11.5px', color: '#6B7280', marginTop: '5px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <span>
                            {activeEmployee.qualifiedThursdays?.length > 0 
                              ? `Qualified ${activeEmployee.qualifiedThursdays.length} of ${activeEmployee.totalThursdaysCount} Thursdays:`
                              : 'No Thursdays qualified (requires working ≥ 2 days of Wed, Thu, Fri)'}
                          </span>
                          {activeEmployee.qualifiedThursdays?.length > 0 && (
                            <span style={{ display: 'inline-flex', gap: '4px', flexWrap: 'wrap' }}>
                              {activeEmployee.qualifiedThursdays.map(d => {
                                const p = d.split('-');
                                const mNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
                                return (
                                  <span key={d} style={{
                                    background: '#F9FAFB',
                                    border: '1px solid #E5E7EB',
                                    color: '#374151',
                                    padding: '1px 6px',
                                    borderRadius: '3px',
                                    fontSize: '10.5px',
                                    fontWeight: '700'
                                  }}>
                                    {p[2]} {mNames[parseInt(p[1],10)-1] || ''}
                                  </span>
                                );
                              })}
                            </span>
                          )}
                          {activeEmployee.userOverride?.thursdayDays !== undefined && (
                            <span style={{ color: '#D97706', fontWeight: '700', marginLeft: '4px' }}>
                              · Manually Adjusted
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '13px 18px', textAlign: 'center', fontSize: '13.5px', fontWeight: '800', color: '#047857' }}>
                        +{formatDays(activeEmployee.finalThursdayDays)} Days
                      </td>
                      <td style={{ padding: '13px 18px', textAlign: 'right', fontSize: '14.5px', fontWeight: '800', color: '#047857' }}>
                        +₹{activeEmployee.thursdayAmount.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  )}

                  {/* 3. Festival Holiday Benefit (Permanent Member) */}
                  {activeEmployee.isPermanent && (
                    <tr className="no-print" style={{ background: '#FFFFFF', borderBottom: '1px solid #F0EAE4' }}>
                      <td colSpan="4" style={{ padding: '13px 18px', textAlign: 'left' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '13px', fontWeight: '800', color: '#111827' }}>
                            Festival Holiday
                          </span>
                          {activeEmployee.monthFestivals?.length > 0 && (
                            <span style={{
                              background: '#FFFBEB',
                              color: '#92400E',
                              border: '1px solid #FDE68A',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: '700'
                            }}>
                              {activeEmployee.monthFestivals.map(f => f.label).join(', ')}
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => handleOpenBenefitModal(activeEmployee)}
                            title="Edit Festival Benefit Days"
                            style={{
                              background: '#FFFFFF',
                              border: '1px solid #D1C2AF',
                              color: '#4A2C17',
                              borderRadius: '4px',
                              padding: '2px 8px',
                              fontSize: '11px',
                              fontWeight: '700',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                            }}
                          >
                            <i className="fa-solid fa-pen" style={{ fontSize: '9px', color: 'var(--gold, #A56A30)' }}></i>
                            Edit
                          </button>
                        </div>
                        <div style={{ fontSize: '11.5px', color: '#6B7280', marginTop: '5px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <span>
                            {activeEmployee.monthFestivals?.length > 0 
                              ? activeEmployee.monthFestivals.map(f => {
                                  const p = f.date ? f.date.split('-') : [];
                                  const mNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
                                  const dt = p.length === 3 ? `${p[2]} ${mNames[parseInt(p[1],10)-1] || ''}` : f.date;
                                  return `${f.label} (${dt})`;
                                }).join(' • ')
                              : 'No festival holidays scheduled this month'}
                          </span>
                          {activeEmployee.userOverride?.festivalDays !== undefined && (
                            <span style={{ color: '#D97706', fontWeight: '700', marginLeft: '4px' }}>
                              · Manually Adjusted
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '13px 18px', textAlign: 'center', fontSize: '13.5px', fontWeight: '800', color: '#B45309' }}>
                        +{formatDays(activeEmployee.finalFestivalDays)} Days
                      </td>
                      <td style={{ padding: '13px 18px', textAlign: 'right', fontSize: '14.5px', fontWeight: '800', color: '#B45309' }}>
                        +₹{activeEmployee.festivalAmount.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  )}

                  {/* 4. Total Net Payable Row */}
                  <tr className="no-print" style={{
                    background: '#FAF4EE',
                    borderTop: '2.5px solid var(--gold, #A56A30)',
                    borderBottom: '2.5px solid var(--gold, #A56A30)'
                  }}>
                    <td colSpan="4" style={{ padding: '15px 18px', textAlign: 'left' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '14px', color: '#4A2C17', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                          Total Net Payable Salary
                        </span>
                        <span style={{ fontSize: '11.5px', color: '#8C5521', fontWeight: '600' }}>
                          (Base Site Shifts {activeEmployee.isPermanent ? '+ Permanent Member Allowances' : ''})
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '15px 18px', fontSize: '15.5px', color: '#8C5521', fontWeight: '900', textAlign: 'center' }}>
                      {formatDays(activeEmployee.totalCombinedDays)} Days
                    </td>
                    <td style={{ padding: '15px 18px', fontSize: '19px', fontWeight: '900', color: '#4A2C17', textAlign: 'right' }}>
                      ₹{activeEmployee.grossAmount.toLocaleString('en-IN')}
                    </td>
                  </tr>
                </tfoot>
              )}

              {/* =========================================================
                  PRINT/PDF SUMMARY ROWS
                  Placed in a separate tbody so browser print engines NEVER repeat
                  them across page splits (only prints once on the final page)
                  ========================================================= */}
              {activeEmployee.attendanceLogs.length > 0 && (
                <tbody className="salary-print-summary-group" style={{ display: 'none' }}>
                  <tr className="salary-print-total-row" style={{ display: 'none', background: '#FAF8F5', borderTop: '1.5px solid #111827' }}>
                    <td colSpan="2" style={{ padding: '8px 14px', fontSize: '12px', color: '#111827', fontWeight: '700', textAlign: 'left' }}>
                      Shifts Subtotal (Worked on Site · {totalResolvedHours} hrs)
                    </td>
                    <td style={{ padding: '8px 14px', fontSize: '12px', color: '#8C5521', fontWeight: '800', textAlign: 'center' }}>
                      {formatDays(activeEmployee.totalDays)} Days
                    </td>
                    <td style={{ padding: '8px 14px', fontSize: '13px', fontWeight: '800', color: '#111827', textAlign: 'right' }}>
                      ₹{activeEmployee.baseAmount.toLocaleString('en-IN')}
                    </td>
                  </tr>

                  {activeEmployee.isPermanent && (
                    <tr className="salary-print-total-row" style={{ display: 'none', background: '#FFFFFF', borderTop: '1px solid #E5E7EB' }}>
                      <td colSpan="2" style={{ padding: '7px 14px', fontSize: '12px', color: '#047857', fontWeight: '700', textAlign: 'left' }}>
                        Thursday Off
                      </td>
                      <td style={{ padding: '7px 14px', fontSize: '12px', color: '#047857', fontWeight: '800', textAlign: 'center' }}>
                        +{formatDays(activeEmployee.finalThursdayDays)} Days
                      </td>
                      <td style={{ padding: '7px 14px', fontSize: '13px', fontWeight: '800', color: '#047857', textAlign: 'right' }}>
                        +₹{activeEmployee.thursdayAmount.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  )}

                  {activeEmployee.isPermanent && (
                    <tr className="salary-print-total-row" style={{ display: 'none', background: '#FFFFFF', borderTop: '1px solid #E5E7EB' }}>
                      <td colSpan="2" style={{ padding: '7px 14px', fontSize: '12px', color: '#B45309', fontWeight: '700', textAlign: 'left' }}>
                        {(() => {
                          const festNames = (activeEmployee.monthFestivals || [])
                            .map(f => (f.label || f.name || '').replace(/\s*\([^)]*\)/g, '').trim())
                            .filter(Boolean)
                            .join(', ');
                          return festNames ? `Festival: ${festNames}` : 'Festival Holiday';
                        })()}
                      </td>
                      <td style={{ padding: '7px 14px', fontSize: '12px', color: '#B45309', fontWeight: '800', textAlign: 'center' }}>
                        +{formatDays(activeEmployee.finalFestivalDays)} Days
                      </td>
                      <td style={{ padding: '7px 14px', fontSize: '13px', fontWeight: '800', color: '#B45309', textAlign: 'right' }}>
                        +₹{activeEmployee.festivalAmount.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  )}

                  <tr className="salary-print-total-row" style={{ display: 'none', background: '#FAF4EE', borderTop: '2px solid #111827', borderBottom: '2px solid #111827' }}>
                    <td colSpan="2" style={{ padding: '10px 14px', fontSize: '13px', color: '#111827', fontWeight: '900', textAlign: 'left' }}>
                      TOTAL NET PAYABLE SALARY
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: '14px', color: '#8C5521', fontWeight: '900', textAlign: 'center' }}>
                      {formatDays(activeEmployee.totalCombinedDays)} Days
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: '16px', fontWeight: '900', color: '#111827', textAlign: 'right' }}>
                      ₹{activeEmployee.grossAmount.toLocaleString('en-IN')}
                    </td>
                  </tr>
                </tbody>
              )}
            </table>
          </div>

          {/* Printable Signatures & Authorization (Only visible on print) */}
          <div className="salary-print-footer" style={{ display: 'none' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              marginTop: '40px',
              paddingTop: '16px',
              borderTop: '1px dashed #CBD5E1'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: '160px', borderBottom: '1.5px solid #111827', marginBottom: '8px' }}></div>
                <div style={{ fontSize: '12px', fontWeight: '700', color: '#111827' }}>Employee Signature</div>
                <div style={{ fontSize: '11px', color: '#6B7280' }}>{activeEmployee.name}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '10.5px', color: '#6B7280', marginBottom: '4px' }}>Modern Interior CRM • System Generated</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: '160px', borderBottom: '1.5px solid #111827', marginBottom: '8px' }}></div>
                <div style={{ fontSize: '12px', fontWeight: '700', color: '#111827' }}>Authorized Signatory</div>
                <div style={{ fontSize: '11px', color: '#6B7280' }}>Modern Interior Management</div>
              </div>
            </div>
          </div>
        </div>
      ) : activeSite ? (
        /* =========================================================================
            VIEW C: INDIVIDUAL SITE LABOR & BILLING EXPENSE STATEMENT (DRILL-DOWN)
            ========================================================================= */
        <div>
          {/* Back Button & Top Navigation */}
          <div style={{ marginBottom: '20px' }}>
            <button
              onClick={() => setActiveSiteId(null)}
              className="no-print"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: '#fff',
                border: '1px solid #D1D5DB',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '700',
                color: '#374151',
                cursor: 'pointer',
                marginBottom: '16px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                transition: 'all 0.15s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--gold, #A56A30)';
                e.currentTarget.style.color = 'var(--gold, #A56A30)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#D1D5DB';
                e.currentTarget.style.color = '#374151';
              }}
            >
              <i className="fa-solid fa-arrow-left"></i> Back to All Sites
            </button>

            {/* Printable Official Site Header (Only visible on print) */}
            <div className="salary-print-header" style={{ display: 'none' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                borderBottom: '2.5px solid var(--gold, #A56A30)',
                paddingBottom: '14px',
                marginBottom: '16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <img src="/logo.png" alt="Modern Interior" style={{ height: '48px', width: 'auto', objectFit: 'contain' }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                  <div>
                    <div style={{ fontSize: '18px', fontWeight: '900', color: '#111827', letterSpacing: '0.5px' }}>
                      MODERN INTERIOR
                    </div>
                    <div style={{ fontSize: '11px', color: '#6B7280', fontWeight: '600' }}>
                      Beyond Imagination • Luxury Interior Solutions
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '15px', fontWeight: '800', color: 'var(--gold, #A56A30)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    PROJECT LABOR COST STATEMENT
                  </div>
                  <div style={{ fontSize: '12.5px', fontWeight: '700', color: '#111827', marginTop: '3px' }}>
                    Period: {formatMonthName(selectedMonth)}
                  </div>
                  <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '2px', fontFamily: 'monospace' }}>
                    Generated: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </div>
                </div>
              </div>

              {/* Site Details Strip for Print */}
              <div style={{
                background: '#FAF8F5',
                border: '1px solid #EAE4DD',
                borderRadius: '8px',
                padding: '10px 16px',
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '18px',
                fontSize: '12.5px'
              }}>
                <div><strong>Site:</strong> {activeSite.siteRef}: {activeSite.customerName}</div>
                <div><strong>Location:</strong> {activeSite.location || activeSite.fullAddress || 'Assigned Location'}</div>
                <div><strong>Total Labor Cost:</strong> <span style={{ color: '#065F46', fontWeight: '800' }}>₹{activeSite.totalLaborCost.toLocaleString('en-IN')}</span></div>
              </div>
            </div>

            {/* Site Banner Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              flexWrap: 'wrap',
              gap: '16px'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <span style={{
                    background: 'rgba(165, 106, 48, 0.12)',
                    color: 'var(--gold, #A56A30)',
                    border: '1px solid rgba(165, 106, 48, 0.3)',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: '800',
                    fontFamily: 'monospace'
                  }}>
                    {activeSite.siteRef}
                  </span>
                  <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: '#111827' }}>
                    {activeSite.customerName} - Project Labor Cost Statement
                  </h1>
                </div>
                <div style={{ fontSize: '13px', color: '#6B7280', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span><i className="fa-solid fa-location-dot" style={{ color: 'var(--gold, #A56A30)', marginRight: '4px' }}></i>{activeSite.location || activeSite.fullAddress || 'Assigned Location'}</span>
                  <span>•</span>
                  <span>Status: <strong style={{ color: activeSite.status === 'Running' ? '#059669' : '#4B5563' }}>{activeSite.status}</strong></span>
                </div>
              </div>

              <div className="no-print" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{
                  background: '#F3EDE6',
                  color: '#7A4518',
                  border: '1px solid #D1C2AF',
                  padding: '7px 14px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '700'
                }}>
                  <i className="fa-regular fa-calendar" style={{ marginRight: '6px' }}></i>
                  {formatMonthName(selectedMonth)}
                </span>
                <button
                  onClick={() => window.print()}
                  className="btn-primary"
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <i className="fa-solid fa-print"></i> Print Billing Sheet
                </button>
              </div>
            </div>
          </div>

          {/* KPI Summary Cards for Site */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '14px',
            marginBottom: '24px'
          }}>
            <div style={{ background: '#FAF8F5', padding: '18px 20px', borderRadius: '10px', border: '1.5px solid #EAE3DA', boxShadow: '0 1px 3px rgba(74, 44, 23, 0.04)' }}>
              <div style={{ fontSize: '11px', color: 'var(--gold, #8C5521)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Total Site Labor Cost (Billing)
              </div>
              <div style={{ fontSize: '26px', fontWeight: '800', color: '#4A2C17', marginTop: '6px' }}>
                ₹{activeSite.totalLaborCost.toLocaleString('en-IN')}
              </div>
            </div>

            <div style={{ background: '#fff', padding: '18px 20px', borderRadius: '10px', border: '1px solid #D1C2AF', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
              <div style={{ fontSize: '11px', color: '#6B7280', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Total Man-Days Logged
              </div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#8C5521', marginTop: '6px' }}>
                {formatDays(activeSite.totalDays)} Days
              </div>
            </div>

            <div style={{ background: '#fff', padding: '18px 20px', borderRadius: '10px', border: '1px solid #D1C2AF', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
              <div style={{ fontSize: '11px', color: '#6B7280', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Workers Deployed
              </div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#111827', marginTop: '6px' }}>
                {activeSite.workerCount} Employees
              </div>
            </div>

            <div style={{ background: '#fff', padding: '18px 20px', borderRadius: '10px', border: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
              <div style={{ fontSize: '11px', color: '#6B7280', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Total Work Hours
              </div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--gold, #A56A30)', marginTop: '6px' }}>
                {activeSite.totalHours} hrs
              </div>
            </div>
          </div>

          {/* Toggle Button for Employee Worked Data vs Day-Wise Attendance */}
          <div className="no-print" style={{
            display: 'inline-flex',
            gap: '8px',
            background: '#FAF8F5',
            padding: '6px 8px',
            borderRadius: '10px',
            border: '1.5px solid #EAE3DA',
            marginBottom: '18px',
            boxShadow: '0 1px 3px rgba(74, 44, 23, 0.04)'
          }}>
            <button
              type="button"
              onClick={() => setSiteTableTab('workers')}
              style={{
                padding: '9px 18px',
                borderRadius: '8px',
                border: siteTableTab === 'workers' ? '2px solid var(--gold, #4A2C17)' : '1.5px solid #DCD4CA',
                fontSize: '13px',
                fontWeight: '800',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.18s ease',
                background: siteTableTab === 'workers' ? 'var(--gold, #4A2C17)' : '#FFFFFF',
                color: siteTableTab === 'workers' ? '#FFFFFF' : '#475569',
                boxShadow: siteTableTab === 'workers' ? '0 4px 12px rgba(74, 44, 23, 0.22)' : '0 1px 2px rgba(0,0,0,0.03)'
              }}
            >
              <i className="fa-solid fa-user-tie" style={{ color: siteTableTab === 'workers' ? '#FBBF24' : '#8C5521' }}></i>
              <span>Employee Worked Data</span>
              <span style={{
                background: siteTableTab === 'workers' ? 'var(--gold, #A56A30)' : '#F3EDE6',
                color: siteTableTab === 'workers' ? '#FFFFFF' : '#7A4518',
                padding: '2px 8px',
                borderRadius: '10px',
                fontSize: '11px',
                fontWeight: '800',
                border: siteTableTab === 'workers' ? '1px solid rgba(255,255,255,0.2)' : '1px solid #D1C2AF'
              }}>
                {activeSite.workers.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSiteTableTab('attendance')}
              style={{
                padding: '9px 18px',
                borderRadius: '8px',
                border: siteTableTab === 'attendance' ? '2px solid var(--gold, #4A2C17)' : '1.5px solid #DCD4CA',
                fontSize: '13px',
                fontWeight: '800',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.18s ease',
                background: siteTableTab === 'attendance' ? 'var(--gold, #4A2C17)' : '#FFFFFF',
                color: siteTableTab === 'attendance' ? '#FFFFFF' : '#475569',
                boxShadow: siteTableTab === 'attendance' ? '0 4px 12px rgba(74, 44, 23, 0.22)' : '0 1px 2px rgba(0,0,0,0.03)'
              }}
            >
              <i className="fa-regular fa-calendar-days" style={{ color: siteTableTab === 'attendance' ? '#FBBF24' : '#8C5521' }}></i>
              <span>Day-Wise Attendance</span>
              <span style={{
                background: siteTableTab === 'attendance' ? 'var(--gold, #A56A30)' : '#F3EDE6',
                color: siteTableTab === 'attendance' ? '#FFFFFF' : '#7A4518',
                padding: '2px 8px',
                borderRadius: '10px',
                fontSize: '11px',
                fontWeight: '800',
                border: siteTableTab === 'attendance' ? '1px solid rgba(255,255,255,0.2)' : '1px solid #D1C2AF'
              }}>
                {activeSite.shifts.length}
              </span>
            </button>
          </div>

          {/* TABLE 1: EMPLOYEE LABOR BREAKDOWN ON THIS SITE */}
          {siteTableTab === 'workers' ? (
            <div>
              <div style={{ marginBottom: '14px' }}>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: '#111827' }}>
                  Employee Labor Breakdown on {activeSite.siteRef}
                </h3>
              </div>

              <div className="panel table-responsive" style={{
                background: '#fff',
                borderRadius: '10px',
                border: '1px solid #E5E7EB',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                overflowX: 'auto',
                WebkitOverflowScrolling: 'touch'
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '850px', tableLayout: 'fixed' }}>
                  <thead>
                    <tr style={{
                      background: '#FAF8F5',
                      borderBottom: '1.5px solid #EAE3DA',
                      color: '#4A2C17',
                      fontSize: '11px',
                      fontWeight: '800',
                      textTransform: 'uppercase',
                      letterSpacing: '0.6px'
                    }}>
                      <th style={{ padding: '14px 18px', width: '32%', textAlign: 'left', fontWeight: '800', color: '#4A2C17' }}>Employee Details</th>
                      <th style={{ padding: '14px 18px', width: '17%', textAlign: 'center', fontWeight: '800', color: '#4A2C17' }}>Days on Site</th>
                      <th style={{ padding: '14px 18px', width: '17%', textAlign: 'center', fontWeight: '800', color: '#4A2C17' }}>Daily Wage Rate</th>
                      <th style={{ padding: '14px 18px', width: '20%', textAlign: 'right', fontWeight: '800', color: '#4A2C17' }}>Total Site Salary</th>
                      <th style={{ padding: '14px 18px', width: '14%', textAlign: 'center', fontWeight: '800', color: '#4A2C17' }}>Shifts Logged</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeSite.workers.length === 0 ? (
                      <tr>
                        <td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: '#9CA3AF' }}>
                          <i className="fa-regular fa-folder-open" style={{ fontSize: '28px', color: '#D1D5DB', marginBottom: '8px', display: 'block' }}></i>
                          <div>No employee shifts have been recorded for this site in {formatMonthName(selectedMonth)}.</div>
                        </td>
                      </tr>
                    ) : (
                      activeSite.workers.map((worker) => (
                        <tr key={worker.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                          <td style={{ padding: '14px 18px', verticalAlign: 'middle', textAlign: 'left' }}>
                            <div style={{ fontWeight: '700', color: '#111827', fontSize: '13px' }}>{worker.name}</div>
                            <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '2px' }}>
                              <span style={{ fontWeight: '600', color: 'var(--gold, #A56A30)' }}>{worker.id}</span> · {worker.role}
                            </div>
                          </td>

                          <td style={{ padding: '14px 18px', verticalAlign: 'middle', textAlign: 'center' }}>
                            <span style={{
                              background: '#FAF4EE',
                              color: 'var(--gold, #8C5521)',
                              border: '1px solid #EAD8C7',
                              padding: '4px 10px',
                              borderRadius: '12px',
                              fontSize: '12px',
                              fontWeight: '700',
                              display: 'inline-block'
                            }}>
                              {formatDays(worker.daysOnSite)} Days
                            </span>
                          </td>

                          <td style={{ padding: '14px 18px', verticalAlign: 'middle', textAlign: 'center', fontWeight: '600', color: '#374151', fontSize: '13px' }}>
                            ₹{worker.dailyRate.toLocaleString('en-IN')}
                          </td>

                          <td style={{ padding: '14px 18px', verticalAlign: 'middle', textAlign: 'right' }}>
                            <span style={{
                              background: '#FAF4EE',
                              color: 'var(--gold, #8C5521)',
                              border: '1px solid #EAD8C7',
                              padding: '5px 12px',
                              borderRadius: '8px',
                              fontSize: '14px',
                              fontWeight: '800',
                              display: 'inline-block'
                            }}>
                              ₹{worker.totalSalary.toLocaleString('en-IN')}
                            </span>
                          </td>

                          <td style={{ padding: '14px 18px', verticalAlign: 'middle', textAlign: 'center', fontSize: '13px', fontWeight: '600', color: '#4B5563' }}>
                            {worker.shiftCount} shifts
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {activeSite.workers.length > 0 && (
                    <tfoot>
                      <tr style={{
                        background: '#FAF8F5',
                        borderTop: '1.5px solid #EAE3DA',
                        borderBottom: '1.5px solid #EAE3DA',
                        fontWeight: '800'
                      }}>
                        <td style={{ padding: '16px 18px', fontSize: '14px', color: '#4A2C17', fontWeight: '800', textAlign: 'left' }}>
                          Total Project Labor Expense
                        </td>
                        <td style={{ padding: '16px 18px', fontSize: '14px', color: '#8C5521', fontWeight: '800', textAlign: 'center' }}>
                          {formatDays(activeSite.totalDays)} Days
                        </td>
                        <td style={{ padding: '16px 18px', fontSize: '12px', color: '#78716C', fontWeight: '700', textAlign: 'center' }}>
                          Avg: ₹{activeSite.totalDays > 0 ? Math.round(activeSite.totalLaborCost / activeSite.totalDays).toLocaleString('en-IN') : 0}/day
                        </td>
                        <td style={{ padding: '16px 18px', fontSize: '18px', fontWeight: '800', color: '#4A2C17', textAlign: 'right' }}>
                          ₹{activeSite.totalLaborCost.toLocaleString('en-IN')}
                        </td>
                        <td style={{ padding: '16px 18px', fontSize: '13px', color: '#4A2C17', fontWeight: '800', textAlign: 'center' }}>
                          {activeSite.shifts.length} shifts
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          ) : (
            /* TABLE 2: DAY-BY-DAY SHIFT LOGS ON THIS SITE */
            <div>
              <div style={{ marginBottom: '14px' }}>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: '#111827' }}>
                  Day-Wise Attendance Log for {activeSite.siteRef}
                </h3>
              </div>

              <div className="panel table-responsive" style={{
                background: '#fff',
                borderRadius: '10px',
                border: '1px solid #E5E7EB',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                overflowX: 'auto',
                WebkitOverflowScrolling: 'touch'
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '850px', tableLayout: 'fixed' }}>
                  <thead>
                    <tr style={{
                      background: '#FAF8F5',
                      borderBottom: '1.5px solid #EAE3DA',
                      color: '#4A2C17',
                      fontSize: '11px',
                      fontWeight: '800',
                      textTransform: 'uppercase',
                      letterSpacing: '0.6px'
                    }}>
                      <th style={{ padding: '14px 18px', width: '15%', textAlign: 'left', fontWeight: '800', color: '#4A2C17' }}>Date</th>
                      <th style={{ padding: '14px 18px', width: '25%', textAlign: 'left', fontWeight: '800', color: '#4A2C17' }}>Employee Name</th>
                      <th style={{ padding: '14px 18px', width: '25%', textAlign: 'center', fontWeight: '800', color: '#4A2C17' }}>Timings (IN / OUT)</th>
                      <th style={{ padding: '14px 18px', width: '11%', textAlign: 'center', fontWeight: '800', color: '#4A2C17' }}>Work Hours</th>
                      <th style={{ padding: '14px 18px', width: '11%', textAlign: 'center', fontWeight: '800', color: '#4A2C17' }}>Day Value</th>
                      <th style={{ padding: '14px 18px', width: '13%', textAlign: 'right', fontWeight: '800', color: '#4A2C17' }}>Shift Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeSite.shifts.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: '#9CA3AF' }}>
                          No individual punch records found for this site.
                        </td>
                      </tr>
                    ) : (
                      activeSite.shifts.map((log, idx) => {
                        const empObj = employees.find(e => e.dbId === log.userId || String(e.id) === String(log.empId));
                        const rate = Number(log.dailyRate || empObj?.dailySalary || 0);
                        const dayVal = parseFloat(log.dayValue) || 1.0;
                        const shiftCost = Math.round(dayVal * rate);

                        return (
                          <tr key={log.id || idx} style={{ borderBottom: '1px solid #F3F4F6' }}>
                            <td style={{ padding: '14px 18px', verticalAlign: 'middle', textAlign: 'left' }}>
                              <span style={{ fontWeight: '700', color: '#111827', fontFamily: 'monospace', fontSize: '13px' }}>
                                {formatToDMY(log.attendanceDate)}
                              </span>
                            </td>

                            <td style={{ padding: '14px 18px', verticalAlign: 'middle', textAlign: 'left' }}>
                              <div style={{ fontWeight: '600', color: '#111827', fontSize: '13px' }}>
                                {log.employeeName || log.name || empObj?.name || 'Worker'}
                              </div>
                              <div style={{ fontSize: '11px', color: '#6B7280' }}>
                                <span style={{ fontWeight: '600', color: 'var(--gold, #A56A30)' }}>{log.empId || empObj?.id}</span> · {log.employeeRole || empObj?.role || 'Staff'}
                              </div>
                            </td>

                            <td style={{ padding: '14px 18px', verticalAlign: 'middle', textAlign: 'center' }}>
                              <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '12px', fontFamily: 'monospace' }}>
                                <span style={{ background: '#FAF4EE', color: '#7A4518', border: '1px solid #EAD8C7', padding: '3px 8px', borderRadius: '4px', fontWeight: '700' }}>
                                  IN: {log.inTime}
                                </span>
                                <span style={{ color: '#9CA3AF' }}>→</span>
                                <span style={{ background: log.outTime === '--:--' ? '#F3F4F6' : '#FEF2F2', color: log.outTime === '--:--' ? '#6B7280' : '#DC2626', padding: '3px 8px', borderRadius: '4px', fontWeight: '700' }}>
                                  OUT: {log.outTime}
                                </span>
                              </div>
                            </td>

                            <td style={{ padding: '14px 18px', verticalAlign: 'middle', textAlign: 'center', fontSize: '13px', fontWeight: '700', color: '#374151' }}>
                              {log.workHours > 0 ? `${log.workHours} hrs` : '--'}
                            </td>

                            <td style={{ padding: '14px 18px', verticalAlign: 'middle', textAlign: 'center' }}>
                              <span style={{
                                background: dayVal >= 1.0 ? '#FAF4EE' : '#FDF8F0',
                                color: dayVal >= 1.0 ? 'var(--gold, #8C5521)' : '#9B6833',
                                border: dayVal >= 1.0 ? '1px solid #EAD8C7' : '1px solid #F3E5D4',
                                padding: '3px 9px',
                                borderRadius: '12px',
                                fontSize: '12px',
                                fontWeight: '700',
                                display: 'inline-block'
                              }}>
                                {formatDays(dayVal)} Day
                              </span>
                            </td>

                            <td style={{ padding: '14px 18px', verticalAlign: 'middle', textAlign: 'right' }}>
                              <span style={{
                                background: '#FAF4EE',
                                color: 'var(--gold, #8C5521)',
                                border: '1px solid #EAD8C7',
                                padding: '3px 10px',
                                borderRadius: '6px',
                                fontSize: '13px',
                                fontWeight: '800'
                              }}>
                                ₹{shiftCost.toLocaleString('en-IN')}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                  {activeSite.shifts.length > 0 && (
                    <tfoot>
                      <tr style={{
                        background: '#FAF8F5',
                        borderTop: '1.5px solid #EAE3DA',
                        borderBottom: '1.5px solid #EAE3DA',
                        fontWeight: '800'
                      }}>
                        <td style={{ padding: '14px 18px', fontSize: '13px', color: '#4A2C17', fontWeight: '800', textAlign: 'left' }} colSpan="3">
                          Total Shifts: {activeSite.shifts.length}
                        </td>
                        <td style={{ padding: '14px 18px', fontSize: '13px', color: '#4A2C17', fontWeight: '800', textAlign: 'center' }}>
                          {activeSite.totalHours} hrs
                        </td>
                        <td style={{ padding: '14px 18px', fontSize: '13px', color: '#8C5521', fontWeight: '800', textAlign: 'center' }}>
                          {formatDays(activeSite.totalDays)} Days
                        </td>
                        <td style={{ padding: '14px 18px', fontSize: '16px', fontWeight: '800', color: '#4A2C17', textAlign: 'right' }}>
                          ₹{activeSite.totalLaborCost.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          )}

          {/* Printable Signatures & Authorization for Site Statement (Only visible on print) */}
          <div className="salary-print-footer" style={{ display: 'none' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              marginTop: '40px',
              paddingTop: '16px',
              borderTop: '1px dashed #CBD5E1'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: '160px', borderBottom: '1.5px solid #111827', marginBottom: '8px' }}></div>
                <div style={{ fontSize: '12px', fontWeight: '700', color: '#111827' }}>Site Supervisor</div>
                <div style={{ fontSize: '11px', color: '#6B7280' }}>Modern Interior Field Ops</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '10.5px', color: '#6B7280', marginBottom: '4px' }}>Modern Interior CRM • System Generated</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: '160px', borderBottom: '1.5px solid #111827', marginBottom: '8px' }}></div>
                <div style={{ fontSize: '12px', fontWeight: '700', color: '#111827' }}>Authorized Signatory</div>
                <div style={{ fontSize: '11px', color: '#6B7280' }}>Modern Interior Management</div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* =========================================================================
            VIEW B: MASTER OVERVIEW (WITH DUAL-VIEW TOGGLE: EMPLOYEE vs SITE)
            ========================================================================= */
        <div>
          {/* Top Page Header */}
          <div className="page-header" style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '10px',
            marginBottom: '14px'
          }}>
            <div>
              <h1 className="page-title" style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: 'var(--navy, #111827)' }}>
                Salary & Payroll
              </h1>
              <p className="page-subtitle" style={{ margin: '2px 0 0 0', fontSize: '11.5px', color: '#7D6C5E' }}>
                Wage statements & site billing
              </p>
            </div>

            <div className="header-actions" style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap', width: '100%' }}>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flex: '1 1 auto' }}>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  style={{
                    padding: '5px 8px',
                    borderRadius: '6px',
                    border: '1px solid #D1D5DB',
                    outline: 'none',
                    background: '#fff',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#111827',
                    height: '34px',
                    boxSizing: 'border-box',
                    flex: '1 1 auto',
                    minWidth: '130px'
                  }}
                />

                <button
                  type="button"
                  onClick={() => handleOpenGiftModal(employees[0] || {})}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '700',
                    background: '#fff',
                    color: '#374151',
                    border: '1.5px solid #D1C2AF',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    height: '34px',
                    whiteSpace: 'nowrap',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                  }}
                >
                  <i className="fa-solid fa-plus" style={{ color: 'var(--gold, #A56A30)' }}></i>
                  Add Days
                </button>

                {onOpenFestivals && (
                  <button
                    type="button"
                    onClick={onOpenFestivals}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '700',
                      background: '#FFFDF5',
                      color: '#B45309',
                      border: '1.5px solid #FDE68A',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      height: '34px',
                      whiteSpace: 'nowrap',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                    }}
                  >
                    <i className="fa-solid fa-champagne-glasses"></i>
                    Festivals
                  </button>
                )}
              </div>

              <button
                onClick={() => {
                  const amt = viewMode === 'employee' ? totalEmployeePayroll : totalSitePayroll;
                  alert(`Total payroll for ${formatMonthName(selectedMonth)} is ₹${amt.toLocaleString('en-IN')}. Release process ready.`);
                }}
                className="btn-primary"
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '700',
                  background: 'var(--gold, #4A2C17)',
                  color: '#fff',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  height: '34px',
                  whiteSpace: 'nowrap',
                  boxShadow: '0 2px 6px rgba(74, 44, 23, 0.2)'
                }}
              >
                <i className="fa-solid fa-money-bill-transfer"></i> Process Payroll
              </button>
            </div>
          </div>

          {/* Gift Attendance Success Banner */}
          {giftSuccessMsg && (
            <div style={{
              background: '#FAF4EE',
              border: '1.5px solid #EAD8C7',
              color: '#7A4518',
              borderRadius: '8px',
              padding: '10px 14px',
              marginBottom: '12px',
              fontWeight: '700',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 2px 6px rgba(165, 106, 48, 0.08)'
            }}>
              <i className="fa-solid fa-circle-check" style={{ fontSize: '16px', color: 'var(--gold, #A56A30)' }}></i>
              <span>{giftSuccessMsg}</span>
            </div>
          )}

          {/* =====================================================================
              PRIMARY VIEW SWITCHER TAB BAR (PERSON-WISE vs SITE-WISE)
              ===================================================================== */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '8px',
            marginBottom: '12px',
            background: '#FAF8F5',
            padding: '6px 8px',
            borderRadius: '10px',
            border: '1.5px solid #EAE3DA',
            boxShadow: '0 1px 3px rgba(74, 44, 23, 0.04)'
          }}>
            {/* Left: Tab Switcher Buttons */}
            <div style={{ display: 'inline-flex', gap: '6px', flex: '1 1 auto' }}>
              <button
                type="button"
                onClick={() => setViewMode('employee')}
                style={{
                  flex: '1 1 auto',
                  padding: '6px 12px',
                  borderRadius: '7px',
                  border: viewMode === 'employee' ? '2px solid var(--gold, #4A2C17)' : '1.5px solid #DCD4CA',
                  fontSize: '12px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.18s ease',
                  background: viewMode === 'employee' ? 'var(--gold, #4A2C17)' : '#FFFFFF',
                  color: viewMode === 'employee' ? '#FFFFFF' : '#5C4E43',
                  height: '34px'
                }}
              >
                <i className="fa-solid fa-user-tie" style={{ color: viewMode === 'employee' ? '#FBBF24' : '#8C7B6D', fontSize: '12px' }}></i>
                <span>By Employee</span>
                <span style={{
                  background: viewMode === 'employee' ? 'var(--gold, #A56A30)' : '#F3EDE6',
                  color: viewMode === 'employee' ? '#FFFFFF' : '#7A4518',
                  padding: '1px 6px',
                  borderRadius: '10px',
                  fontSize: '10.5px',
                  fontWeight: '800'
                }}>
                  {salaryRows.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('site')}
                style={{
                  flex: '1 1 auto',
                  padding: '6px 12px',
                  borderRadius: '7px',
                  border: viewMode === 'site' ? '2px solid var(--gold, #4A2C17)' : '1.5px solid #DCD4CA',
                  fontSize: '12px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.18s ease',
                  background: viewMode === 'site' ? 'var(--gold, #4A2C17)' : '#FFFFFF',
                  color: viewMode === 'site' ? '#FFFFFF' : '#5C4E43',
                  height: '34px'
                }}
              >
                <i className="fa-solid fa-location-dot" style={{ color: viewMode === 'site' ? '#FBBF24' : '#8C7B6D', fontSize: '12px' }}></i>
                <span>By Site</span>
                <span style={{
                  background: viewMode === 'site' ? 'var(--gold, #A56A30)' : '#F3EDE6',
                  color: viewMode === 'site' ? '#FFFFFF' : '#7A4518',
                  padding: '1px 6px',
                  borderRadius: '10px',
                  fontSize: '10.5px',
                  fontWeight: '800'
                }}>
                  {activeSitesCount}
                </span>
              </button>
            </div>

            {/* Right: Quick Search Box */}
            <div style={{ position: 'relative', width: '100%', maxWidth: '240px', flex: '1 1 180px' }}>
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '6px 26px 6px 28px',
                  borderRadius: '6px',
                  border: '1px solid #DCD4CA',
                  background: '#FFFFFF',
                  fontSize: '12px',
                  outline: 'none',
                  height: '34px',
                  boxSizing: 'border-box'
                }}
              />
              <i className="fa-solid fa-magnifying-glass" style={{
                position: 'absolute',
                left: '9px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#8C7B6D',
                fontSize: '11px'
              }}></i>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#94A3B8',
                    cursor: 'pointer',
                    fontSize: '11px',
                    padding: 0
                  }}
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* KPI Snapshot Cards for Current View - Compact 2-column Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '8px',
            marginBottom: '12px'
          }}>
            {viewMode === 'employee' ? (
              <>
                <div style={{ background: '#fff', padding: '10px 12px', borderRadius: '8px', border: '1px solid #D1C2AF' }}>
                  <div style={{ fontSize: '10px', color: '#78716C', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Total Payroll</div>
                  <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--gold, #8C5521)', marginTop: '2px' }}>
                    ₹{totalEmployeePayroll.toLocaleString('en-IN')}
                  </div>
                </div>
                <div style={{ background: '#fff', padding: '10px 12px', borderRadius: '8px', border: '1px solid #D1C2AF' }}>
                  <div style={{ fontSize: '10px', color: '#6B7280', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Active Employees</div>
                  <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--navy, #111827)', marginTop: '2px' }}>
                    {salaryRows.filter(r => r.totalDays > 0).length} / {salaryRows.length}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div style={{ background: '#FAF8F5', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid #EAE3DA' }}>
                  <div style={{ fontSize: '10px', color: 'var(--gold, #8C5521)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Total Labor Cost</div>
                  <div style={{ fontSize: '18px', fontWeight: '800', color: '#4A2C17', marginTop: '2px' }}>
                    ₹{totalSitePayroll.toLocaleString('en-IN')}
                  </div>
                </div>
                <div style={{ background: '#fff', padding: '10px 12px', borderRadius: '8px', border: '1px solid #D1C2AF' }}>
                  <div style={{ fontSize: '10px', color: '#6B7280', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Active Sites</div>
                  <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--gold, #A56A30)', marginTop: '2px' }}>
                    {activeSitesCount} Sites
                  </div>
                </div>
              </>
            )}
          </div>

          {/* ===================================================================
              SUB-VIEW 1: EMPLOYEE-WISE SALARY TABLE (WHEN viewMode === 'employee')
              =================================================================== */}
          {viewMode === 'employee' ? (
            <div className="panel table-responsive" style={{
              background: '#fff',
              borderRadius: '10px',
              border: '1.5px solid #EAE3DA',
              boxShadow: '0 2px 8px rgba(74, 44, 23, 0.04)',
              overflowX: 'auto',
              WebkitOverflowScrolling: 'touch'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '960px', tableLayout: 'fixed' }}>
                <thead>
                  <tr style={{
                    background: '#FAF8F5',
                    borderBottom: '1.5px solid #EAE3DA',
                    color: '#4A2C17',
                    fontSize: '11px',
                    fontWeight: '800',
                    textTransform: 'uppercase',
                    letterSpacing: '0.6px'
                  }}>
                    <th style={{ padding: '12px 14px', width: '18%', fontWeight: '800', color: '#4A2C17' }}>Employee</th>
                    <th style={{ padding: '12px 12px', width: '12%', minWidth: '95px', fontWeight: '800', color: '#4A2C17', whiteSpace: 'nowrap' }}>Total Days</th>
                    <th style={{ padding: '12px 12px', width: '11%', fontWeight: '800', color: '#4A2C17' }}>Daily Rate</th>
                    <th style={{ padding: '12px 12px', width: '11%', fontWeight: '800', color: '#4A2C17' }}>Gross Amount</th>
                    <th style={{ padding: '12px 12px', width: '11%', fontWeight: '800', color: '#4A2C17' }}>Deductions / Adv.</th>
                    <th style={{ padding: '12px 12px', width: '12%', fontWeight: '800', color: '#4A2C17' }}>Net Payable</th>
                    <th style={{ padding: '12px 12px', width: '13%', fontWeight: '800', color: '#4A2C17', whiteSpace: 'nowrap' }}>Status</th>
                    <th style={{ padding: '12px 12px', width: '12%', fontWeight: '800', color: '#4A2C17', textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="8" style={{ padding: '30px', textAlign: 'center', color: '#6B7280' }}>
                        <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '20px', color: 'var(--gold, #A56A30)', marginBottom: '8px' }}></i>
                        <div>Calculating real payroll from attendance...</div>
                      </td>
                    </tr>
                  ) : filteredSalaryRows.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={{ padding: '30px', textAlign: 'center', color: '#9CA3AF' }}>
                        No employees found matching your search.
                      </td>
                    </tr>
                  ) : (
                    filteredSalaryRows.map((row) => (
                      <tr 
                        key={row.id} 
                        onClick={() => setActiveEmployeeId(row.id)}
                        title={`Click to open full day-wise salary for ${row.name}`}
                        style={{ 
                          borderBottom: '1px solid #F3F4F6',
                          cursor: 'pointer',
                          transition: 'background 0.15s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F9FAFB'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <td style={{ padding: '10px 14px', verticalAlign: 'middle' }}>
                          <div>
                            <div style={{ fontWeight: '700', color: '#111827', fontSize: '13px' }}>{row.name}</div>
                            <div style={{ fontSize: '11px', color: '#6B7280' }}>
                              <span style={{ fontWeight: '600', color: 'var(--gold, #A56A30)' }}>{row.id}</span> · {row.role}
                            </div>
                          </div>
                        </td>

                        <td style={{ padding: '10px 12px', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                          <span style={{
                            background: row.totalCombinedDays > 0 ? '#FAF4EE' : '#F5F5F4',
                            color: row.totalCombinedDays > 0 ? 'var(--gold, #8C5521)' : '#78716C',
                            border: row.totalCombinedDays > 0 ? '1px solid #EAD8C7' : '1px solid #E7E5E4',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '700',
                            display: 'inline-flex',
                            alignItems: 'center',
                            whiteSpace: 'nowrap'
                          }}>
                            {formatDays(row.totalCombinedDays)} Days
                          </span>
                          {row.isPermanent && (row.finalThursdayDays > 0 || row.finalFestivalDays > 0) && (
                            <div style={{ fontSize: '10.5px', color: '#047857', fontWeight: '700', marginTop: '2px' }}>
                              +{formatDays(row.finalThursdayDays + row.finalFestivalDays)} Bonus
                            </div>
                          )}
                        </td>

                        <td style={{ padding: '10px 12px', verticalAlign: 'middle', fontWeight: '600', color: '#374151', fontSize: '12.5px' }}>
                          ₹{row.dailyRate.toLocaleString('en-IN')}
                        </td>

                        <td style={{ padding: '10px 12px', verticalAlign: 'middle', fontWeight: '700', color: '#111827', fontSize: '12.5px' }}>
                          ₹{row.grossAmount.toLocaleString('en-IN')}
                        </td>

                        <td style={{ padding: '10px 12px', verticalAlign: 'middle', color: row.deductions > 0 ? '#DC2626' : '#A8A29E', fontSize: '12.5px' }}>
                          {row.deductions > 0 ? `- ₹${row.deductions.toLocaleString('en-IN')}` : '₹0'}
                        </td>

                        <td style={{ padding: '10px 12px', verticalAlign: 'middle', fontWeight: '800', color: 'var(--navy, #111827)', fontSize: '13.5px' }}>
                          ₹{row.netPayable.toLocaleString('en-IN')}
                        </td>

                        <td style={{ padding: '14px 12px', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                          <span style={{
                            background: row.totalDays > 0 ? '#FDF8F0' : '#F5F5F4',
                            color: row.totalDays > 0 ? '#9B6833' : '#78716C',
                            border: row.totalDays > 0 ? '1px solid #F3E5D4' : '1px solid #E7E5E4',
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '11.5px',
                            fontWeight: '700',
                            whiteSpace: 'nowrap',
                            display: 'inline-block'
                          }}>
                            {row.status}
                          </span>
                        </td>

                        <td style={{ padding: '14px 18px', verticalAlign: 'middle', textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenGiftModal(row);
                            }}
                            title={`Add extra attendance days to ${row.name}`}
                            style={{
                              background: '#fff',
                              color: '#374151',
                              border: '1px solid #D1C2AF',
                              padding: '5px 10px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: '700',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                            }}
                          >
                            <i className="fa-solid fa-plus" style={{ color: 'var(--gold, #A56A30)' }}></i> Add Days
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            /* ===================================================================
                SUB-VIEW 2: SITE-WISE LABOR & BILLING TABLE (WHEN viewMode === 'site')
                =================================================================== */
            <div className="panel table-responsive" style={{
              background: '#fff',
              borderRadius: '10px',
              border: '1.5px solid #EAE3DA',
              boxShadow: '0 2px 8px rgba(74, 44, 23, 0.04)',
              overflowX: 'auto',
              WebkitOverflowScrolling: 'touch'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '950px', tableLayout: 'fixed' }}>
                <thead>
                  <tr style={{
                    background: '#FAF8F5',
                    borderBottom: '1.5px solid #EAE3DA',
                    color: '#4A2C17',
                    fontSize: '11px',
                    fontWeight: '800',
                    textTransform: 'uppercase',
                    letterSpacing: '0.6px'
                  }}>
                    <th style={{ padding: '14px 18px', width: '25%', fontWeight: '800', color: '#4A2C17' }}>Site / Customer Project</th>
                    <th style={{ padding: '14px 18px', width: '14%', fontWeight: '800', color: '#4A2C17' }}>Active Workers</th>
                    <th style={{ padding: '14px 18px', width: '13%', fontWeight: '800', color: '#4A2C17' }}>Total Man-Days</th>
                    <th style={{ padding: '14px 18px', width: '12%', fontWeight: '800', color: '#4A2C17' }}>Total Hours</th>
                    <th style={{ padding: '14px 18px', width: '18%', fontWeight: '800', color: '#4A2C17' }}>Site Labor Cost (Billing)</th>
                    <th style={{ padding: '14px 18px', width: '18%', fontWeight: '800', color: '#4A2C17', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: '#6B7280' }}>
                        <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '22px', color: 'var(--gold, #A56A30)', marginBottom: '8px' }}></i>
                        <div>Calculating site-wise labor billing expenses...</div>
                      </td>
                    </tr>
                  ) : filteredSiteRows.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: '#9CA3AF' }}>
                        No sites found matching your search.
                      </td>
                    </tr>
                  ) : (
                    filteredSiteRows.map((site) => (
                      <tr 
                        key={site.id}
                        onClick={() => setActiveSiteId(site.id)}
                        title={`Click to open full project labor breakdown for ${site.customerName}`}
                        style={{ 
                          borderBottom: '1px solid #F3F4F6',
                          cursor: 'pointer',
                          transition: 'background 0.15s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F9FAFB'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        {/* Site Ref & Customer Name */}
                        <td style={{ padding: '14px 18px', verticalAlign: 'middle' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{
                              background: 'rgba(165, 106, 48, 0.1)',
                              color: 'var(--gold, #A56A30)',
                              fontWeight: '800',
                              padding: '3px 8px',
                              borderRadius: '5px',
                              fontSize: '11px',
                              letterSpacing: '0.5px',
                              fontFamily: 'monospace'
                            }}>
                              {site.siteRef}
                            </span>
                            <div style={{ fontWeight: '700', color: '#111827', fontSize: '13px' }}>
                              {site.customerName}
                            </div>
                          </div>
                          <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '3px', paddingLeft: '2px' }}>
                            <i className="fa-solid fa-location-dot" style={{ fontSize: '10px', color: '#9CA3AF', marginRight: '4px' }}></i>
                            {site.location || 'Site Location'}
                          </div>
                        </td>

                        {/* Workers Count */}
                        <td style={{ padding: '14px 18px', verticalAlign: 'middle' }}>
                          <span style={{
                            background: site.workerCount > 0 ? 'rgba(165, 106, 48, 0.1)' : '#F3EDE6',
                            color: site.workerCount > 0 ? '#7A4518' : '#7D7368',
                            border: '1px solid #D1C2AF',
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '700',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px'
                          }}>
                            <i className="fa-solid fa-users" style={{ fontSize: '11px' }}></i>
                            {site.workerCount} {site.workerCount === 1 ? 'Worker' : 'Workers'}
                          </span>
                        </td>

                        {/* Total Man-Days */}
                        <td style={{ padding: '14px 18px', verticalAlign: 'middle' }}>
                          <span style={{
                            background: site.totalDays > 0 ? '#FAF4EE' : '#F5F5F4',
                            color: site.totalDays > 0 ? 'var(--gold, #8C5521)' : '#78716C',
                            border: site.totalDays > 0 ? '1px solid #EAD8C7' : '1px solid #E7E5E4',
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '700',
                            display: 'inline-block'
                          }}>
                            {formatDays(site.totalDays)} Days
                          </span>
                        </td>

                        {/* Total Work Hours */}
                        <td style={{ padding: '14px 18px', verticalAlign: 'middle', fontWeight: '600', color: site.totalHours > 0 ? '#374151' : '#9CA3AF', fontSize: '13px' }}>
                          {site.totalHours > 0 ? `${site.totalHours} hrs` : '--'}
                        </td>

                        {/* Total Labor Cost (Billing) */}
                        <td style={{ padding: '14px 18px', verticalAlign: 'middle' }}>
                          <span style={{
                            background: site.totalLaborCost > 0 ? '#FAF4EE' : '#F5F5F4',
                            color: site.totalLaborCost > 0 ? 'var(--gold, #8C5521)' : '#78716C',
                            border: site.totalLaborCost > 0 ? '1px solid #EAD8C7' : 'none',
                            padding: '5px 12px',
                            borderRadius: '8px',
                            fontSize: '14px',
                            fontWeight: '800',
                            display: 'inline-block'
                          }}>
                            ₹{site.totalLaborCost.toLocaleString('en-IN')}
                          </span>
                        </td>

                        {/* Actions */}
                        <td style={{ padding: '14px 18px', verticalAlign: 'middle', textAlign: 'right' }}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveSiteId(site.id);
                            }}
                            style={{
                              background: '#F8FAFC',
                              border: '1px solid #CBD5E1',
                              padding: '6px 12px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: '700',
                              color: '#334155',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              transition: 'all 0.15s'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = 'var(--gold, #A56A30)';
                              e.currentTarget.style.color = 'var(--gold, #A56A30)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = '#CBD5E1';
                              e.currentTarget.style.color = '#334155';
                            }}
                          >
                            <span>View Breakdown</span>
                            <i className="fa-solid fa-arrow-right" style={{ fontSize: '11px' }}></i>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {filteredSiteRows.length > 0 && (
                  <tfoot>
                    <tr style={{
                      background: '#FAF8F5',
                      borderTop: '1.5px solid #EAE3DA',
                      borderBottom: '1.5px solid #EAE3DA',
                      fontWeight: '800'
                    }}>
                      <td style={{ padding: '16px 18px', fontSize: '13px', color: '#4A2C17', fontWeight: '800' }}>
                        Total Project Labor Expense
                      </td>
                      <td style={{ padding: '16px 18px', fontSize: '13px', color: '#4A2C17', fontWeight: '800' }}>
                        {activeSitesCount} Active Sites
                      </td>
                      <td style={{ padding: '16px 18px', fontSize: '14px', color: '#8C5521', fontWeight: '800' }}>
                        {formatDays(totalSiteManDays)} Days
                      </td>
                      <td style={{ padding: '16px 18px', fontSize: '13px', color: '#4A2C17', fontWeight: '800' }}>
                        {filteredSiteRows.reduce((sum, s) => sum + s.totalHours, 0)} hrs
                      </td>
                      <td style={{ padding: '16px 18px', fontSize: '17px', fontWeight: '800', color: '#4A2C17' }}>
                        ₹{totalSitePayroll.toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: '16px 18px', textAlign: 'right', fontSize: '12px', color: '#78716C' }}>
                        All Sites Active
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          )}
        </div>
      )}

      {/* ========================================================== */}
      {/* SIMPLE ADD DAYS MODAL */}
      {/* ========================================================== */}
      {showGiftModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.55)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1450,
          padding: '16px'
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '400px',
            boxShadow: '0 20px 30px -5px rgba(0,0,0,0.2)',
            overflow: 'hidden',
            border: '1px solid #E5E7EB'
          }}>
            {/* Header */}
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid #E5E7EB',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#F9FAFB'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '6px',
                  background: 'var(--gold, #A56A30)',
                  color: '#fff',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '13px'
                }}>
                  <i className="fa-solid fa-plus"></i>
                </span>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#111827' }}>
                  Add Attendance Days
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowGiftModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '18px',
                  color: '#9CA3AF',
                  cursor: 'pointer'
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveGiftAttendance} style={{ padding: '20px' }}>
              {/* Employee Selection */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#374151', marginBottom: '6px' }}>
                  Employee
                </label>
                <select
                  value={giftFormData.userId}
                  onChange={(e) => {
                    const uId = e.target.value;
                    const emp = employees.find(empItem => String(empItem.dbId || empItem.id) === String(uId));
                    setGiftFormData({
                      ...giftFormData,
                      userId: uId,
                      employeeName: emp?.name || '',
                      dailyRate: Number(emp?.dailySalary || 1000)
                    });
                  }}
                  required
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '7px',
                    border: '1px solid #D1D5DB',
                    fontSize: '13px',
                    outline: 'none',
                    background: '#fff',
                    fontWeight: '600'
                  }}
                >
                  <option value="" disabled>-- Select Worker --</option>
                  {employees.map(e => {
                    const eId = e.dbId || e.id;
                    return (
                      <option key={eId} value={eId}>
                        {e.name} ({e.id}) — ₹{e.dailySalary || 1000}/day
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Days to Add */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#374151', marginBottom: '6px' }}>
                  Days to Add (+Days)
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="number"
                    step="0.25"
                    min="0.25"
                    placeholder="e.g. 4"
                    value={giftFormData.bonusDays}
                    onChange={(e) => setGiftFormData({ ...giftFormData, bonusDays: e.target.value })}
                    required
                    style={{
                      flex: 1,
                      padding: '9px 12px',
                      borderRadius: '7px',
                      border: '1px solid #D1D5DB',
                      fontSize: '14px',
                      fontWeight: '700',
                      outline: 'none'
                    }}
                  />
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#6B7280' }}>Days</span>
                </div>
                {(() => {
                  const emp = employees.find(e => String(e.dbId || e.id) === String(giftFormData.userId));
                  const rate = Number(emp?.dailySalary || giftFormData.dailyRate || 0);
                  const days = parseFloat(giftFormData.bonusDays) || 0;
                  if (rate > 0 && days > 0) {
                    return (
                      <div style={{ fontSize: '12px', color: 'var(--gold, #8C5521)', fontWeight: '700', marginTop: '6px' }}>
                        +{days} Days × ₹{rate}/day = +₹{Math.round(days * rate).toLocaleString('en-IN')} added salary
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>

              {/* Submit Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowGiftModal(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '7px',
                    border: '1px solid #D1D5DB',
                    background: '#fff',
                    color: '#374151',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={giftSaving}
                  style={{
                    padding: '8px 20px',
                    borderRadius: '7px',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: giftSaving ? 'not-allowed' : 'pointer',
                    background: 'var(--gold, #4A2C17)',
                    color: '#fff',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 6px rgba(74, 44, 23, 0.2)'
                  }}
                >
                  {giftSaving ? 'Adding...' : 'Add Days'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: EDIT THURSDAY & FESTIVAL BENEFITS FOR PERMANENT EMPLOYEE
          ========================================================================= */}
      {showBenefitModal && benefitTargetEmp && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(28, 17, 10, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          padding: '16px'
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '14px',
            width: '100%',
            maxWidth: '520px',
            boxShadow: '0 20px 40px rgba(74, 44, 23, 0.25)',
            border: '1px solid #EAD8C7',
            overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '18px 22px',
              borderBottom: '1px solid #F0E6DD',
              background: 'linear-gradient(135deg, #FAF4EE 0%, #FFFFFF 100%)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#4A2C17' }}>
                  ✏️ Edit Benefits & Bonuses
                </h3>
                <div style={{ fontSize: '12px', color: '#8C5521', marginTop: '2px' }}>
                  {benefitTargetEmp.name} <span style={{ fontWeight: '700' }}>({benefitTargetEmp.id})</span> · ₹{benefitTargetEmp.dailyRate}/day
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowBenefitModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '18px',
                  color: '#9CA3AF',
                  cursor: 'pointer'
                }}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveBenefitOverride} style={{ padding: '20px 22px' }}>
              <div style={{
                background: '#FAF8F5',
                border: '1px solid #EAE3DA',
                borderRadius: '8px',
                padding: '10px 14px',
                marginBottom: '16px',
                fontSize: '12px',
                color: '#4B5563'
              }}>
                <div style={{ fontWeight: '700', color: '#4A2C17', marginBottom: '4px' }}>
                  Policy Rules:
                </div>
                <div>• <strong>Thursdays:</strong> +1 Hajeri per Thursday if worker worked at least 2 days of Wed, Thu, Fri.</div>
                <div>• <strong>Festivals:</strong> +1 Hajeri for every festival holiday occurring in this month.</div>
              </div>

              {/* Thursday Days Input */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '12.5px', fontWeight: '700', color: '#111827' }}>
                    Thursday Off Days:
                  </label>
                  <button
                    type="button"
                    onClick={() => setBenefitThursdayInput(String(benefitTargetEmp.autoThursdayDays || 0))}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--gold, #8C5521)',
                      fontSize: '11px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      textDecoration: 'underline'
                    }}
                  >
                    Restore Auto ({benefitTargetEmp.autoThursdayDays || 0})
                  </button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="15"
                    value={benefitThursdayInput}
                    onChange={(e) => setBenefitThursdayInput(e.target.value)}
                    required
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #D1C2AF',
                      fontSize: '14px',
                      fontWeight: '700',
                      outline: 'none'
                    }}
                  />
                  <span style={{ fontSize: '13px', fontWeight: '700', color: '#4B5563' }}>Days</span>
                </div>
                <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '4px' }}>
                  Auto: {benefitTargetEmp.autoThursdayDays} Days ({benefitTargetEmp.qualifiedThursdays?.length || 0} of {benefitTargetEmp.totalThursdaysCount} Thursdays qualified)
                </div>
              </div>

              {/* Festival Days Input */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '12.5px', fontWeight: '700', color: '#111827' }}>
                    Festival Holiday Days:
                  </label>
                  <button
                    type="button"
                    onClick={() => setBenefitFestivalInput(String(benefitTargetEmp.autoFestivalDays || 0))}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--gold, #8C5521)',
                      fontSize: '11px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      textDecoration: 'underline'
                    }}
                  >
                    Restore Auto ({benefitTargetEmp.autoFestivalDays || 0})
                  </button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="15"
                    value={benefitFestivalInput}
                    onChange={(e) => setBenefitFestivalInput(e.target.value)}
                    required
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #D1C2AF',
                      fontSize: '14px',
                      fontWeight: '700',
                      outline: 'none'
                    }}
                  />
                  <span style={{ fontSize: '13px', fontWeight: '700', color: '#4B5563' }}>Days</span>
                </div>
                <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '4px' }}>
                  Auto: {benefitTargetEmp.autoFestivalDays} Days ({benefitTargetEmp.monthFestivals?.map(f => f.label).join(', ') || 'No festivals scheduled'})
                </div>
              </div>

              {/* Optional Notes */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#374151', marginBottom: '4px' }}>
                  Adjustment Reason / Notes (Optional):
                </label>
                <input
                  type="text"
                  placeholder="e.g. Approved extra holiday by management"
                  value={benefitNotesInput}
                  onChange={(e) => setBenefitNotesInput(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #D1C2AF',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Preview Box */}
              {(() => {
                const thu = parseFloat(benefitThursdayInput) || 0;
                const fest = parseFloat(benefitFestivalInput) || 0;
                const totalExtra = thu + fest;
                const totalAmt = Math.round(totalExtra * benefitTargetEmp.dailyRate);
                return (
                  <div style={{
                    background: '#ECFDF5',
                    border: '1px solid #A7F3D0',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    marginBottom: '20px',
                    fontSize: '12.5px',
                    color: '#065F46',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <strong>Combined Extra Benefits:</strong> +{totalExtra} Days
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: '900' }}>
                      +₹{totalAmt.toLocaleString('en-IN')}
                    </div>
                  </div>
                );
              })()}

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={handleResetBenefitOverride}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#DC2626',
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  <i className="fa-solid fa-rotate-left"></i> Reset to Default
                </button>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setShowBenefitModal(false)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      border: '1px solid #D1D5DB',
                      background: '#FFFFFF',
                      color: '#374151',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    style={{
                      padding: '8px 20px',
                      borderRadius: '8px',
                      border: 'none',
                      background: '#4A2C17',
                      color: '#FFFFFF',
                      fontSize: '13px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      boxShadow: '0 2px 6px rgba(74, 44, 23, 0.2)'
                    }}
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

    </main>
  );
};

export default Salary;
