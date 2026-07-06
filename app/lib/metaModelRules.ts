export type CuePriority = "high" | "medium" | "low";

export type MetaModelCue = {
  id: string;
  pattern: string;
  description: string;
  sentence: string;
  suggestion: string;
  alternatives: string[];
  priority: CuePriority;
  matchedText?: string;
};

type Rule = {
  id: string;
  pattern: string;
  description: string;
  priority: CuePriority;
  expressions: RegExp[];
  suggestion: (match: string) => string;
  alternatives: string[];
};

const rules: Rule[] = [
  {
    id: "universal-generalization",
    pattern: "Universal generalization",
    description: "Broad language that may hide exceptions or specifics.",
    priority: "high",
    expressions: [
      /\b(everyone|everybody|nobody|no one|people always|they always|always|never|all of them|none of them)\b/i
    ],
    suggestion: (match) => `${capitalize(match)}?`,
    alternatives: ["Who specifically?", "Always, or are there exceptions?", "Can you think of one exception?"]
  },
  {
    id: "mind-reading",
    pattern: "Mind reading",
    description: "A claim about another person's thoughts or motives.",
    priority: "high",
    expressions: [
      /\b(he|she|they|everyone|my partner|my boss|my mother|my father|people)\s+(thinks?|knows?|believes?|feels?|expects?|wants?)\b/i
    ],
    suggestion: () => "How do you know that?",
    alternatives: ["What tells you that?", "Did they say that directly?", "What else might be possible?"]
  },
  {
    id: "modal-impossibility",
    pattern: "Modal operator of impossibility",
    description: "Language that frames an action as impossible.",
    priority: "high",
    expressions: [/\b(i|we)\s+(can't|cannot|could never|would never)\b/i],
    suggestion: () => "What stops you?",
    alternatives: ["What would happen if you did?", "What makes that impossible?", "Has there ever been a small exception?"]
  },
  {
    id: "modal-necessity",
    pattern: "Modal operator of necessity",
    description: "Language that frames a rule or obligation as fixed.",
    priority: "medium",
    expressions: [/\b(i|we)\s+(have to|must|should|need to|ought to)\b/i],
    suggestion: () => "What would happen if you did not?",
    alternatives: ["Who says you have to?", "What makes that necessary?", "What choice do you still have?"]
  },
  {
    id: "lost-performative",
    pattern: "Lost performative",
    description: "A value judgment without naming who made the judgment.",
    priority: "medium",
    expressions: [/\b(it'?s|that'?s|this is)\s+(wrong|bad|selfish|stupid|unacceptable|normal|not normal|good|right)\b/i],
    suggestion: () => "According to whom?",
    alternatives: ["Who decided that?", "How did you come to that view?", "Is that your judgment or someone else's?"]
  },
  {
    id: "cause-effect",
    pattern: "Cause and effect",
    description: "One person's action is described as directly causing an inner state.",
    priority: "medium",
    expressions: [
      /\b(he|she|they|it|that|my partner|my boss|my family)\s+(makes?|made|causes?|caused)\s+me\s+(feel\s+)?\w+/i
    ],
    suggestion: () => "How exactly does that lead to this feeling?",
    alternatives: ["What happens inside you when that occurs?", "Is the feeling always the same?", "What part of it affects you most?"]
  },
  {
    id: "comparative-deletion",
    pattern: "Comparative deletion",
    description: "A comparison is made without saying compared to what.",
    priority: "medium",
    expressions: [/\b(better|worse|more|less|enough|not enough|too much|too little)\b/i],
    suggestion: () => "Compared to what?",
    alternatives: ["Enough for what?", "By what standard?", "How would you know it was enough?"]
  },
  {
    id: "nominalization",
    pattern: "Nominalization",
    description: "A process is frozen into an abstract noun.",
    priority: "low",
    expressions: [/\b(relationship|communication|rejection|failure|success|anxiety|depression|connection|trust)\b/i],
    suggestion: () => "What is happening specifically?",
    alternatives: ["How are you doing that?", "What does that look like in the moment?", "What is the action underneath that word?"]
  }
];

export function splitIntoSentences(text: string): string[] {
  return text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+|\n+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

export function analyzeSentence(sentence: string): MetaModelCue[] {
  return rules.flatMap((rule) => {
    const match = rule.expressions
      .map((expression) => sentence.match(expression))
      .find((result): result is RegExpMatchArray => Boolean(result));

    if (!match) {
      return [];
    }

    const matchedText = match[0];

    return [
      {
        id: `${rule.id}-${hashSentence(sentence)}`,
        pattern: rule.pattern,
        description: rule.description,
        sentence,
        suggestion: rule.suggestion(matchedText),
        alternatives: rule.alternatives,
        priority: rule.priority,
        matchedText
      }
    ];
  });
}

export function analyzeTranscript(text: string): MetaModelCue[] {
  return splitIntoSentences(text).flatMap(analyzeSentence);
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function hashSentence(sentence: string): string {
  let hash = 0;

  for (let index = 0; index < sentence.length; index += 1) {
    hash = (hash << 5) - hash + sentence.charCodeAt(index);
    hash |= 0;
  }

  return Math.abs(hash).toString(36);
}
