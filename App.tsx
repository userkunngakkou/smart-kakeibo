import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Receipt, 
  LayoutDashboard, 
  History, 
  Users, 
  X, 
  Camera, 
  Check, 
  Loader2,
  Trash2,
  PieChart as PieChartIcon,
  Info,
  Smartphone,
  Monitor,
  Database,
  RefreshCw,
  Cloud,
  CloudOff,
  ChevronRight
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { Transaction, User, INITIAL_USERS, CATEGORIES } from './types';
import { scanReceipt } from './services/geminiService';
import { dbService } from './services/dbService';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'history' | 'users'>('dashboard');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [currentUser, setCurrentUser] = useState<User>(INITIAL_USERS[0]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [d1Connected, setD1Connected] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // フォームの状態
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [storeName, setStoreName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [receiptImage, setReceiptImage] = useState<string | null>(null);

  // 初回ロード
  useEffect(() => {
    const data = dbService.getLocalTransactions();
    setTransactions(data);
    handleSync();
  }, []);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await dbService.syncAll();
      setTransactions(dbService.getLocalTransactions());
      setD1Connected(true);
    } catch (e) {
      setD1Connected(false);
    } finally {
      setTimeout(() => setIsSyncing(false), 800);
    }
  };

  const toggleUser = () => {
    const currentIndex = INITIAL_USERS.findIndex(u => u.id === currentUser.id);
    const nextIndex = (currentIndex + 1) % INITIAL_USERS.length;
    setCurrentUser(INITIAL_USERS[nextIndex]);
  };

  const handleAddTransaction = async () => {
    if (!amount) return;
    const newTx: Transaction = {
      id: crypto.randomUUID(),
      date,
      amount: parseInt(amount),
      category,
      userId: currentUser.id,
      userName: currentUser.name,
      description,
      storeName,
      receiptImage: receiptImage || undefined,
      createdAt: Date.now()
    };

    const result = await dbService.saveTransaction(newTx);
    setTransactions(dbService.getLocalTransactions());
    
    if (!result.synced) {
      setD1Connected(false);
    }

    resetForm();
    setIsAddModalOpen(false);
  };

  const resetForm = () => {
    setAmount('');
    setDescription('');
    setCategory(CATEGORIES[0]);
    setStoreName('');
    setDate(new Date().toISOString().split('T')[0]);
    setReceiptImage(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm('この項目を削除してもよろしいですか？')) {
      await dbService.deleteTransaction(id);
      setTransactions(dbService.getLocalTransactions());
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      setReceiptImage(base64);
      setIsScanning(true);
      const ocrResult = await scanReceipt(base64);
      setIsScanning(false);
      if (ocrResult) {
        setAmount(ocrResult.amount.toString());
        setStoreName(ocrResult.storeName);
        if (ocrResult.date) setDate(ocrResult.date);
        if (CATEGORIES.includes(ocrResult.category)) setCategory(ocrResult.category);
        setDescription(`AI解析: ${ocrResult.storeName}`);
      }
    };
    reader.readAsDataURL(file);
  };

  const getTotalByCategories = () => {
    return CATEGORIES.map(cat => ({
      name: cat,
      value: transactions.filter(t => t.category === cat).reduce((sum, t) => sum + t.amount, 0)
    })).filter(d => d.value > 0);
  };

  const getTotalByUsers = () => {
    return INITIAL_USERS.map(u => ({
      name: u.name,
      amount: transactions.filter(t => u.id === t.userId).reduce((sum, t) => sum + t.amount, 0),
      color: u.color
    }));
  };

  const totalSpend = transactions.reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col lg:flex-row">
      {/* サイドバー (Desktop) */}
      <aside className="hidden lg:flex w-72 bg-white border-r border-slate-200 flex-col sticky top-0 h-screen z-40 shadow-sm">
        <div className="p-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100">
              <Database className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-800 tracking-tighter">スマート家計簿</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Powered by D1 & AI</p>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-4">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold transition-all ${activeTab === 'dashboard' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <LayoutDashboard size={22} /> ホーム
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold transition-all ${activeTab === 'history' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <History size={22} /> 支出履歴
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold transition-all ${activeTab === 'users' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <Users size={22} /> 家族管理
          </button>
        </nav>

        <div className="p-6 space-y-4">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black text-slate-400 uppercase">Cloudflare D1</span>
              {d1Connected ? (
                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                  <Cloud size={12} /> 同期済み
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[10px] font-bold text-rose-500">
                  <CloudOff size={12} /> オフライン
                </span>
              )}
            </div>
            <button 
              onClick={handleSync}
              disabled={isSyncing}
              className="w-full flex items-center justify-center gap-2 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-50"
            >
              <RefreshCw size={14} className={isSyncing ? "animate-spin" : ""} />
              {isSyncing ? "同期中..." : "手動同期"}
            </button>
          </div>

          {/* ユーザー切り替え可能なプロフィールカード */}
          <div 
            onClick={toggleUser}
            className="p-4 bg-indigo-600 rounded-2xl text-white shadow-xl shadow-indigo-200 relative overflow-hidden group cursor-pointer hover:bg-indigo-700 transition-all active:scale-95 select-none"
            title="クリックしてユーザーを切り替え"
          >
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] opacity-80 font-bold uppercase tracking-wider">現在の利用者</p>
                <RefreshCw size={10} className="opacity-50 group-hover:rotate-180 transition-transform duration-500" />
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-black ring-2 ring-white/30" style={{ backgroundColor: currentUser.color }}>
                  {currentUser.name.slice(0, 1)}
                </div>
                <div className="flex-1">
                   <span className="font-black text-lg block">{currentUser.name}</span>
                   <p className="text-[9px] opacity-60 font-bold">クリックで切り替え</p>
                </div>
                <ChevronRight size={16} className="opacity-40" />
              </div>
            </div>
            <div className="absolute top-[-20px] right-[-20px] w-24 h-24 bg-white/10 rounded-full blur-xl transition-transform group-hover:scale-150"></div>
          </div>
        </div>
      </aside>

      {/* メインエリア */}
      <div className="flex-1 flex flex-col w-full">
        {/* モバイルヘッダー */}
        <header className="lg:hidden sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Database size={18} className="text-white" />
            </div>
            <h1 className="text-lg font-black text-slate-800 tracking-tighter">スマート家計簿</h1>
          </div>
          <div 
            className="flex items-center gap-2 bg-slate-100 pr-4 pl-1 py-1 rounded-full cursor-pointer hover:bg-slate-200 transition-all active:scale-95"
            onClick={toggleUser}
          >
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-black shadow-md"
              style={{ backgroundColor: currentUser.color }}
            >
              {currentUser.name.slice(0, 1)}
            </div>
            <span className="text-xs font-black text-slate-600">{currentUser.name}</span>
            <RefreshCw size={12} className="text-slate-400" />
          </div>
        </header>

        <main className="flex-1 p-6 lg:p-12 pb-32 lg:pb-12 overflow-y-auto max-w-7xl mx-auto w-full">
          {activeTab === 'dashboard' && (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
              {/* サマリーカード */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-2 bg-slate-900 rounded-[32px] p-10 text-white shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[260px]">
                  <div className="relative z-10">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-2">今月の総支出額 (D1同期)</p>
                        <h2 className="text-5xl lg:text-6xl font-black tracking-tight font-mono">¥{totalSpend.toLocaleString()}</h2>
                      </div>
                      <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md">
                        <Receipt className="text-white/80" size={36} />
                      </div>
                    </div>
                  </div>
                  <div className="relative z-10 grid grid-cols-3 gap-6 mt-10 pt-8 border-t border-white/10">
                    {getTotalByUsers().map(u => (
                      <div key={u.name} className="flex flex-col">
                        <div className="flex items-center gap-1.5 mb-1">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: u.color }}></div>
                          <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider">{u.name}</span>
                        </div>
                        <span className="text-xl font-black">¥{u.amount.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                  <div className="absolute top-[-40px] right-[-40px] w-80 h-80 bg-indigo-600/10 rounded-full blur-[100px]"></div>
                </div>

                <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm flex flex-col justify-between group hover:border-indigo-200 transition-all cursor-pointer">
                    <div className="bg-amber-100 w-14 h-14 rounded-2xl flex items-center justify-center text-amber-600 mb-6 group-hover:scale-110 transition-transform">
                      <Info size={28} />
                    </div>
                    <div>
                      <h3 className="font-black text-slate-800 text-xl mb-2 tracking-tight">AI解析機能</h3>
                      <p className="text-sm text-slate-500 leading-relaxed font-medium">Gemini 3 Flashがレシートを即座にデジタル化します。</p>
                    </div>
                  </div>
                  <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm flex flex-col justify-between group hover:border-indigo-200 transition-all cursor-pointer" onClick={handleSync}>
                    <div className="bg-indigo-100 w-14 h-14 rounded-2xl flex items-center justify-center text-indigo-600 mb-6 group-hover:rotate-180 transition-transform duration-500">
                      <RefreshCw size={28} />
                    </div>
                    <div>
                      <h3 className="font-black text-slate-800 text-xl mb-2 tracking-tight">リアルタイム同期</h3>
                      <p className="text-sm text-slate-500 leading-relaxed font-medium">Cloudflare D1で家族全員のデータを一元管理。</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* チャート */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-200">
                  <div className="flex justify-between items-center mb-10">
                    <h3 className="text-xl font-black text-slate-800 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                        <PieChartIcon size={20} className="text-indigo-500" />
                      </div>
                      カテゴリ別支出
                    </h3>
                  </div>
                  <div className="h-[300px] w-full">
                    {getTotalByCategories().length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={getTotalByCategories()}
                            cx="50%"
                            cy="50%"
                            innerRadius={80}
                            outerRadius={110}
                            paddingAngle={8}
                            dataKey="value"
                            stroke="none"
                          >
                            {getTotalByCategories().map((_, index) => (
                              <Cell key={`cell-${index}`} fill={['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#a855f7', '#ec4899'][index % 6]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0(0 / 0.15)', fontWeight: 'bold' }}
                            formatter={(v: any) => `¥${v.toLocaleString()}`}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
                         <div className="bg-slate-50 p-6 rounded-full"><PieChartIcon size={40} /></div>
                         <p className="text-sm font-black uppercase tracking-wider">データなし</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-200">
                  <div className="flex justify-between items-center mb-10">
                    <h3 className="text-xl font-black text-slate-800 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                        <Users size={20} className="text-emerald-500" />
                      </div>
                      メンバー別の累計
                    </h3>
                  </div>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={getTotalByUsers()} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94A3B8', fontWeight: 'bold'}} />
                        <YAxis hide />
                        <Tooltip 
                          cursor={{fill: '#F8FAFC', radius: 16}}
                          contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)', fontWeight: 'bold' }}
                          formatter={(v: any) => `¥${v.toLocaleString()}`}
                        />
                        <Bar dataKey="amount" radius={[12, 12, 12, 12]} barSize={48}>
                          {getTotalByUsers().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700 max-w-4xl mx-auto w-full">
              <div className="flex justify-between items-end">
                <div>
                  <h3 className="text-3xl font-black text-slate-800 tracking-tight">支出履歴</h3>
                  <p className="text-slate-500 font-bold mt-1">すべての記録を時系列で確認できます</p>
                </div>
                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-slate-200 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></span>
                  <span className="text-xs font-black text-slate-600">{transactions.length}件</span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                {transactions.length === 0 ? (
                  <div className="py-32 text-center bg-white rounded-[40px] border border-slate-200 border-dashed">
                    <div className="bg-slate-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 text-slate-300 shadow-inner">
                      <History size={48} />
                    </div>
                    <p className="text-slate-500 font-black text-xl mb-4">データがありません</p>
                    <button onClick={() => setIsAddModalOpen(true)} className="text-indigo-600 font-black hover:underline">記録を始める</button>
                  </div>
                ) : (
                  transactions.map((tx) => (
                    <div key={tx.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-6 group transition-all hover:border-indigo-300 hover:shadow-xl hover:-translate-y-1">
                      <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-2xl overflow-hidden shrink-0 shadow-inner group-hover:scale-105 transition-transform">
                        {tx.receiptImage ? (
                          <img src={tx.receiptImage} className="w-full h-full object-cover" alt="Receipt" />
                        ) : (
                          <Receipt size={28} className="text-slate-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-1">
                          <h4 className="font-black text-slate-800 truncate text-xl tracking-tight">
                            {tx.storeName || tx.description || '名称なし'}
                          </h4>
                          <p className="font-black text-slate-900 text-xl font-mono">¥{tx.amount.toLocaleString()}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="px-3 py-1 rounded-full text-[10px] font-black text-white shadow-sm" style={{ backgroundColor: INITIAL_USERS.find(u => u.id === tx.userId)?.color }}>
                            {tx.userName}
                          </span>
                          <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-wider">
                            {tx.category}
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold ml-1">
                            {tx.date}
                          </span>
                          {!tx.isSynced && (
                            <span className="flex items-center gap-1 text-[9px] font-black text-amber-500 bg-amber-50 px-2 py-0.5 rounded-full">
                              <RefreshCw size={10} /> LOCAL
                            </span>
                          )}
                        </div>
                      </div>
                      <button onClick={() => handleDelete(tx.id)} className="p-4 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all opacity-0 group-hover:opacity-100">
                        <Trash2 size={22} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700 max-w-4xl mx-auto w-full">
              <div>
                <h3 className="text-3xl font-black text-slate-800 tracking-tight">家族管理</h3>
                <p className="text-slate-500 font-bold mt-1">家族それぞれの支出分担を一目で把握</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {INITIAL_USERS.map((user) => (
                  <div 
                    key={user.id} 
                    onClick={() => setCurrentUser(user)}
                    className={`bg-white p-10 rounded-[40px] border shadow-sm flex flex-col items-center gap-6 group hover:border-indigo-300 transition-all cursor-pointer ${currentUser.id === user.id ? 'border-indigo-600 ring-2 ring-indigo-50' : 'border-slate-200'}`}
                  >
                    <div className="w-24 h-24 rounded-full flex items-center justify-center text-white text-4xl font-black shadow-2xl transition-transform group-hover:scale-110" style={{ backgroundColor: user.color }}>
                      {user.name.slice(0, 1)}
                    </div>
                    <div className="text-center">
                      <h4 className="font-black text-slate-800 text-2xl mb-2">{user.name}</h4>
                      {currentUser.id === user.id && (
                        <span className="text-[10px] bg-indigo-600 text-white px-3 py-1 rounded-full font-black uppercase tracking-widest mb-4 inline-block">ログイン中</span>
                      )}
                      <div className="bg-slate-50 px-6 py-3 rounded-2xl">
                        <p className="text-xs text-slate-400 font-black uppercase tracking-widest mb-1">累計支出</p>
                        <p className="text-2xl font-black text-slate-800 font-mono">
                          ¥{transactions.filter(t => t.userId === user.id).reduce((s, t) => s + t.amount, 0).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-12 rounded-[48px] text-white shadow-2xl relative overflow-hidden">
                <div className="relative z-10 flex flex-col lg:flex-row gap-10 items-center">
                  <div className="flex-1">
                    <h4 className="text-3xl font-black mb-6 flex items-center gap-4">
                      <div className="bg-white/20 p-3 rounded-2xl">
                        <Cloud size={32} />
                      </div>
                      クラウド・エッジ同期
                    </h4>
                    <p className="text-indigo-100 leading-relaxed text-lg font-medium opacity-90">
                      「スマート家計簿」は Cloudflare のエッジデータベース D1 と連携しています。Gemini 3 Flash AI がレシートを瞬時に解析し、家族全員のデバイス間で瞬時に同期を実現します。
                    </p>
                    <div className="mt-8 flex flex-wrap gap-4">
                      <div className="flex items-center gap-3 bg-white/10 px-5 py-3 rounded-2xl border border-white/10 backdrop-blur-md">
                        <Smartphone size={20} /> <span className="text-sm font-black uppercase">モバイル最適化</span>
                      </div>
                      <div className="flex items-center gap-3 bg-white/10 px-5 py-3 rounded-2xl border border-white/10 backdrop-blur-md">
                        <Monitor size={20} /> <span className="text-sm font-black uppercase">PC対応</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="absolute bottom-[-100px] right-[-100px] w-64 h-64 bg-white/5 rounded-full blur-[80px]"></div>
              </div>
            </div>
          )}
        </main>

        {/* モバイルナビ */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-slate-200 px-6 py-5 flex justify-around items-center z-40 pb-safe shadow-2xl">
          <button onClick={() => setActiveTab('dashboard')} className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === 'dashboard' ? 'text-indigo-600 scale-110' : 'text-slate-400'}`}>
            <LayoutDashboard size={24} />
            <span className="text-[9px] font-black uppercase tracking-widest">ホーム</span>
          </button>
          <button onClick={() => setActiveTab('history')} className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === 'history' ? 'text-indigo-600 scale-110' : 'text-slate-400'}`}>
            <History size={24} />
            <span className="text-[9px] font-black uppercase tracking-widest">履歴</span>
          </button>
          <button onClick={() => setActiveTab('users')} className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === 'users' ? 'text-indigo-600 scale-110' : 'text-slate-400'}`}>
            <Users size={24} />
            <span className="text-[9px] font-black uppercase tracking-widest">家族</span>
          </button>
        </nav>
      </div>

      {/* フローティング追加ボタン */}
      <button 
        onClick={() => setIsAddModalOpen(true)}
        className="fixed bottom-28 lg:bottom-12 right-6 lg:right-12 w-20 h-20 bg-indigo-600 text-white rounded-[28px] shadow-2xl shadow-indigo-300 flex items-center justify-center transition-all hover:scale-110 hover:bg-indigo-700 active:scale-90 z-40"
      >
        <Plus size={44} strokeWidth={3} />
      </button>

      {/* 支出追加モーダル */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center bg-slate-900/60 backdrop-blur-md p-0 sm:p-8 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-t-[48px] sm:rounded-[56px] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom-full duration-500 flex flex-col max-h-[96vh] overflow-hidden">
            <div className="p-10 border-b border-slate-100 flex justify-between items-center bg-white/50 sticky top-0 z-10 backdrop-blur-md">
              <div>
                <h2 className="text-3xl font-black text-slate-800 tracking-tight">支出を記録する</h2>
                <p className="text-sm font-bold text-slate-400 mt-1 uppercase tracking-widest">Transaction Record</p>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="p-4 bg-slate-100 rounded-2xl text-slate-500 hover:text-slate-800 transition-all hover:rotate-90">
                <X size={24} />
              </button>
            </div>

            <div className="p-10 overflow-y-auto space-y-10">
              <div className="relative">
                <input type="file" accept="image/*" onChange={handleFileChange} id="receipt-upload" className="hidden" />
                <label 
                  htmlFor="receipt-upload"
                  className={`group relative w-full h-72 border-4 border-dashed rounded-[40px] flex flex-col items-center justify-center cursor-pointer transition-all duration-300 ${receiptImage ? 'border-indigo-400 bg-indigo-50/10' : 'border-slate-100 hover:border-indigo-400 hover:bg-slate-50'}`}
                >
                  {receiptImage ? (
                    <div className="relative w-full h-full p-6">
                      <img src={receiptImage} className="w-full h-full object-contain rounded-3xl" alt="Preview" />
                      <div className="absolute inset-0 bg-indigo-600/10 flex items-center justify-center rounded-[40px] opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="bg-white/95 p-6 rounded-full shadow-2xl scale-0 group-hover:scale-100 transition-transform duration-300"><Camera className="text-indigo-600" size={40} /></div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="w-20 h-20 bg-indigo-50 rounded-[28px] flex items-center justify-center text-indigo-600 mb-6 shadow-sm group-hover:scale-110 group-hover:rotate-12 transition-all">
                        <Camera size={36} />
                      </div>
                      <p className="text-xl font-black text-slate-800">レシートをスキャン</p>
                      <p className="text-xs text-slate-400 mt-2 font-black uppercase tracking-widest">AIが自動解析します</p>
                    </>
                  )}
                  {isScanning && (
                    <div className="absolute inset-0 bg-white/95 backdrop-blur-2xl flex flex-col items-center justify-center rounded-[40px] z-10">
                      <div className="relative">
                         <Loader2 size={64} className="text-indigo-600 animate-spin" />
                         <div className="absolute inset-0 flex items-center justify-center">
                            <RefreshCw size={24} className="text-indigo-300" />
                         </div>
                      </div>
                      <p className="text-2xl font-black text-indigo-600 mt-8 animate-pulse tracking-tight">AIが解析中...</p>
                    </div>
                  )}
                </label>
              </div>

              <div className="space-y-8">
                <div className="flex items-center gap-6 bg-[#F8FAFC] p-8 rounded-[36px] border border-slate-100 shadow-inner">
                  <div className="bg-indigo-600 w-16 h-16 rounded-2xl text-white shadow-xl shadow-indigo-200 flex items-center justify-center">
                    <span className="font-black text-3xl">¥</span>
                  </div>
                  <input 
                    type="number" 
                    placeholder="0" 
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="flex-1 text-5xl font-black bg-transparent border-none focus:outline-none focus:ring-0 placeholder:text-slate-200 font-mono"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2">決済日</label>
                    <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-[#F8FAFC] border border-slate-200 rounded-2xl px-6 py-5 text-sm font-black focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all" />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2">カテゴリ</label>
                    <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-[#F8FAFC] border border-slate-200 rounded-2xl px-6 py-5 text-sm font-black focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all appearance-none cursor-pointer">
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2">店名 / メモ</label>
                  <input 
                    type="text" 
                    placeholder="どこで使いましたか？" 
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    className="w-full bg-[#F8FAFC] border border-slate-200 rounded-2xl px-6 py-5 text-sm font-black focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all placeholder:text-slate-300"
                  />
                </div>

                <div className="pt-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 px-2 block">誰の支出？</label>
                  <div className="flex gap-4">
                    {INITIAL_USERS.map((user) => (
                      <button
                        key={user.id}
                        onClick={() => setCurrentUser(user)}
                        className={`flex-1 py-5 rounded-2xl text-xs font-black transition-all border-2 relative overflow-hidden group ${
                          currentUser.id === user.id ? 'border-indigo-600 bg-indigo-600 text-white shadow-xl shadow-indigo-100 scale-105' : 'border-slate-100 bg-slate-50 text-slate-400'
                        }`}
                      >
                        <span className="relative z-10 uppercase tracking-widest">{user.name}</span>
                        {currentUser.id === user.id && (
                          <div className="absolute top-0 right-0 p-1">
                             <Check size={12} strokeWidth={4} />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-10 border-t border-slate-100 bg-[#F8FAFC]">
              <button 
                onClick={handleAddTransaction}
                disabled={!amount || isScanning}
                className="w-full bg-indigo-600 text-white font-black py-6 rounded-3xl shadow-2xl shadow-indigo-200 flex items-center justify-center gap-4 hover:bg-indigo-700 active:scale-[0.98] transition-all disabled:opacity-50 text-lg uppercase tracking-widest"
              >
                <Database size={24} />
                D1 データベースに保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
