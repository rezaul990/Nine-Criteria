import { useState } from 'react';
import * as XLSX from 'xlsx';
import './App.css';

interface PlazaData {
  Rank_No: number;
  Plaza: string;
  Area: string;
  Division: string;
  Total_Marks: number;
  Achv_Pct: number;
  Profit_Achv: number;
  allColumns?: any[];
  // Target, Achievement, and Achievement % fields
  Total_Target?: number;
  Total_Ach?: number;
  Total_Ach_Pct?: number;
  
  Retail_Sales_Target?: number;
  Retail_Sales_Ach?: number;
  Retail_Sales_Ach_Pct?: number;
  
  Hire_Sales_Target?: number;
  Hire_Sales_Ach?: number;
  Hire_Sales_Ach_Pct?: number;
  
  Hire_DP_Col_Target?: number;
  Hire_DP_Col_Ach?: number;
  Hire_DP_Col_Ach_Pct?: number;
  
  Hire_LPR_Col_Target?: number;
  Hire_LPR_Col_Ach?: number;
  Hire_LPR_Col_Ach_Pct?: number;
  
  Col_Exec_Target?: number;
  Col_Exec_Ach?: number;
  Col_Exec_Ach_Pct?: number;
  
  Col_Self_Target?: number;
  Col_Self_Ach?: number;
  Col_Self_Ach_Pct?: number;
  
  Dealer_Corp_Sales_Target?: number;
  Dealer_Corp_Sales_Ach?: number;
  Dealer_Corp_Sales_Ach_Pct?: number;
  
  Dealer_Corp_Col_Target?: number;
  Dealer_Corp_Col_Ach?: number;
  Dealer_Corp_Col_Ach_Pct?: number;
  
  Profit_Target?: number;
  Profit_Ach?: number;
  Profit_Ach_Pct?: number;
}

function App() {
  const [fullData, setFullData] = useState<PlazaData[]>([]);
  const [filteredData, setFilteredData] = useState<PlazaData[]>([]);
  const [divisionFilter, setDivisionFilter] = useState('');
  const [areaFilter, setAreaFilter] = useState('');
  const [plazaFilter, setPlazaFilter] = useState('');
  const [selectedPlaza, setSelectedPlaza] = useState<PlazaData | null>(null);
  const [headers, setHeaders] = useState<{ [key: number]: string }>({});

  const [isDragging, setIsDragging] = useState(false);

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const raw: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      // Create proper header mapping
      const headerMapping: { [key: number]: string } = {
        0: 'S/N',
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
        13: 'Retail Marks (15)',
        14: 'Hire Sales Tk',
        15: 'Hire Achv',
        17: 'Hire Achv %',
        19: 'Hire Marks (17)',
        20: 'Hire DP Col Tk',
        21: 'DP Achv',
        22: 'DP Achv %',
        23: 'DP Marks (5)',
        24: 'LPR Col Tk',
        26: 'LPR Achv',
        29: 'LPR Achv %',
        30: 'LPR Marks (11)',
        31: 'Col Exec Qty',
        32: 'Col Exec Achv',
        33: 'Col Exec Achv %',
        34: 'Col Exec Marks (6)',
        35: 'Col Self Qty',
        36: 'Col Self Achv',
        37: 'Col Self Achv %',
        38: 'Col Self Marks (6)',
        39: 'Dealer Corp Sales Tk',
        40: 'Dealer Corp Achv',
        41: 'Dealer Corp Achv %',
        42: 'Dealer Corp Marks (6)',
        43: 'Dealer Corp Col Tk',
        44: 'Dealer Corp Col Achv',
        45: 'Dealer Corp Col Achv %',
        46: 'Dealer Corp Col Marks (7)',
        47: 'Profit Tk',
        49: 'Profit Achv',
        50: 'Profit Achv %',
        51: 'Profit Marks (27)',
      };
      
      setHeaders(headerMapping);

      const rows = raw.slice(7);
      const parsedData: PlazaData[] = rows
        .map((r) => ({
          Rank_No: r[1],
          Plaza: r[2],
          Area: r[3],
          Division: r[4],
          Total_Marks: parseFloat(r[5]) || 0,
          Achv_Pct: parseFloat(r[9]) || 0,
          Profit_Achv: parseFloat((r[49] || '').toString().replace(/,/g, '')) || 0,
          allColumns: r,
          // Target fields
          Total_Target: parseFloat((r[6] || '').toString().replace(/,/g, '')) || 0,
          Total_Ach: parseFloat((r[8] || '').toString().replace(/,/g, '')) || 0,
          Total_Ach_Pct: parseFloat(r[9]) || 0,
          
          Retail_Sales_Target: parseFloat((r[10] || '').toString().replace(/,/g, '')) || 0,
          Retail_Sales_Ach: parseFloat((r[11] || '').toString().replace(/,/g, '')) || 0,
          Retail_Sales_Ach_Pct: parseFloat(r[12]) || 0,
          
          Hire_Sales_Target: parseFloat((r[14] || '').toString().replace(/,/g, '')) || 0,
          Hire_Sales_Ach: parseFloat((r[15] || '').toString().replace(/,/g, '')) || 0,
          Hire_Sales_Ach_Pct: parseFloat(r[17]) || 0,
          
          Hire_DP_Col_Target: parseFloat((r[20] || '').toString().replace(/,/g, '')) || 0,
          Hire_DP_Col_Ach: parseFloat((r[21] || '').toString().replace(/,/g, '')) || 0,
          Hire_DP_Col_Ach_Pct: parseFloat(r[22]) || 0,
          
          Hire_LPR_Col_Target: parseFloat((r[24] || '').toString().replace(/,/g, '')) || 0,
          Hire_LPR_Col_Ach: parseFloat((r[26] || '').toString().replace(/,/g, '')) || 0,
          Hire_LPR_Col_Ach_Pct: parseFloat(r[29]) || 0,
          
          Col_Exec_Target: parseFloat((r[31] || '').toString().replace(/,/g, '')) || 0,
          Col_Exec_Ach: parseFloat((r[32] || '').toString().replace(/,/g, '')) || 0,
          Col_Exec_Ach_Pct: parseFloat(r[33]) || 0,
          
          Col_Self_Target: parseFloat((r[35] || '').toString().replace(/,/g, '')) || 0,
          Col_Self_Ach: parseFloat((r[36] || '').toString().replace(/,/g, '')) || 0,
          Col_Self_Ach_Pct: parseFloat(r[37]) || 0,
          
          Dealer_Corp_Sales_Target: parseFloat((r[39] || '').toString().replace(/,/g, '')) || 0,
          Dealer_Corp_Sales_Ach: parseFloat((r[40] || '').toString().replace(/,/g, '')) || 0,
          Dealer_Corp_Sales_Ach_Pct: parseFloat(r[41]) || 0,
          
          Dealer_Corp_Col_Target: parseFloat((r[43] || '').toString().replace(/,/g, '')) || 0,
          Dealer_Corp_Col_Ach: parseFloat((r[44] || '').toString().replace(/,/g, '')) || 0,
          Dealer_Corp_Col_Ach_Pct: parseFloat(r[45]) || 0,
          
          Profit_Target: parseFloat((r[47] || '').toString().replace(/,/g, '')) || 0,
          Profit_Ach: parseFloat((r[49] || '').toString().replace(/,/g, '')) || 0,
          Profit_Ach_Pct: parseFloat(r[50]) || 0,
        }))
        .filter((d) => d.Plaza && d.Plaza.toString().trim() !== '' && d.Total_Marks > 0);

      setFullData(parsedData);
      setFilteredData(parsedData);
    };

    reader.readAsArrayBuffer(file);
  };

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
    ? (filteredData.reduce((a, b) => a + b.Achv_Pct, 0) / filteredData.length).toFixed(2)
    : '0';

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
      'Hire DP Collection Target (Tk.)': d.Hire_DP_Col_Target || 0,
      'Hire DP Collection Ach': d.Hire_DP_Col_Ach || 0,
      'Hire DP Collection Ach %': d.Hire_DP_Col_Ach_Pct || 0,
      'Hire LPR Collection Target (Tk.)': d.Hire_LPR_Col_Target || 0,
      'Hire LPR Collection Ach': d.Hire_LPR_Col_Ach || 0,
      'Hire LPR Collection Ach %': d.Hire_LPR_Col_Ach_Pct || 0,
      'Collection Executive Target (Qty.)': d.Col_Exec_Target || 0,
      'Collection Executive Ach': d.Col_Exec_Ach || 0,
      'Collection Executive Ach %': d.Col_Exec_Ach_Pct || 0,
      'Collection Self Target (Qty.)': d.Col_Self_Target || 0,
      'Collection Self Ach': d.Col_Self_Ach || 0,
      'Collection Self Ach %': d.Col_Self_Ach_Pct || 0,
      'Dealer & Corporate Sales Target (Tk.)': d.Dealer_Corp_Sales_Target || 0,
      'Dealer & Corporate Sales Ach': d.Dealer_Corp_Sales_Ach || 0,
      'Dealer & Corporate Sales Ach %': d.Dealer_Corp_Sales_Ach_Pct || 0,
      'Dealer & Corporate Collection Target (Tk.)': d.Dealer_Corp_Col_Target || 0,
      'Dealer & Corporate Collection Ach': d.Dealer_Corp_Col_Ach || 0,
      'Dealer & Corporate Collection Ach %': d.Dealer_Corp_Col_Ach_Pct || 0,
      'Profit Target (Tk.)': d.Profit_Target || 0,
      'Profit Ach': d.Profit_Ach || 0,
      'Profit Ach %': d.Profit_Ach_Pct || 0,
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

  return (
    <div className="app">
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
                    {filteredData.reduce((sum, d) => sum + (d.Profit_Ach || 0), 0).toLocaleString()}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '12px', color: '#888' }}>Ach %:</span>
                  <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#28a745' }}>
                    {(() => {
                      const target = filteredData.reduce((sum, d) => sum + (d.Profit_Target || 0), 0);
                      const ach = filteredData.reduce((sum, d) => sum + (d.Profit_Ach || 0), 0);
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
                  <td>{(d.Profit_Ach || 0).toLocaleString()}</td>
                  <td>{(d.Profit_Ach_Pct || 0).toFixed(2)}%</td>
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
            <div style={{ overflowX: 'auto' }}>
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
                      <td>{(d.Profit_Ach || 0).toLocaleString()}</td>
                      <td>{(d.Profit_Ach_Pct || 0).toFixed(2)}%</td>
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
                    <td>{filteredData.reduce((sum, d) => sum + (d.Profit_Ach || 0), 0).toLocaleString()}</td>
                    <td>{(filteredData.reduce((sum, d) => sum + (d.Profit_Ach_Pct || 0), 0) / filteredData.length).toFixed(2)}%</td>
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
              Loss Plaza List ({fullData.filter((d) => (d.Profit_Ach || 0) < 0).length} out of {fullData.length} Plazas)
            </h2>
            
            {fullData.filter((d) => (d.Profit_Ach || 0) < 0).length > 0 && (
              <>
                <div style={{ marginBottom: '20px' }}>
                  <h3 style={{ marginBottom: '10px' }}>Loss Summary by Division</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px', marginBottom: '20px' }}>
                    {(() => {
                      const lossPlazas = fullData.filter((d) => (d.Profit_Ach || 0) < 0);
                      const divisionSummary = lossPlazas.reduce((acc, d) => {
                        if (!acc[d.Division]) {
                          acc[d.Division] = { qty: 0, amount: 0 };
                        }
                        acc[d.Division].qty += 1;
                        acc[d.Division].amount += d.Profit_Ach || 0;
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
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px', marginBottom: '20px' }}>
                    {(() => {
                      const lossPlazas = fullData.filter((d) => (d.Profit_Ach || 0) < 0);
                      const areaSummary = lossPlazas.reduce((acc, d) => {
                        if (!acc[d.Area]) {
                          acc[d.Area] = { qty: 0, amount: 0 };
                        }
                        acc[d.Area].qty += 1;
                        acc[d.Area].amount += d.Profit_Ach || 0;
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
            <div style={{ overflowX: 'auto' }}>
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
                    .filter((d) => (d.Profit_Ach || 0) < 0)
                    .map((d, idx) => (
                      <tr key={idx} style={{ background: '#fff5f5' }}>
                        <td>{d.Division}</td>
                        <td>{d.Area}</td>
                        <td>{d.Plaza}</td>
                        <td style={{ color: '#dc3545', fontWeight: 'bold' }}>
                          {(d.Profit_Ach || 0).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  {fullData.filter((d) => (d.Profit_Ach || 0) < 0).length === 0 && (
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
      )}
    </div>
  );
}

export default App;
