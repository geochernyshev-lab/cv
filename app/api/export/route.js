import { NextResponse } from 'next/server';
import { Document, Packer, Paragraph, HeadingLevel } from 'docx';

export async function POST(req){
  const { jobTitle='Target Role', matchScore=0, matched=[], gaps=[], bullets=[], coverLetter='', tailoredResume='' } = await req.json();

  const children = [
    new Paragraph({ text: 'ResumeTailor Pro — Tailored Package', heading: HeadingLevel.HEADING_1 }),
    new Paragraph({ text: `Match Score: ${Math.round(matchScore)}%` })
  ];

  children.push(new Paragraph({ text: '' }));
  children.push(new Paragraph({ text: 'Matched Keywords', heading: HeadingLevel.HEADING_2 }));
  children.push(new Paragraph({ text: matched.join(', ') || '-' }));

  children.push(new Paragraph({ text: '' }));
  children.push(new Paragraph({ text: 'Gaps (Consider Adding)', heading: HeadingLevel.HEADING_2 }));
  children.push(new Paragraph({ text: gaps.join(', ') || '-' }));

  children.push(new Paragraph({ text: '' }));
  children.push(new Paragraph({ text: 'Recommended Bullets', heading: HeadingLevel.HEADING_2 }));
  for(const b of bullets){ children.push(new Paragraph({ text: '• ' + b })); }

  children.push(new Paragraph({ text: '' }));
  children.push(new Paragraph({ text: 'Cover Letter', heading: HeadingLevel.HEADING_2 }));
  for(const line of (coverLetter||'').split('\n')) children.push(new Paragraph({ text: line }));

  children.push(new Paragraph({ text: '' }));
  children.push(new Paragraph({ text: 'Tailored Resume (base)', heading: HeadingLevel.HEADING_2 }));
  for(const line of (tailoredResume||'').split('\n')) children.push(new Paragraph({ text: line }));

  const doc = new Document({ sections:[{ children }] });
  const buffer = await Packer.toBuffer(doc);
  return new NextResponse(buffer, {
    headers:{
      'Content-Type':'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition':'attachment; filename="resume_tailored.docx"'
    }
  });
}
