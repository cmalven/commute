# Shuttle

A simple command-line tool for syncing development databases.

---

## Install

```
npm install -g shuttle
```

## Setup

Shuttle expects to find a file at `~/shuttle/projects.json` that defines the connection settings for each project.

```
[
  {
    "name": "myProject",
    "seedDbPath": "seed/db.sql",
    "local": {
      "useMamp":  true,
      "host":     "localhost",
      "user":     "root",
      "password": "root",
      "database": "myproject"
    },
    "staging": {
      "host":     "96.120.203.112",
      "user":     "admin",
      "password": "abc123",
      "database": "myproject"
    }
  }
]
```

## Use

Run shuttle out of any project directory:

```
shuttle <project> <operation>
```

`project`: The name of the project to work with, should match a record in `projects.json`

`operation`: Should be one of `up`, `down`, `seed`, or `dump`

## Operations

### up

Pushes your local db up to staging.

### down

Pulls the staging db down to local.

### seed

Pulls the `.sql` file defined in `seedDbPath` of `projects.json` into your local db.

### Dump

Dumps the contents of your local db into the file defined in `seedDbPath` of `projects.json`