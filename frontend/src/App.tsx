import { useState, useEffect } from 'react'
import axios from 'axios'
import { FileUp, ShieldAlert, LayoutDashboard, FileText, GitCompare, MessageSquare, Calendar, ChevronRight, AlertTriangle, UploadCloud, Search, Bell, Settings, HelpCircle, Bot, Activity, LogOut, ChevronDown, CheckCircle, Users, Server, Shield } from 'lucide-react'

const API_BASE = 'http://127.0.0.1:8000/api'

function App() {
  // Auth state
  const [authView, setAuthView] = useState<'login' | 'signup' | 'admin-login'>('login')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [authLoading, setAuthLoading] = useState(false)

  // Auth form state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [authError, setAuthError] = useState('')

  // App state
  const [view, setView] = useState<'dashboard' | 'contracts' | 'compare' | 'obligations' | 'review' | 'assistant' | 'timeline' | 'settings' | 'help'>('dashboard')
  const [stats, setStats] = useState<any>(null)
  const [contracts, setContracts] = useState<any[]>([])
  const [globalObligations, setGlobalObligations] = useState<any[]>([])
  const [globalReviewFlags, setGlobalReviewFlags] = useState<any[]>([])
  
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [selectedContract, setSelectedContract] = useState<any | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'obligations' | 'timeline' | 'qa'>('overview')

  // QA & Compare state
  const [qaQuestion, setQaQuestion] = useState('')
  const [qaAnswer, setQaAnswer] = useState<{answer: string, source_reference: string} | null>(null)
  const [qaLoading, setQaLoading] = useState(false)
  const [c1, setC1] = useState<number | ''>('')
  const [c2, setC2] = useState<number | ''>('')
  const [compareResult, setCompareResult] = useState<any>(null)
  const [compareLoading, setCompareLoading] = useState(false)

  // Settings & Help state
  const [settingsTab, setSettingsTab] = useState<'profile' | 'preferences' | 'account'>('profile')
  const [faqOpen, setFaqOpen] = useState<number | null>(null)

  useEffect(() => {
    if (isLoggedIn && !isAdmin) {
      fetchStats()
      fetchContracts()
      fetchObligations()
      fetchReviewFlags()
    }
  }, [isLoggedIn, isAdmin])

  const fetchStats = async () => {
    try { const res = await axios.get(`${API_BASE}/stats`); setStats(res.data) } catch (e) { console.error(e) }
  }
  const fetchContracts = async () => {
    try { const res = await axios.get(`${API_BASE}/contracts`); setContracts(res.data) } catch (e) { console.error(e) }
  }
  const fetchObligations = async () => {
    try { const res = await axios.get(`${API_BASE}/obligations`); setGlobalObligations(res.data) } catch (e) { console.error(e) }
  }
  const fetchReviewFlags = async () => {
    try { const res = await axios.get(`${API_BASE}/review-flags`); setGlobalReviewFlags(res.data) } catch (e) { console.error(e) }
  }

  // --- Handlers ---
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthError('')
    if (!email || !password) return setAuthError('Please fill in all fields.')
    
    setAuthLoading(true)
    setTimeout(() => {
      setAuthLoading(false)
      if (authView === 'signup' && password !== confirmPassword) {
        return setAuthError('Passwords do not match.')
      }
      setIsLoggedIn(true)
      setIsAdmin(authView === 'admin-login')
    }, 800)
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return
    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    try {
      const res = await axios.post(`${API_BASE}/contracts/upload`, formData)
      setContracts([...contracts, res.data])
      setSelectedContract(res.data)
      setView('contracts')
      setActiveTab('overview')
      fetchStats(); fetchObligations(); fetchReviewFlags()
    } catch (e) {
      alert("Error uploading contract. Please ensure the backend is running.")
    }
    setUploading(false)
    setFile(null)
  }

  const handleAskQuestion = async (e?: React.FormEvent, presetQ?: string) => {
    e?.preventDefault()
    const q = presetQ || qaQuestion
    if (!q || !selectedContract) return
    if (presetQ) setQaQuestion(presetQ)
    setQaLoading(true)
    try {
      const res = await axios.post(`${API_BASE}/contracts/${selectedContract.id}/qa`, { question: q })
      setQaAnswer(res.data)
    } catch (e) {
      setQaAnswer({answer: "Error communicating with AI service.", source_reference: ""})
    }
    setQaLoading(false)
  }

  const handleCompare = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!c1 || !c2) return
    setCompareLoading(true)
    try {
      const res = await axios.post(`${API_BASE}/contracts/compare`, { contract_1_id: Number(c1), contract_2_id: Number(c2) })
      setCompareResult(res.data)
    } catch (e) {
      alert("Error comparing contracts.")
    }
    setCompareLoading(false)
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
    setIsAdmin(false)
    setAuthView('login')
  }

  // --- Components ---
  const SidebarItem = ({ icon: Icon, label, id, isBeta = false }: any) => (
    <button 
      onClick={() => setView(id)}
      className={`w-full text-left px-4 py-3 rounded-xl flex items-center justify-between transition-all duration-200 ${view === id ? 'bg-blue-50 text-blue-700 font-semibold border-l-4 border-blue-600' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 border-l-4 border-transparent'}`}
    >
      <div className="flex items-center gap-3">
        <Icon size={18} className={view === id ? 'text-blue-600' : 'text-slate-400'} />
        {label}
      </div>
      {isBeta && <span className="text-[10px] uppercase tracking-wider bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full font-bold">Beta</span>}
    </button>
  )

  const faqs = [
    { q: "How to upload a contract?", a: "Navigate to the Dashboard and use the 'Analyze a Contract' drag-and-drop area. We support PDF, DOCX, and TXT files." },
    { q: "How contract extraction works?", a: "We securely send the document text to our AI processing pipeline which identifies parties, dates, financial terms, and obligations." },
    { q: "How to view obligations?", a: "You can view all obligations across all contracts in the 'Obligations' tab in the sidebar, or view specific ones inside a Contract's detail view." },
    { q: "How to use AI Q&A?", a: "Open a contract from the Document Library, navigate to the 'AI Assistant' tab, and type your question. The AI will cite its sources." },
    { q: "How to compare contracts?", a: "Navigate to Compare in the sidebar, select a Base contract and a Modified contract from the dropdowns, and run the comparison to see the AI diff." }
  ]

  // --- Auth View ---
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#F4F7FC] flex items-center justify-center p-4 selection:bg-blue-100">
        <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md border border-slate-200 relative overflow-hidden">
          {authView === 'admin-login' && <div className="absolute top-0 left-0 w-full h-1 bg-red-500"></div>}
          
          <div className="flex justify-center mb-6 relative z-10">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${authView === 'admin-login' ? 'bg-gradient-to-br from-red-600 to-orange-600 shadow-red-500/20' : 'bg-gradient-to-br from-blue-600 to-indigo-600 shadow-blue-500/20'}`}>
              {authView === 'admin-login' ? <Shield size={24} className="text-white"/> : <FileText size={24} className="text-white" />}
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-center text-slate-900 mb-1">
            {authView === 'login' && 'Sign in to ContractLens'}
            {authView === 'signup' && 'Create your account'}
            {authView === 'admin-login' && 'Admin Portal Portal'}
          </h2>
          <p className="text-center text-slate-500 text-sm mb-6">AI-powered Business Contract Intelligence</p>

          <form onSubmit={handleAuth} className="space-y-4">
            {authError && <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm font-medium border border-red-100 text-center">{authError}</div>}
            
            {authView === 'signup' && (
              <input type="text" value={name} onChange={e=>setName(e.target.value)} placeholder="Full Name" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
            )}
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email Address" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
            
            {authView === 'signup' && (
              <input type="password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} placeholder="Confirm Password" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
            )}

            {authView === 'login' && <div className="text-right"><button type="button" className="text-sm font-medium text-blue-600 hover:text-blue-700">Forgot Password?</button></div>}

            <button type="submit" disabled={authLoading} className={`w-full text-white font-bold py-3.5 rounded-xl shadow-lg transition-all flex justify-center items-center gap-2 ${authView === 'admin-login' ? 'bg-red-600 hover:bg-red-700 shadow-red-600/20' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20'}`}>
              {authLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : (
                <>{authView === 'login' ? 'Sign In' : authView === 'signup' ? 'Create Account' : 'Authenticate as Admin'}</>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col gap-3">
            {authView === 'login' && (
              <>
                <button onClick={() => {setAuthView('signup'); setAuthError('')}} className="w-full text-sm font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 py-3 rounded-xl transition-colors">Create Account</button>
                <button onClick={() => {setAuthView('admin-login'); setAuthError('')}} className="w-full text-sm font-bold text-red-600 hover:bg-red-50 py-2 rounded-xl transition-colors">Admin Login</button>
              </>
            )}
            {(authView === 'signup' || authView === 'admin-login') && (
              <button onClick={() => {setAuthView('login'); setAuthError('')}} className="w-full text-sm font-bold text-blue-600 hover:bg-blue-50 py-3 rounded-xl transition-colors border border-transparent">Back to Sign In</button>
            )}
            <p className="text-xs text-center text-slate-400 mt-2 px-4">
              Note: The backend authentication API is not currently implemented. This is a frontend mock simulating standard access.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // --- Admin Dashboard View ---
  if (isLoggedIn && isAdmin) {
    return (
      <div className="min-h-screen bg-[#F4F7FC] flex font-sans">
        <aside className="w-64 bg-slate-900 text-white flex flex-col shrink-0">
          <div className="p-6 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <Shield size={20} className="text-red-500" />
              <h1 className="text-xl font-bold">Admin Portal</h1>
            </div>
          </div>
          <nav className="flex-1 p-4 space-y-2">
            <div className="bg-slate-800 text-slate-200 px-4 py-3 rounded-lg flex items-center gap-3 font-semibold"><LayoutDashboard size={18}/> Overview</div>
            <div className="text-slate-400 px-4 py-3 rounded-lg flex items-center gap-3 font-semibold hover:text-white cursor-pointer"><Users size={18}/> User Management</div>
            <div className="text-slate-400 px-4 py-3 rounded-lg flex items-center gap-3 font-semibold hover:text-white cursor-pointer"><FileText size={18}/> Global Contracts</div>
            <div className="text-slate-400 px-4 py-3 rounded-lg flex items-center gap-3 font-semibold hover:text-white cursor-pointer"><Server size={18}/> System Status</div>
          </nav>
          <div className="p-4 border-t border-slate-800">
            <button onClick={handleLogout} className="flex items-center gap-3 text-red-400 hover:text-red-300 px-4 py-2 font-bold w-full"><LogOut size={18}/> Sign Out</button>
          </div>
        </aside>
        <main className="flex-1 p-10 overflow-auto">
          <h2 className="text-3xl font-extrabold text-slate-900 mb-8">System Dashboard</h2>
          <div className="grid grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm border-t-4 border-t-blue-500">
              <div className="text-slate-500 font-semibold mb-2">Total Users</div>
              <div className="text-4xl font-extrabold text-slate-800">1,248</div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm border-t-4 border-t-emerald-500">
              <div className="text-slate-500 font-semibold mb-2">Total Contracts Processed</div>
              <div className="text-4xl font-extrabold text-slate-800">45,920</div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm border-t-4 border-t-red-500">
              <div className="text-slate-500 font-semibold mb-2">System Status</div>
              <div className="text-2xl font-bold text-emerald-600 mt-2 flex items-center gap-2"><CheckCircle size={20}/> All Systems Operational</div>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100"><h3 className="font-bold text-slate-800 text-lg">Recent Activity Logs</h3></div>
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                <tr><th className="px-6 py-4">Timestamp</th><th className="px-6 py-4">User</th><th className="px-6 py-4">Action</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr><td className="px-6 py-4">Just now</td><td className="px-6 py-4 font-medium text-slate-800">admin@contractlens.io</td><td className="px-6 py-4">Logged into admin portal</td></tr>
                <tr><td className="px-6 py-4">2 mins ago</td><td className="px-6 py-4 font-medium text-slate-800">jdoe@example.com</td><td className="px-6 py-4">Uploaded 'Vendor_Agreement.pdf'</td></tr>
                <tr><td className="px-6 py-4">15 mins ago</td><td className="px-6 py-4 font-medium text-slate-800">system</td><td className="px-6 py-4">Automated backup completed</td></tr>
              </tbody>
            </table>
          </div>
        </main>
      </div>
    )
  }

  // --- User Dashboard View ---
  return (
    <div className="min-h-screen bg-[#F4F7FC] text-slate-800 flex font-sans selection:bg-blue-100 selection:text-blue-900">
      
      {/* SIDEBAR */}
      <aside className="w-72 bg-white border-r border-slate-200 flex flex-col relative shrink-0 shadow-sm z-30">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20">
              <FileText size={18} className="text-white" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">ContractLens</h1>
          </div>
          <p className="text-xs text-blue-600 font-semibold tracking-wide uppercase ml-11">AI Contract Intelligence</p>
        </div>

        <nav className="flex-1 px-4 py-2 flex flex-col gap-1 overflow-y-auto">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-4 mt-2">Core</div>
          <SidebarItem icon={LayoutDashboard} label="Dashboard" id="dashboard" />
          <SidebarItem icon={FileText} label="Contracts" id="contracts" />
          <SidebarItem icon={Activity} label="Obligations" id="obligations" />
          
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-4 mt-6">Intelligence</div>
          <SidebarItem icon={ShieldAlert} label="Review Center" id="review" />
          <SidebarItem icon={GitCompare} label="Compare" id="compare" />
          <SidebarItem icon={Bot} label="AI Assistant" id="assistant" isBeta={true} />
        </nav>

        <div className="p-4 border-t border-slate-100 mt-auto bg-slate-50/50">
          <nav className="flex flex-col gap-1">
            <SidebarItem icon={Settings} label="Settings" id="settings" />
            <SidebarItem icon={HelpCircle} label="Help & Support" id="help" />
          </nav>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col relative h-screen overflow-hidden">
        {/* Header */}
        <header className="h-20 border-b border-slate-200 flex items-center justify-between px-8 bg-white sticky top-0 z-20 shadow-sm">
          <div className="flex items-center gap-4 bg-slate-100 border border-transparent focus-within:border-blue-300 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-50 rounded-full px-4 py-2.5 w-[400px] transition-all">
            <Search size={16} className="text-slate-400" />
            <input type="text" placeholder="Search contracts, clauses, or parties..." className="bg-transparent border-none outline-none text-sm w-full text-slate-700 placeholder-slate-400" />
          </div>
          <div className="flex items-center gap-6">
            <button className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
            </button>
            <div onClick={() => setView('settings')} className="flex items-center gap-3 cursor-pointer group">
              <div className="w-10 h-10 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center font-bold text-blue-700 text-sm shadow-sm">
                {name ? name.substring(0,2).toUpperCase() : 'JD'}
              </div>
              <div className="hidden md:block">
                <div className="text-sm font-bold text-slate-700 group-hover:text-blue-600 transition-colors">{name || 'John Doe'}</div>
                <div className="text-xs text-slate-500">{email || 'Legal Team'}</div>
              </div>
              <ChevronDown size={14} className="text-slate-400"/>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8 relative">
          <div className="max-w-[1400px] mx-auto space-y-8 relative z-10">
            
            {/* DASHBOARD VIEW */}
            {view === 'dashboard' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                
                {/* Hero Section */}
                <div className="relative rounded-3xl overflow-hidden bg-white border border-slate-200 p-10 shadow-sm">
                  <div className="absolute top-0 right-0 w-96 h-96 bg-blue-50 blur-[100px] rounded-full pointer-events-none"></div>
                  <div className="relative z-10 max-w-2xl space-y-4">
                    <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight">
                      Contract Intelligence, <span className="text-blue-600">Simplified</span>
                    </h2>
                    <p className="text-slate-600 text-lg leading-relaxed">
                      Analyze agreements, track obligations, and never miss an important deadline. Let AI do the heavy lifting for your legal operations.
                    </p>
                  </div>
                </div>
                
                {/* Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {[
                    { label: 'Total Contracts', value: stats?.total_contracts || 0, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-100', border: 'hover:border-blue-300' },
                    { label: 'Pending Obligations', value: stats?.pending_obligations || 0, icon: Activity, color: 'text-amber-600', bg: 'bg-amber-100', border: 'hover:border-amber-300' },
                    { label: 'Upcoming Renewals', value: stats?.upcoming_renewals || 0, icon: Calendar, color: 'text-emerald-600', bg: 'bg-emerald-100', border: 'hover:border-emerald-300' },
                    { label: 'Review Required', value: stats?.review_flags || 0, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-100', border: 'hover:border-red-300' }
                  ].map((stat, i) => (
                    <div key={i} className={`bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group transition-all duration-300 ${stat.border}`}>
                      <div className="flex items-center justify-between mb-4">
                        <div className="text-slate-500 font-semibold text-sm">{stat.label}</div>
                        <div className={`p-2 rounded-xl ${stat.bg} ${stat.color}`}><stat.icon size={20}/></div>
                      </div>
                      <div className="text-4xl font-extrabold text-slate-800">{stat.value}</div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Upload Section */}
                  <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm text-center flex flex-col items-center col-span-1">
                    <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-blue-100">
                      <UploadCloud size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Analyze Contract</h2>
                    <p className="text-slate-500 text-sm mb-8 px-4">Upload PDF, DOCX or TXT and let ContractLens automatically extract key terms and deadlines.</p>
                    
                    <div className="w-full border-2 border-dashed border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 rounded-2xl p-6 transition-all">
                      <form onSubmit={handleUpload} className="flex flex-col items-center gap-4">
                        <div className="flex flex-col items-center gap-2">
                          <label className="cursor-pointer bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-6 py-2.5 rounded-xl font-semibold shadow-sm transition-colors text-sm">
                            Choose File
                            <input type="file" accept=".pdf,.docx,.txt" className="hidden" onChange={e => setFile(e.target.files ? e.target.files[0] : null)} />
                          </label>
                          {file && <span className="text-blue-600 font-medium text-xs mt-1 truncate max-w-[200px]">{file.name}</span>}
                        </div>
                        
                        <button 
                          type="submit" 
                          disabled={uploading || !file}
                          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:bg-slate-400 text-white px-6 py-3 rounded-xl font-bold shadow-md shadow-blue-600/20 transition-all flex justify-center items-center gap-2 text-sm"
                        >
                          {uploading ? (
                            <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Processing...</>
                          ) : (
                            <><FileUp size={18}/> Upload & Analyze</>
                          )}
                        </button>
                      </form>
                    </div>
                  </section>
                  
                  {/* Recent Contracts */}
                  <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden col-span-2 flex flex-col">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
                      <h3 className="text-xl font-bold text-slate-800">Recent Contracts</h3>
                      <button onClick={() => setView('contracts')} className="text-blue-600 text-sm font-bold hover:text-blue-800 flex items-center gap-1 transition-colors">View All <ChevronRight size={16}/></button>
                    </div>
                    <div className="overflow-x-auto flex-1">
                      <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                          <tr>
                            <th className="px-6 py-4">Contract Name</th>
                            <th className="px-6 py-4">Parties</th>
                            <th className="px-6 py-4">Date Uploaded</th>
                            <th className="px-6 py-4 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {contracts.slice(0, 5).map(c => (
                            <tr key={c.id} className="hover:bg-slate-50 transition-colors group">
                              <td className="px-6 py-4 font-bold text-slate-800 flex items-center gap-3">
                                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><FileText size={16}/></div>
                                {c.name}
                              </td>
                              <td className="px-6 py-4 font-medium truncate max-w-[200px]">{c.parties || 'N/A'}</td>
                              <td className="px-6 py-4">{new Date(c.created_at).toLocaleDateString()}</td>
                              <td className="px-6 py-4 text-right">
                                <button onClick={() => { setSelectedContract(c); setView('contracts'); setActiveTab('overview'); }} className="text-blue-600 hover:text-blue-800 font-bold px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors">Review</button>
                              </td>
                            </tr>
                          ))}
                          {contracts.length === 0 && (
                            <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-400 font-medium">No contracts uploaded yet. Upload a contract to begin.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </section>
                </div>
              </div>
            )}

            {/* SHARED LAYOUT: CONTRACTS / TIMELINE / ASSISTANT */}
            {(view === 'contracts' || view === 'assistant' || view === 'timeline') && (
              <div className="flex gap-8 h-[calc(100vh-140px)] animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Document Library List */}
                <div className="w-80 bg-white p-5 rounded-3xl border border-slate-200 overflow-auto shadow-sm flex flex-col shrink-0">
                  <h2 className="text-xs font-bold mb-4 text-slate-500 uppercase tracking-widest ml-1">Document Library</h2>
                  <div className="relative mb-4">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="text" placeholder="Filter contracts..." className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:border-blue-400 outline-none transition-colors" />
                  </div>
                  <ul className="space-y-2 flex-1 overflow-y-auto pr-1">
                    {contracts.length === 0 && <p className="text-slate-400 text-sm text-center mt-10">No contracts found.</p>}
                    {contracts.map(c => (
                      <li 
                        key={c.id} 
                        onClick={() => { setSelectedContract(c); setQaAnswer(null); setQaQuestion(''); if(view !== 'contracts') setView('contracts'); }}
                        className={`cursor-pointer p-4 rounded-xl border transition-all duration-200 group ${selectedContract?.id === c.id ? 'bg-blue-50 border-blue-200 shadow-sm' : 'bg-white border-slate-100 hover:border-slate-300 hover:bg-slate-50'}`}
                      >
                        <div className={`font-bold truncate text-sm mb-1 ${selectedContract?.id === c.id ? 'text-blue-800' : 'text-slate-700'}`}>{c.name}</div>
                        <div className="flex justify-between items-center mt-2">
                          <div className="text-[11px] font-medium text-slate-400">{new Date(c.created_at).toLocaleDateString()}</div>
                          {c.review_flags?.length > 0 && <div className="flex items-center gap-1 text-[10px] text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-100 font-bold"><AlertTriangle size={10}/> {c.review_flags.length} Flags</div>}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Contract Details Panel */}
                <div className="flex-1 bg-white rounded-3xl border border-slate-200 flex flex-col overflow-hidden shadow-sm relative">
                  {selectedContract ? (
                    <>
                      {/* Panel Header */}
                      <div className="p-8 border-b border-slate-100 bg-white">
                        <div className="flex justify-between items-start mb-6">
                          <div>
                            <div className="flex items-center gap-3 mb-2">
                              <span className="bg-emerald-50 text-emerald-600 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider border border-emerald-200">Analyzed by AI</span>
                              <span className="text-slate-400 text-xs font-medium">{new Date(selectedContract.created_at).toLocaleString()}</span>
                            </div>
                            <h2 className="text-3xl font-extrabold text-slate-900">{selectedContract.name}</h2>
                          </div>
                          <button className="bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xl text-sm font-bold transition-colors shadow-sm">
                            Download PDF
                          </button>
                        </div>
                        
                        {/* Tabs */}
                        <div className="flex gap-2 border-b border-slate-200 pb-px">
                          {['overview', 'obligations', 'timeline', 'qa'].map(tab => (
                            <button 
                              key={tab}
                              onClick={() => setActiveTab(tab as any)} 
                              className={`px-6 py-3 text-sm font-bold capitalize transition-all border-b-2 -mb-px ${activeTab === tab ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
                            >
                              {tab === 'qa' ? 'AI Assistant' : tab}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Tab Content */}
                      <div className="p-8 overflow-auto flex-1 bg-slate-50/50">
                        {activeTab === 'overview' && (
                          <div className="space-y-8 animate-in fade-in duration-300 max-w-4xl">
                            <div className="grid grid-cols-2 gap-6">
                              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                <span className="text-slate-400 text-[10px] uppercase font-extrabold tracking-widest block mb-2">Parties Involved</span>
                                <div className="text-slate-800 font-medium leading-relaxed">{selectedContract.parties || 'N/A'}</div>
                              </div>
                              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                <span className="text-slate-400 text-[10px] uppercase font-extrabold tracking-widest block mb-2">Payment Terms</span>
                                <div className="text-slate-800 font-medium leading-relaxed">{selectedContract.payment_terms || 'N/A'}</div>
                              </div>
                              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                <span className="text-slate-400 text-[10px] uppercase font-extrabold tracking-widest block mb-2">Renewal Terms</span>
                                <div className="text-slate-800 font-medium leading-relaxed">{selectedContract.renewal_terms || 'N/A'}</div>
                              </div>
                              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                <span className="text-slate-400 text-[10px] uppercase font-extrabold tracking-widest block mb-2">Termination</span>
                                <div className="text-slate-800 font-medium leading-relaxed">{selectedContract.termination_conditions || 'N/A'}</div>
                              </div>
                            </div>
                            
                            {selectedContract.review_flags?.length > 0 && (
                              <div className="mt-10">
                                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2"><ShieldAlert className="text-red-500"/> Critical Review Flags</h3>
                                <div className="grid gap-4">
                                  {selectedContract.review_flags.map((f: any) => (
                                    <div key={f.id} className="bg-white border border-red-200 p-6 rounded-2xl flex gap-4 items-start shadow-sm hover:shadow-md transition-shadow">
                                      <div className="mt-1 p-2 bg-red-50 rounded-xl border border-red-100"><AlertTriangle size={20} className="text-red-500"/></div>
                                      <div className="flex-1">
                                        <div className="flex justify-between items-start mb-2">
                                          <div className="font-extrabold text-slate-800 text-lg">{f.clause}</div>
                                          <span className="text-[10px] bg-red-50 text-red-600 px-3 py-1 rounded-full uppercase tracking-widest font-bold border border-red-200">{f.severity}</span>
                                        </div>
                                        <div className="text-slate-600 text-sm mb-4 leading-relaxed font-medium">{f.reason}</div>
                                        {f.source_reference && (
                                          <div className="inline-block text-xs font-bold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                                            Source: <span className="text-slate-700">{f.source_reference}</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {activeTab === 'obligations' && (
                          <div className="animate-in fade-in duration-300 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                            <table className="w-full text-left text-sm text-slate-700">
                              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200 font-extrabold">
                                <tr>
                                  <th className="px-6 py-4">Party</th>
                                  <th className="px-6 py-4">Obligation</th>
                                  <th className="px-6 py-4">Due Date</th>
                                  <th className="px-6 py-4">Status</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {selectedContract.obligations?.map((o: any) => (
                                  <tr key={o.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 font-bold text-slate-800">{o.party}</td>
                                    <td className="px-6 py-4 text-slate-600 leading-relaxed font-medium">{o.obligation}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      {o.due_date ? <div className="flex items-center gap-2 text-slate-500 font-medium"><Calendar size={14}/> {o.due_date}</div> : <span className="text-slate-400 italic">N/A</span>}
                                    </td>
                                    <td className="px-6 py-4">
                                      <span className="bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg text-xs font-bold text-amber-700 flex w-max items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-amber-500"></div> {o.status}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                                {(!selectedContract.obligations || selectedContract.obligations.length === 0) && (
                                  <tr><td colSpan={4} className="text-center py-12 text-slate-400 font-medium">No obligations extracted.</td></tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        )}

                        {activeTab === 'timeline' && (
                          <div className="max-w-2xl mx-auto py-8 animate-in fade-in duration-300">
                            <div className="relative border-l-2 border-slate-200 ml-4 space-y-12 pb-8">
                              <div className="relative ml-8 group">
                                <span className="absolute -left-[42px] flex h-9 w-9 items-center justify-center rounded-full bg-white border-2 border-blue-200 shadow-sm group-hover:scale-110 transition-transform"><Calendar size={16} className="text-blue-600"/></span>
                                <h3 className="text-lg font-extrabold text-slate-800 mb-1">Effective Date</h3>
                                <time className="inline-block text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-full mb-2 border border-blue-100">{selectedContract.effective_date || 'Not specified'}</time>
                                <p className="text-slate-500 text-sm font-medium">Contract comes into force.</p>
                              </div>
                              
                              {selectedContract.obligations?.filter((o:any)=>o.due_date).map((o:any) => (
                                <div key={o.id} className="relative ml-8 group">
                                  <span className="absolute -left-[42px] flex h-9 w-9 items-center justify-center rounded-full bg-white border-2 border-amber-200 shadow-sm group-hover:scale-110 transition-transform"><Activity size={16} className="text-amber-500"/></span>
                                  <h3 className="text-lg font-extrabold text-slate-800 mb-1">{o.party} Obligation</h3>
                                  <time className="inline-block text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-full mb-3 border border-amber-100">Due: {o.due_date}</time>
                                  <div className="bg-white border border-slate-200 p-4 rounded-xl text-slate-600 text-sm mt-1 shadow-sm font-medium">{o.obligation}</div>
                                </div>
                              ))}
                              
                              <div className="relative ml-8 group">
                                <span className="absolute -left-[42px] flex h-9 w-9 items-center justify-center rounded-full bg-white border-2 border-red-200 shadow-sm group-hover:scale-110 transition-transform"><Calendar size={16} className="text-red-500"/></span>
                                <h3 className="text-lg font-extrabold text-slate-800 mb-1">Expiration Date</h3>
                                <time className="inline-block text-xs font-bold text-red-700 bg-red-50 px-3 py-1 rounded-full mb-2 border border-red-100">{selectedContract.expiration_date || 'Not specified'}</time>
                                <p className="text-slate-500 text-sm font-medium">Contract expires naturally if not renewed.</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {activeTab === 'qa' && (
                          <div className="flex flex-col h-full animate-in fade-in duration-300 max-w-3xl mx-auto">
                            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 mb-6">
                              <h3 className="text-blue-800 font-extrabold mb-3 flex items-center gap-2"><Bot size={20}/> Suggested Questions</h3>
                              <div className="flex flex-wrap gap-2">
                                {['What are the payment terms?', 'When does the contract expire?', 'What obligations does each party have?', 'What are the termination conditions?'].map(q => (
                                  <button onClick={(e) => handleAskQuestion(e, q)} key={q} className="bg-white border border-blue-200 hover:border-blue-400 text-blue-700 font-semibold px-4 py-2 rounded-xl text-sm transition-colors text-left shadow-sm">
                                    {q}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div className="flex-1 overflow-auto bg-white rounded-2xl p-6 mb-4 border border-slate-200 shadow-sm flex flex-col gap-6">
                              {qaAnswer ? (
                                <>
                                  <div className="flex justify-end">
                                    <div className="bg-blue-600 text-white p-4 rounded-2xl rounded-tr-sm max-w-[80%] shadow-sm font-medium">
                                      {qaQuestion}
                                    </div>
                                  </div>
                                  <div className="flex justify-start">
                                    <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl rounded-tl-sm max-w-[90%] shadow-sm">
                                      <div className="text-slate-700 leading-relaxed text-sm whitespace-pre-wrap font-medium">{qaAnswer.answer}</div>
                                      {qaAnswer.source_reference && (
                                        <div className="mt-4 text-[11px] font-bold tracking-wider uppercase text-slate-500 bg-white px-3 py-2 rounded-lg border border-slate-200 inline-block">
                                          Source: <span className="text-slate-800 normal-case">{qaAnswer.source_reference}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </>
                              ) : (
                                <div className="h-full flex items-center justify-center text-slate-400 flex-col gap-4">
                                  <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center border border-slate-200 shadow-sm">
                                    <MessageSquare size={24} className="text-blue-500"/>
                                  </div>
                                  <p className="text-lg font-medium text-slate-500">Ask any question about this contract.</p>
                                </div>
                              )}
                            </div>
                            
                            <form onSubmit={(e) => handleAskQuestion(e)} className="relative">
                              <input 
                                type="text" 
                                value={qaQuestion}
                                onChange={e => setQaQuestion(e.target.value)}
                                placeholder="Type your question..." 
                                className="w-full bg-white border border-slate-300 rounded-2xl pl-6 pr-32 py-4 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all text-slate-800 shadow-sm font-medium"
                              />
                              <button type="submit" disabled={qaLoading || !qaQuestion} className="absolute right-2 top-2 bottom-2 bg-blue-600 hover:bg-blue-700 px-6 rounded-xl font-bold text-white disabled:bg-slate-300 disabled:text-slate-500 transition-colors flex items-center gap-2 shadow-sm">
                                {qaLoading ? <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin"></div> : 'Ask AI'}
                              </button>
                            </form>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 flex-col gap-4 bg-slate-50/50">
                      <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center border border-slate-200 shadow-sm"><FileText size={32} className="text-blue-300"/></div>
                      <p className="text-lg font-bold text-slate-400">Select a contract from the library to view details.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* GLOBAL OBLIGATIONS VIEW */}
            {view === 'obligations' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-between items-end">
                  <div>
                    <h2 className="text-3xl font-extrabold text-slate-900 mb-2">Global Obligations Tracker</h2>
                    <p className="text-slate-600">Track and manage all extracted commitments across your entire contract portfolio.</p>
                  </div>
                </div>

                <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                  <table className="w-full text-left text-sm text-slate-700">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200 font-extrabold">
                      <tr>
                        <th className="px-6 py-4">Contract ID</th>
                        <th className="px-6 py-4">Party</th>
                        <th className="px-6 py-4">Obligation</th>
                        <th className="px-6 py-4">Due Date</th>
                        <th className="px-6 py-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {globalObligations?.map((o: any) => (
                        <tr key={o.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 font-bold text-blue-600">#{o.contract_id}</td>
                          <td className="px-6 py-4 font-bold text-slate-800">{o.party}</td>
                          <td className="px-6 py-4 text-slate-600 leading-relaxed font-medium max-w-md truncate">{o.obligation}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {o.due_date ? <div className="flex items-center gap-2 text-slate-500 font-medium"><Calendar size={14}/> {o.due_date}</div> : <span className="text-slate-400 italic">N/A</span>}
                          </td>
                          <td className="px-6 py-4">
                            <span className="bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg text-xs font-bold text-amber-700 flex w-max items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-amber-500"></div> {o.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {(!globalObligations || globalObligations.length === 0) && (
                        <tr><td colSpan={5} className="text-center py-16 text-slate-500 font-medium">No obligations found across all contracts.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* GLOBAL REVIEW CENTER */}
            {view === 'review' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-between items-end">
                  <div>
                    <h2 className="text-3xl font-extrabold text-slate-900 mb-2">Review Center</h2>
                    <p className="text-slate-600">Centralized hub for addressing critical clauses and human review flags.</p>
                  </div>
                </div>

                <div className="grid gap-6">
                  {globalReviewFlags?.map((f: any) => (
                    <div key={f.id} className="bg-white border border-red-200 p-6 rounded-2xl flex gap-6 items-start shadow-sm hover:shadow-md transition-shadow">
                      <div className="mt-1 p-3 bg-red-50 rounded-xl border border-red-100"><AlertTriangle size={24} className="text-red-500"/></div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-3">
                            <div className="font-extrabold text-slate-800 text-xl">{f.clause}</div>
                            <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md font-bold border border-slate-200">Contract #{f.contract_id}</span>
                          </div>
                          <span className="text-[10px] bg-red-50 text-red-600 px-3 py-1 rounded-full uppercase tracking-widest font-bold border border-red-200">{f.severity}</span>
                        </div>
                        <div className="text-slate-600 mb-4 leading-relaxed font-medium max-w-4xl">{f.reason}</div>
                        <div className="flex gap-4">
                          <button className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-colors">Mark Resolved</button>
                          {f.source_reference && (
                            <div className="inline-block text-xs font-bold text-slate-500 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
                              Source: <span className="text-slate-700">{f.source_reference}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {(!globalReviewFlags || globalReviewFlags.length === 0) && (
                    <div className="bg-white rounded-3xl border border-slate-200 p-16 text-center shadow-sm">
                      <div className="w-20 h-20 mx-auto bg-emerald-50 rounded-full flex items-center justify-center border border-emerald-100 mb-4"><CheckCircle size={32} className="text-emerald-500"/></div>
                      <h3 className="text-xl font-bold text-slate-800 mb-2">All clear!</h3>
                      <p className="text-slate-500 font-medium">There are no pending review flags in your contracts.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* COMPARE VIEW */}
            {view === 'compare' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-[1200px] mx-auto">
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                  <h2 className="text-3xl font-extrabold mb-3 text-slate-900">Compare Versions</h2>
                  <p className="text-slate-600 mb-8 font-medium">Select two contract versions to instantly highlight additions, removals, and critical modifications using AI.</p>
                  
                  <div className="flex gap-6 items-center bg-slate-50 p-6 rounded-2xl border border-slate-200">
                    <div className="flex-1">
                      <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-2 ml-1">Base Version</label>
                      <select value={c1} onChange={e => setC1(e.target.value ? Number(e.target.value) : '')} className="w-full bg-white border border-slate-300 rounded-xl p-3.5 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 text-slate-800 font-bold shadow-sm transition-all">
                        <option value="">Select Base Contract...</option>
                        {contracts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shrink-0 mt-6 border border-slate-200 shadow-sm"><GitCompare size={20} className="text-blue-500"/></div>
                    <div className="flex-1">
                      <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-2 ml-1">Modified Version</label>
                      <select value={c2} onChange={e => setC2(e.target.value ? Number(e.target.value) : '')} className="w-full bg-white border border-slate-300 rounded-xl p-3.5 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 text-slate-800 font-bold shadow-sm transition-all">
                        <option value="">Select Modified Contract...</option>
                        {contracts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div className="mt-6">
                      <button onClick={handleCompare} disabled={compareLoading || !c1 || !c2} className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:text-slate-500 px-8 py-3.5 rounded-xl font-bold text-white shadow-md shadow-blue-600/20 disabled:shadow-none transition-all h-full">
                        {compareLoading ? 'Comparing...' : 'Run Comparison'}
                      </button>
                    </div>
                  </div>
                </div>

                {compareResult && (
                  <div className="grid grid-cols-2 gap-8 animate-in fade-in duration-500">
                    <div className="bg-white p-8 rounded-3xl border border-red-200 shadow-sm relative overflow-hidden">
                      <h3 className="font-extrabold text-red-600 border-b border-red-100 pb-4 mb-6 flex items-center gap-3 text-lg"><div className="w-3 h-3 rounded-full bg-red-500"></div> Removed Clauses</h3>
                      <ul className="space-y-4">
                        {compareResult.removed?.map((x:string, i:number) => (
                          <li key={i} className="text-sm text-slate-700 font-medium bg-red-50 border border-red-100 p-5 rounded-xl leading-relaxed shadow-sm">{x}</li>
                        ))}
                        {compareResult.removed?.length === 0 && <span className="text-slate-400 italic font-medium">No clauses were removed.</span>}
                      </ul>
                    </div>
                    
                    <div className="bg-white p-8 rounded-3xl border border-emerald-200 shadow-sm relative overflow-hidden">
                      <h3 className="font-extrabold text-emerald-600 border-b border-emerald-100 pb-4 mb-6 flex items-center gap-3 text-lg"><div className="w-3 h-3 rounded-full bg-emerald-500"></div> Added Clauses</h3>
                      <ul className="space-y-4">
                        {compareResult.added?.map((x:string, i:number) => (
                          <li key={i} className="text-sm text-slate-700 font-medium bg-emerald-50 border border-emerald-100 p-5 rounded-xl leading-relaxed shadow-sm">{x}</li>
                        ))}
                        {compareResult.added?.length === 0 && <span className="text-slate-400 italic font-medium">No new clauses were added.</span>}
                      </ul>
                    </div>
                    
                    <div className="bg-white p-8 rounded-3xl border border-amber-200 shadow-sm col-span-2 relative overflow-hidden">
                      <h3 className="font-extrabold text-amber-600 border-b border-amber-100 pb-4 mb-8 flex items-center gap-3 text-lg"><div className="w-3 h-3 rounded-full bg-amber-500"></div> Modified & Important Changes</h3>
                      
                      <div className="grid grid-cols-2 gap-10">
                        <div>
                          <h4 className="text-[10px] uppercase text-slate-400 mb-4 font-extrabold tracking-widest bg-slate-50 inline-block px-3 py-1 rounded-md border border-slate-100">Modified Clauses</h4>
                          <ul className="space-y-4">
                            {compareResult.modified?.map((x:string, i:number) => (
                              <li key={i} className="text-sm text-slate-700 font-medium bg-white border border-amber-100 shadow-sm p-5 rounded-xl leading-relaxed">{x}</li>
                            ))}
                            {compareResult.modified?.length === 0 && <span className="text-slate-400 italic font-medium">No modified clauses.</span>}
                          </ul>
                        </div>
                        <div>
                          <h4 className="text-[10px] uppercase text-slate-400 mb-4 font-extrabold tracking-widest bg-slate-50 inline-block px-3 py-1 rounded-md border border-slate-100">Critical Impacts</h4>
                          <ul className="space-y-4">
                            {compareResult.important_changes?.map((x:string, i:number) => (
                              <li key={i} className="text-sm text-slate-700 font-bold bg-blue-50 border border-blue-200 shadow-sm p-5 rounded-xl leading-relaxed">{x}</li>
                            ))}
                            {compareResult.important_changes?.length === 0 && <span className="text-slate-400 italic font-medium">No critical impacts noted.</span>}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* SETTINGS VIEW */}
            {view === 'settings' && (
              <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
                <h2 className="text-3xl font-extrabold text-slate-900 mb-2">Settings</h2>
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex min-h-[600px]">
                  <div className="w-64 bg-slate-50 border-r border-slate-200 p-6 flex flex-col gap-2">
                    <button onClick={()=>setSettingsTab('profile')} className={`w-full text-left px-4 py-3 rounded-xl font-bold transition-all ${settingsTab === 'profile' ? 'bg-blue-100 text-blue-700' : 'text-slate-600 hover:bg-slate-200'}`}>Profile</button>
                    <button onClick={()=>setSettingsTab('preferences')} className={`w-full text-left px-4 py-3 rounded-xl font-bold transition-all ${settingsTab === 'preferences' ? 'bg-blue-100 text-blue-700' : 'text-slate-600 hover:bg-slate-200'}`}>Preferences</button>
                    <button onClick={()=>setSettingsTab('account')} className={`w-full text-left px-4 py-3 rounded-xl font-bold transition-all ${settingsTab === 'account' ? 'bg-blue-100 text-blue-700' : 'text-slate-600 hover:bg-slate-200'}`}>Account</button>
                  </div>
                  <div className="flex-1 p-10">
                    {settingsTab === 'profile' && (
                      <div className="space-y-8">
                        <h3 className="text-xl font-extrabold text-slate-800 border-b border-slate-100 pb-4">Public Profile</h3>
                        <div className="flex items-center gap-6">
                          <div className="w-24 h-24 rounded-full bg-blue-100 border-4 border-white shadow-md flex items-center justify-center font-bold text-blue-700 text-3xl">
                            {name ? name.substring(0,2).toUpperCase() : 'JD'}
                          </div>
                          <button className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xl text-sm font-bold shadow-sm transition-colors">Change Avatar</button>
                        </div>
                        <div className="grid gap-6 max-w-md">
                          <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Display Name</label>
                            <input type="text" value={name} onChange={e=>setName(e.target.value)} placeholder="Full Name" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-400 font-medium text-slate-800" />
                          </div>
                          <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Email Address</label>
                            <input type="email" value={email} disabled className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-slate-500 font-medium cursor-not-allowed" />
                            <p className="text-xs text-slate-400 mt-2">Email changing requires authentication API integration.</p>
                          </div>
                        </div>
                        <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold shadow-md shadow-blue-600/20 transition-all">Save Changes</button>
                      </div>
                    )}
                    {settingsTab === 'preferences' && (
                      <div className="space-y-8">
                        <h3 className="text-xl font-extrabold text-slate-800 border-b border-slate-100 pb-4">Preferences</h3>
                        <div className="space-y-6 max-w-md">
                          <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Theme</label>
                            <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium text-slate-800 outline-none">
                              <option>Light Blue (Default)</option>
                              <option>Dark Navy (Legacy)</option>
                              <option>System Default</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Language</label>
                            <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium text-slate-800 outline-none">
                              <option>English (US)</option>
                              <option>Spanish</option>
                              <option>French</option>
                            </select>
                          </div>
                          <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-200">
                            <div>
                              <div className="font-bold text-slate-800">Email Notifications</div>
                              <div className="text-xs text-slate-500 mt-1">Receive alerts for upcoming deadlines.</div>
                            </div>
                            <div className="w-12 h-6 bg-blue-600 rounded-full relative cursor-pointer shadow-inner">
                              <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    {settingsTab === 'account' && (
                      <div className="space-y-8">
                        <h3 className="text-xl font-extrabold text-slate-800 border-b border-slate-100 pb-4">Account Security</h3>
                        <div className="grid gap-6 max-w-md">
                          <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Current Password</label>
                            <input type="password" placeholder="••••••••" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-400 font-medium" />
                          </div>
                          <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">New Password</label>
                            <input type="password" placeholder="New Password" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-400 font-medium" />
                          </div>
                          <button className="bg-slate-800 hover:bg-slate-900 text-white px-8 py-3 rounded-xl font-bold shadow-md transition-all w-max">Update Password</button>
                        </div>
                        <div className="pt-8 mt-8 border-t border-slate-100">
                          <button onClick={handleLogout} className="flex items-center gap-2 text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 px-6 py-3 rounded-xl font-bold transition-colors">
                            <LogOut size={18}/> Sign Out of ContractLens
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* HELP VIEW */}
            {view === 'help' && (
              <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-16">
                <div className="text-center py-10 bg-white rounded-3xl border border-slate-200 shadow-sm">
                  <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm"><HelpCircle size={40}/></div>
                  <h2 className="text-4xl font-extrabold text-slate-900 mb-4">How can we help?</h2>
                  <p className="text-slate-500 text-lg">Search our knowledge base or browse FAQs below.</p>
                </div>

                <h3 className="text-2xl font-extrabold text-slate-900 mt-12 mb-6">Frequently Asked Questions</h3>
                <div className="space-y-4">
                  {faqs.map((faq, i) => (
                    <div key={i} className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden transition-all">
                      <button 
                        onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                        className="w-full px-6 py-5 text-left flex justify-between items-center font-bold text-slate-800 hover:bg-slate-50"
                      >
                        {faq.q}
                        <ChevronDown size={20} className={`text-slate-400 transition-transform ${faqOpen === i ? 'rotate-180' : ''}`}/>
                      </button>
                      {faqOpen === i && (
                        <div className="px-6 pb-5 pt-2 text-slate-600 font-medium leading-relaxed bg-slate-50 border-t border-slate-100">
                          {faq.a}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="bg-blue-600 rounded-3xl p-10 text-center text-white shadow-xl mt-12 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-tr from-blue-700 to-indigo-600 opacity-50"></div>
                  <div className="relative z-10">
                    <h3 className="text-2xl font-bold mb-4">Still need help?</h3>
                    <p className="text-blue-100 mb-8 font-medium">Our support team is available 24/7 to assist with your contract intelligence needs.</p>
                    <button className="bg-white text-blue-700 font-bold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all">Contact Support</button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </main>
    </div>
  )
}

export default App
