# Commute

A simple command-line tool for syncing development database.

---

## Install

```
npm install -g commute

OR

npm link -g (from within this repo locally)
```

## Setup

Commute expects to find a YAML file at `~/.commute.yml` that defines the connection settings for each project.

```yaml
sources:
  staging:
    host: 123.456.789.0
    u: remoteuser
    secure: true
  mysql-local:
    host: 127.0.0.1
    db:
      u: root
      p: root
  ddev-local:
    prefixCommand: ddev exec
    db:
      u: db
      p: db
      name: db
        
my-project:
  remote:
    source: staging
    db:
      name: remote-db-name
      u: dbuser
      p: dbpass

  local:
    source: mysql-local
    db:
      name: local-db-name
```

## Use

Run commute out of any project directory:

```
commute <project> <operation>
```

`project`: The name of the project to work with, should match a top-level key in `~/.commute.yml`

`operation`: Should be one of `down`, or `dump`

## Operations

### down

Creates a dump of the remote database and imports it into the local database.

### dump

Creates a dump of the remote database and saves it locally without importing.
