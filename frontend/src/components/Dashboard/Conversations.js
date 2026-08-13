import React, { useState, useEffect } from 'react';
import { MessageSquare, Bot, User, Clock } from 'lucide-react';
import API from '../../utils/api';

const demoSessions = [
  { _id: 's1', sessionId: 'session_001', visitorName: 'Arjun Sharma', visitorEmail: 'arjun@gmail.com', status: 'active', intent: 'test-ride', messages: [
    { role: 'user', content: 'Hi, I want to book a test ride for Nexon EV Max', timestamp: new Date(Date.now()-600000) },
    { role: 'assistant', content: 'Great choice! Please share your preferred date and location.', timestamp: new Date(Date.now()-590000) },
    { role: 'user', content: 'I\'m free this Saturday at 11am', timestamp: new Date(Date.now()-580000) },
    { role: 'assistant', content: 'Perfect! Can I have your phone number to confirm the booking?', timestamp: new Date(Date.now()-570000) },
  ], createdAt: new Date(Date.now()-600000) },
  { _id: 's2', sessionId: 'session_002', visitorName: 'Priya Mehta', visitorEmail: 'priya@mail.com', status: 'closed', intent: 'charging', messages: [
    { role: 'user', content: 'What is the charging time for Tiago EV?', timestamp: new Date(Date.now()-3600000) },
    { role: 'assistant', content: 'The Tiago EV supports 3.3 kW AC charging (~8.7 hrs) and DC fast charging for 0-80% in 35 minutes!', timestamp: new Date(Date.now()-3590000) },
  ], createdAt: new Date(Date.now()-3600000) },
  { _id: 's3', sessionId: 'session_003', visitorName: 'Rohit Verma', visitorEmail: '', status: 'active', intent: 'pricing', messages: [
    { role: 'user', content: 'What is the price of Punch EV?', timestamp: new Date(Date.now()-1800000) },
    { role: 'assistant', content: 'Tata Punch EV starts at Rs 9.99 Lakhs (ex-showroom), going up to Rs 14.49 Lakhs.', timestamp: new Date(Date.now()-1790000) },
    { role: 'user', content: 'Does it qualify for any subsidy?', timestamp: new Date(Date.now()-1780000) },
    { role: 'assistant', content: 'Yes! It qualifies for FAME-II subsidy of up to Rs 1.5 Lakhs. Some states offer additional EV subsidies.', timestamp: new Date(Date.now()-1770000) },
  ], createdAt: new Date(Date.now()-1800000) },
];

export default function Conversations() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    API.get('/chat/sessions' + (filter ? '?status=' + filter : ''))
      .then(r => { setSessions(r.data.sessions); if (r.data.sessions.length) setSelectedId(r.data.sessions[0]._id); })
      .catch(() => { setSessions(demoSessions); setSelectedId('s1'); })
      .finally(() => setLoading(false));
  }, [filter]);

  const selected = sessions.find(s => s._id === selectedId);

  return (
    <div className="space-y-5">
      <div><h1 className="font-display font-bold text-2xl text-white mb-0.5">Conversations</h1><p className="text-gray-500 text-sm">{sessions.length} chat sessions</p></div>
      <div className="flex gap-2">
        {['','active','closed','escalated'].map(s => (
          <button key={s} onClick={() => setFilter(s)} className={`text-xs px-3 py-1.5 rounded-full border transition-colors capitalize ${filter===s?'bg-ev-blue border-ev-blue text-white':'border-ev-border text-gray-400 hover:text-white'}`}>{s||'All'}</button>
        ))}
      </div>
      <div className="grid lg:grid-cols-5 gap-4" style={{height:'calc(100vh - 280px)', minHeight:'400px'}}>
        <div className="lg:col-span-2 card overflow-y-auto">
          {loading ? [...Array(4)].map((_,i)=><div key={i} className="p-4 border-b border-ev-border animate-pulse"><div className="h-4 bg-ev-border rounded mb-2 w-3/4"/><div className="h-3 bg-ev-border rounded w-1/2"/></div>)
          : sessions.map(session => (
            <button key={session._id} onClick={() => setSelectedId(session._id)}
              className={`w-full text-left p-4 border-b border-ev-border hover:bg-ev-border/30 transition-colors ${selectedId===session._id?'bg-ev-blue/10 border-l-2 border-l-ev-blue':''}`}>
              <div className="flex items-start justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-gradient-to-br from-ev-blue to-ev-cyan rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{(session.visitorName||'V').charAt(0).toUpperCase()}</div>
                  <div><div className="text-sm font-medium text-white">{session.visitorName||'Visitor'}</div><div className="text-xs text-gray-500">{session.visitorEmail||'Anonymous'}</div></div>
                </div>
                <div className={`text-xs px-1.5 py-0.5 rounded-full ${session.status==='active'?'text-ev-green bg-ev-green/10':'text-gray-500 bg-ev-border/50'}`}>{session.status}</div>
              </div>
              <div className="text-xs text-gray-500 pl-9 truncate">{session.messages?.[session.messages.length-1]?.content?.slice(0,55)}...</div>
              <div className="text-xs text-gray-600 pl-9 mt-1 flex items-center gap-1">
                <MessageSquare size={10}/> {session.messages?.length||0} msgs · <Clock size={10}/> {new Date(session.createdAt).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}
              </div>
            </button>
          ))}
          {sessions.length===0&&!loading&&<div className="p-8 text-center text-gray-500 text-sm">No conversations</div>}
        </div>
        <div className="lg:col-span-3 card flex flex-col overflow-hidden">
          {selected ? (
            <>
              <div className="p-4 border-b border-ev-border flex items-center gap-3 flex-shrink-0">
                <div className="w-8 h-8 bg-gradient-to-br from-ev-blue to-ev-cyan rounded-full flex items-center justify-center text-white text-sm font-bold">{(selected.visitorName||'V').charAt(0)}</div>
                <div>
                  <div className="font-medium text-white text-sm">{selected.visitorName||'Visitor'}</div>
                  <div className="text-xs text-gray-500">Intent: <span className="text-ev-cyan capitalize">{selected.intent||'general'}</span> · <span className="font-mono">{selected.sessionId?.slice(-8)}</span></div>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {selected.messages?.map((msg,i) => (
                  <div key={i} className={`flex items-start gap-2 ${msg.role==='user'?'flex-row-reverse':''}`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role==='user'?'bg-ev-blue':'bg-ev-border'}`}>
                      {msg.role==='user'?<User size={12} className="text-white"/>:<Bot size={12} className="text-ev-cyan"/>}
                    </div>
                    <div className={`max-w-xs rounded-xl px-3 py-2 text-sm ${msg.role==='user'?'bg-ev-blue/20 text-white rounded-tr-none':'bg-ev-border/50 text-gray-200 rounded-tl-none'}`}>
                      {msg.content}
                      <div className="text-xs text-gray-600 mt-1">{new Date(msg.timestamp).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center"><MessageSquare size={40} className="mx-auto mb-3 opacity-30"/><div className="text-sm">Select a conversation</div></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
