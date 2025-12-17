// src/App.jsx - PART 1 of 2
// Delete your current App.jsx content and paste BOTH parts

import React, { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import { Network, Zap, Users, TrendingUp, Moon, Sun, Menu, LogOut, Crown, Send, MessageSquare, X, Sparkles, Loader, CheckCircle } from 'lucide-react'

export default function SynergyAI() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [darkMode, setDarkMode] = useState(true)
  const [view, setView] = useState('home')
  const [task, setTask] = useState('')
  const [executing, setExecuting] = useState(false)
  const [currentChat, setCurrentChat] = useState(null)
  const [chatHistory, setChatHistory] = useState([])
  const [messages, setMessages] = useState([])
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [feedbackText, setFeedbackText] = useState('')
  const [userStats, setUserStats] = useState({ tasks: 0, isPremium: false })

  useEffect(() => {
    checkUser()
    
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null)
      if (session?.user) {
        loadUserData(session.user.id)
        setView('app')
      }
    })

    return () => {
      authListener?.subscription?.unsubscribe()
    }
  }, [])

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    setUser(session?.user || null)
    if (session?.user) {
      await loadUserData(session.user.id)
      setView('app')
    }
    setLoading(false)
  }

  const loadUserData = async (userId) => {
    const { data: stats } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (stats) {
      setUserStats(stats)
    } else {
      await supabase.from('user_stats').insert({
        user_id: userId,
        tasks: 0,
        is_premium: false
      })
      setUserStats({ tasks: 0, isPremium: false })
    }

    const { data: chats } = await supabase
      .from('chats')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    setChatHistory(chats || [])
  }

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    })
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setView('home')
    setChatHistory([])
    setCurrentChat(null)
  }

  const createNewTask = async () => {
    if (!userStats.isPremium && userStats.tasks >= 1) {
      alert('Free users can only create 1 task. Upgrade to Premium for unlimited tasks!')
      setView('upgrade')
      return
    }

    const newChat = {
      id: Date.now().toString(),
      user_id: user.id,
      title: 'New Task',
      messages: [],
      chat_count: 0,
      created_at: new Date().toISOString()
    }

    const { data } = await supabase
      .from('chats')
      .insert(newChat)
      .select()
      .single()

    if (data) {
      setCurrentChat(data)
      setMessages([])
      setChatHistory([data, ...chatHistory])
      
      await supabase
        .from('user_stats')
        .update({ tasks: userStats.tasks + 1 })
        .eq('user_id', user.id)
      
      setUserStats({ ...userStats, tasks: userStats.tasks + 1 })
    }
  }

  const selectChat = async (chat) => {
    setCurrentChat(chat)
    const { data } = await supabase
      .from('chats')
      .select('messages')
      .eq('id', chat.id)
      .single()
    
    setMessages(data?.messages || [])
  }

  const executeTask = async () => {
    if (!task.trim() || !currentChat) return

    if (!userStats.isPremium && currentChat.chat_count >= 5) {
      alert('Free users are limited to 5 chats per task. Upgrade to Premium for unlimited chats!')
      setView('upgrade')
      return
    }

    setExecuting(true)

    const userMessage = { role: 'user', content: task, timestamp: new Date().toISOString() }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)

    try {
      // TODO: Replace with your Make.com webhook URL
      const aiMessage = {
        role: 'assistant',
        content: 'This is a simulated response. Connect your Make.com webhook to enable real AI orchestration.',
        timestamp: new Date().toISOString()
      }

      const updatedMessages = [...newMessages, aiMessage]
      setMessages(updatedMessages)

      await supabase
        .from('chats')
        .update({
          messages: updatedMessages,
          chat_count: currentChat.chat_count + 1,
          title: task.slice(0, 50)
        })
        .eq('id', currentChat.id)

      setCurrentChat({ ...currentChat, chat_count: currentChat.chat_count + 1 })
      setTask('')

    } catch (error) {
      console.error('Error:', error)
    }

    setExecuting(false)
  }

  const submitFeedback = async () => {
    if (!feedbackText.trim()) return

    await supabase.from('feedback').insert({
      user_id: user?.id,
      feedback: feedbackText,
      created_at: new Date().toISOString()
    })

    setFeedbackText('')
    setFeedbackOpen(false)
    alert('Thank you for your feedback!')
  }

  const bgColor = darkMode ? 'bg-slate-900' : 'bg-slate-50'
  const textColor = darkMode ? 'text-slate-100' : 'text-slate-900'
  const cardBg = darkMode ? 'bg-slate-800' : 'bg-white'
  const borderColor = darkMode ? 'border-slate-700' : 'border-slate-200'
  const mutedText = darkMode ? 'text-slate-400' : 'text-slate-600'

  const NavBar = () => (
    <nav className={`${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} border-b sticky top-0 z-50 backdrop-blur-sm bg-opacity-90`}>
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView('home')}>
          <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
            <Network className="w-6 h-6 text-white" />
          </div>
          <span className={`text-xl font-bold ${textColor}`}>Synergy AI</span>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`p-2 rounded-lg ${darkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100'} transition-colors`}
          >
            {darkMode ? <Sun className="w-5 h-5 text-slate-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
          </button>

          {!user ? (
            <>
              <button
                onClick={signInWithGoogle}
                className={`px-4 py-2 rounded-lg ${darkMode ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-100'} transition-colors font-medium hidden sm:block`}
              >
                Sign In
              </button>
              <button
                onClick={signInWithGoogle}
                className="px-5 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-colors font-semibold"
              >
                Get Started
              </button>
            </>
          ) : (
            <>
              {!userStats.isPremium && (
                <button
                  onClick={() => setView('upgrade')}
                  className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-yellow-500 text-slate-900 rounded-lg hover:from-yellow-500 hover:to-yellow-600 transition-colors font-semibold flex items-center gap-2"
                >
                  <Crown className="w-4 h-4" />
                  <span className="hidden sm:inline">Upgrade</span>
                </button>
              )}
              <button
                onClick={() => setView('app')}
                className="px-5 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-colors font-semibold"
              >
                App
              </button>
              <button onClick={signOut} className={`p-2 rounded-lg ${darkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100'} transition-colors`}>
                <LogOut className={`w-5 h-5 ${mutedText}`} />
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  )

  if (loading) {
    return (
      <div className={`min-h-screen ${bgColor} flex items-center justify-center`}>
        <Loader className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    )
  }

  if (view === 'home') {
    return (
      <div className={`min-h-screen ${bgColor} transition-colors`}>
        <NavBar />
        
        <div className="max-w-6xl mx-auto px-6 py-20 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 bg-opacity-10 rounded-full mb-8">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span className="text-blue-400 text-sm font-medium">AI Orchestration Platform</span>
          </div>
          
          <h1 className={`text-5xl md:text-6xl font-bold ${textColor} mb-6 leading-tight`}>
            Coordinate Multiple AI Agents<br />
            <span className="bg-gradient-to-r from-blue-500 to-purple-600 text-transparent bg-clip-text">
              for 10x Better Results
            </span>
          </h1>
          
          <p className={`text-xl ${mutedText} mb-12 max-w-3xl mx-auto leading-relaxed`}>
            Stop using one AI for everything. Synergy orchestrates multiple specialist agents 
            working together in parallel to deliver professional-grade results in minutes.
          </p>

          <div className="flex items-center justify-center gap-4 mb-6 flex-wrap">
            <button
              onClick={() => user ? setView('app') : signInWithGoogle()}
              className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Start Free Today
            </button>
            <button
              onClick={() => setView('upgrade')}
              className={`px-8 py-4 ${cardBg} ${textColor} rounded-lg border ${borderColor} hover:border-blue-500 transition-colors font-semibold text-lg`}
            >
              View Pricing
            </button>
          </div>
          
          <p className={`text-sm ${mutedText}`}>
            Free tier: 1 task • 5 chats • No credit card required
          </p>
        </div>

        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="grid md:grid-cols-3 gap-8">
            <div className={`${cardBg} p-8 rounded-2xl border ${borderColor} hover:border-blue-500 transition-all`}>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-6">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h3 className={`text-2xl font-bold ${textColor} mb-4`}>10x Faster</h3>
              <p className={mutedText}>
                Multiple AI agents work in parallel. Complex tasks that take hours with traditional AI are completed in minutes.
              </p>
            </div>

            <div className={`${cardBg} p-8 rounded-2xl border ${borderColor} hover:border-purple-500 transition-all`}>
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-6">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className={`text-2xl font-bold ${textColor} mb-4`}>Expert Quality</h3>
              <p className={mutedText}>
                Specialized agents for research, analysis, strategy, writing, and more. Professional results every time.
              </p>
            </div>

            <div className={`${cardBg} p-8 rounded-2xl border ${borderColor} hover:border-green-500 transition-all`}>
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-6">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <h3 className={`text-2xl font-bold ${textColor} mb-4`}>Better Results</h3>
              <p className={mutedText}>
                Coordination produces insights no single AI can match. Like having a team of experts.
              </p>
            </div>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-6 py-16">
          <h2 className={`text-4xl font-bold ${textColor} text-center mb-16`}>How It Works</h2>
          <div className="grid md:grid-cols-3 gap-12">
            {[
              { num: '1', title: 'Describe Your Task', desc: 'Tell Synergy what you need - a marketing plan, research report, or any complex project.' },
              { num: '2', title: 'AI Orchestration', desc: 'Our coordinator AI deploys specialist agents to work in parallel on each component.' },
              { num: '3', title: 'Get Results', desc: 'Receive a comprehensive output combining insights from all agents into one deliverable.' }
            ].map((step, i) => (
              <div key={i} className="text-center">
                <div className={`w-16 h-16 ${cardBg} border-2 ${i === 0 ? 'border-blue-500' : i === 1 ? 'border-purple-500' : 'border-green-500'} rounded-2xl flex items-center justify-center mx-auto mb-6 text-2xl font-bold ${i === 0 ? 'text-blue-500' : i === 1 ? 'text-purple-500' : 'text-green-500'}`}>
                  {step.num}
                </div>
                <h3 className={`text-xl font-bold ${textColor} mb-3`}>{step.title}</h3>
                <p className={mutedText}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-6 py-20 text-center">
          <div className={`${cardBg} rounded-3xl border ${borderColor} p-12`}>
            <h2 className={`text-4xl font-bold ${textColor} mb-6`}>
              Ready to 10x Your Productivity?
            </h2>
            <p className={`text-xl ${mutedText} mb-8`}>
              Join thousands using AI orchestration to get better results faster.
            </p>
            <button
              onClick={() => user ? setView('app') : signInWithGoogle()}
              className="px-10 py-5 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all font-bold text-xl shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Start Free - No Credit Card
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (view === 'upgrade') {
    return (
      <div className={`min-h-screen ${bgColor} transition-colors`}>
        <NavBar />
        
        <div className="max-w-5xl mx-auto px-6 py-16">
          <div className="text-center mb-16">
            <Crown className="w-20 h-20 text-yellow-500 mx-auto mb-6" />
            <h1 className={`text-5xl font-bold ${textColor} mb-4`}>Upgrade to Premium</h1>
            <p className={`text-xl ${mutedText}`}>Unlock unlimited AI orchestration power</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-16">
            <div className={`${cardBg} border ${borderColor} rounded-2xl p-8 hover:border-blue-500 transition-all`}>
              <h3 className={`text-2xl font-bold ${textColor} mb-2`}>Monthly</h3>
              <div className="mb-6">
                <span className="text-5xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 text-transparent bg-clip-text">$15</span>
                <span className={mutedText}>/month</span>
              </div>
              <button className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all font-bold text-lg mb-6">
                Start 7-Day Free Trial
              </button>
              <p className={`text-sm ${mutedText} text-center`}>Cancel anytime</p>
            </div>

            <div className="bg-gradient-to-br from-blue-600 to-purple-700 rounded-2xl p-8 relative border-2 border-yellow-400 shadow-2xl">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-yellow-400 text-slate-900 px-6 py-2 rounded-full text-sm font-bold">
                BEST VALUE
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Yearly</h3>
              <div className="mb-2">
                <span className="text-5xl font-bold text-white">$100</span>
                <span className="text-blue-200">/year</span>
              </div>
              <p className="text-blue-200 mb-6">Save $80 vs monthly</p>
              <button className="w-full py-4 bg-white text-purple-600 rounded-xl hover:bg-blue-50 transition-all font-bold text-lg mb-6">
                Start 7-Day Free Trial
              </button>
              <p className="text-sm text-blue-200 text-center">2 months free</p>
            </div>
          </div>

          <div className={`${cardBg} border ${borderColor} rounded-2xl p-10`}>
            <h3 className={`text-3xl font-bold ${textColor} mb-8 text-center`}>Everything in Premium</h3>
            <div className="grid md:grid-cols-2 gap-6">
              {[
                { title: 'Unlimited Tasks', desc: 'Create as many orchestration tasks as you need' },
                { title: 'Unlimited Chats', desc: 'No limit on follow-up conversations per task' },
                { title: 'Advanced Agents', desc: 'Access specialized AI agents for complex work' },
                { title: 'Faster Processing', desc: 'Priority queue for faster results' },
                { title: 'Priority Support', desc: 'Get help faster with dedicated support' },
                { title: '7-Day Free Trial', desc: 'Try all features risk-free' }
              ].map((feature, i) => (
                <div key={i} className="flex items-start gap-4">
                  <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                  <div>
                    <div className={`font-semibold ${textColor} mb-1`}>{feature.title}</div>
                    <div className={`text-sm ${mutedText}`}>{feature.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`h-screen flex flex-col ${bgColor} transition-colors`}>
      <div className={`${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} border-b px-6 py-4 flex items-center justify-between`}>
        <div className="flex items-center gap-4">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden">
            <Menu className={`w-6 h-6 ${mutedText}`} />
          </button>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
              <Network className="w-5 h-5 text-white" />
            </div>
            <h1 className={`text-xl font-bold ${textColor}`}>Synergy AI</h1>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`p-2 rounded-lg ${darkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100'} transition-colors`}
          >
            {darkMode ? <Sun className="w-5 h-5 text-slate-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
          </button>
          {!userStats.isPremium && (
            <button
              onClick={() => setView('upgrade')}
              className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-yellow-500 text-slate-900 rounded-lg hover:from-yellow-500 hover:to-yellow-600 transition-colors font-semibold flex items-center gap-2"
            >
              <Crown className="w-4 h-4" />
              <span className="hidden sm:inline">Upgrade</span>
            </button>
          )}
          <button onClick={signOut} className={`p-2 rounded-lg ${darkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100'} transition-colors`}>
            <LogOut className={`w-5 h-5 ${mutedText}`} />
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className={`${sidebarOpen ? 'w-64' : 'w-0'} ${cardBg} border-r ${borderColor} transition-all overflow-hidden`}>
          <div className="p-4">
            <button
              onClick={createNewTask}
              className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-colors font-semibold mb-4"
            >
              + New Task
            </button>
            <div className={`text-xs ${mutedText} mb-2`}>
              {userStats.isPremium ? (
                <span className="text-green-500 font-semibold">✓ Premium</span>
              ) : (
                <span>Free: {userStats.tasks}/1 tasks</span>
              )}
            </div>
          </div>
          <div className="overflow-y-auto h-full pb-24">
            {chatHistory.map(chat => (
              <button
                key={chat.id}
                onClick={() => selectChat(chat)}
                className={`w-full text-left px-4 py-3 transition-colors border-l-2 ${
                  currentChat?.id === chat.id 
                    ? `border-blue-500 ${darkMode ? 'bg-slate-700' : 'bg-slate-100'}` 
                    : `border-transparent ${darkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-100'}`
                }`}
              >
                <div className={`font-medium text-sm ${textColor} truncate`}>{chat.title}</div>
                <div className={`text-xs ${mutedText} mt-1`}>
                  {chat.chat_count || 0} {userStats.isPremium ? '' : '/ 5'} chats
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          {!currentChat ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="p-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl inline-block mb-6">
                  <Network className="w-16 h-16 text-white" />
                </div>
                <h2 className={`text-2xl font-semibold ${textColor} mb-2`}>Welcome to Synergy AI</h2>
                <p className={`${mutedText} mb-6`}>Create a new task to get started</p>
                <button
                  onClick={createNewTask}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-colors font-semibold"
                >
                  Create Your First Task
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto p-6">
                {messages.map((msg, i) => (
                  <div key={i} className={`mb-6 ${msg.role === 'user' ? 'text-right' : ''}`}>
                    <div className={`inline-block max-w-3xl p-4 rounded-lg ${
                      msg.role === 'user' 
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white' 
                        : `${cardBg} border ${borderColor} ${textColor}`
                    }`}>
                      <div className="whitespace-pre-line">{msg.content}</div>
                    </div>
                  </div>
                ))}
                {executing && (
                  <div className="mb-6">
                    <div className={`inline-block ${cardBg} border ${borderColor} p-4 rounded-lg`}>
                      <Loader className="w-5 h-5 animate-spin text-blue-500" />
                    </div>
                  </div>
                )}
              </div>

              <div className={`border-t ${borderColor} ${cardBg} p-4`}>
                <div className="max-w-4xl mx-auto flex gap-3">
                  <input
                    type="text"
                    value={task}
                    onChange={(e) => setTask(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !executing && executeTask()}
                    placeholder="Type your message..."
                    className={`flex-1 px-4 py-3 ${cardBg} border ${borderColor} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${textColor}`}
                    disabled={executing}
                  />
                  <button
                    onClick={executeTask}
                    disabled={executing || !task.trim()}
                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {feedbackOpen ? (
        <div className={`fixed bottom-4 right-4 w-80 ${cardBg} rounded-lg shadow-xl border ${borderColor} p-4`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className={`font-semibold ${textColor}`}>Send Feedback</h3>
            <button onClick={() => setFeedbackOpen(false)}>
              <X className={`w-5 h-5 ${mutedText}`} />
            </button>
          </div>
          <textarea
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            placeholder="What can we improve?"
            className={`w-full px-3 py-2 border ${borderColor} ${cardBg} ${textColor} rounded-lg resize-none mb-3`}
            rows="4"
          />
          <button
            onClick={submitFeedback}
            className="w-full py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-colors font-semibold"
          >
            Submit
          </button>
        </div>
      ) : (
        <button
          onClick={() => setFeedbackOpen(true)}
          className="fixed bottom-4 right-4 p-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full shadow-lg hover:from-blue-600 hover:to-purple-700 transition-colors"
        >
          <MessageSquare className="w-6 h-6" />
        </button>
      )}
    </div>
  )
}
