export const topics = [
  'new life',
  'love',
  'faith',
  'hope',
  'joy',
  'peace',
  'patience',
  'kindness',
  'goodness',
  'gentleness',
  'self-control',
  'forgiveness',
  'prayer',
  'history',
  'prophecy',
  'salvation',
  'sin',
  'heaven',
  'hell',
  'baptism',
  'communion',
  'money',
  'work',
  'marriage',
  'children',
  'family',
  'friendship',
  'generosity',
  'justice',
  'wisdom',
  'humility'
];

export function getTodaysTopic() {
  // get the topic that corresponds to the current day of the month
  return topics[new Date().getDate() - 1];
}
