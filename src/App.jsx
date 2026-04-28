import { useState, useRef } from "react";

const C = {
  bg: "#07090F",
  surface: "#0D1117",
  surface2: "#131820",
  border: "rgba(255,255,255,0.06)",
  border2: "rgba(255,255,255,0.12)",
  gold: "#D4A843",
  gold2: "#F0C96B",
  green: "#22D98A",
  red: "#FF4D6D",
  amber: "#FBBF24",
  blue: "#5B9CF6",
  text: "#EEF2FF",
  text2: "#7C8499",
  text3: "#3D4457",
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500&display=swap');
  *{margin:0;padding:0;box-sizing:border-box}
  body{background:${C.bg};color:${C.text};font-family:'Outfit',sans-serif}
  ::placeholder{color:${C.text3}}
  textarea,input,select{outline:none;font-family:'Outfit',sans-serif}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
  @keyframes fillBar{from{width:0}to{width:var(--w)}}
  .spin{animation:spin 1s linear infinite}
  .fadeUp{animation:fadeUp 0.5s ease forwards}
  .pulse{animation:pulse 2s infinite}
`;

function Ring({ score }) {
  const r = 52, circ = 2 * Math.PI * r;
  const color = score >= 75 ? C.green : score >= 50 ? C.amber : C.red;
  const offset = circ - (score / 100) * circ;
  return (
    <div style={{ position: "relative", width: 144, height: 144, margin: "0 auto 20px" }}>
      <svg width="144" height="144" style={{ transform: "rotate(-90deg)", filter: "drop-shadow(0 0 12px " + color + "44)" }}>
        <circle cx="72" cy="72" r={r} fill="none" stroke={C.border} strokeWidth="9" />
        <circle cx="72" cy="72" r={r} fill="none" stroke={color} strokeWidth="9"
          strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontSize: 38, fontWeight: 900, color, lineHeight: 1, letterSpacing: -1 }}>{score}</div>
        <div style={{ fontSize: 10, color: C.text2, letterSpacing: 2, marginTop: 2 }}>ATS SCORE</div>
      </div>
    </div>
  );
}

function Bar({ label, val, icon }) {
  const color = val >= 75 ? C.green : val >= 50 ? C.amber : C.red;
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7, alignItems: "center" }}>
        <span style={{ fontSize: 13, color: C.text2, display: "flex", alignItems: "center", gap: 7 }}><span>{icon}</span>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color, fontFamily: "'JetBrains Mono',monospace" }}>{val}%</span>
      </div>
      <div style={{ height: 7, background: C.border, borderRadius: 99, overflow: "hidden" }}>
        <div style={{ height: "100%", width: val + "%", background: "linear-gradient(90deg," + color + "99," + color + ")", borderRadius: 99, transition: "width 1.4s cubic-bezier(0.4,0,0.2,1)", boxShadow: "0 0 10px " + color + "55" }} />
      </div>
    </div>
  );
}

function Chip({ text, type }) {
  const map = {
    g: { bg: "rgba(34,217,138,0.1)", color: C.green, border: "rgba(34,217,138,0.2)" },
    r: { bg: "rgba(255,77,109,0.1)", color: C.red, border: "rgba(255,77,109,0.2)" },
    b: { bg: "rgba(91,156,246,0.1)", color: C.blue, border: "rgba(91,156,246,0.2)" },
    a: { bg: "rgba(251,191,36,0.1)", color: C.amber, border: "rgba(251,191,36,0.2)" },
  };
  const s = map[type] || map.b;
  return <span style={{ display: "inline-flex", alignItems: "center", padding: "4px 12px", borderRadius: 99, fontSize: 12, fontWeight: 500, color: s.color, background: s.bg, border: "1px solid " + s.border, margin: "3px" }}>{text}</span>;
}

const ROLES = ["Data Analyst", "Data Scientist", "ML Engineer", "Software Engineer", "Frontend Developer", "Backend Developer", "Full Stack Developer", "DevOps Engineer", "Product Manager", "Business Analyst"];

export default function App() {
  const [step, setStep] = useState("input");
  const [apiKey, setApiKey] = useState("");
  const [jd, setJd] = useState("");
  const [role, setRole] = useState("Data Analyst");
  const [loadMsg, setLoadMsg] = useState("");
  const [result, setResult] = useState(null);
  const [err, setErr] = useState("");
  const [resumeName, setResumeName] = useState("");
  const [resumeB64, setResumeB64] = useState("");
  const fileRef = useRef();

  const msgs = ["Parsing resume structure...", "Extracting keywords with NLP...", "Matching against job description...", "Scoring ATS compatibility...", "Generating smart suggestions..."];

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setResumeName(f.name);
    const reader = new FileReader();
    reader.onload = ev => setResumeB64(ev.target.result.split(",")[1]);
    reader.readAsDataURL(f);
  };

  const analyze = async () => {
    if (!jd.trim()) { setErr("Please paste a job description."); return; }
    if (!apiKey.trim()) { setErr("Please enter your Claude API key."); return; }
    setErr("");
    setStep("loading");
    let i = 0;
    setLoadMsg(msgs[0]);
    const iv = setInterval(() => { i = Math.min(i + 1, msgs.length - 1); setLoadMsg(msgs[i]); }, 1400);

    const prompt = `You are an elite ATS expert and career coach for ${role} roles. Analyze this resume against the job description. Return ONLY a JSON object, no markdown, no backticks, no extra text.

Role: ${role}
Job Description: ${jd}

JSON structure to return:
{"ats_score":78,"verdict":"Good","scores":{"keywords":82,"experience":71,"skills":78,"formatting":74,"education":80},"matching_skills":["Python","SQL","Excel","Pandas","Statistics"],"missing_skills":["Power BI","Tableau","AWS","Docker","Spark"],"keywords":[{"word":"Python","found":true,"importance":"High"},{"word":"SQL","found":true,"importance":"High"},{"word":"Power BI","found":false,"importance":"High"},{"word":"Tableau","found":false,"importance":"High"},{"word":"AWS","found":false,"importance":"Medium"},{"word":"Machine Learning","found":false,"importance":"Medium"},{"word":"Excel","found":true,"importance":"Medium"}],"suggestions":[{"title":"Add missing technical tools","text":"Power BI and Tableau are explicitly required. Add them to your skills section and mention any exposure you have had to data visualization tools.","priority":"High","icon":"🛠️"},{"title":"Quantify every achievement","text":"Replace vague statements with numbers. Example: Analyzed data becomes Analyzed 2M+ records using SQL reducing report time by 45%.","priority":"High","icon":"📊"},{"title":"Mirror job description language","text":"ATS systems scan for exact phrases. Use Machine Learning not ML, use ETL pipeline not data pipeline to match the job posting exactly.","priority":"High","icon":"🔑"},{"title":"Add strong action verbs","text":"Start every bullet with: Developed, Engineered, Automated, Optimized, Delivered, Architected, Reduced, Increased, Built.","priority":"Medium","icon":"✍️"},{"title":"Write a tailored summary","text":"Add a 3-line professional summary at the top. Mention your years of experience, top 3 skills, and one measurable achievement specific to this ${role} role.","priority":"Medium","icon":"💡"}],"summary":"Your resume shows strong foundational skills in Python and SQL but is missing several key tools mentioned in the job description. Adding Power BI, Tableau and quantified achievements will significantly boost your ATS score."}`;

    try {
      const messages = resumeB64
        ? [{ role: "user", content: [{ type: "document", source: { type: "base64", media_type: "application/pdf", data: resumeB64 } }, { type: "text", text: prompt }] }]
        : [{ role: "user", content: prompt }];

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true"
        },
        body: JSON.stringify({ model: "claude-haiku-4-5", max_tokens: 1500, messages })
      });

      const data = await res.json();
      clearInterval(iv);

      if (data.error) { setErr("API Error: " + data.error.message); setStep("input"); return; }

      const raw = data.content && data.content[0] && data.content[0].text ? data.content[0].text : "";
      const match = raw.match(/\{[\s\S]*\}/);
const clean = match ? match[0] : raw.replace(/json|/g,"").trim();
      const parsed = JSON.parse(clean);
      setResult(parsed);
      setStep("result");
    } catch (e) {
      clearInterval(iv);
      setErr("Error: " + e.message + ". Check your API key and try again.");
      setStep("input");
    }
  };

  const download = () => {
    if (!result) return;
    const txt = [
      "RESUMEIQ PRO — ANALYSIS REPORT",
      "=================================",
      "Role: " + role,
      "Date: " + new Date().toLocaleDateString(),
      "",
      "ATS SCORE: " + result.ats_score + "% — " + result.verdict,
      "",
      "SCORE BREAKDOWN",
      ...Object.entries(result.scores || {}).map(([k, v]) => "  " + k + ": " + v + "%"),
      "",
      "MATCHING SKILLS: " + (result.matching_skills || []).join(", "),
      "MISSING SKILLS: " + (result.missing_skills || []).join(", "),
      "",
      "SUGGESTIONS",
      ...(result.suggestions || []).map((s, i) => (i + 1) + ". [" + s.priority + "] " + s.title + "\n   " + s.text),
      "",
      "SUMMARY: " + result.summary,
    ].join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([txt], { type: "text/plain" }));
    a.download = "ResumeIQ-Report.txt";
    a.click();
  };

  const P = { padding: "28px", background: C.surface, border: "1px solid " + C.border, borderRadius: "16px" };
  const inputStyle = { width: "100%", padding: "11px 14px", background: C.surface2, border: "1px solid " + C.border, borderRadius: "10px", color: C.text, fontSize: "14px", marginBottom: "14px" };

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text }}>
      <style>{css}</style>

      {/* Header */}
      <div style={{ padding: "18px 40px", borderBottom: "1px solid " + C.border, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, background: "rgba(7,9,15,0.85)", backdropFilter: "blur(16px)", zIndex: 99 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 38, height: 38, background: "linear-gradient(135deg," + C.gold + "," + C.gold2 + ")", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 17, color: C.bg }}>R</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 17 }}>ResumeIQ <span style={{ color: C.gold }}>Pro</span></div>
            <div style={{ fontSize: 10, color: C.text3, letterSpacing: 0.5 }}>AI-Powered Resume Optimization</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 16px", border: "1px solid " + C.border2, borderRadius: "99px", fontSize: 12, color: C.text2, background: C.surface }}>
          <span className="pulse" style={{ width: 7, height: 7, background: C.green, borderRadius: "50%", display: "inline-block", boxShadow: "0 0 8px " + C.green }}></span>
          Claude AI Active
        </div>
      </div>

      {/* Hero */}
      <div style={{ padding: "60px 40px 44px", textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 16px", background: "rgba(212,168,67,0.1)", border: "1px solid rgba(212,168,67,0.25)", borderRadius: "99px", fontSize: 11, fontWeight: 600, color: C.gold2, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 24 }}>
          Powered by Claude Sonnet
        </div>
        <h1 style={{ fontSize: "clamp(30px,5vw,54px)", fontWeight: 900, lineHeight: 1.08, letterSpacing: -1.5, marginBottom: 16 }}>
          Optimize Your Resume<br /><span style={{ color: C.gold }}>for Any Job in Seconds</span>
        </h1>
        <p style={{ fontSize: 16, color: C.text2, maxWidth: 480, margin: "0 auto", lineHeight: 1.7, fontWeight: 300 }}>
          Beat ATS systems with AI-powered insights. Get role-specific suggestions that top recruiters care about.
        </p>
      </div>

      <div style={{ padding: "0 40px 80px", maxWidth: 1140, margin: "0 auto" }}>

        {/* INPUT */}
        {step === "input" && (
          <div className="fadeUp">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
              <div style={P}>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>🔑 Setup</div>
                <label style={{ fontSize: 11, color: C.text2, display: "block", marginBottom: 6, letterSpacing: 0.5 }}>CLAUDE API KEY</label>
                <input type="password" style={inputStyle} placeholder="sk-ant-api03-..." value={apiKey} onChange={e => setApiKey(e.target.value)} />
                <label style={{ fontSize: 11, color: C.text2, display: "block", marginBottom: 6, letterSpacing: 0.5 }}>TARGET ROLE</label>
                <select style={{ ...inputStyle, cursor: "pointer" }} value={role} onChange={e => setRole(e.target.value)}>
                  {ROLES.map(r => <option key={r} value={r} style={{ background: C.surface2 }}>{r}</option>)}
                </select>
                <label style={{ fontSize: 11, color: C.text2, display: "block", marginBottom: 6, letterSpacing: 0.5 }}>JOB DESCRIPTION</label>
                <textarea style={{ ...inputStyle, height: 160, resize: "vertical", marginBottom: 0 }} placeholder="Paste the full job description here..." value={jd} onChange={e => setJd(e.target.value)} />
              </div>

              <div style={P}>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 20 }}>📄 Resume Upload</div>
                <div onClick={() => fileRef.current.click()} style={{ border: "2px dashed " + C.border, borderRadius: "12px", padding: "44px 20px", textAlign: "center", cursor: "pointer", transition: "all 0.2s", marginBottom: 16 }}
                  onMouseOver={e => e.currentTarget.style.borderColor = C.gold}
                  onMouseOut={e => e.currentTarget.style.borderColor = C.border}>
                  <div style={{ fontSize: 38, marginBottom: 10 }}>📁</div>
                  <div style={{ fontSize: 14, color: C.text2, fontWeight: 500 }}>Click to upload PDF</div>
                  <div style={{ fontSize: 11, color: C.text3, marginTop: 6 }}>Optional — AI generates demo analysis without file</div>
                  <input ref={fileRef} type="file" accept=".pdf" style={{ display: "none" }} onChange={handleFile} />
                </div>

                {resumeName && (
                  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: "rgba(34,217,138,0.07)", border: "1px solid rgba(34,217,138,0.2)", borderRadius: "10px", marginBottom: 16 }}>
                    <span style={{ fontSize: 20 }}>📋</span>
                    <div>
                      <div style={{ fontSize: 13, color: C.green, fontWeight: 500 }}>{resumeName}</div>
                      <div style={{ fontSize: 11, color: C.text3 }}>Ready to analyze</div>
                    </div>
                    <button onClick={() => { setResumeName(""); setResumeB64(""); }} style={{ marginLeft: "auto", background: "none", border: "none", color: C.text3, cursor: "pointer", fontSize: 18 }}>×</button>
                  </div>
                )}

                <div style={{ padding: "14px 16px", background: "rgba(91,156,246,0.06)", border: "1px solid rgba(91,156,246,0.15)", borderRadius: "10px" }}>
                  <div style={{ fontSize: 12, color: C.blue, fontWeight: 600, marginBottom: 8 }}>What you get:</div>
                  <div style={{ fontSize: 12, color: C.text2, lineHeight: 1.9 }}>
                    📊 Animated ATS score ring<br />
                    🧠 NLP keyword extraction<br />
                    🎯 Role-specific suggestions<br />
                    📈 5-category score breakdown<br />
                    📥 Downloadable text report
                  </div>
                </div>
              </div>
            </div>

            {err && <div style={{ padding: "12px 18px", background: "rgba(255,77,109,0.08)", border: "1px solid rgba(255,77,109,0.2)", borderRadius: "10px", color: C.red, fontSize: 13, marginBottom: 16 }}>⚠️ {err}</div>}

            <button onClick={analyze} style={{ width: "100%", padding: "19px", background: "linear-gradient(135deg," + C.gold + "," + C.gold2 + ")", border: "none", borderRadius: "12px", color: C.bg, fontWeight: 800, fontSize: 16, cursor: "pointer", fontFamily: "'Outfit',sans-serif", boxShadow: "0 8px 32px rgba(212,168,67,0.2)", letterSpacing: 0.3 }}>
              ⚡ Analyze My Resume
            </button>
          </div>
        )}

        {/* LOADING */}
        {step === "loading" && (
          <div style={{ textAlign: "center", padding: "80px 20px" }} className="fadeUp">
            <div className="spin" style={{ width: 56, height: 56, border: "2px solid " + C.border, borderTopColor: C.gold, borderRadius: "50%", margin: "0 auto 28px" }} />
            <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 10 }}>Analyzing Your Resume</div>
            <div style={{ fontSize: 14, color: C.text2, marginBottom: 36 }}>{loadMsg}</div>
            <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
              {msgs.map((m, i) => (
                <div key={i} style={{ padding: "6px 14px", background: C.surface, border: "1px solid " + C.border, borderRadius: "99px", fontSize: 11, color: m === loadMsg ? C.gold : C.text3, borderColor: m === loadMsg ? "rgba(212,168,67,0.3)" : C.border, background: m === loadMsg ? "rgba(212,168,67,0.08)" : C.surface }}>
                  {m === loadMsg ? "⟳ " : "✓ "}{m}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* RESULT */}
        {step === "result" && result && (
          <div className="fadeUp">
            {/* Result header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, paddingBottom: 24, borderBottom: "1px solid " + C.border }}>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800 }}>Analysis Complete 🎉</div>
                <div style={{ fontSize: 13, color: C.text2, marginTop: 4 }}>Role: {role} · {new Date().toLocaleDateString()}</div>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={download} style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 20px", background: "transparent", border: "1px solid " + C.border2, borderRadius: "10px", color: C.text2, cursor: "pointer", fontSize: 13, fontFamily: "'Outfit',sans-serif" }}>
                  📥 Download Report
                </button>
                <button onClick={() => { setStep("input"); setResult(null); setResumeName(""); setResumeB64(""); }} style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 20px", background: "transparent", border: "1px solid " + C.border2, borderRadius: "10px", color: C.text2, cursor: "pointer", fontSize: 13, fontFamily: "'Outfit',sans-serif" }}>
                  ← New Analysis
                </button>
              </div>
            </div>

            {/* Summary */}
            {result.summary && (
              <div style={{ padding: "16px 22px", background: C.surface, border: "1px solid " + C.border, borderRadius: "12px", marginBottom: 20, fontSize: 14, color: C.text2, lineHeight: 1.7, borderLeft: "3px solid " + C.gold }}>
                <span style={{ color: C.gold, fontWeight: 700 }}>🤖 AI Summary: </span>{result.summary}
              </div>
            )}

            {/* Score + Breakdown */}
            <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 20, marginBottom: 20 }}>
              <div style={{ ...P, textAlign: "center" }}>
                <div style={{ fontSize: 10, color: C.text3, letterSpacing: 2, textTransform: "uppercase", marginBottom: 20 }}>ATS Compatibility</div>
                <Ring score={result.ats_score} />
                <div style={{ padding: "7px 20px", borderRadius: "99px", display: "inline-block", fontSize: 13, fontWeight: 600, background: result.ats_score >= 75 ? "rgba(34,217,138,0.1)" : result.ats_score >= 50 ? "rgba(251,191,36,0.1)" : "rgba(255,77,109,0.1)", color: result.ats_score >= 75 ? C.green : result.ats_score >= 50 ? C.amber : C.red }}>
                  {result.ats_score >= 75 ? "🏆 " : result.ats_score >= 50 ? "⚠️ " : "❌ "}{result.verdict}
                </div>
              </div>
              <div style={P}>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 22 }}>📈 Score Breakdown</div>
                <Bar label="Keywords Match" val={result.scores?.keywords || 0} icon="🔑" />
                <Bar label="Experience" val={result.scores?.experience || 0} icon="💼" />
                <Bar label="Skills" val={result.scores?.skills || 0} icon="🛠️" />
                <Bar label="Formatting" val={result.scores?.formatting || 0} icon="📝" />
                <Bar label="Education" val={result.scores?.education || 0} icon="🎓" />
              </div>
            </div>

            {/* Skills */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
              <div style={P}>
                <div style={{ fontWeight: 700, fontSize: 15, color: C.green, marginBottom: 16 }}>✅ Matching Skills <span style={{ fontSize: 12, color: C.text3, fontWeight: 400 }}>({(result.matching_skills || []).length})</span></div>
                <div>{(result.matching_skills || []).map((s, i) => <Chip key={i} text={"✅ " + s} type="g" />)}</div>
              </div>
              <div style={P}>
                <div style={{ fontWeight: 700, fontSize: 15, color: C.red, marginBottom: 16 }}>❌ Missing Skills <span style={{ fontSize: 12, color: C.text3, fontWeight: 400 }}>({(result.missing_skills || []).length})</span></div>
                <div>{(result.missing_skills || []).map((s, i) => <Chip key={i} text={"❌ " + s} type="r" />)}</div>
              </div>
            </div>

            {/* Keywords */}
            {result.keywords && (
              <div style={{ ...P, marginBottom: 20 }}>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 18 }}>🔍 Keyword Analysis</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(190px,1fr))", gap: 10 }}>
                  {result.keywords.map((k, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: C.surface2, borderRadius: "10px", border: "1px solid " + C.border }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span>{k.found ? "✅" : "❌"}</span>
                        <span style={{ fontSize: 13, fontWeight: 500 }}>{k.word}</span>
                      </div>
                      <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: "99px", fontWeight: 600, background: k.importance === "High" ? "rgba(255,77,109,0.1)" : k.importance === "Medium" ? "rgba(251,191,36,0.1)" : "rgba(34,217,138,0.1)", color: k.importance === "High" ? C.red : k.importance === "Medium" ? C.amber : C.green }}>
                        {k.importance}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Suggestions */}
            <div style={P}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 20 }}>💡 Smart Suggestions <span style={{ fontSize: 12, color: C.text3, fontWeight: 400 }}>({(result.suggestions || []).length} action items)</span></div>
              {(result.suggestions || []).map((sg, i) => {
                const pc = sg.priority === "High" ? C.red : sg.priority === "Medium" ? C.amber : C.green;
                const pb = sg.priority === "High" ? "rgba(255,77,109,0.08)" : sg.priority === "Medium" ? "rgba(251,191,36,0.08)" : "rgba(34,217,138,0.08)";
                return (
                  <div key={i} style={{ display: "flex", gap: 14, padding: "16px 0", borderBottom: i < result.suggestions.length - 1 ? "1px solid " + C.border : "none" }}>
                    <div style={{ width: 42, height: 42, borderRadius: "12px", background: pb, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{sg.icon || "💡"}</div>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                        <span style={{ fontWeight: 600, fontSize: 14 }}>{sg.title}</span>
                        <span style={{ padding: "2px 10px", borderRadius: "99px", fontSize: 10, fontWeight: 700, color: pc, background: pb, letterSpacing: 0.5 }}>{sg.priority}</span>
                      </div>
                      <div style={{ fontSize: 13, color: C.text2, lineHeight: 1.65 }}>{sg.text}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}