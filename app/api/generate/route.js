import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const STOP_EN = new Set(['the','and','a','to','of','in','for','on','with','at','as','by','is','are','be','an','or','from','this','that','it','we','you','your','our']);
const STOP_RU = new Set(['и','в','во','не','что','он','на','я','с','со','как','а','то','все','она','так','его','но','да','ты','к','у','же','вы','за','бы','по','только','ее','мне','было','вот','от','меня','еще','нет','о','из','ему','теперь','когда','даже','ну','вдруг','ли','если','уже','или','ни','быть','был','него','до','вас','нибудь','опять','уж','вам','ведь','там','потом','себя','ничего','ей','может','они','тут','где','есть','надо','ней','для']);
const SOFT_DICT_EN = ['communication','teamwork','leadership','ownership','problem solving','analytical','collaboration','presentation','stakeholder','mentoring','adaptability'];
const SOFT_DICT_RU = ['коммуникация','командная работа','лидерство','ответственность','решение проблем','аналитика','сотрудничество','презентация','стейкхолдеры','менторство','адаптивность'];
const VERBS_EN = ['led','managed','built','designed','shipped','launched','improved','reduced','increased','optimized','analyzed','automated','implemented','owned','delivered'];
const VERBS_RU = ['руководил','управлял','построил','спроектировал','запустил','улучшил','снизил','повысил','оптимизировал','проанализировал','автоматизировал','внедрил','ответствовал','доставил'];

function tokenize(text){
  return (text||'').toLowerCase()
    .replace(/[^a-zа-я0-9+/#.\-\s]/g, ' ')
    .split(/\s+/).filter(Boolean);
}

function uniq(arr){ return Array.from(new Set(arr)); }

function freqTerms(tokens, stop){
  const f = new Map();
  for(const t of tokens){
    if(stop.has(t) || t.length<2) continue;
    f.set(t, (f.get(t)||0)+1);
  }
  return Array.from(f.entries()).sort((a,b)=>b[1]-a[1]).map(x=>x[0]);
}

function splitCategories(keywords, lang){
  const softDict = lang==='ru'?SOFT_DICT_RU:SOFT_DICT_EN;
  const verbsDict = lang==='ru'?VERBS_RU:VERBS_EN;
  const soft=[], verbs=[], hard=[];
  for(const k of keywords){
    if(softDict.some(s=>k.includes(s))) soft.push(k);
    else if(verbsDict.includes(k)) verbs.push(k);
    else hard.push(k);
  }
  return {soft:uniq(soft), verbs:uniq(verbs), hard:uniq(hard)};
}

function highlight(text, matched){
  let html = (text||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  for(const k of matched.sort((a,b)=>b.length-a.length)){
    const re = new RegExp(`(\\b${k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b)`, 'gi');
    html = html.replace(re, '<mark style="background:#f3d55b;color:#0b1220;border-radius:4px;padding:0 3px;">$1</mark>');
  }
  return `<pre style="white-space:pre-wrap">${html}</pre>`;
}

function naiveAI(jobText, resumeText, lang){
  const stop = lang==='ru'?STOP_RU:STOP_EN;
  const jobTok = tokenize(jobText);
  const resTok = tokenize(resumeText);

  const kwAll = uniq(freqTerms(jobTok, stop)).slice(0,60);

  const resSet = new Set(resTok);
  const matched = kwAll.filter(k=>resSet.has(k));
  const gaps = kwAll.filter(k=>!resSet.has(k)).slice(0,20);

  const baseScore = Math.min(100, Math.round((matched.length / Math.max(1, kwAll.length)) * 100));
  const {soft, verbs, hard} = splitCategories(kwAll, lang);

  const bullets = gaps.slice(0,6).map(k=>{
    const up = k && k[0] ? k[0].toUpperCase()+k.slice(1) : k;
    return lang==='ru'
      ? `Реализовал(а) ${up}, добившись <NUM>% улучшения ключевого показателя; подтвердил(а) эффект A/B и метриками.`
      : `Implemented ${up}, achieving <NUM>% improvement on a key KPI; validated via metrics and A/B.`;
  });

  const cover = lang==='ру'
    ? `Здравствуйте!\nЯ изучил(а) вакансию и вижу совпадение по ключевым областям: ${matched.slice(0,6).join(', ')}.\nГотов(а) применить опыт и быстро закрыть пробелы: ${gaps.slice(0,3).join(', ')}.\nСпасибо за рассмотрение!`
    : `Hello,\nI reviewed the JD and I’m a strong match across: ${matched.slice(0,6).join(', ')}.\nI can quickly apply my experience and close gaps: ${gaps.slice(0,3).join(', ')}.\nThank you for your time.`;

  const resumeHighlighted = highlight(resumeText, matched);

  return {
    jobTitle: (lang==='ru'?'Целевая роль':'Target Role'),
    matchScore: baseScore,
    keywords:{soft, verbs, hard},
    matched, gaps, bullets,
    coverLetter: cover,
    resumeHighlighted,
    tailoredResume: resumeText
  };
}

async function aiCoverLetter(openai, resumeText, jobText, lang){
  try{
    const model = process.env.OPENAI_MODEL || 'gpt-5';
    const prompt = lang==='ru'
      ? 'Напиши краткое (180–220 слов) сопроводительное письмо на русском под эту вакансию. Вплети 3–4 ключевых навыка из описания вакансии. JD: ' + jobText + '\nРезюме: ' + resumeText
      : 'Write a concise (180–220 words) cover letter tailored to this job. Weave in 3–4 key skills from the JD. JD: ' + jobText + '\nResume: ' + resumeText;
    const resp = await openai.chat.completions.create({
      model,
      messages:[{role:'user', content: prompt}],
      temperature:0.5
    });
    const text = resp.choices?.[0]?.message?.content?.trim();
    return text || null;
  }catch(e){
    return null;
  }
}

export async function POST(req){
  const { jobText='', resumeText='', lang='en' } = await req.json();
  if(!jobText || !resumeText){
    return NextResponse.json({ error:'jobText and resumeText required' }, { status:400 });
  }

  let result = naiveAI(jobText, resumeText, lang);

  const key = process.env.OPENAI_API_KEY;
  if(key){
    try{
      const openai = new OpenAI({ apiKey: key });
      const letter = await aiCoverLetter(openai, resumeText, jobText, lang);
      if(letter) result.coverLetter = letter;
    }catch{}
  }

  return NextResponse.json(result);
}
