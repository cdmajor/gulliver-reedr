import { createBookFromText } from "./parseBook";

const SAMPLE = `Chapter 1
The lighthouse keeper woke before the gulls. Fog pressed against the glass like a second skin, and the lamp upstairs still clicked as it cooled. Below the cliff, the sea wrote the same sentence it had written for a thousand years and expected no reply.

He made coffee, opened the logbook, and wrote: "Visibility low. No vessels. Dreamed of a library that floats."

Chapter 2
By noon the fog unstitched itself. A packet steamer appeared on the horizon, late and listing slightly to port. Through the glass he watched a woman on deck hold a stack of books against the wind as if the wind might steal the endings.

When the steamer docked at the lower pier, she climbed the path with mud on her boots and salt in her hair. "I heard you keep more than light up here," she said. "I brought chapters that need a quieter room."

Chapter 3
They sorted the books by weather. Storm volumes on the low shelf. Clear-day essays near the window. One thin volume had no title, only a ribbon the color of wet slate. Inside: blank pages, and a note — "Write what the light refuses to say."

That evening the lamp turned again. The keeper wrote nothing in the official log. In the blank book he wrote one line: "A stranger arrived with weather for every shelf."

Chapter 4
Years later sailors still tell it wrong. They say the lighthouse learned to read. They say the fog became an index. The truth is smaller and better: two people kept a room where long work could be finished, summarized aloud at dawn, and sent back to sea lighter than it arrived.
`;

export function createSampleBook() {
  return createBookFromText({
    title: "The Floating Library",
    author: "Reedr Sample",
    text: SAMPLE,
    format: "sample",
  });
}
