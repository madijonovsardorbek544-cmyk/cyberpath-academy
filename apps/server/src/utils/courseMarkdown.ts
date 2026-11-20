// Parses the Uzbek cohort lessons in docs/course-uz into lesson rows and quiz questions.
// The markdown files are the source of truth; reviewers edit them, then an admin runs `npm run seed:cohort-uz`.

export type CourseQuestion = {
  id: string;
  prompt: string;
  type: 'multiple-choice' | 'true-false';
  explanation: string;
  options: Array<{ id: string; label: string }>;
  answer: string | boolean;
};

export type CourseLesson = {
  slug: string;
  order: number;
  title: string;
  estimatedMinutes: number;
  isDraft: boolean;
  objectives: string[];
  content: string;
  knowledgeChecks: string[];
  whyItMatters: string;
  questions: CourseQuestion[];
};

const TRUE_WORD = 'Toʻgʻri';
const FALSE_WORD = 'Notoʻgʻri';

const plain = (text: string) => text.replace(/\*\*/g, '').replace(/`/g, '').replace(/\s+/g, ' ').trim();

function splitSections(markdown: string) {
  const sections: Array<{ heading: string; body: string }> = [];
  let current = { heading: '', body: '' };
  for (const line of markdown.split('\n')) {
    if (line.startsWith('## ')) {
      sections.push(current);
      current = { heading: line.slice(3).replace(/^\d+\.\s*/, '').trim(), body: '' };
    } else {
      current.body += `${line}\n`;
    }
  }
  sections.push(current);
  return sections;
}

function parseQuestions(body: string, order: number): CourseQuestion[] {
  const blocks: string[][] = [];
  for (const line of body.split('\n')) {
    if (/^\d+\.\s/.test(line)) blocks.push([line.replace(/^\d+\.\s/, '')]);
    else if (line.trim() && blocks.length) blocks[blocks.length - 1].push(line.trim());
  }

  return blocks.map((lines, index) => {
    const id = `uz-cohort-${String(order).padStart(2, '0')}-q${index + 1}`;
    let text = lines.join('\n');
    let explanation = '';
    text = text.replace(/\*Izoh:\s*([^*]+)\*/g, (_match, note: string) => {
      explanation = note.trim();
      return '';
    });

    const [promptLine, ...rest] = text.split('\n');
    const tf = promptLine.match(new RegExp(`^${TRUE_WORD} yoki ${FALSE_WORD.toLowerCase()}:\\s*(.+?)\\s*\\*\\*(${TRUE_WORD}|${FALSE_WORD})\\.\\*\\*`));
    if (tf) {
      const answer = tf[2] === TRUE_WORD;
      return {
        id,
        prompt: `${TRUE_WORD} yoki ${FALSE_WORD.toLowerCase()}: ${plain(tf[1])}`,
        type: 'true-false' as const,
        explanation: explanation || `Toʻgʻri javob: ${answer ? TRUE_WORD : FALSE_WORD}.`,
        options: [],
        answer
      };
    }

    const optionText = rest.map((line) => line.replace(/^-\s*/, '')).join(' ');
    const options: Array<{ id: string; label: string }> = [];
    let answer = '';
    for (const match of optionText.matchAll(/([a-d])\)\s(.*?)(?=\s[a-d]\)\s|$)/g)) {
      if (match[2].includes('**')) answer = match[1];
      options.push({ id: match[1], label: plain(match[2]) });
    }
    if (options.length < 2 || !answer) {
      throw new Error(`Lesson ${order}, question ${index + 1}: expected options a) b) c) with one **correct** answer.`);
    }
    const correct = options.find((option) => option.id === answer)!;
    // The drafts put most correct answers at b); rotate deterministically so position is no hint.
    const shift = (order + index) % options.length;
    const shuffled = [...options.slice(shift), ...options.slice(0, shift)].map((option, i) => ({ id: 'abcd'[i], label: option.label }));
    return {
      id,
      prompt: plain(promptLine),
      type: 'multiple-choice' as const,
      explanation: explanation || `Toʻgʻri javob: ${correct.label}.`,
      options: shuffled,
      answer: shuffled.find((option) => option.label === correct.label)!.id
    };
  });
}

export function parseCourseLesson(markdown: string, fileName: string): CourseLesson {
  const order = Number(fileName.match(/^(\d+)-/)?.[1]);
  if (!order) throw new Error(`${fileName}: file name must start with the lesson number, e.g. 05-...md`);

  const title = markdown.match(/^# (.+)$/m)?.[1].trim();
  if (!title) throw new Error(`${fileName}: missing "# title" line.`);

  const durationLine = markdown.match(/^\*\*Davomiyligi:\*\*(.+)$/m)?.[1] || '';
  // Ranges like "25–30 daqiqa" count the upper bound; the separate-day exam is not lesson time.
  const estimatedMinutes = durationLine
    .split('+')
    .filter((part) => !part.includes('imtihon'))
    .reduce((sum, part) => sum + Number(part.match(/(\d+)\s*daqiqa/)?.[1] || 0), 0) || 30;

  const sections = splitSections(markdown);
  const find = (name: string) => sections.find((section) => section.heading.startsWith(name));
  const objectives = (find('Dars maqsadlari')?.body || '')
    .split('\n')
    .filter((line) => /^\d+\.\s/.test(line))
    .map((line) => plain(line.replace(/^\d+\.\s/, '')));
  const quiz = find('Bilimni tekshirish');
  if (!quiz) throw new Error(`${fileName}: missing "Bilimni tekshirish" section.`);

  const content = sections
    .slice(1)
    .filter((section) => section !== quiz && !section.heading.startsWith('Dars maqsadlari'))
    .map((section) => `## ${section.heading}\n${section.body}`.trim())
    .join('\n\n');

  const assignment = markdown.match(/\*\*Yozma topshiriq[^*]*\*\*:?\s*(.+)$/m)?.[1];
  const summary = (find('Xulosa')?.body || '')
    .split('\n')
    .filter((line) => line.startsWith('- '))
    .map((line) => plain(line.slice(2)));

  return {
    slug: `uz-cohort-${String(order).padStart(2, '0')}`,
    order,
    title,
    estimatedMinutes,
    isDraft: /^> Qoralama/m.test(markdown),
    objectives,
    content,
    knowledgeChecks: assignment ? [`Yozma topshiriq: ${plain(assignment)}`] : [],
    whyItMatters: summary.join(' '),
    questions: parseQuestions(quiz.body, order)
  };
}
