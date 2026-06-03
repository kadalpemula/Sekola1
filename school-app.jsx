import { useState, useEffect, useRef } from "react";

const SUBJECTS = [
  "Matematika","Bahasa Indonesia","Bahasa Inggris","B. Inggris TL",
  "Bahasa Jawa","Ekonomi","Informatika","Sejarah",
  "PAI (Agama)","PKN","PKWU (Prakarya)","Bahasa Mandarin",
  "Seni Budaya"
];
const SUBJECT_COLORS = {
  "Matematika": "#FF6B6B",
  "Bahasa Indonesia": "#4ECDC4",
  "Bahasa Inggris": "#45B7D1",
  "B. Inggris TL": "#00CEC9",
  "Bahasa Jawa": "#E17055",
  "Ekonomi": "#FDCB6E",
  "Informatika": "#6C63FF",
  "Sejarah": "#A29BFE",
  "PAI (Agama)": "#55EFC4",
  "PKN": "#DDA0DD",
  "PKWU (Prakarya)": "#FAB1A0",
  "Bahasa Mandarin": "#FF7675",
  "Seni Budaya": "#FD79A8"
};

const DAYS = ["Sen","Sel","Rab","Kam","Jum","Sab"];
const FULL_DAYS = ["Senin","Selasa","Rabu","Kamis","Jumat","Sabtu"];

function useLocalStorage(key, init) {
  const [val, setVal] = useState(() => {
    try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : init; } catch { return init; }
  });
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} }, [key, val]);
  return [val, setVal];
}

function formatDate(d) {
  return new Date(d).toLocaleDateString("id-ID", { day:"numeric", month:"short", year:"numeric" });
}
function daysLeft(due) {
  const diff = Math.ceil((new Date(due) - new Date()) / 86400000);
  if (diff < 0) return "Terlambat!";
  if (diff === 0) return "Hari ini!";
  return `${diff} hari lagi`;
}
function urgencyColor(due) {
  const diff = Math.ceil((new Date(due) - new Date()) / 86400000);
  if (diff < 0) return "#FF4757";
  if (diff === 0) return "#FF6348";
  if (diff <= 2) return "#FFA502";
  return "#2ED573";
}

export default function SchoolApp() {
  const [tab, setTab] = useState("dashboard");
  const [homeworks, setHomeworks] = useLocalStorage("hw", []);
  const [notes, setNotes] = useLocalStorage("notes", []);
  const [schedule, setSchedule] = useLocalStorage("schedule", {
    Senin:[], Selasa:[], Rabu:[], Kamis:[], Jumat:[], Sabtu:[]
  });
  const [studySessions, setStudySessions] = useLocalStorage("study", []);
  const [showModal, setShowModal] = useState(null);
  const [timer, setTimer] = useState({ running:false, seconds:0, mode:"pomodoro" });
  const timerRef = useRef(null);

  // HW Form state
  const [hwForm, setHwForm] = useState({ subject:"Matematika", title:"", desc:"", due:"", priority:"normal" });
  // Note form
  const [noteForm, setNoteForm] = useState({ subject:"Matematika", title:"", content:"" });
  // Schedule form
  const [schedForm, setSchedForm] = useState({ day:"Senin", subject:"Matematika", time:"07:00", room:"" });
  // Study timer
  const [studySubject, setStudySubject] = useState("Matematika");

  // Timer logic
  useEffect(() => {
    if (timer.running) {
      timerRef.current = setInterval(() => setTimer(t => ({ ...t, seconds: t.seconds + 1 })), 1000);
    } else clearInterval(timerRef.current);
    return () => clearInterval(timerRef.current);
  }, [timer.running]);

  const fmtTime = (s) => `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;

  const today = FULL_DAYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1] || "Senin";
  const todaySchedule = schedule[today] || [];
  const pendingHW = homeworks.filter(h => !h.done);
  const doneHW = homeworks.filter(h => h.done);
  const urgentHW = pendingHW.filter(h => {
    const diff = Math.ceil((new Date(h.due) - new Date()) / 86400000);
    return diff <= 2;
  });

  function addHW() {
    if (!hwForm.title || !hwForm.due) return;
    setHomeworks(prev => [...prev, { ...hwForm, id: Date.now(), done: false, created: new Date().toISOString() }]);
    setHwForm({ subject:"Matematika", title:"", desc:"", due:"", priority:"normal" });
    setShowModal(null);
  }
  function toggleHW(id) {
    setHomeworks(prev => prev.map(h => h.id === id ? { ...h, done: !h.done } : h));
  }
  function deleteHW(id) {
    setHomeworks(prev => prev.filter(h => h.id !== id));
  }
  function addNote() {
    if (!noteForm.title || !noteForm.content) return;
    setNotes(prev => [...prev, { ...noteForm, id: Date.now(), created: new Date().toISOString() }]);
    setNoteForm({ subject:"Matematika", title:"", content:"" });
    setShowModal(null);
  }
  function addSchedule() {
    if (!schedForm.subject) return;
    setSchedule(prev => ({
      ...prev,
      [schedForm.day]: [...(prev[schedForm.day]||[]), { ...schedForm, id: Date.now() }]
        .sort((a,b) => a.time.localeCompare(b.time))
    }));
    setSchedForm({ day:"Senin", subject:"Matematika", time:"07:00", room:"" });
    setShowModal(null);
  }
  function saveStudy() {
    if (timer.seconds < 60) return;
    setStudySessions(prev => [...prev, {
      subject: studySubject, seconds: timer.seconds, date: new Date().toISOString(), id: Date.now()
    }]);
    setTimer({ running:false, seconds:0, mode:"pomodoro" });
  }

  const totalStudyToday = studySessions
    .filter(s => new Date(s.date).toDateString() === new Date().toDateString())
    .reduce((a,s) => a + s.seconds, 0);

  const tabs = [
    { id:"dashboard", icon:"🏠", label:"Beranda" },
    { id:"homework", icon:"📝", label:"PR" },
    { id:"schedule", icon:"📅", label:"Jadwal" },
    { id:"notes", icon:"📖", label:"Catatan" },
    { id:"study", icon:"⏱️", label:"Belajar" },
  ];

  return (
    <div style={{
      minHeight:"100vh", background:"#0A0E1A", color:"#E8EAF0",
      fontFamily:"'Nunito', 'Segoe UI', sans-serif", maxWidth:420, margin:"0 auto",
      position:"relative", paddingBottom:80
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #0A0E1A; }
        ::-webkit-scrollbar-thumb { background: #2A3050; border-radius: 4px; }
        input, textarea, select {
          background: #151929 !important; border: 1.5px solid #2A3050 !important;
          color: #E8EAF0 !important; border-radius: 10px !important;
          padding: 10px 14px !important; font-family: inherit !important;
          font-size: 14px !important; width: 100%;
          outline: none !important; transition: border-color .2s;
        }
        input:focus, textarea:focus, select:focus { border-color: #6C63FF !important; }
        .btn {
          cursor: pointer; border: none; border-radius: 12px;
          font-family: inherit; font-weight: 700; transition: all .15s;
          display: inline-flex; align-items: center; gap: 6px;
        }
        .btn:active { transform: scale(.96); }
        .card {
          background: #12172A; border-radius: 16px;
          padding: 16px; border: 1px solid #1E2540;
        }
        .pill {
          display:inline-block; border-radius:20px; padding:3px 10px;
          font-size:11px; font-weight:700; letter-spacing:.5px;
        }
        .hw-item {
          background:#12172A; border-radius:14px; padding:14px;
          border:1px solid #1E2540; margin-bottom:10px;
          transition: opacity .2s;
        }
        .hw-item.done { opacity:.5; }
        .checkbox {
          width:22px;height:22px;border-radius:8px;border:2px solid #6C63FF;
          display:flex;align-items:center;justify-content:center;
          cursor:pointer;flex-shrink:0;transition:all .15s;
          background:transparent;
        }
        .checkbox.checked { background:#6C63FF; border-color:#6C63FF; }
        .modal-bg {
          position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:100;
          display:flex;align-items:flex-end;justify-content:center;
          backdrop-filter:blur(4px);
        }
        .modal {
          background:#12172A;border-radius:24px 24px 0 0;
          padding:24px;width:100%;max-width:420px;
          border:1px solid #2A3050; max-height:85vh; overflow-y:auto;
        }
        .tab-bar {
          position:fixed;bottom:0;left:50%;transform:translateX(-50%);
          width:100%;max-width:420px;background:#0D1120;
          border-top:1px solid #1E2540;padding:8px 0 4px;
          display:flex;justify-content:space-around;z-index:50;
        }
        .tab-btn {
          display:flex;flex-direction:column;align-items:center;
          gap:2px;cursor:pointer;padding:4px 12px;
          border:none;background:none;color:#5A6080;
          font-size:10px;font-weight:700;font-family:inherit;
          transition:color .15s;
        }
        .tab-btn.active { color:#6C63FF; }
        .badge {
          position:absolute;top:-4px;right:-4px;
          background:#FF4757;color:#fff;border-radius:10px;
          font-size:10px;font-weight:800;padding:0 5px;min-width:16px;
          text-align:center;
        }
        .note-card {
          background:#12172A;border-radius:14px;padding:14px;
          border:1px solid #1E2540;margin-bottom:10px;
        }
        .timer-ring {
          width:180px;height:180px;position:relative;margin:0 auto;
        }
        .sched-item {
          display:flex;gap:12px;align-items:center;
          background:#12172A;border-radius:12px;padding:12px;
          margin-bottom:8px;border:1px solid #1E2540;
        }
        .stat-box {
          background:#12172A;border-radius:14px;padding:14px;
          border:1px solid #1E2540;flex:1;text-align:center;
        }
        input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(1); }
      `}</style>

      {/* Header */}
      <div style={{ padding:"20px 20px 10px", background:"#0A0E1A" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <div style={{ fontSize:22, fontWeight:900, letterSpacing:-0.5 }}>
              📚 <span style={{ background:"linear-gradient(135deg,#6C63FF,#48CAE4)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>SchoolMate</span>
            </div>
            <div style={{ fontSize:12, color:"#5A6080", marginTop:2 }}>
              {new Date().toLocaleDateString("id-ID", { weekday:"long", day:"numeric", month:"long" })}
            </div>
          </div>
          <div style={{ textAlign:"right" }}>
            <div style={{ fontSize:11, color:"#5A6080" }}>Belajar hari ini</div>
            <div style={{ fontSize:16, fontWeight:800, color:"#48CAE4" }}>{fmtTime(totalStudyToday)}</div>
          </div>
        </div>
      </div>

      {/* DASHBOARD */}
      {tab === "dashboard" && (
        <div style={{ padding:"0 16px" }}>
          {/* Stats row */}
          <div style={{ display:"flex", gap:10, marginBottom:16 }}>
            <div className="stat-box">
              <div style={{ fontSize:28, fontWeight:900, color:"#FF6B6B" }}>{pendingHW.length}</div>
              <div style={{ fontSize:11, color:"#5A6080", fontWeight:700 }}>PR Pending</div>
            </div>
            <div className="stat-box">
              <div style={{ fontSize:28, fontWeight:900, color:"#FFA502" }}>{urgentHW.length}</div>
              <div style={{ fontSize:11, color:"#5A6080", fontWeight:700 }}>Mendesak</div>
            </div>
            <div className="stat-box">
              <div style={{ fontSize:28, fontWeight:900, color:"#2ED573" }}>{doneHW.length}</div>
              <div style={{ fontSize:11, color:"#5A6080", fontWeight:700 }}>Selesai</div>
            </div>
          </div>

          {/* Today's schedule */}
          <div className="card" style={{ marginBottom:16 }}>
            <div style={{ fontWeight:800, marginBottom:12, display:"flex", justifyContent:"space-between" }}>
              <span>📅 Jadwal Hari Ini <span style={{ color:"#6C63FF" }}>({today})</span></span>
              <span style={{ fontSize:12, color:"#5A6080" }}>{todaySchedule.length} pelajaran</span>
            </div>
            {todaySchedule.length === 0 ? (
              <div style={{ textAlign:"center", color:"#5A6080", fontSize:13, padding:"10px 0" }}>Tidak ada pelajaran hari ini 🎉</div>
            ) : todaySchedule.map(s => (
              <div key={s.id} style={{ display:"flex", gap:10, alignItems:"center", marginBottom:8 }}>
                <div style={{ background:SUBJECT_COLORS[s.subject]+"22", borderRadius:8, padding:"6px 10px", fontSize:12, fontWeight:800, color:SUBJECT_COLORS[s.subject], minWidth:52, textAlign:"center" }}>{s.time}</div>
                <div>
                  <div style={{ fontWeight:700, fontSize:14 }}>{s.subject}</div>
                  {s.room && <div style={{ fontSize:11, color:"#5A6080" }}>Ruang {s.room}</div>}
                </div>
              </div>
            ))}
          </div>

          {/* Urgent PR */}
          {urgentHW.length > 0 && (
            <div className="card" style={{ marginBottom:16, borderColor:"#FF4757" }}>
              <div style={{ fontWeight:800, marginBottom:12, color:"#FF6B6B" }}>🚨 PR Mendesak!</div>
              {urgentHW.map(h => (
                <div key={h.id} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
                  <div className={`checkbox ${h.done?"checked":""}`} onClick={() => toggleHW(h.id)}>
                    {h.done && <span style={{ color:"#fff", fontSize:12 }}>✓</span>}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:700, fontSize:14 }}>{h.title}</div>
                    <div style={{ fontSize:11 }}>
                      <span className="pill" style={{ background:SUBJECT_COLORS[h.subject]+"22", color:SUBJECT_COLORS[h.subject] }}>{h.subject}</span>
                      <span style={{ color:urgencyColor(h.due), fontWeight:700, marginLeft:6 }}>{daysLeft(h.due)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Quick actions */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:16 }}>
            <button className="btn" onClick={() => setShowModal("hw")} style={{ background:"linear-gradient(135deg,#6C63FF,#9C88FF)", color:"#fff", padding:"14px", justifyContent:"center", fontSize:14 }}>
              ➕ Tambah PR
            </button>
            <button className="btn" onClick={() => setTab("study")} style={{ background:"linear-gradient(135deg,#48CAE4,#00B4D8)", color:"#fff", padding:"14px", justifyContent:"center", fontSize:14 }}>
              ⏱️ Mulai Belajar
            </button>
          </div>
        </div>
      )}

      {/* HOMEWORK */}
      {tab === "homework" && (
        <div style={{ padding:"0 16px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
            <div style={{ fontWeight:900, fontSize:18 }}>📝 Daftar PR</div>
            <button className="btn" onClick={() => setShowModal("hw")} style={{ background:"#6C63FF", color:"#fff", padding:"8px 16px", fontSize:13 }}>
              + Tambah
            </button>
          </div>
          {pendingHW.length === 0 && doneHW.length === 0 && (
            <div style={{ textAlign:"center", padding:"40px 0", color:"#5A6080" }}>
              <div style={{ fontSize:48 }}>📭</div>
              <div style={{ marginTop:10, fontWeight:700 }}>Belum ada PR!</div>
              <div style={{ fontSize:13, marginTop:4 }}>Tambahkan PR pertamamu</div>
            </div>
          )}
          {pendingHW.length > 0 && (
            <>
              <div style={{ fontSize:12, color:"#5A6080", fontWeight:700, marginBottom:8, textTransform:"uppercase", letterSpacing:1 }}>Belum Selesai ({pendingHW.length})</div>
              {pendingHW.sort((a,b) => new Date(a.due) - new Date(b.due)).map(h => (
                <div className="hw-item" key={h.id}>
                  <div style={{ display:"flex", gap:12, alignItems:"flex-start" }}>
                    <div className="checkbox" onClick={() => toggleHW(h.id)}>
                      {h.done && <span style={{ color:"#fff", fontSize:12 }}>✓</span>}
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:800, fontSize:15 }}>{h.title}</div>
                      {h.desc && <div style={{ fontSize:12, color:"#8890AA", marginTop:3 }}>{h.desc}</div>}
                      <div style={{ display:"flex", gap:8, marginTop:6, flexWrap:"wrap", alignItems:"center" }}>
                        <span className="pill" style={{ background:SUBJECT_COLORS[h.subject]+"22", color:SUBJECT_COLORS[h.subject] }}>{h.subject}</span>
                        <span style={{ fontSize:11, color:"#5A6080" }}>📅 {formatDate(h.due)}</span>
                        <span style={{ fontSize:11, color:urgencyColor(h.due), fontWeight:700 }}>{daysLeft(h.due)}</span>
                        {h.priority === "high" && <span className="pill" style={{ background:"#FF475722", color:"#FF4757" }}>🔥 Penting</span>}
                      </div>
                    </div>
                    <button className="btn" onClick={() => deleteHW(h.id)} style={{ background:"transparent", color:"#FF4757", fontSize:16, padding:"2px 4px" }}>🗑</button>
                  </div>
                </div>
              ))}
            </>
          )}
          {doneHW.length > 0 && (
            <>
              <div style={{ fontSize:12, color:"#5A6080", fontWeight:700, margin:"16px 0 8px", textTransform:"uppercase", letterSpacing:1 }}>Selesai ({doneHW.length})</div>
              {doneHW.map(h => (
                <div className="hw-item done" key={h.id}>
                  <div style={{ display:"flex", gap:12, alignItems:"center" }}>
                    <div className="checkbox checked" onClick={() => toggleHW(h.id)}>
                      <span style={{ color:"#fff", fontSize:12 }}>✓</span>
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:700, fontSize:14, textDecoration:"line-through" }}>{h.title}</div>
                      <span className="pill" style={{ background:SUBJECT_COLORS[h.subject]+"22", color:SUBJECT_COLORS[h.subject] }}>{h.subject}</span>
                    </div>
                    <button className="btn" onClick={() => deleteHW(h.id)} style={{ background:"transparent", color:"#FF4757", fontSize:16, padding:"2px 4px" }}>🗑</button>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {/* SCHEDULE */}
      {tab === "schedule" && (
        <div style={{ padding:"0 16px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
            <div style={{ fontWeight:900, fontSize:18 }}>📅 Jadwal Pelajaran</div>
            <button className="btn" onClick={() => setShowModal("sched")} style={{ background:"#6C63FF", color:"#fff", padding:"8px 16px", fontSize:13 }}>+ Tambah</button>
          </div>
          {FULL_DAYS.map(day => (
            <div key={day} style={{ marginBottom:14 }}>
              <div style={{
                fontWeight:800, fontSize:13, textTransform:"uppercase", letterSpacing:1,
                color: day === today ? "#6C63FF" : "#5A6080",
                marginBottom:6, display:"flex", alignItems:"center", gap:8
              }}>
                {day} {day === today && <span style={{ background:"#6C63FF22", color:"#6C63FF", borderRadius:6, padding:"1px 6px", fontSize:10 }}>HARI INI</span>}
              </div>
              {(schedule[day]||[]).length === 0 ? (
                <div style={{ fontSize:12, color:"#2A3050", padding:"8px 12px", background:"#12172A", borderRadius:10 }}>Tidak ada pelajaran</div>
              ) : (schedule[day]||[]).map(s => (
                <div className="sched-item" key={s.id}>
                  <div style={{ background:SUBJECT_COLORS[s.subject]+"22", borderRadius:8, padding:"6px 10px", fontSize:12, fontWeight:800, color:SUBJECT_COLORS[s.subject], minWidth:52, textAlign:"center" }}>{s.time}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:700 }}>{s.subject}</div>
                    {s.room && <div style={{ fontSize:11, color:"#5A6080" }}>Ruang {s.room}</div>}
                  </div>
                  <button className="btn" onClick={() => setSchedule(prev => ({ ...prev, [day]: prev[day].filter(x => x.id !== s.id) }))} style={{ background:"transparent", color:"#3A4060", fontSize:14, padding:"2px" }}>✕</button>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* NOTES */}
      {tab === "notes" && (
        <div style={{ padding:"0 16px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
            <div style={{ fontWeight:900, fontSize:18 }}>📖 Catatan Belajar</div>
            <button className="btn" onClick={() => setShowModal("note")} style={{ background:"#6C63FF", color:"#fff", padding:"8px 16px", fontSize:13 }}>+ Tambah</button>
          </div>
          {notes.length === 0 ? (
            <div style={{ textAlign:"center", padding:"40px 0", color:"#5A6080" }}>
              <div style={{ fontSize:48 }}>📝</div>
              <div style={{ marginTop:10, fontWeight:700 }}>Belum ada catatan</div>
            </div>
          ) : notes.map(n => (
            <div className="note-card" key={n.id}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                <div style={{ flex:1 }}>
                  <span className="pill" style={{ background:SUBJECT_COLORS[n.subject]+"22", color:SUBJECT_COLORS[n.subject], marginBottom:6, display:"inline-block" }}>{n.subject}</span>
                  <div style={{ fontWeight:800, fontSize:15, marginBottom:6 }}>{n.title}</div>
                  <div style={{ fontSize:13, color:"#8890AA", lineHeight:1.6, whiteSpace:"pre-wrap" }}>{n.content}</div>
                  <div style={{ fontSize:11, color:"#3A4060", marginTop:8 }}>{formatDate(n.created)}</div>
                </div>
                <button className="btn" onClick={() => setNotes(prev => prev.filter(x => x.id !== n.id))} style={{ background:"transparent", color:"#FF4757", fontSize:16, padding:"2px 4px", marginLeft:8 }}>🗑</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* STUDY TIMER */}
      {tab === "study" && (
        <div style={{ padding:"0 16px" }}>
          <div style={{ fontWeight:900, fontSize:18, marginBottom:16 }}>⏱️ Timer Belajar</div>
          
          {/* Timer display */}
          <div className="card" style={{ textAlign:"center", marginBottom:16 }}>
            <div style={{ fontSize:64, fontWeight:900, letterSpacing:2, color:"#48CAE4", margin:"10px 0", fontVariantNumeric:"tabular-nums" }}>
              {fmtTime(timer.seconds)}
            </div>
            <div style={{ marginBottom:16 }}>
              <select value={studySubject} onChange={e => setStudySubject(e.target.value)} style={{ maxWidth:200 }}>
                {SUBJECTS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div style={{ display:"flex", gap:10, justifyContent:"center" }}>
              <button className="btn" onClick={() => setTimer(t => ({ ...t, running: !t.running }))} style={{
                background: timer.running ? "#FF4757" : "linear-gradient(135deg,#48CAE4,#6C63FF)",
                color:"#fff", padding:"12px 28px", fontSize:15
              }}>
                {timer.running ? "⏸ Pause" : "▶ Mulai"}
              </button>
              <button className="btn" onClick={() => setTimer({ running:false, seconds:0, mode:"pomodoro" })} style={{ background:"#1E2540", color:"#E8EAF0", padding:"12px 20px", fontSize:15 }}>
                ↺ Reset
              </button>
            </div>
            {timer.seconds >= 60 && !timer.running && (
              <button className="btn" onClick={saveStudy} style={{ background:"#2ED573", color:"#fff", padding:"10px 24px", marginTop:12, fontSize:14 }}>
                💾 Simpan Sesi
              </button>
            )}
          </div>

          {/* Stats */}
          <div className="card" style={{ marginBottom:16 }}>
            <div style={{ fontWeight:800, marginBottom:12 }}>📊 Rekap Belajar Hari Ini</div>
            {studySessions.filter(s => new Date(s.date).toDateString() === new Date().toDateString()).length === 0 ? (
              <div style={{ color:"#5A6080", fontSize:13 }}>Belum ada sesi belajar hari ini</div>
            ) : (
              <>
                {studySessions.filter(s => new Date(s.date).toDateString() === new Date().toDateString()).map(s => (
                  <div key={s.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 0", borderBottom:"1px solid #1E2540" }}>
                    <span className="pill" style={{ background:SUBJECT_COLORS[s.subject]+"22", color:SUBJECT_COLORS[s.subject] }}>{s.subject}</span>
                    <span style={{ fontWeight:700, color:"#48CAE4" }}>{fmtTime(s.seconds)}</span>
                  </div>
                ))}
                <div style={{ display:"flex", justifyContent:"space-between", marginTop:10, fontWeight:800 }}>
                  <span>Total</span>
                  <span style={{ color:"#2ED573" }}>{fmtTime(totalStudyToday)}</span>
                </div>
              </>
            )}
          </div>

          {/* Study tips */}
          <div className="card" style={{ background:"linear-gradient(135deg,#6C63FF15,#48CAE415)", borderColor:"#6C63FF33" }}>
            <div style={{ fontWeight:800, marginBottom:10, color:"#6C63FF" }}>💡 Tips Belajar</div>
            {["Gunakan teknik Pomodoro: 25 menit fokus, 5 menit istirahat",
              "Buat ringkasan setelah belajar untuk memperkuat memori",
              "Hindari gadget saat sesi belajar sedang berlangsung",
              "Minum air putih cukup untuk menjaga konsentrasi"].map((tip, i) => (
              <div key={i} style={{ fontSize:12, color:"#8890AA", marginBottom:8, paddingLeft:14, position:"relative" }}>
                <span style={{ position:"absolute", left:0, color:"#6C63FF" }}>•</span>
                {tip}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODALS */}
      {showModal === "hw" && (
        <div className="modal-bg" onClick={e => e.target === e.currentTarget && setShowModal(null)}>
          <div className="modal">
            <div style={{ fontWeight:900, fontSize:18, marginBottom:20 }}>➕ Tambah PR</div>
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              <select value={hwForm.subject} onChange={e => setHwForm(f => ({ ...f, subject: e.target.value }))}>
                {SUBJECTS.map(s => <option key={s}>{s}</option>)}
              </select>
              <input placeholder="Judul PR *" value={hwForm.title} onChange={e => setHwForm(f => ({ ...f, title: e.target.value }))} />
              <textarea placeholder="Deskripsi (opsional)" rows={3} value={hwForm.desc} onChange={e => setHwForm(f => ({ ...f, desc: e.target.value }))} style={{ resize:"none" }} />
              <div>
                <div style={{ fontSize:12, color:"#5A6080", marginBottom:6 }}>Deadline *</div>
                <input type="date" value={hwForm.due} onChange={e => setHwForm(f => ({ ...f, due: e.target.value }))} />
              </div>
              <select value={hwForm.priority} onChange={e => setHwForm(f => ({ ...f, priority: e.target.value }))}>
                <option value="normal">Prioritas Normal</option>
                <option value="high">🔥 Prioritas Tinggi</option>
              </select>
              <div style={{ display:"flex", gap:10, marginTop:4 }}>
                <button className="btn" onClick={() => setShowModal(null)} style={{ flex:1, background:"#1E2540", color:"#E8EAF0", padding:"12px", justifyContent:"center" }}>Batal</button>
                <button className="btn" onClick={addHW} style={{ flex:2, background:"linear-gradient(135deg,#6C63FF,#9C88FF)", color:"#fff", padding:"12px", justifyContent:"center" }}>Simpan PR</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showModal === "note" && (
        <div className="modal-bg" onClick={e => e.target === e.currentTarget && setShowModal(null)}>
          <div className="modal">
            <div style={{ fontWeight:900, fontSize:18, marginBottom:20 }}>📝 Tambah Catatan</div>
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              <select value={noteForm.subject} onChange={e => setNoteForm(f => ({ ...f, subject: e.target.value }))}>
                {SUBJECTS.map(s => <option key={s}>{s}</option>)}
              </select>
              <input placeholder="Judul Catatan *" value={noteForm.title} onChange={e => setNoteForm(f => ({ ...f, title: e.target.value }))} />
              <textarea placeholder="Isi catatan..." rows={5} value={noteForm.content} onChange={e => setNoteForm(f => ({ ...f, content: e.target.value }))} style={{ resize:"none" }} />
              <div style={{ display:"flex", gap:10 }}>
                <button className="btn" onClick={() => setShowModal(null)} style={{ flex:1, background:"#1E2540", color:"#E8EAF0", padding:"12px", justifyContent:"center" }}>Batal</button>
                <button className="btn" onClick={addNote} style={{ flex:2, background:"linear-gradient(135deg,#6C63FF,#9C88FF)", color:"#fff", padding:"12px", justifyContent:"center" }}>Simpan</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showModal === "sched" && (
        <div className="modal-bg" onClick={e => e.target === e.currentTarget && setShowModal(null)}>
          <div className="modal">
            <div style={{ fontWeight:900, fontSize:18, marginBottom:20 }}>📅 Tambah Jadwal</div>
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              <select value={schedForm.day} onChange={e => setSchedForm(f => ({ ...f, day: e.target.value }))}>
                {FULL_DAYS.map(d => <option key={d}>{d}</option>)}
              </select>
              <select value={schedForm.subject} onChange={e => setSchedForm(f => ({ ...f, subject: e.target.value }))}>
                {SUBJECTS.map(s => <option key={s}>{s}</option>)}
              </select>
              <div>
                <div style={{ fontSize:12, color:"#5A6080", marginBottom:6 }}>Jam Mulai</div>
                <input type="time" value={schedForm.time} onChange={e => setSchedForm(f => ({ ...f, time: e.target.value }))} />
              </div>
              <input placeholder="Ruang kelas (opsional)" value={schedForm.room} onChange={e => setSchedForm(f => ({ ...f, room: e.target.value }))} />
              <div style={{ display:"flex", gap:10 }}>
                <button className="btn" onClick={() => setShowModal(null)} style={{ flex:1, background:"#1E2540", color:"#E8EAF0", padding:"12px", justifyContent:"center" }}>Batal</button>
                <button className="btn" onClick={addSchedule} style={{ flex:2, background:"linear-gradient(135deg,#6C63FF,#9C88FF)", color:"#fff", padding:"12px", justifyContent:"center" }}>Simpan</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Bar */}
      <div className="tab-bar">
        {tabs.map(t => (
          <button key={t.id} className={`tab-btn ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)}>
            <div style={{ position:"relative" }}>
              <span style={{ fontSize:20 }}>{t.icon}</span>
              {t.id === "homework" && pendingHW.length > 0 && (
                <span className="badge">{pendingHW.length}</span>
              )}
            </div>
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}
