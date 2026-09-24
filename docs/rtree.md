# R-tree

[`src/plotter/rtree`](../src/plotter/rtree) is a small R-tree over 2D
MBRs. Its only user is `reorderLineGroups` in
[`planner.ts`](../src/plotter/planner.ts), which orders line groups to cut
pen-up travel when reordering is allowed:

1. Each line group adds two entries, its start and its end point. Ids are
   handed out in document order, start before end.
2. From the pen's position, `nnSearch` finds the nearest entry. That group
   is drawn next, reversed if the entry was its end point.
3. Both of the group's entries are removed, and the pen moves to the
   group's other end.

So the tree is filled once, then emptied one nearest point at a time. The
planner uses `createRTree(2, 4)`.

[`DebugRtree`](../src/containers/plotter/components/workspace/debug.tsx)
draws a tree over the page: every entry as a dot, leaf nodes outlined in
green and internal nodes in red. It isn't mounted anywhere on purpose; add
it to the workspace by hand when debugging the tree.

These notes come from a review in September 2026: what was found, what was
changed, what was left alone on purpose, and the measurements behind each
call.

## Summary

The search was correct: seeded random inserts, removes and queries, checked
against a linear scan, found no wrong answer. What needed work was speed,
determinism and some hygiene. The changes, in order (each commit message
has the details and its own numbers):

- `fix(rtree): break nearest-neighbour ties by entry id`
- `perf(rtree): stop re-inserting entries when condensing after remove`
- `perf(rtree): drop MINMAXDIST pruning, stop remove at the first match`
- `refactor(rtree): stop writing to entries, keep the root's MBR current`
- `test(rtree): check random operations against a linear scan`

Left alone: how nodes are split and how inserts pick a subtree. See
[Single axis or two axes](#single-axis-or-two-axes-not-changed).

`reorderLineGroups`, before and after these changes:

| Input                     | Groups | Before |  After |
| ------------------------- | -----: | -----: | -----: |
| Random short strokes      |   4000 | 119 ms |  54 ms |
|                           |  16000 | 652 ms | 326 ms |
| Grid of closed rectangles |   4000 | 182 ms |  68 ms |
|                           |  16000 | 929 ms | 286 ms |
| Shuffled hatching         |   4000 |  85 ms |  31 ms |
|                           |  16000 | 446 ms | 166 ms |

## Drawing order depends only on ties

`nnSearch` is exact. However the tree is laid out, the entry it returns is
at the true nearest distance; the layout (split heuristic, node capacity,
how removals reshape the tree) only decides how fast it gets there. The
exception is when several entries are equally near. The search used to
return whichever of them it met first, and that depends on the layout. Two
kinds of ties are common in plots:

- **Closed shapes.** A closed path starts and ends at the same point, so
  its two entries always tie. This only decides whether the shape is drawn
  forwards or backwards, but it was arbitrary: 773 of 2000 closed circles
  (39%) were drawn against their SVG direction.
- **Equally near groups.** Grids, wireframes and shared end points put
  several candidates at exactly the same distance. The greedy walk forks at
  the first such tie, and everything after it differs. Across tree layouts
  the pen-up distance ranged over 501–660 mm for a shuffled 32×32
  wireframe and 6313–6643 mm for a grid of 2000 squares, with no layout
  consistently better.

`nnSearch` now returns the smallest id among equally near entries. With the
planner's ids, that means:

- closed shapes keep the direction they were drawn in;
- of equally near groups, the one earlier in the document goes first.

The order is now a function of the input alone. On open strokes, circles,
the wireframe and the squares, the planner's output was identical to a
linear scan with the same rule, whether the tree used the current split,
a single-axis or a two-axis split, or node capacity 9. The rule buys
determinism, not shorter paths: it gave the shortest walk on the squares
(5997 mm) and a middling one on the wireframe (573 mm).

Equally near entries can sit in different leaves, so a branch is skipped
only when its MBR is strictly farther than the best entry so far.

## Removing entries

`condenseTree` used to follow Guttman: a node left with fewer than
`minimum` entries was taken out, and every data entry below it was
inserted again. Emptying the tree point by point, the planner kept
rebuilding whole subtrees; on shuffled hatching, remove took 83% of the
walk. The better a tree was split, the worse this got: with a better split
(prototype), 8000 removals re-inserted 95,000 entries, and the walk was
3–4× slower than before.

Now removal works like rbush's: it drops the nodes left empty, shrinks the
MBRs up to the root, and replaces a root that has a single child with that
child. Underfull nodes stay. That suits the planner, whose tree only
shrinks. A long mix of inserts and removes would leave the tree looser; if
that ever matters, re-insert the orphaned subtrees at their own level, as
in Guttman's CondenseTree, rather than their data entries.

`remove` returns whether it found an entry, and removes exactly one per
call.

## Nearest-neighbour search

The search is branch and bound after Roussopoulos et al. (1995), without
their MINMAXDIST pruning (H1). When branches are visited in MINDIST order,
pruning those farther than the best entry so far (H3) already drops
everything H1 would (Cheung and Fu, 1998). Checked on 20000 points: with
siblings visited in the same order, both versions examined exactly the same
number of MBRs per query (68.29 for scattered points, 77.27 on an integer
grid).

## Single axis or two axes (not changed)

A split sorts the entries along the diagonal, by x + y of their centres,
seeds the two new nodes with the entries at either end, and deals out the
rest by least area enlargement. An insert picks the subtree whose MBR
needs the least area enlargement, then the smallest one.

**Weak spot.** Points on a horizontal or vertical line have MBRs with no
area, so all of those comparisons tie. Splits deal entries out alternately,
inserts always go to the first child, and the leaves overlap all along the
line. Queries from arbitrary points then visit nearly the whole tree:

| 20000 points, random queries | Time per query |
| ---------------------------- | -------------: |
| Scattered                    |        14.5 µs |
| Integer grid                 |        20.4 µs |
| One vertical line            |         2.3 ms |
| One horizontal line          |         2.4 ms |

**The axis is not the cause.** MBRs examined per query, measured with a
prototype of other heuristics. "Cut" splits the sorted entries into two
runs instead of dealing them out by area; "choose fix" breaks area ties by
perimeter enlargement when picking a subtree:

| Heuristics                            | Scattered | Vertical line | Anti-diagonal line | Integer grid | Rectangle corners |
| ------------------------------------- | --------: | ------------: | -----------------: | -----------: | ----------------: |
| Current                               |        78 |          9009 |                 54 |          101 |                96 |
| Two axes (R\*-style), cut             |        35 |          8558 |                 25 |           36 |                48 |
| Diagonal, cut, choose fix             |        96 |            26 |                 98 |           97 |               120 |
| Two axes (R\*-style), cut, choose fix |        35 |            26 |                 25 |           35 |                43 |

(The first row used the old search with MINMAXDIST, which examines 3–4%
fewer MBRs on the same tree.)

- Two axes alone leave a line at 8558. What fixes lines is the
  choose-subtree tie-break together with cutting the sorted run.
- With those two, the diagonal handles horizontal and vertical lines too,
  since x + y keeps their order, but not an anti-diagonal, where x + y is
  constant. Picking the better of x and y (R\*: least total margin) is
  best everywhere, and examines 2–3× fewer MBRs on ordinary data.
- Don't change the sort to the distance from the node's centre, as its old
  comment claimed: that would seed a new node with the entry nearest the
  centre, the least separated one.

**Why it was left alone.** The planner queries from the point it has just
removed, right next to the remaining ones, and removals keep shrinking the
MBRs around it. On the degenerate line tree the walk examined about 20
MBRs per step, against 1100–3500 for queries from arbitrary points; the
shuffled hatching above, two columns of collinear points, is one of the
fastest inputs. For the walk, the better heuristics were a mixed bag: 26%
less time on random strokes, 1.8× more on the grid of squares, no change on
hatching. With ties broken by id, they wouldn't change any output either.

Revisit this if the tree is used for queries from arbitrary points, such
as hit testing in the UI. Then change the choose-subtree tie-break and the
split together.

## Not done

- Bulk loading, such as STR: the planner knows every point up front.
- Node capacity: 4/9 instead of 2/4 changed the walk by −8% to +3%.

## Noticed elsewhere

- `reorderLineGroups` stops when `nnSearch` returns a falsy id, which only
  works because ids start at 1.

## How it was measured

Synthetic inputs:

- random short strokes: one line up to 5 mm long, anywhere in 280×200 mm;
- grid of closed rectangles: 2×2 mm squares in rows;
- shuffled hatching: 80 mm horizontal lines 0.05 mm apart, in random order;
- closed circles: 24-gons with random centres and radii;
- wireframe: the edges of a 32×32 grid, 2.5 mm apart, as separate groups in
  random order.

Timings are the best of 5 runs on an Apple M2 Max with Node 24.12. The
correctness oracle is the "random operations" suite in
[`rtree.test.ts`](../src/plotter/rtree/tests/rtree.test.ts).
