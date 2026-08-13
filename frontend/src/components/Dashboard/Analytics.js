import React, { useState, useEffect } from 'react';
import { TrendingUp, Users, MessageSquare, Calendar, ArrowUp } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import API from '../../utils/api';

const COLORS = ['#0066FF','#00D4FF','#00FF88','#FF6B00','#A78BFA'];
const demoStats = {
  totalLeads:342,newLeads:47,convertedLeads:89,conversionRate:26.0,
  totalBookings:128,pendingBookings:34,totalChats:1204,recentChats:156,
  leadsByStatus:[{_id:'new',count:120},{_id:'contacted',count:98},{_id:'qualified',count:75},{_id:'converted',count:89},{_id:'lost',count:40}],
  leadsBySource:[{_id:'chatbot',count:180},{_id:'voice',count:95},{_id:'form',count:42},{_id:'demo-booking',count:25}],
  dailyLeads:[{_id:'07-14',count:8},{_id:'07-15',count:12},{_id:'07-16',count:6},{_id:'07-17',count:15},{_id:'07-18',count:9},{_id:'07-19',count:11},{_id:'07-20',count:18}]
};
const mockMonthly=[
  {month:'Feb',leads:180,conversions:38},{month:'Mar',leads:220,conversions:52},{month:'Apr',leads:195,conversions:45},
  {month:'May',leads:280,conversions:70},{month:'Jun',leads:310,conversions:82},{month:'Jul',leads:342,conversions:89},
];
const CT = ({active,payload,label}) => active&&payload?.length?<div className="bg-ev-card border border-ev-border rounded-lg px-3 py-2 text-xs"><div className="text-gray-400 mb-1">{label}</div>{payload.map((p,i)=><div key={i} style={{color:p.color}}>{p.name}: <span className="font-medium text-white">{p.value}</span></div>)}</div>:null;

export default function Analytics() {
  const [stats,setStats]=useState(null);
  const [loading,setLoading]=useState(true);
  useEffect(()=>{API.get('/analytics/dashboard').then(r=>setStats(r.data.stats)).catch(()=>setStats(demoStats)).finally(()=>setLoading(false));},[]);
  const s=stats||demoStats;
  if(loading)return<div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-ev-blue border-t-transparent rounded-full animate-spin"/></div>;
  return(
    <div className="space-y-6">
      <div><h1 className="font-display font-bold text-2xl text-white mb-0.5">Analytics</h1><p className="text-gray-500 text-sm">Performance insights across all AI touchpoints.</p></div>
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          {t:'Total Leads',v:s.totalLeads,s:`${s.newLeads} new this month`,c:'bg-ev-blue',I:Users},
          {t:'Conversion Rate',v:`${s.conversionRate}%`,s:`${s.convertedLeads} converted`,c:'bg-green-600',I:TrendingUp},
          {t:'Bookings',v:s.totalBookings,s:`${s.pendingBookings} pending`,c:'bg-purple-500',I:Calendar},
          {t:'AI Chats',v:s.totalChats,s:`${s.recentChats} this week`,c:'bg-orange-500',I:MessageSquare},
        ].map(({t,v,s:sub,c,I})=>(
          <div key={t} className="card p-5">
            <div className="flex justify-between mb-3"><div className={`w-9 h-9 rounded-lg flex items-center justify-center ${c}`}><I size={17} className="text-white"/></div><div className="flex items-center gap-1 text-xs text-ev-green"><ArrowUp size={11}/>+12%</div></div>
            <div className="font-display font-bold text-2xl text-white mb-0.5">{v}</div>
            <div className="text-sm text-gray-400">{t}</div><div className="text-xs text-gray-600">{sub}</div>
          </div>
        ))}
      </div>
      <div className="card p-5">
        <div className="font-display font-semibold text-white mb-4">6-Month Performance</div>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={mockMonthly}>
            <defs>
              <linearGradient id="lG" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#0066FF" stopOpacity={0.3}/><stop offset="95%" stopColor="#0066FF" stopOpacity={0}/></linearGradient>
              <linearGradient id="cG" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#00FF88" stopOpacity={0.3}/><stop offset="95%" stopColor="#00FF88" stopOpacity={0}/></linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1A2540"/>
            <XAxis dataKey="month" tick={{fill:'#6B7280',fontSize:11}} axisLine={false} tickLine={false}/>
            <YAxis tick={{fill:'#6B7280',fontSize:11}} axisLine={false} tickLine={false}/>
            <Tooltip content={<CT/>}/>
            <Area type="monotone" dataKey="leads" name="Leads" stroke="#0066FF" fill="url(#lG)" strokeWidth={2}/>
            <Area type="monotone" dataKey="conversions" name="Conversions" stroke="#00FF88" fill="url(#cG)" strokeWidth={2}/>
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <div className="font-display font-semibold text-white mb-4">Lead Pipeline</div>
          <div className="space-y-3">
            {s.leadsByStatus.map(({_id,count},i)=>{const pct=Math.round(count/s.totalLeads*100);return(
              <div key={_id}><div className="flex justify-between text-xs mb-1"><span className="text-gray-400 capitalize">{_id}</span><span className="text-white">{count} ({pct}%)</span></div>
              <div className="w-full bg-ev-border rounded-full h-2"><div className="h-2 rounded-full" style={{width:`${pct}%`,background:COLORS[i%COLORS.length]}}/></div></div>
            );})}
          </div>
        </div>
        <div className="card p-5">
          <div className="font-display font-semibold text-white mb-4">Sources</div>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width={140} height={140}>
              <PieChart><Pie data={s.leadsBySource} cx="50%" cy="50%" innerRadius={35} outerRadius={65} paddingAngle={4} dataKey="count" nameKey="_id">
                {s.leadsBySource.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
              </Pie><Tooltip content={<CT/>}/></PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {s.leadsBySource.map(({_id,count},i)=>(
                <div key={_id} className="flex justify-between items-center">
                  <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full" style={{background:COLORS[i%COLORS.length]}}/><span className="text-sm text-gray-300 capitalize">{_id}</span></div>
                  <span className="text-sm font-medium text-white">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="card p-5">
        <div className="font-display font-semibold text-white mb-4">Daily Leads — Last 7 Days</div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={s.dailyLeads.map(d=>({date:d._id,leads:d.count}))}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1A2540"/>
            <XAxis dataKey="date" tick={{fill:'#6B7280',fontSize:11}} axisLine={false} tickLine={false}/>
            <YAxis tick={{fill:'#6B7280',fontSize:11}} axisLine={false} tickLine={false}/>
            <Tooltip content={<CT/>}/>
            <Bar dataKey="leads" name="Leads" radius={[4,4,0,0]}>
              {s.dailyLeads.map((_,i)=><Cell key={i} fill={i===s.dailyLeads.length-1?'#00D4FF':'#0066FF'}/>)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
