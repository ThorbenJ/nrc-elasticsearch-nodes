# nrc-elasticsearch-nodes

A set of [Node-RED](http://www.nodered.org) contributed (NRC) nodes for Elasticsearch including
search, get, exists, create, update, delete, tail.

Using [@elastic/elasticsearch](https://github.com/elastic/elasticsearch-js)
features, such as authentication.

### Note

This has been in active development and I had to make some breaking changes between 0.2.x and 0.3.x.
Exporting your flow, and a quick regex replace, then reimporting them will fix missing nodes. i.e. node "create" (or "es-create") -> "es-doc-create".
(Wish I had forseen the previous naming problem, before I started adding more nodes for further API support, such as index ops)

## Install
-------

Run the following command in the root directory of your Node-RED install

```
npm install nrc-elasticsearch-nodes
```

Recommended that you install `nrc-tjtoolkit-nodes` for the various helper nodes, such as `dedot` - which helps
with using mustache templates.


## Features

 - Shareable connection config node
 - All authentication schemes and other features (e.g. proxy) supported by `@elastic/elasticsearch` (none, basic, api-key, bearer)
 - Easily interpret input messages via mustache templates, including the use of context data
 - Nodes
   - Connection - Config node for the connection to Elasticsearch
   - Doc level =>
     - Create - Create a doc
     - Delete - Delete a doc
     - Exists - Test if a doc exists
     - Get - Emit a single doc by its ID
     - Index - Index a doc (or update it)
     - Search - Stream found docs as new messages
     - Tail - Stream new docs as new messages
     - Update - By script or static doc
   - Index level =>
     - Exists - Test if index exists
     - Create - Create an index (apply settings and mappings)

## Usage

See the documentation in the (right hand side) help pane of Node-Red; or the help block at the top of each node's .html file.

## Contributions

A fork of a fork... See contributors in pacakges.js for projects this was based on
