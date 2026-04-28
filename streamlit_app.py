import streamlit as st
import anthropic
import fitz
import json

st.set_page_config(
    page_title="ResumeIQ Pro",
    page_icon="lightning",
    layout="wide"
)

st.markdown("""
<style>
    .main { background: #07090F; }
    .stApp { background: #07090F; color: white; }
    h1 { color: #D4A843; }
    .stTextArea textarea { background: #0D1117; color: white; }
    .stSelectbox select { background: #0D1117; color: white; }
</style>
""", unsafe_allow_html=True)

st.title("ResumeIQ Pro")
st.caption("AI-Powered Resume Optimization Tool")

col1, col2 = st.columns(2)

with col1:
    api_key = st.text_input(
        "Claude API Key",
        type="password",
        placeholder="sk-ant-api03-..."
    )
    role = st.selectbox("Target Role", [
        "Data Analyst", "Data Scientist", "ML Engineer",
        "Software Engineer", "Frontend Developer",
        "Backend Developer", "Full Stack Developer",
        "DevOps Engineer", "Product Manager"
    ])
    jd = st.text_area(
        "Job Description",
        height=200,
        placeholder="Paste full job description here..."
    )

with col2:
    uploaded = st.file_uploader(
        "Upload Resume PDF (Optional)",
        type=["pdf"]
    )
    if uploaded:
        st.success("Resume uploaded: " + uploaded.name)

if st.button("Analyze My Resume", use_container_width=True):
    if not api_key:
        st.error("Please enter your Claude API key!")
    elif not jd:
        st.error("Please paste a job description!")
    else:
        with st.spinner("Analyzing your resume with AI..."):
            resume_text = ""
            if uploaded:
                doc = fitz.open(
                    stream=uploaded.read(),
                    filetype="pdf"
                )
                for page in doc:
                    resume_text += page.get_text()

            prompt = """You are an elite ATS expert for """ + role + """ roles.
Analyze this resume against the job description.
Return ONLY valid JSON, no markdown, no extra text.

Role: """ + role + """
Job Description: """ + jd + """
Resume: """ + resume_text + """

Return this JSON:
{"ats_score":75,"verdict":"Good",
"scores":{"keywords":80,"experience":70,"skills":75,"formatting":74,"education":80},
"matching_skills":["Python","SQL","Excel"],
"missing_skills":["Power BI","Tableau","AWS"],
"suggestions":[
{"title":"Add missing tools","text":"Include Power BI in skills section.","priority":"High"},
{"title":"Quantify achievements","text":"Add measurable results like increased revenue by 20%.","priority":"High"},
{"title":"Use action verbs","text":"Start bullets with Led, Built, Optimized.","priority":"Medium"}
],
"summary":"Good match but missing key tools."}"""

            try:
                client = anthropic.Anthropic(api_key=api_key)
                response = client.messages.create(
                    model="claude-haiku-4-5",
                    max_tokens=1500,
                    messages=[{
                        "role": "user",
                        "content": prompt
                    }]
                )
                raw = response.content[0].text
                match = _import_('re').search(
                    r'\{[\s\S]*\}', raw
                )
                result = json.loads(
                    match.group() if match else raw
                )

                st.success("Analysis Complete!")

                col_a, col_b = st.columns([1, 2])

                with col_a:
                    score = result["ats_score"]
                    color = (
                        "green" if score >= 75
                        else "orange" if score >= 50
                        else "red"
                    )
                    st.metric(
                        "ATS Score",
                        str(score) + "%",
                        delta=result["verdict"]
                    )

                with col_b:
                    st.subheader("Score Breakdown")
                    for key, val in result["scores"].items():
                        st.progress(
                            val / 100,
                            text=key.title() + ": " + str(val) + "%"
                        )

                col_c, col_d = st.columns(2)

                with col_c:
                    st.subheader("Matching Skills")
                    for s in result["matching_skills"]:
                        st.markdown("- " + s)

                with col_d:
                    st.subheader("Missing Skills")
                    for s in result["missing_skills"]:
                        st.markdown("- " + s)

                st.subheader("Smart Suggestions")
                for s in result["suggestions"]:
                    icon = (
                        "🔴" if s["priority"] == "High"
                        else "🟡" if s["priority"] == "Medium"
                        else "🟢"
                    )
                    with st.expander(
                        icon + " " + s["title"] +
                        " — " + s["priority"]
                    ):
                        st.write(s["text"])

                st.info("AI Summary: " + result["summary"])

                st.download_button(
                    "Download Report",
                    data=json.dumps(result, indent=2),
                    file_name="resumeiq-report.json",
                    mime="application/json"
                )

            except Exception as e:
                st.error("Error: " + str(e))