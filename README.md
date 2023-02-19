# nrc-elasticsearch-nodes

A fork of a fork... See github fork/network info or contributors in pacakges.js

Goal to update this to better support [@elastic/elasticsearch](https://github.com/elastic/elasticsearch-js)
features, such as authentication.

A set of [Node-RED](http://www.nodered.org) contributed (NRC) nodes for Elasticsearch including search, get, exists, create, update, delete, tail.

## Install
-------

Run the following command in the root directory of your Node-RED install

```
npm install nrc-elasticsearch-nodes
```

(Not yet submitted to npm)

## Features

 - Shareable connection config node
 - All authentication schemes support by `@elastic/elasticsearch` (none, basic, api-key, bearer)
 - Proxy configuration
 - A standard output and a status output - to allow you to more easily react to events such as failures in your flow
 - Nodes
   - Connection - Config node for the connection to Elasticsearch
   - Create - Create a doc
   - Delete - Delete a doc
   - Exists - Test if a doc exists
   - Get - Emit a single doc by its ID
   - Search - Stream found docs as new messages
   - Tail - Stream new docs as new messages
   - Update - By script or static doc

## Usage

See the documentation in the (right hand side) help pane of Node-Red; or the help block at then of each node's .html file.
