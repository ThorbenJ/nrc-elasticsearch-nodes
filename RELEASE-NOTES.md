
# Release Note

## 0.3.x -> 1.0.x

Creating a node for every API, would result in far too many nodes.
Therefore undertook a major refactor, where API that do similar things are combined
into a single node.

To avoid breaking existing flows, `nrc-elasticsearch-nodes` will remain on 0.x.y,
while also being marked deprecated. This 1.x.y "next-gen1" package will be named
`nrc-elasticsearch-nodes1`

## 0.2.x -> 0.3.0

This had been in active re-design and I had to make some breaking changes between 0.2.x and 0.3.x.
Exporting your flows, and a quick regex replace, then reimporting them will fix missing nodes. i.e. node "create" (or "es-create") -> "es-doc-create".
(Wish I had forseen the previous naming problem, before I started adding more nodes for further API support, such as index ops)
