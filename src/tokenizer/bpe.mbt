// Byte-level BPE: merge priority over a vocabulary, GPT-2 style.
//
// A piece from the pre-tokenizer is a string of GPT-2-encoded characters. BPE
// starts from single characters and repeatedly merges the adjacent pair with
// the best (lowest) merge rank until no adjacent pair is mergeable. Ranks come
// from `tokenizer.ggml.merges`, whose array index is the priority; the pair
// "first second" merges into "firstsecond" (string concatenation, which is why
// the byte encoding uses printable stand-ins for whitespace bytes).
//
// The rank map is a flat sorted array of (left, right, rank) searched with
// binary search on the pair identity, which keeps a 49k-entry merge table
// compact and allocation-free at lookup time.

///|
/// The merge rank table: parallel arrays sorted by (left, right).
pub(all) struct MergeTable {
  /// Left token string of each pair, in sorted order for binary search.
  lefts : Array[String]
  /// Right token string of each pair, in sorted order for binary search.
  rights : Array[String]
  /// Concatenated pair, precomputed so merges need no string building.
  joined : Array[String]
  /// Original merge priority (array index in tokenizer.ggml.merges) of each
  /// pair, parallel to the sorted arrays. Selection during BPE compares THIS,
  /// not the sorted position: alphabetical order and merge priority differ.
  priority : Array[Int]
} derive(Debug)

///|
/// Build a merge table from `tokenizer.ggml.merges` entries ("first second").
///
/// Rows are sorted lexicographically by (left, right) with a bottom-up merge
/// sort so pair lookup can binary-search; `priority` keeps the original array
/// index (the merge rank) for BPE selection. An insertion sort would be
/// O(n^2) over ~49k entries and a hand-rolled quicksort risks pathological
/// cases; merge sort is deterministic and fast.
pub fn MergeTable::new(merges : Array[String]) -> MergeTable {
  // Flat rows: left[i], right[i], joined[i], prio[i] for i < n_kept.
  let lefts : Array[String] = []
  let rights : Array[String] = []
  let joined : Array[String] = []
  let prio : Array[Int] = []
  for i, entry in merges {
    let sp = find_space(entry)
    if sp > 0 {
      let l = entry[:sp].to_owned()
      let r = entry[sp + 1:].to_owned()
      lefts.push(l)
      rights.push(r)
      joined.push(l + r)
      prio.push(i)
    }
  }
  let n = lefts.length()
  // Sort indices [0, n) by (left, right). `ord` holds row indices; `tmp` is
  // merge scratch. Comparison is explicit char-wise on (left, right) so the
  // ordering cannot depend on operator overloads.
  let ord : Array[Int] = Array::make(n, 0)
  for i = 0; i < n; i = i + 1 {
    ord[i] = i
  }
  let tmp : Array[Int] = Array::make(n, 0)
  let mut width = 1
  while width < n {
    let mut lo = 0
    while lo < n - width {
      let mid = lo + width
      let hi = if lo + 2 * width < n { lo + 2 * width } else { n }
      // Merge ord[lo..mid) and ord[mid..hi) into tmp, then copy back.
      let mut a = lo
      let mut b = mid
      let mut k = lo
      while a < mid && b < hi {
        let ca = cmp_pair(lefts[ord[a]], rights[ord[a]], lefts[ord[b]], rights[ord[b]])
        if ca <= 0 {
          tmp[k] = ord[a]
          a = a + 1
        } else {
          tmp[k] = ord[b]
          b = b + 1
        }
        k = k + 1
      }
      while a < mid {
        tmp[k] = ord[a]
        a = a + 1
        k = k + 1
      }
      while b < hi {
        tmp[k] = ord[b]
        b = b + 1
        k = k + 1
      }
      for x = lo; x < hi; x = x + 1 {
        ord[x] = tmp[x]
      }
      lo = lo + 2 * width
    }
    width = width * 2
  }
  // Materialize in sorted order.
  let s_lefts : Array[String] = []
  let s_rights : Array[String] = []
  let s_joined : Array[String] = []
  let s_prio : Array[Int] = []
  for k = 0; k < n; k = k + 1 {
    let i = ord[k]
    s_lefts.push(lefts[i])
    s_rights.push(rights[i])
    s_joined.push(joined[i])
    s_prio.push(prio[i])
  }
  { lefts: s_lefts, rights: s_rights, joined: s_joined, priority: s_prio }
}

///|
/// Lexicographic comparison of two (left, right) pairs: left first, then
/// right, both by Unicode code point.
fn cmp_pair(l1 : String, r1 : String, l2 : String, r2 : String) -> Int {
  let c = cmp_str(l1, l2)
  if c != 0 {
    c
  } else {
    cmp_str(r1, r2)
  }
}

///|
/// Code-point-wise lexicographic comparison of two strings.
fn cmp_str(a : String, b : String) -> Int {
  let la = a.length()
  let lb = b.length()
  let n = if la < lb { la } else { lb }
  let mut i = 0
  while i < n {
    let x = a[i].to_int()
    let y = b[i].to_int()
    if x < y {
      return -1
    }
    if x > y {
      return 1
    }
    i = i + 1
  }
  if la < lb {
    -1
  } else if la > lb {
    1
  } else {
    0
  }
}

///|
/// Find the first space in `s`, or -1. Tokens never contain spaces because the
/// byte encoder maps byte 0x20 to 'Ġ'.
fn find_space(s : String) -> Int {
  let mut i = 0
  for ch in s {
    if ch == ' ' {
      return i
    }
    i = i + 1
  }
  -1
}

///|
/// Look up the rank of merging `left + " " + right`; lower is better.
pub fn MergeTable::lookup(self : MergeTable, left : String, right : String) -> Int {
  // Binary search on (left, right); returns the sorted-array position, or -1.
  // Callers compare `priority[pos]` for merge order and read
  // `joined[pos]` for the merged text — the arrays are parallel.
  let n = self.lefts.length()
  let mut lo = 0
  let mut hi = n
  while lo < hi {
    let mid = (lo + hi) / 2
    let cmp = cmp_pair(self.lefts[mid], self.rights[mid], left, right)
    if cmp == 0 {
      return mid
    } else if cmp < 0 {
      lo = mid + 1
    } else {
      hi = mid
    }
  }
  -1
}

///|
/// Merge priority of the pair at sorted position `pos`.
pub fn MergeTable::priority_at(self : MergeTable, pos : Int) -> Int {
  self.priority[pos]
}

///|
/// Apply BPE to one pre-tokenized piece.
///
/// `parts` starts as the piece's individual characters and is merged in place.
/// Termination: every merge reduces the part count by one, so the loop runs at
/// most `len-1` times.
pub fn bpe_merge(table : MergeTable, piece : String) -> Array[String] {
  if piece.length() <= 1 {
    return [piece]
  }
  let parts : Array[String] = []
  for ch in piece {
    parts.push(ch.to_string())
  }
  // Repeatedly find the best-ranked adjacent pair and merge it.
  let mut parts_len = parts.length()
  while parts_len > 1 {
    let mut best_pri = -1
    let mut best_i = -1
    let mut best_pos = -1
    for i = 0; i < parts_len - 1; i = i + 1 {
      let pos = table.lookup(parts[i], parts[i + 1])
      if pos >= 0 {
        let pri = table.priority_at(pos)
        if best_pri < 0 || pri < best_pri {
          best_pri = pri
          best_i = i
          best_pos = pos
        }
      }
    }
    if best_i < 0 {
      break
    }
    parts[best_i] = table.joined[best_pos]
    // Remove parts[best_i + 1] by shifting the tail left one slot.
    for j = best_i + 1; j < parts_len - 1; j = j + 1 {
      parts[j] = parts[j + 1]
    }
    parts_len = parts_len - 1
    // Drop the stale duplicate beyond the new logical length so a later rank
    // scan cannot see it: truncation, not shift-then-read.
    parts.truncate(parts_len)
  }
  parts
}
