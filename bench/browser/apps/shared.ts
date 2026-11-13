/** Words and helpers shared by the Vue, Svelte and Angular apps. */
export const ADJECTIVES = ["pretty", "large", "big", "small", "tall", "short", "long", "handsome", "plain", "quaint"];
export const COLOURS = ["red", "yellow", "blue", "green", "pink", "brown", "purple", "orange", "white", "black"];
export const NOUNS = ["table", "chair", "house", "bbq", "desk", "car", "pony", "cookie", "sandwich", "burger"];
const pick = (list: string[]) => list[Math.floor(Math.random() * list.length)] as string;
export const randomLabel = () => `${pick(ADJECTIVES)} ${pick(COLOURS)} ${pick(NOUNS)}`;
