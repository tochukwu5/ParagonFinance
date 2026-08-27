// The sidebar replaced the navbar. Several pages still render <Navbar />
// inline, so rather than editing all six of them, this returns null and
// every one of those becomes a no-op.
//
// Worth cleaning up properly later: delete the <Navbar /> lines from
// Docs, PublicPages, StatsPage, TestnetHub, TestnetPages and TestnetSend,
// then delete this file. Leaving it means dead JSX sitting in those pages.
export default function Navbar() {
  return null
}