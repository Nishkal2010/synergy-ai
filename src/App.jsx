import React, { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import { Play, Loader, CheckCircle, Network, Menu, LogOut, Crown, Zap, Users, TrendingUp, Send, MessageSquare, X } from 'lucide-react'

export default function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('landing')
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
    setView('landing')
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
      // const response = await fetch('YOUR_MAKE_COM_WEBHOOK_URL', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ task })
      // })
      // const data = await response.json()
      
      // Simulated response for now:
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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  // Landing Page
  if (view === 'landing' && !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="text-center mb-16">
            <div className="flex items-center justify-center gap-3 mb-6">
              <Network className="w-12 h-12 text-blue-600" />
              <h1 className="text-5xl font-bold text-slate-900">Synergy AI</h1>
            </div>
            <p className="text-2xl text-slate-700 mb-8">
              Coordinate Multiple AI Agents for 10x Better Results
            </p>
            <p className="text-lg text-slate-600 mb-12 max-w-2xl mx-auto">
              Stop using one AI for everything. Synergy orchestrates multiple specialist agents 
              working together to deliver professional-grade results in minutes.
            </p>
            <button
              onClick={signInWithGoogle}
              className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-lg inline-flex items-center gap-3"
            >
              Sign in with Google
            </button>
            <p className="text-sm text-slate-500 mt-4">1 free task • 5 chats included</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
              <Zap className="w-12 h-12 text-blue-600 mb-4" />
              <h3 className="text-xl font-semibold mb-3">10x Faster</h3>
              <p className="text-slate-600">Multiple AI agents work in parallel. What takes hours with one AI takes minutes with Synergy.</p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
              <Users className="w-12 h-12 text-blue-600 mb-4" />
              <h3 className="text-xl font-semibold mb-3">Expert Quality</h3>
              <p className="text-slate-600">Specialized agents for research, analysis, strategy, and more. Professional results every time.</p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
              <TrendingUp className="w-12 h-12 text-blue-600 mb-4" />
              <h3 className="text-xl font-semibold mb-3">Better Results</h3>
              <p className="text-slate-600">Coordination produces insights no single AI can match. It's like having a team of experts.</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Upgrade Page
  if (view === 'upgrade') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="max-w-4xl mx-auto px-6 py-16">
          <button
            onClick={() => setView('app')}
            className="mb-8 text-slate-600 hover:text-slate-900 flex items-center gap-2"
          >
            ← Back to App
          </button>

          <div className="text-center mb-12">
            <Crown className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h1 className="text-4xl font-bold mb-4">Upgrade to Premium</h1>
            <p className="text-xl text-slate-600">Unlock the full power of AI orchestration</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="bg-white rounded-xl shadow-lg border-2 border-slate-200 p-8">
              <h3 className="text-2xl font-bold mb-2">Monthly</h3>
              <div className="text-4xl font-bold text-blue-600 mb-6">
                $15<span className="text-lg text-slate-600">/month</span>
              </div>
              <button className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold mb-6">
                Start 7-Day Free Trial
              </button>
            </div>

            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-lg border-2 border-blue-400 p-8 text-white relative">
              <div className="absolute top-4 right-4 bg-yellow-400 text-blue-900 px-3 py-1 rounded-full text-sm font-bold">
                BEST VALUE
              </div>
              <h3 className="text-2xl font-bold mb-2">Yearly</h3>
              <div className="text-4xl font-bold mb-2">
                $100<span className="text-lg opacity-90">/year</span>
              </div>
              <div className="text-sm opacity-90 mb-6">Save $80 vs monthly</div>
              <button className="w-full py-3 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-semibold mb-6">
                Start 7-Day Free Trial
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8">
            <h3 className="text-2xl font-bold mb-6 text-center">Premium Benefits</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                <div>
                  <div className="font-semibold mb-1">Unlimited Tasks</div>
                  <div className="text-sm text-slate-600">Create as many orchestration tasks as you need</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                <div>
                  <div className="font-semibold mb-1">Unlimited Chats</div>
                  <div className="text-sm text-slate-600">No limit on follow-up conversations per task</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                <div>
                  <div className="font-semibold mb-1">Advanced Agents</div>
                  <div className="text-sm text-slate-600">Access to specialized AI agents for complex tasks</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                <div>
                  <div className="font-semibold mb-1">Faster Processing</div>
                  <div className="text-sm text-slate-600">Priority queue for faster results</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                <div>
                  <div className="font-semibold mb-1">Priority Support</div>
                  <div className="text-sm text-slate-600">Get help faster with dedicated support</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                <div>
                  <div className="font-semibold mb-1">7-Day Free Trial</div>
                  <div className="text-sm text-slate-600">Try all features risk-free for a week</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Main App
  return (
    <div className="h-screen flex flex-col bg-slate-50">
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden">
            <Menu className="w-6 h-6 text-slate-600" />
          </button>
          <div className="flex items-center gap-2">
            <Network className="w-6 h-6 text-blue-600" />
            <h1 className="text-xl font-bold text-slate-900">Synergy AI</h1>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {!userStats.isPremium && (
            <button
              onClick={() => setView('upgrade')}
              className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-yellow-500 text-slate-900 rounded-lg hover:from-yellow-500 hover:to-yellow-600 transition-colors font-semibold flex items-center gap-2"
            >
              <Crown className="w-4 h-4" />
              Upgrade
            </button>
          )}
          <button onClick={signOut} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <LogOut className="w-5 h-5 text-slate-600" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className={`${sidebarOpen ? 'w-64' : 'w-0'} bg-white border-r border-slate-200 transition-all overflow-hidden`}>
          <div className="p-4">
            <button
              onClick={createNewTask}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold mb-4"
            >
              + New Task
            </button>
            <div className="text-xs text-slate-500 mb-2">
              {userStats.isPremium ? (
                <span className="text-green-600 font-semibold">✓ Premium</span>
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
                className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors border-l-2 ${
                  currentChat?.id === chat.id ? 'border-blue-600 bg-slate-50' : 'border-transparent'
                }`}
              >
                <div className="font-medium text-sm text-slate-900 truncate">{chat.title}</div>
                <div className="text-xs text-slate-500 mt-1">
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
                <Network className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h2 className="text-2xl font-semibold text-slate-700 mb-2">Welcome to Synergy AI</h2>
                <p className="text-slate-500 mb-6">Create a new task to get started</p>
                <button
                  onClick={createNewTask}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
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
                        ? 'bg-blue-600 text-white' 
                        : 'bg-white border border-slate-200 text-slate-800'
                    }`}>
                      <div className="whitespace-pre-line">{msg.content}</div>
                    </div>
                  </div>
                ))}
                {executing && (
                  <div className="mb-6">
                    <div className="inline-block bg-white border border-slate-200 p-4 rounded-lg">
                      <Loader className="w-5 h-5 animate-spin text-blue-600" />
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-slate-200 bg-white p-4">
                <div className="max-w-4xl mx-auto flex gap-3">
                  <input
                    type="text"
                    value={task}
                    onChange={(e) => setTask(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !executing && executeTask()}
                    placeholder="Type your message..."
                    className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={executing}
                  />
                  <button
                    onClick={executeTask}
                    disabled={executing || !task.trim()}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors font-semibold"
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
        <div className="fixed bottom-4 right-4 w-80 bg-white rounded-lg shadow-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Send Feedback</h3>
            <button onClick={() => setFeedbackOpen(false)}>
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>
          <textarea
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            placeholder="What can we improve?"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg resize-none mb-3"
            rows="4"
          />
          <button
            onClick={submitFeedback}
            className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            Submit
          </button>
        </div>
      ) : (
        <button
          onClick={() => setFeedbackOpen(true)}
          className="fixed bottom-4 right-4 p-4 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors"
        >
          <MessageSquare className="w-6 h-6" />
        </button>
      )}
    </div>
  )
}
