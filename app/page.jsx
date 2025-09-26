'use client';
import React, { useState } from 'react';

const css = {
  container:{maxWidth:1000, margin:'0 auto', padding:'24px'},
  card:(bg='#0f172a')=>({background:bg, border:'1px solid #22293c', borderRadius:12, padding:16}),
  h1:{fontSize:36, fontWeight:800, margin:'8px 0 4px'},
  sub:{opacity:0.8, marginBottom:24},
  grid:{display:'grid', gridTemplateColumns:'1fr 1fr', gap:16},
  label:{fontSize:13, opacity:0.8, marginBottom:6},
  textarea:{width:'100%', height:220, borderRadius:10, padding:12, border:'1px solid #243047', background:'#0b1426', color:'#e6e9ef', outline:'none'},
  btnPrimary:{background:'#5b8cff', border:'none', padding:'12px 16px', borderRadius:10, color:'#0b1220', fontWeight:700, cursor:'pointer'},
  btnGhost:{background:'transparent', border:'1px solid #2b3652', padding:'10px 14px', borderRadius:10, color:'#e6e9ef', cursor:'pointer'},
  row:{display:'flex', gap:12, alignItems:'center', flexWrap:'wrap'},
  sectionTitle:{fontWeight:700, margin:'16px 0 8px'},
  small:{fontSize:12, opacity:0.8}
};

export default function Page(){
  const [jobText, setJobText] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [lang, setLang] = useState('en');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  async function analyze(){
    setLoading(true); setError(null);
    try{
      const res = await fetch('/api/generate', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ jobText, resumeText, lang })
      });
      if(!res.ok) throw new Error('Ошибка генерации');
      const json = await res.json();
      setData(json);
    }catch(e){
      setError(e.message);
    }finally{
      setLoading(false);
    }
  }

  async function exportDocx(){
    if(!data) return;
    const res = await fetch('/api/export', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({
        jobTitle: data.jobTitle || 'Target Role',
        matchScore: data.matchScore,
        matched: data.matched || [],
        gaps: data.gaps || [],
        bullets: data.bullets || [],
        coverLetter: data.coverLetter || '',
        tailoredResume: data.tailoredResume || resumeText
      })
    });
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'resume_tailored.docx';
    a.click();
    window.URL.revokeObjectURL(url);
  }

  return (
    <div style={css.container}>
      <div style={css.card()}>
        <div style={css.h1}>ResumeTailor Pro</div>
        <div style={css.sub}>Адаптируй резюме под вакансию за 60 секунд: Live Match & Gaps, готовые bullets и сопроводительное.</div>
        <div style={css.row}>
          <button onClick={()=>setLang(lang==='en'?'ru':'en')} style={css.btnGhost}>Язык интерфейса: {lang.toUpperCase()}</button>
        </div>
      </div>

      <div style={{height:12}}/>
      <div style={{...css.card(), ...css.grid}}>
        <div>
          <div style={css.label}>Текст вакансии (Job Description)</div>
          <textarea style={css.textarea} value={jobText} onChange={e=>setJobText(e.target.value)} placeholder="Вставьте сюда описание вакансии..."/>
        </div>
        <div>
          <div style={css.label}>Ваше резюме (текстом)</div>
          <textarea style={css.textarea} value={resumeText} onChange={e=>setResumeText(e.target.value)} placeholder="Вставьте сюда текст вашего резюме..."/>
        </div>
      </div>

      <div style={{height:12}}/>
      <div style={css.card()}>
        <div style={css.row}>
          <button onClick={analyze} style={css.btnPrimary} disabled={loading || !jobText || !resumeText}>
            {loading ? 'Анализ…' : 'Анализировать и подогнать'}
          </button>
          <button onClick={exportDocx} style={css.btnGhost} disabled={!data}>Скачать DOCX</button>
          <div style={css.small}>Сопроводительное письмо генерируется, если задан OPENAI_API_KEY.</div>
        </div>

        {error && <div style={{color:'#ff8080', marginTop:12}}>Ошибка: {error}</div>}

        {data && (
          <div style={{marginTop:16}}>
            <div style={css.sectionTitle}>Match Score: <span style={{color:'#5b8cff', fontWeight:800}}>{Math.round(data.matchScore)}%</span></div>
            <div style={css.small}>Совпадения: {data.matched?.length||0} • Пробелы: {data.gaps?.length||0}</div>

            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginTop:12}}>
              <div style={css.card('#0b1426')}>
                <div style={css.sectionTitle}>Ключевые совпадения</div>
                <ul>
                  {(data.matched||[]).map((k,i)=>(<li key={i}>{k}</li>))}
                </ul>
              </div>
              <div style={css.card('#0b1426')}>
                <div style={css.sectionTitle}>Чего не хватает (Gaps)</div>
                <ul>
                  {(data.gaps||[]).map((k,i)=>(<li key={i}>{k}</li>))}
                </ul>
              </div>
            </div>

            <div style={{height:12}}/>
            <div style={css.card('#0b1426')}>
              <div style={css.sectionTitle}>Рекомендованные bullets</div>
              <ul>
                {(data.bullets||[]).map((b,i)=>(<li key={i}>{b}</li>))}
              </ul>
            </div>

            <div style={{height:12}}/>
            <div style={css.card('#0b1426')}>
              <div style={css.sectionTitle}>Сопроводительное письмо</div>
              <pre style={{whiteSpace:'pre-wrap'}}>{data.coverLetter}</pre>
            </div>

            <div style={{height:12}}/>
            <div style={css.card('#0b1426')}>
              <div style={css.sectionTitle}>Ваше резюме с подсветкой совпадений</div>
              <div dangerouslySetInnerHTML={{__html: data.resumeHighlighted}}/>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
