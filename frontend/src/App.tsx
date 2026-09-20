import { useState, useEffect } from 'react'
import axios from 'axios'
import { FileUp, ShieldAlert, Clock, LayoutDashboard, FileText, GitCompare, MessageSquare, Calendar } from 'lucide-react'

const API_BASE = 'http://127.0.0.1:8000/api'

function App() {
  const [view, setView] = useState<'dashboard' | 'contracts' | 'compare'>('dashboard')
  const [stats, setStats] = useState<any>(null)
  const [contracts, setContracts] = useState<any[]>([])
  
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [selectedContract, setSelectedContract] = useState<any | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'obligations' | 'timeline' | 'qa'>('overview')

  // QA state
  const [qaQuestion, setQaQuestion] = useState('')
  const [qaAnswer, setQaAnswer] = useState<{answer: string, source_reference: string} | null>(null)
  const [qaLoading, setQaLoading] = useState(false)

  // Compare state
  const [c1, setC1] = useState<number | ''>('')
  const [c2, setC2] = useState<number | ''>('')
  const [compareResult, setCompareResult] = useState<any>(null)
  const [compareLoading, setCompareLoading] = useState(false)

  useEffect(() => {
    fetchStats()
    fetchContracts()
  }, [])

  const fetchStats = async () => {
    try {
      const res = await axios.get(`${API_BASE}/stats`)
      setStats(res.data)
    } catch (e) {
      console.error(e)
    }
  }

  const fetchContracts = async () => {
    try {
      const res = await axios.get(`${API_BASE}/contracts`)
      setContracts(res.data)
    } catch (e) {
      console.error(e)
    }
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
      fetchStats()
    } catch (e) {
      console.error(e)
    }
    setUploading(false)
  }

  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!qaQuestion || !selectedContract) return
    setQaLoading(true)
    try {
      const res = await axios.post(`${API_BASE}/contracts/${selectedContract.id}/qa`, { question: qaQuestion })
      setQaAnswer(res.data)
    } catch (e) {
      console.error(e)
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
      console.error(e)
    }
    setCompareLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex font-sans">
      <aside className="w-64 bg-gray-800 border-r border-gray-700 p-6 flex flex-col gap-6">
        <h1 className="text-2xl font-bold text-blue-400">ContractLens</h1>
        <nav className="flex flex-col gap-2">
          <button onClick={() => setView('dashboard')} className={`text-left px-4 py-3 rounded-md flex items-center gap-3 ${view === 'dashboard' ? 'bg-blue-600/20 text-blue-400' : 'hover:bg-gray-700'}`}><LayoutDashboard size={18}/> Dashboard</button>
          <button onClick={() => setView('contracts')} className={`text-left px-4 py-3 rounded-md flex items-center gap-3 ${view === 'contracts' ? 'bg-blue-600/20 text-blue-400' : 'hover:bg-gray-700'}`}><FileText size={18}/> Contracts</button>
          <button onClick={() => setView('compare')} className={`text-left px-4 py-3 rounded-md flex items-center gap-3 ${view === 'compare' ? 'bg-blue-600/20 text-blue-400' : 'hover:bg-gray-700'}`}><GitCompare size={18}/> Compare</button>
        </nav>
      </aside>

      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-7xl mx-auto space-y-8">
          
          {view === 'dashboard' && (
            <div className="space-y-8">
              <h2 className="text-3xl font-bold">Dashboard</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-sm">
                  <div className="text-gray-400 text-sm font-semibold mb-1">Total Contracts</div>
                  <div className="text-3xl font-bold text-blue-400">{stats?.total_contracts || 0}</div>
                </div>
                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-sm">
                  <div className="text-gray-400 text-sm font-semibold mb-1">Pending Obligations</div>
                  <div className="text-3xl font-bold text-yellow-400">{stats?.pending_obligations || 0}</div>
                </div>
                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-sm">
                  <div className="text-gray-400 text-sm font-semibold mb-1">Upcoming Renewals</div>
                  <div className="text-3xl font-bold text-emerald-400">{stats?.upcoming_renewals || 0}</div>
                </div>
                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-sm">
                  <div className="text-gray-400 text-sm font-semibold mb-1">Review Flags</div>
                  <div className="text-3xl font-bold text-red-400">{stats?.review_flags || 0}</div>
                </div>
              </div>

              <section className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><FileUp size={20}/> Upload New Contract</h2>
                <form onSubmit={handleUpload} className="flex gap-4 items-center">
                  <input 
                    type="file" 
                    accept=".pdf,.docx,.txt"
                    onChange={e => setFile(e.target.files ? e.target.files[0] : null)}
                    className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 bg-gray-700 rounded-md p-2 w-full max-w-md"
                  />
                  <button 
                    type="submit" 
                    disabled={uploading || !file}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-6 py-2 rounded-md font-semibold transition"
                  >
                    {uploading ? 'Processing...' : 'Upload & Extract'}
                  </button>
                </form>
              </section>
            </div>
          )}

          {view === 'contracts' && (
            <div className="flex gap-8 h-[calc(100vh-120px)]">
              {/* Contract List */}
              <div className="w-1/3 bg-gray-800 p-4 rounded-xl border border-gray-700 overflow-auto">
                <h2 className="text-lg font-semibold mb-4 text-gray-300 uppercase tracking-wider text-sm">Document Library</h2>
                <ul className="space-y-2">
                  {contracts.length === 0 && <p className="text-gray-500 text-sm">No contracts found.</p>}
                  {contracts.map(c => (
                    <li 
                      key={c.id} 
                      onClick={() => { setSelectedContract(c); setActiveTab('overview'); setQaAnswer(null); setQaQuestion(''); }}
                      className={`cursor-pointer p-3 rounded-lg border transition ${selectedContract?.id === c.id ? 'bg-blue-900/40 border-blue-500' : 'bg-gray-750 border-gray-700 hover:border-gray-500'}`}
                    >
                      <div className="font-medium text-gray-100 truncate">{c.name}</div>
                      <div className="text-xs text-gray-400 mt-1">{new Date(c.created_at).toLocaleDateString()}</div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Contract Details */}
              <div className="w-2/3 bg-gray-800 rounded-xl border border-gray-700 flex flex-col overflow-hidden">
                {selectedContract ? (
                  <>
                    <div className="p-6 border-b border-gray-700 bg-gray-800">
                      <h2 className="text-2xl font-bold text-white mb-2">{selectedContract.name}</h2>
                      <div className="flex gap-2">
                        <button onClick={() => setActiveTab('overview')} className={`px-4 py-1.5 rounded-full text-sm font-medium ${activeTab === 'overview' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>Overview</button>
                        <button onClick={() => setActiveTab('obligations')} className={`px-4 py-1.5 rounded-full text-sm font-medium ${activeTab === 'obligations' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>Obligations</button>
                        <button onClick={() => setActiveTab('timeline')} className={`px-4 py-1.5 rounded-full text-sm font-medium ${activeTab === 'timeline' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>Timeline</button>
                        <button onClick={() => setActiveTab('qa')} className={`px-4 py-1.5 rounded-full text-sm font-medium ${activeTab === 'qa' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>Q&A</button>
                      </div>
                    </div>

                    <div className="p-6 overflow-auto flex-1 bg-gray-900/50">
                      {activeTab === 'overview' && (
                        <div className="space-y-6">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-gray-800 p-4 rounded-lg border border-gray-700"><span className="text-gray-400 text-xs uppercase font-bold tracking-wider block mb-1">Parties</span>{selectedContract.parties || 'N/A'}</div>
                            <div className="bg-gray-800 p-4 rounded-lg border border-gray-700"><span className="text-gray-400 text-xs uppercase font-bold tracking-wider block mb-1">Payment Terms</span>{selectedContract.payment_terms || 'N/A'}</div>
                            <div className="bg-gray-800 p-4 rounded-lg border border-gray-700"><span className="text-gray-400 text-xs uppercase font-bold tracking-wider block mb-1">Renewal Terms</span>{selectedContract.renewal_terms || 'N/A'}</div>
                            <div className="bg-gray-800 p-4 rounded-lg border border-gray-700"><span className="text-gray-400 text-xs uppercase font-bold tracking-wider block mb-1">Termination</span>{selectedContract.termination_conditions || 'N/A'}</div>
                          </div>
                          
                          {selectedContract.review_flags?.length > 0 && (
                            <div>
                              <h3 className="text-lg font-bold text-gray-200 mb-3 flex items-center gap-2"><ShieldAlert className="text-red-400"/> Critical Review Flags</h3>
                              <div className="space-y-3">
                                {selectedContract.review_flags.map((f: any) => (
                                  <div key={f.id} className="bg-red-950/30 border-l-4 border-red-500 p-4 rounded-r-lg">
                                    <div className="flex justify-between items-start mb-1">
                                      <div className="font-bold text-red-400">{f.clause}</div>
                                      <span className="text-xs bg-red-900/60 text-red-200 px-2 py-0.5 rounded uppercase">{f.severity}</span>
                                    </div>
                                    <div className="text-gray-300 text-sm mb-2">{f.reason}</div>
                                    {f.source_reference && <div className="text-xs text-gray-500 font-mono">Source: {f.source_reference}</div>}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {activeTab === 'obligations' && (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-sm text-gray-300">
                            <thead className="bg-gray-800 text-gray-400 uppercase text-xs">
                              <tr>
                                <th className="px-4 py-3">Party</th>
                                <th className="px-4 py-3">Obligation</th>
                                <th className="px-4 py-3">Due Date</th>
                                <th className="px-4 py-3">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {selectedContract.obligations?.map((o: any) => (
                                <tr key={o.id} className="border-b border-gray-700 hover:bg-gray-800/50">
                                  <td className="px-4 py-3 font-medium text-yellow-400">{o.party}</td>
                                  <td className="px-4 py-3">{o.obligation}</td>
                                  <td className="px-4 py-3">{o.due_date || 'N/A'}</td>
                                  <td className="px-4 py-3"><span className="bg-gray-700 px-2 py-1 rounded text-xs">{o.status}</span></td>
                                </tr>
                              ))}
                              {(!selectedContract.obligations || selectedContract.obligations.length === 0) && (
                                <tr><td colSpan={4} className="text-center py-8 text-gray-500">No obligations extracted.</td></tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {activeTab === 'timeline' && (
                        <div className="relative border-l border-gray-600 ml-4 space-y-8 py-4">
                          <div className="mb-8 ml-6">
                            <span className="absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full bg-blue-900 ring-4 ring-gray-900"><Calendar size={12} className="text-blue-300"/></span>
                            <h3 className="font-semibold text-gray-100">Effective Date</h3>
                            <time className="block mb-2 text-sm font-normal leading-none text-gray-400">{selectedContract.effective_date || 'Not specified'}</time>
                          </div>
                          {selectedContract.obligations?.filter((o:any)=>o.due_date).map((o:any) => (
                            <div key={o.id} className="mb-8 ml-6">
                               <span className="absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full bg-yellow-900 ring-4 ring-gray-900"><Clock size={12} className="text-yellow-300"/></span>
                               <h3 className="font-semibold text-gray-100">{o.party} - {o.obligation}</h3>
                               <time className="block mb-2 text-sm font-normal leading-none text-gray-400">Due: {o.due_date}</time>
                            </div>
                          ))}
                          <div className="ml-6">
                            <span className="absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full bg-red-900 ring-4 ring-gray-900"><Calendar size={12} className="text-red-300"/></span>
                            <h3 className="font-semibold text-gray-100">Expiration Date</h3>
                            <time className="block mb-2 text-sm font-normal leading-none text-gray-400">{selectedContract.expiration_date || 'Not specified'}</time>
                          </div>
                        </div>
                      )}

                      {activeTab === 'qa' && (
                        <div className="flex flex-col h-full">
                          <div className="flex-1 overflow-auto bg-gray-800/30 rounded-lg p-4 mb-4 border border-gray-700">
                            {qaAnswer ? (
                              <div className="space-y-3">
                                <div className="bg-blue-900/30 p-3 rounded-lg text-blue-100 text-sm w-max max-w-[80%] ml-auto border border-blue-800">{qaQuestion}</div>
                                <div className="bg-gray-700 p-4 rounded-lg text-gray-200 text-sm max-w-[90%] border border-gray-600">
                                  {qaAnswer.answer}
                                  {qaAnswer.source_reference && <div className="mt-3 text-xs text-gray-400 border-t border-gray-600 pt-2 font-mono">Source: {qaAnswer.source_reference}</div>}
                                </div>
                              </div>
                            ) : (
                              <div className="h-full flex items-center justify-center text-gray-500 flex-col gap-2">
                                <MessageSquare size={32}/>
                                <p>Ask any question about this contract.</p>
                              </div>
                            )}
                          </div>
                          <form onSubmit={handleAskQuestion} className="flex gap-2">
                            <input 
                              type="text" 
                              value={qaQuestion}
                              onChange={e => setQaQuestion(e.target.value)}
                              placeholder="e.g., What are the payment terms?" 
                              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
                            />
                            <button type="submit" disabled={qaLoading || !qaQuestion} className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg font-semibold disabled:bg-gray-700 transition">
                              {qaLoading ? '...' : 'Ask'}
                            </button>
                          </form>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-500">
                    Select a contract from the library to view details.
                  </div>
                )}
              </div>
            </div>
          )}

          {view === 'compare' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Compare Versions</h2>
              <div className="flex gap-4">
                <select value={c1} onChange={e => setC1(e.target.value ? Number(e.target.value) : '')} className="bg-gray-800 border border-gray-700 rounded-md p-2 flex-1">
                  <option value="">Select Base Contract</option>
                  {contracts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <select value={c2} onChange={e => setC2(e.target.value ? Number(e.target.value) : '')} className="bg-gray-800 border border-gray-700 rounded-md p-2 flex-1">
                  <option value="">Select New Contract</option>
                  {contracts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <button onClick={handleCompare} disabled={compareLoading || !c1 || !c2} className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 px-6 rounded-md font-semibold">
                  {compareLoading ? 'Comparing...' : 'Compare'}
                </button>
              </div>

              {compareResult && (
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-gray-800 p-6 rounded-xl border border-red-900/50 space-y-4">
                    <h3 className="font-bold text-red-400 border-b border-red-900/50 pb-2">Removed Clauses</h3>
                    <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
                      {compareResult.removed?.map((x:string, i:number) => <li key={i}>{x}</li>)}
                      {compareResult.removed?.length === 0 && <span className="text-gray-500">None</span>}
                    </ul>
                  </div>
                  <div className="bg-gray-800 p-6 rounded-xl border border-green-900/50 space-y-4">
                    <h3 className="font-bold text-green-400 border-b border-green-900/50 pb-2">Added Clauses</h3>
                    <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
                      {compareResult.added?.map((x:string, i:number) => <li key={i}>{x}</li>)}
                      {compareResult.added?.length === 0 && <span className="text-gray-500">None</span>}
                    </ul>
                  </div>
                  <div className="bg-gray-800 p-6 rounded-xl border border-yellow-900/50 col-span-2 space-y-4">
                    <h3 className="font-bold text-yellow-400 border-b border-yellow-900/50 pb-2">Modified & Important Changes</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-xs uppercase text-gray-500 mb-2 font-bold">Modified</h4>
                        <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
                          {compareResult.modified?.map((x:string, i:number) => <li key={i}>{x}</li>)}
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-xs uppercase text-gray-500 mb-2 font-bold">Important</h4>
                        <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
                          {compareResult.important_changes?.map((x:string, i:number) => <li key={i}>{x}</li>)}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </main>
    </div>
  )
}

export default App
